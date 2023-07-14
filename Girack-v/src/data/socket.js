//socket.js
//通信とかそこらへん

import { io } from "socket.io-client"; //ウェブソケット通信用

//Socket通信用
export const backendURI = "http://" + location.hostname + ":33333";

//Socket接続
const socket = io(backendURI, {
  transports: ["websocket"],
  reconnection: true,
  reconnectionDelay: 100,
  reconnectionDelayMax: 1000,
});

import { ref } from "vue";

import { getCONFIG } from "../config.js";

export const CLIENT_VERSION = "alpha_20230714";

const {
  CONFIG_SYNC,
  CONFIG_NOTIFICATION,
  LIST_NOTIFICATION_MUTE_CHANNEL,
  CONFIG_DISPLAY,
} = getCONFIG(); //設定

//クライアントがロードできたかどうかのフラグ
export const CLIENT_FULL_LOADED = ref(false);

//サーバー(インスタンス)情報
export const Serverinfo = ref({
  servername: "...",
  registerAvailable: null,
  inviteOnly: null,
  config: {},
  serverVersion: "",
});

//データインポート
import { dataUser } from "./dataUserinfo.js";
import { dataChannel } from "./dataChannel.js";
import { dataMsg } from "./dataMsg.js";

//メッセージ受け取り、履歴への保存
socket.on("messageReceive", (msg) => {
  //メッセージ発信元のチャンネルに参加してなくてかつプレビューでもないなら
  if (
    !dataUser().myUserinfo.value.channelJoined.includes(msg.channelid) &&
    dataChannel().PreviewChannelData.value.channelid !== msg.channelid
  )
    return;

  console.log("socket :: msgReceive : ↓");
  console.log(msg);

  //もしユーザーの名前リストに名前がなかったら
  if (dataUser().UserIndex.value[msg.userid] === undefined) {
    //名前をリクエスト
    socket.emit("getInfoUser", {
      targetid: msg.userid,
      reqSender: {
        userid: dataUser().myUserinfo.value.userid, //ユーザーID
        sessionid: dataUser().myUserinfo.value.sessionid, //セッションID
      },
    });
  }

  try {
    //DB配列の存在を確認してから追加
    if (dataMsg().MsgDB.value[msg.channelid] !== undefined) {
      //undefinedじゃないなら追加
      dataMsg().MsgDB.value[msg.channelid].push({
        ...msg,
      });
    } else {
      //配列が空なら新しく作成、配置
      dataMsg().MsgDB.value[msg.channelid] = [
        {
          ...msg,
        },
      ];
    }

    //プレビューモードならここでやめる
    if (dataChannel().PreviewChannelData.value.channelid === msg.channelid)
      return;

    //指定チャンネルの既読状態がデータになかったら新たに定義
    if (dataMsg().MsgReadTime.value[msg.channelid] === null)
      dataMsg().MsgReadTime.value[msg.channelid].mention = 0;

    //メンション判別する文字列
    let ContentChecking = "";
    //システムメッセージなら
    if (msg.isSystemMessage) {
      //メンション判別のためにも標的ユーザーを本文扱いする
      ContentChecking = "@" + msg.content.targetUser;
    } else {
      //普通のメッセージなら
      ContentChecking = msg.content;
    }

    //新着メッセージ数を更新
    if (dataMsg().MsgReadTime.value[msg.channelid] === undefined) {
      //セットされてなかったら新しく定義
      if (
        ContentChecking.includes("@" + dataUser().myUserinfo.value.username)
      ) {
        dataMsg().MsgReadTime.value[msg.channelid] = {
          time: msg.time, //最後に読んだ時間
          new: 1,
          mention: 0,
        };
      } else {
        dataMsg().MsgReadTime.value[msg.channelid] = {
          time: msg.time, //最後に読んだ時間
          new: 0,
          mention: 1,
        };
      }

      //faviconにドット表示
      document.querySelector("link[rel~='icon']").href = "/icon_w_dot.svg";
    } else {
      //すでにあるなら加算
      //メンションか自分への返信ならメンションを加算
      if (
        ContentChecking.includes(
          "@/" + dataUser().myUserinfo.value.userid + "/"
        ) ||
        msg.replyData.userid === dataUser().myUserinfo.value.userid
      ) {
        if (dataMsg().MsgReadTime.value[msg.channelid].mention === null) {
          dataMsg().MsgReadTime.value[msg.channelid].mention = 0;
        } else {
          //メンション数加算
          dataMsg().MsgReadTime.value[msg.channelid].mention++;
          //faviconにドット表示
          document.querySelector("link[rel~='icon']").href = "/icon_w_dot.svg";
        }
      } else {
        //そうじゃないなら普通に通知を加算
        dataMsg().MsgReadTime.value[msg.channelid].new++;
        //faviconにドット表示
        document.querySelector("link[rel~='icon']").href = "/icon_w_dot.svg";
      }
    }

    //既読状態をサーバーへ同期させる
    socket.emit("updateUserSaveMsgReadState", {
      msgReadState: dataMsg().MsgReadTime.value,
      reqSender: {
        userid: dataUser().myUserinfo.value.userid,
        sessionid: dataUser().myUserinfo.value.sessionid,
      },
    });

    //新着のメッセージを通知
    if (
      CONFIG_NOTIFICATION.value.ENABLE && //通知が有効である
      msg.userid !== dataUser().myUserinfo.value.userid && //送信者が自分じゃない
      !LIST_NOTIFICATION_MUTE_CHANNEL.value.includes(msg.channelid) && //ミュートリストにチャンネルが入っていない
      (!location.pathname.includes(msg.channelid) || document.hidden) //今いるチャンネルじゃなく、または違うタブなら
    ) {
      //すべてのメッセージを通知に出すようにしているなら通知
      if (CONFIG_NOTIFICATION.value.NOTIFY_ALL) {
        //通知を出す
        new Notification(
          dataChannel().ChannelIndex.value[msg.channelid].channelname,
          {
            body:
              "#" +
              (dataUser().UserIndex.value[msg.userid] === undefined
                ? msg.userid
                : dataUser().UserIndex.value[msg.userid].username) +
              ": " +
              msg.content,
            icon: backendURI + "/img/" + msg.userid,
          }
        );
      } else if (CONFIG_NOTIFICATION.value.NOTIFY_MENTION) {
        //メンションで通知なら
        //メンションの条件である@<名前>が入っているか
        if (
          ContentChecking.includes(
            "@/" + dataUser().myUserinfo.value.userid + "/"
          )
        ) {
          let contentToDisplay = ContentChecking.replace(
            /@\/([0-9]*)\//g,
            (mentionedId) => {
              if (mentionedId.includes(dataUser().myUserinfo.value.userid)) {
                return "@" + dataUser().myUserinfo.value.username;
              }
            }
          );

          //通知を出す
          new Notification(
            dataChannel().ChannelIndex.value[msg.channelid].channelname,
            {
              body:
                "#" +
                (dataUser().UserIndex.value[msg.userid] === undefined
                  ? msg.userid
                  : dataUser().UserIndex.value[msg.userid].username) +
                ": " +
                contentToDisplay,
              icon: backendURI + "/img/" + msg.userid,
            }
          );
        }

        //自分宛の返信なら
        if (msg.replyData.userid === dataUser().myUserinfo.value.userid) {
          //通知を出す
          new Notification(
            dataChannel().ChannelIndex.value[msg.channelid].channelname,
            {
              body:
                "#" +
                (dataUser().UserIndex.value[msg.userid] === undefined
                  ? msg.userid
                  : dataUser().UserIndex.value[msg.userid].username) +
                ": " +
                msg.content,
              icon: backendURI + "/img/" + msg.userid,
            }
          );
        }
      }
    }
  } catch (e) {
    console.log("Content :: dataMsg().MsgDB.value書き込みエラー");
    console.log(e);
  }
});

//他人の名前の受け取り
socket.on("infoResult", (dat) => {
  if (dat.type !== "user") {
    return;
  } //ユーザー情報じゃなければ取りやめ
  console.log("Content :: infoResult : 名前情報受け取り \\/");
  console.log(dat);

  let username = dat.username;
  let userid = dat.userid;
  let role = dat.role;

  dataUser().UserIndex.value[userid] = {};

  //ユーザーインデックス更新
  dataUser().UserIndex.value[userid].username = username; //名前
  dataUser().UserIndex.value[userid].role = role; //ロール
});

//メッセージの更新
socket.on("messageUpdate", (dat) => {
  //メッセージ消したりリアクションされたり
  /*
    {
        action: "delete"|"reaction|"urlData",
        channelid: dat.channelid,
        messageid: dat.messageid,
        ["reaction"だったら]
        reaction: dat.reaction
        ["urlData"だったら]
        urlData: dat.urlData
    }
    */

  switch (dat.action) {
    //削除する
    case "delete":
      //ループでIDが一致するメッセージを探す
      for (let index in dataMsg().MsgDB.value[dat.channelid]) {
        if (
          dataMsg().MsgDB.value[dat.channelid][index].messageid ===
          dat.messageid
        ) {
          //もしまだ未読のものだったら新着数を減らす
          if (
            dataMsg().MsgReadTime.value[dat.channelid].time <
            dataMsg().MsgDB.value[dat.channelid][index].time
          ) {
            //メンションされているかどうかで減らす値を選ぶ
            if (
              dataMsg().MsgDB.value[dat.channelid][index].content.includes(
                "@/" + dataUser().myUserinfo.value.userid + "/"
              )
            ) {
              //メンション数を減らす
              dataMsg().MsgReadTime.value[dat.channelid].mention--;
            } else {
              //新着数を減らす
              dataMsg().MsgReadTime.value[dat.channelid].new--;
            }
          }

          dataMsg().MsgDB.value[dat.channelid].splice(index, 1); //削除
        }
      }
      break;

    //リアクションをつける
    case "reaction":
      //メッセージIDで探索して更新
      for (let index in dataMsg().MsgDB.value[dat.channelid]) {
        if (
          dataMsg().MsgDB.value[dat.channelid][index].messageid ===
          dat.messageid
        ) {
          dataMsg().MsgDB.value[dat.channelid][index].reaction = dat.reaction; //リアクション更新
        }
      }
      break;

    //URLプレビュー用のデータを追加
    case "urlData":
      //メッセージIDで探索して更新
      for (let index in dataMsg().MsgDB.value[dat.channelid]) {
        if (
          dataMsg().MsgDB.value[dat.channelid][index].messageid ===
          dat.messageid
        ) {
          //URlプレビューデータを更新
          dataMsg().MsgDB.value[dat.channelid][index].urlData.data[
            dat.urlIndex
          ] = dat.urlDataItem;
        }
      }

      break;

    //メッセージの編集
    case "edit":
      console.log("socket :: messageUpdate(edit) : 更新するデータ->", dat);
      //メッセージIDで探索して更新
      for (let index in dataMsg().MsgDB.value[dat.messageData.channelid]) {
        if (
          dataMsg().MsgDB.value[dat.messageData.channelid][index].messageid ===
          dat.messageData.messageid
        ) {
          //メッセージ本文を更新
          dataMsg().MsgDB.value[dat.messageData.channelid][index].content
            = dat.messageData.content;
          //URLが含まれるかどうかを適用
          dataMsg().MsgDB.value[dat.messageData.channelid][index].hasUrl
            = dat.messageData.hasUrl;
          //編集されたと設定
            dataMsg().MsgDB.value[dat.messageData.channelid][index].isEdited = true;
        }
      }

      break;

    default:
      break;
  }
});

/* ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ */

//ソケットの接続状態をもつオブジェクトを返すだけ
export function getSocket() {
  return socket;
}

//メッセージ履歴の取得をする
export function getMessage(channelid, readLength, startLength) {
  socket.emit("getMessage", {
    //送信者の情報
    reqSender: {
      userid: dataUser().myUserinfo.value.userid, //ユーザーID
      sessionid: dataUser().myUserinfo.value.sessionid, //セッションID
    },
    channelid: channelid, //ほしい履歴のチャンネルID
    readLength: readLength, //ほしい長さ
    startLength: startLength, //履歴を取得し始める位置
  });
}

//サーバー情報の受け取り
socket.on("infoServer", (dat) => {
  console.log("socket :: infoServer : ", dat);

  //もしサーバーとクライアントのバージョンが違っていたらページを更新させる
  if (
    dat.serverVersion !== CLIENT_VERSION &&
    dataUser().myUserinfo.value.loggedin
  ) {
    location.reload();
  }

  //サーバーの基本情報の更新
  Serverinfo.value = {
    servername: dat.servername, //サーバーの名前
    registerAvailable: dat.registerAvailable, //登録できるかどうか
    inviteOnly: dat.inviteOnly, //招待オンリーかどうか
    config: dat.config, //サーバーの設定
    serverVersion: dat.serverVersion, //サーバー側のバージョン
  };
});

//チャンネル情報の更新
socket.on("infoChannel", (dat) => {
  console.log(
    "socket :: infoChannel : ",
    dataChannel().PreviewChannelData.value.channelid,
    dat
  );

  //チャンネルデータテンプレ
  let channelDataTemplate = {
    channelname: "channel", //チャンネル名
    description: "desc", //チャンネル概要
    scope: "public", //チャンネルの公開範囲
    canTalk: "Member", //喋るのに必要なロール
    historyReadCount: 0, //すでに読んだ履歴の数
  };

  //もしプレビュー用のチャンネル情報、かつロードができていたら
  if (
    dataChannel().PreviewChannelData.value.channelid === dat.channelid &&
    CLIENT_FULL_LOADED
  ) {
    console.log("socket :: infoChannel : preview用チャンネル情報取得 -> ", dat);
    dataChannel().PreviewChannelData.value = { ...channelDataTemplate, ...dat };

    //チャンネルに渡す時にプレビュー中と処理する用
    dataChannel().PreviewChannelData.value.previewmode = true;

    return;
  }

  //参加していないチャンネルならスルー
  if (!dataUser().myUserinfo.value.channelJoined.includes(dat.channelid)) {
    return;
  }

  console.log("socket :: infoChannel : チャンネル情報更新");

  //削除されているならスキップ
  if (dat.scope === "deleted") {
    //もしすでにデータを持っているなら削除
    if (dataChannel().ChannelIndex.value[dat.channelid] !== undefined) {
      delete dataChannel().ChannelIndex.value[dat.channelid]; //削除
    }

    //チャンネルから抜けさせる
    socket.emit("channelAction", {
      action: "leave",
      channelid: dat.channelid,
      userid: dataUser().myUserinfo.value.userid,
      reqSender: {
        userid: dataUser().myUserinfo.value.userid,
        sessionid: dataUser().myUserinfo.value.sessionid,
      },
    });

    //スキップ
    return;
  }

  //チャンネルデータをテンプレに上書きするように更新
  dataChannel().ChannelIndex.value[dat.channelid] = {
    ...channelDataTemplate,
    ...dat,
  };

  //自分の参加チャンネル数と受け取ったチャンネルデータの数が一致したらロードできたと設定
  if (dataUser().myUserinfo.value.channelJoined.length === Object.keys(dataChannel().ChannelIndex.value).length) {
    CLIENT_FULL_LOADED.value = true;
  }
});

//プロフィール情報の受け取り
socket.on("infoUser", (dat) => {
  let username = dat.username;
  let userid = dat.userid;
  let role = dat.role;

  dataUser().UserIndex.value[userid] = {};

  console.log("socket :: infoUser : 情報北");
  console.log(dat);

  //ユーザーインデックス更新
  dataUser().UserIndex.value[userid].username = username; //名前
  dataUser().UserIndex.value[userid].role = role; //ロール
  dataUser().UserIndex.value[userid].banned = dat.banned; //BANされているかどうか
  dataUser().UserIndex.value[userid].channelJoined = dat.channelJoined; //参加しているチャンネル

  //自分の情報の更新にだけ使うから
  if (dat.userid !== dataUser().myUserinfo.value.userid) {
    return;
  }

  //参加しているチャンネルリストの長さを比較をして減ったり増えたりしたチャンネルのデータを処理
  if (
    dat.channelJoined.length !==
    dataUser().myUserinfo.value.channelJoined.length
  ) {
    //チャンネル数が増えているなら
    if (
      dat.channelJoined.length >
      dataUser().myUserinfo.value.channelJoined.length
    ) {
      let channelNew = dat.channelJoined.filter(
        (cid) => !dataUser().myUserinfo.value.channelJoined.includes(cid)
      );

      console.log("socket :: チャンネル差 : ");
      console.log(channelNew);

      //新しく参加したチャンネル情報の取得
      for (let c in channelNew) {
        //リクエスト送信
        socket.emit("getInfoChannel", {
          targetid: channelNew[c],
          reqSender: {
            userid: dataUser().myUserinfo.value.userid, //ユーザーID
            sessionid: dataUser().myUserinfo.value.sessionid, //セッションID
          },
        });
      }

      //新しく参加したチャンネルの履歴を取得
      for (let c in channelNew) {
        getMessage(channelNew[c], 20); //リクエスト送信する
      }
    }

    //チャンネル数が減っている（チャンネルを抜けた）なら
    if (
      dat.channelJoined.length <
      dataUser().myUserinfo.value.channelJoined.length
    ) {
      console.log("socket :: infoResult : チャンネル差が少ないから減らす");
      dat.channelid = dataUser().myUserinfo.value.channelJoined.filter(
        (cid) => !dat.channelJoined.includes(cid)
      );

      console.log(
        "socket :: infoResult : 今参加しているチャンネル -> " +
          dat.channelJoined
      );
      //自分が抜けたチャンネル分channelIndexを削る
      for (
        let c = 0;
        c < Object.keys(dataChannel().ChannelIndex.value).length;
        c++
      ) {
        //チャンネルIDをチャンネル情報リストからとる
        let channelid = Object.keys(dataChannel().ChannelIndex.value)[c];

        //チャンネルIDがユーザーが参加しているチャンネルIDリストに入っているかどうか調べる
        if (!dat.channelJoined.includes(channelid)) {
          //チャンネルがリストに入っていなければ
          delete dataChannel().ChannelIndex.value[channelid]; //そのチャンネルIDのJSONを削除
          delete dataMsg().MsgDB.value[channelid]; //そのチャンネルの履歴を削除

          break;
        }
      }
    }
  }

  //自分のユーザーデータを更新
  dataUser().myUserinfo.value = {
    username: dat.username,
    userid: dataUser().myUserinfo.value.userid, //ユーザーID
    role: dat.role, //ロール
    loggedin: true, //ログイン状態はそのまま
    sessionid: dataUser().myUserinfo.value.sessionid, //セッションIDはそのまま
    channelJoined: dat.channelJoined, //参加しているチャンネル
  };
});

//メッセージの履歴受け取り
socket.on("messageHistory", (history) => {
  //履歴がそもそも空なら何もしない
  if (history === 0) {
    return;
  }

  console.log("socket :: messageHistory : history -> ");
  console.log(history);

  let channelid = ""; //履歴を入れるチャンネルID

  try {
    channelid = history[0].channelid; //受け取ったデータの中身使っちゃうんだよね
  } catch (e) {
    console.log("socket :: messageHistory : 履歴受け取りエラー", e);
    console.log(history);
    return;
  }

  //プレビュー用の履歴データなら読み込むだけで処理を終える
  if (dataChannel().PreviewChannelData.value.channelid === channelid) {
    //履歴分ユーザーデータを持っているか調べて持ってなければ取得する
    for (let index in history) {
      //もしユーザーの名前リストに名前がなかったら
      if (dataUser().UserIndex.value[history[index].userid] === undefined) {
        //データ受け取るまでのホルダー
        dataUser().UserIndex.value[history[index].userid] = {
          username: "loading...",
        };
        //名前をリクエスト
        socket.emit("getInfoUser", {
          targetid: history[index].userid,
          reqSender: {
            userid: dataUser().myUserinfo.value.userid, //ユーザーID
            sessionid: dataUser().myUserinfo.value.sessionid, //セッションID
          },
        });
      }
    }

    console.log("messageHistory :: プレビュー用に読み込まれました...");

    dataMsg().MsgDB.value[channelid] = history;
    return;
  }

  let index = 0; //チャンネル参照インデックス変数

  if (dataMsg().MsgReadTime.value[channelid] !== undefined) {
    //既読状態の時間から計算するから予め新着数初期化
    dataMsg().MsgReadTime.value[channelid].new = 0;
    dataMsg().MsgReadTime.value[channelid].mention = 0;
  }

  //受信した履歴の中で新着のものかどうか調べて新着数を加算
  for (index in history) {
    //既読状態がそもそも無ければやらない
    if (dataMsg().MsgReadTime.value[channelid] === undefined) break;

    //もしユーザーの名前リストに名前がなかったら
    if (dataUser().UserIndex.value[history[index].userid] === undefined) {
      //データ受け取るまでのホルダー
      dataUser().UserIndex.value[history[index].userid] = {
        username: "loading...",
      };
      //名前をリクエスト
      socket.emit("getInfoUser", {
        targetid: history[index].userid,
        reqSender: {
          userid: dataUser().myUserinfo.value.userid, //ユーザーID
          sessionid: dataUser().myUserinfo.value.sessionid, //セッションID
        },
      });
    }

    //システムメッセージじゃないなら既読状態の時間から新着メッセージ数を加算
    if (
      parseInt(history[index].time) >
        parseInt(dataMsg().MsgReadTime.value[channelid].time) &&
      !history[index].isSystemMessage
    ) {
      //メンションされていたかどうかにあわせて既読状態を更新
      if (
        history[index].content.includes(
          "@/" + dataUser().myUserinfo.value.userid + "/"
        )
      ) {
        dataMsg().MsgReadTime.value[channelid].mention++; //メンション数を加算
      } else {
        dataMsg().MsgReadTime.value[channelid].new++; //新着数を加算
      }

      //faviconをドット表示に
      document.querySelector("link[rel~='icon']").href = "/icon_w_dot.svg";
    }
  }

  try {
    if (
      dataMsg().MsgReadTime.value[channelid].mention !== 0 &&
      dataMsg().MsgReadTime.value[channelid].new !== 0
    ) {
      //既読状態をサーバーへ同期させる
      socket.emit("updateUserSaveMsgReadState", {
        msgReadState: dataMsg().MsgReadTime.value,
        reqSender: {
          userid: dataUser().myUserinfo.value.userid,
          sessionid: dataUser().myUserinfo.value.sessionid,
        },
      });
    }
  } catch (e) {
    console.error(e);
  }

  //履歴が存在しているなら履歴を頭から追加
  if (dataChannel().ChannelIndex.value[channelid].historyReadCount !== 0) {
    //データの追加順的に逆だからここでソートしておく
    history = history.reverse();

    //履歴用配列の先頭から一つずつ履歴を追加
    for (let index in history) {
      dataMsg().MsgDB.value[channelid].unshift(history[index]);
    }

    //履歴の長さを計算
    dataChannel().ChannelIndex.value[channelid].historyReadCount +=
      history.length;
  } else {
    //存在しないなら新しく追加
    dataMsg().MsgDB.value[channelid] = history;
    dataChannel().ChannelIndex.value[channelid].historyReadCount +=
      history.length;
  }
});

//認証結果
socket.on("authResult", (dat) => {
  //ユーザーデータの更新
  if (dat.result) {
    //もしログイン成功なら
    //ユーザー情報を更新
    dataUser().myUserinfo.value = {
      userid: dat.userid, //ユーザーID
      loggedin: true, //ログイン状態
      sessionid: dat.sessionid, //セッションID
      channelJoined: dat.channelJoined,
    };

    //クッキーから設定を読み込み
    loadDataFromCookie();

    //既読状態の取得
    socket.emit("getUserSaveMsgReadState", {
      reqSender: {
        userid: dat.userid,
        sessionid: dat.sessionid,
      },
    });

    //ユーザー情報をさらに取得
    socket.emit("getInfoUser", {
      targetid: dat.userid,
      reqSender: {
        userid: dat.userid,
        sessionid: dat.sessionid,
      },
    });

    //クッキーにセッションIDを設定、寿命は15日
    setCookie(
      "session",
      JSON.stringify({
        userid: dat.userid,
        sessionid: dat.sessionid,
      }),
      15
    );
    console.log("session id in cookie -> " + getCookie("sessionid"));

    //チャンネル情報の取得
    for (let c in dataUser().myUserinfo.value.channelJoined) {
      socket.emit("getInfoChannel", {
        //リクエスト送信
        targetid: dataUser().myUserinfo.value.channelJoined[c],
        reqSender: {
          userid: dataUser().myUserinfo.value.userid, //ユーザーID
          sessionid: dataUser().myUserinfo.value.sessionid, //セッションID
        },
      });
    }
  }
});

//設定データの受け取り、適用
socket.on("infoUserSaveConfig", (userSaveConfig) => {
  console.log("socket :: infoUserSaveConfig : 設定受信", userSaveConfig);

  //もしクラウド上に設定が保存されていたなら
  if (userSaveConfig.configAvailable) {
    CONFIG_NOTIFICATION.value = userSaveConfig.config.CONFIG_NOTIFICATION;
    CONFIG_DISPLAY.value = userSaveConfig.config.CONFIG_DISPLAY;
  }
});

//既読状態データの受け取り、適用
socket.on("infoUserSaveMsgReadState", (userSaveMsgReadState) => {
  console.log(
    "socket :: infoUserSaveMsgReadState : 既読状態受信",
    userSaveMsgReadState
  );

  //もしクラウド上に設定が保存されていたなら
  if (userSaveMsgReadState.msgReadStateAvailable) {
    //既読状態のチャンネルIDを取り出して配列にする
    let keysUserSaveMsgReadState = Object.keys(
      userSaveMsgReadState.msgReadState
    );
    //参加していないチャンネルの既読状態を削除
    for (let index in keysUserSaveMsgReadState) {
      //既読状態のチャンネルIDをぶん回す
      //もしチャンネル参加リストにチャンネルIDが入っていなければ
      if (
        !dataUser().myUserinfo.value.channelJoined.includes(
          keysUserSaveMsgReadState[index]
        )
      ) {
        //引っ張ってきた既読状態から削除
        delete userSaveMsgReadState.msgReadState[
          keysUserSaveMsgReadState[index]
        ];
      } else {
        //チャンネル参加してるなら
        //比較用時間に今の既読時間を設定
        userSaveMsgReadState.msgReadState[
          keysUserSaveMsgReadState[index]
        ].timeBefore =
          userSaveMsgReadState.msgReadState[
            keysUserSaveMsgReadState[index]
          ].time;
      }
    }

    //既読状態を適用
    dataMsg().MsgReadTime.value = userSaveMsgReadState.msgReadState;
  }

  //メッセージ履歴の取得
  for (let index in dataUser().myUserinfo.value.channelJoined) {
    //チャンネルIDを抽出
    let channelid = dataUser().myUserinfo.value.channelJoined[index];
    dataMsg().MsgDB.value[channelid] = [];//メッセージDBを初期化
    getMessage(channelid, 40); //リクエスト送信する
  }
});

//初回処理用のクッキーから設定や既読状態を読み込む
function loadDataFromCookie() {
  //既読状態をクッキーから取得して設定に適用
  try {
    //クッキーから既読状態を取得
    let COOKIE_MsgReadTime = JSON.parse(getCookie("MsgReadTime"));
    console.log("socket :: authResult : クッキーからのMsgReadTime ->");
    console.log(Object.entries(COOKIE_MsgReadTime));

    //既読状態のJSONを配列化して使いやすくする
    let objCOOKIE_MsgReadTime = Object.entries(COOKIE_MsgReadTime);
    //既読状態の新着数とメンション数を0へ初期化(ToDoこれを記録する時点で0になるようにする)
    for (let index in objCOOKIE_MsgReadTime) {
      COOKIE_MsgReadTime[objCOOKIE_MsgReadTime[index][0]].new = 0;
      COOKIE_MsgReadTime[objCOOKIE_MsgReadTime[index][0]].mention = 0;
    }

    //既読状態をクッキーから取得
    dataMsg().MsgReadTime.value = COOKIE_MsgReadTime;
  } catch (e) {
    console.error(e);
  }

  //クッキーからチャンネルミュートリストを取得して設定に適用
  try {
    //クッキーからチャンネルミュートリストを取得
    let COOKIE_ListMute = getCookie("configListMute");
    LIST_NOTIFICATION_MUTE_CHANNEL.value = COOKIE_ListMute.split("::");
  } catch (e) {
    console.error(e);
  }

  //クッキーから通知設定を取得して適用
  try {
    //クッキーから通知設定を読み込み
    let COOKIE_ConfigNotify = JSON.parse(getCookie("configNotify"));
    //もしクッキーの設定情報とデフォルトの項目数が違ったらデフォルトを採用
    if (
      Object.keys(COOKIE_ConfigNotify).length ===
      Object.keys(CONFIG_NOTIFICATION.value).nelgth
    ) {
      CONFIG_NOTIFICATION.value = COOKIE_ConfigNotify;
    }
  } catch (e) {
    console.error("socket :: loadDataFromCookie : エラー->", e);
  }

  //もし同期設定がそもそも空だったらとりあえず同期
  if (getCookie("configSync") === "") {
    //サーバーから設定を取得
    socket.emit("getUserSaveConfig", {
      reqSender: {
        userid: dataUser().myUserinfo.value.userid,
        sessionid: dataUser().myUserinfo.value.sessionid,
      },
    });
  }

  let COOKIE_ConfigSync;
  let COOKIE_ConfigDisplay;
  let COOKIE_ConfigNotify;

  //クッキーから通知設定を読み込み
  try {
    COOKIE_ConfigSync = getCookie("configSync");
  } catch (e) {
    COOKIE_ConfigSync = {};
  }
  try {
    COOKIE_ConfigDisplay = JSON.parse(getCookie("configDisplay"));
  } catch (e) {
    COOKIE_ConfigDisplay = {};
  }
  try {
    COOKIE_ConfigNotify = JSON.parse(getCookie("configNotify"));
  } catch (e) {
    COOKIE_ConfigNotify = {};
  }

  //クッキーから表示設定を取得して適用
  try {
    //同期設定の上書き
    CONFIG_SYNC.value =
      COOKIE_ConfigSync === "true" || COOKIE_ConfigSync === "" ? true : false;
    console.log(
      "socket :: loadDataFromCookie : Syncの設定(cookie)->",
      COOKIE_ConfigSync,
      " そして適用した状態->",
      CONFIG_SYNC.value
    );

    //もしクッキーの設定情報とデフォルトの項目数が違ったらデフォルトを採用
    if (
      Object.keys(COOKIE_ConfigDisplay).length ===
      Object.keys(CONFIG_DISPLAY.value).length
    ) {
      //表示設定を上書き
      CONFIG_DISPLAY.value = COOKIE_ConfigDisplay;
    }

    //通知設定を上書き
    CONFIG_NOTIFICATION.value = COOKIE_ConfigNotify;

    //もし同期設定がオンだったら設定を取得
    if (CONFIG_SYNC.value) {
      console.log("socket :: loadDataFromCookie : 設定を同期します");
      //取得
      socket.emit("getUserSaveConfig", {
        reqSender: {
          userid: dataUser().myUserinfo.value.userid,
          sessionid: dataUser().myUserinfo.value.sessionid,
        },
      });
    }
  } catch (e) {
    console.log("socket :: loadDataFromCookie : 設定読み取りエラー", e);
  }
}

//クッキー設定するやつ(MDNから参考)
export function setCookie(cname, cvalue, exdays) {
  const d = new Date();

  d.setTime(d.getTime() + exdays * 24 * 60 * 60 * 1000); //寿命のための時間計算
  let expires = "expires=" + d.toUTCString(); //寿命設定
  document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/"; //クッキー追加
}

//クッキーを取得(MDNから参考)
export function getCookie(cname) {
  let name = cname + "="; //検索するクッキーの名前を設定
  let decodedCookie = decodeURIComponent(document.cookie); //クッキー取得
  let ca = decodedCookie.split(";"); //クッキーを探せるようにするために分解

  //該当クッキーの探索開始
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];

    while (c.charAt(0) == " ") {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }

  return "";
}
