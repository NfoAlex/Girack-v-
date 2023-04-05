//socket.js
//通信とかそこらへん

import { io } from 'socket.io-client'; //ウェブソケット通信用
import { ref } from "vue";

import { getCONFIG } from './config.js';
const { CONFIG_NOTIFICATION, LIST_NOTIFICATION_MUTE_CHANNEL } = getCONFIG();

//Socket通信用
export const backendURI = "http://" + location.hostname + ":33333";
const socket = io(backendURI, {
    transports : ['websocket'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 2000,
});

/* vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv */
//ユーザー(自分)情報

const Userinfo = ref({
    username: "User", //名前
    role: "Admin",
    userid: "001", //ユーザーID
    loggedin: false, //ログイン状態
    sessionid: 0, //セッションID
    channelJoined: [], //参加しているチャンネル
});

export function dataUser() {
    return { Userinfo };

}

/* ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ */

/* vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv */

//サーバー(インスタンス)情報 (ToDo削除)
export const Serverinfo = ref({
    servername: "...",
    registerAvailable: null,
    inviteOnly: null
});

//チャンネル情報
const ChannelIndex = ref({
    /*
    "0001": {
        channelname: "random",
        description: "Hello, Girack",
        scope: "open"
    }
    */
});

//チャンネル情報を返すだけ
export function dataChannel() {
    return { ChannelIndex };

}

/* ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ */

/* vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv */

//メッセージ履歴DB
const MsgDB = ref({
    // "001": [
    //     {
    //         id: 0,
    //         username: "asdf",
    //         userid: "xx0",
    //         channelid: "001",
    //         time: "20200217165240643",
    //         content: "Ayo"
    //     },
    //     {
    //         id: 1,
    //         username: "fdsa",
    //         userid: "xx1",
    //         channelid: "001",
    //         time: "20200227165240646",
    //         content: "は"
    //     }
    // ]
});

//ユーザーが最後に読んだ時間リスト
const MsgReadTime = ref({
    "0001": {
        time: "202301011210938424",
        new: 0,
        mention: 0
    }
});

//ユーザー情報(名前とかロールとか)
const UserIndex = ref({

});

const StateScrolled = ref(false); //スクロールしきっているかどうか

//履歴DB返すだけ
export function dataMsg() {
    return { MsgDB, UserIndex, StateScrolled, MsgReadTime };

}

//メッセージ受け取り、出力
socket.on("messageReceive", (msg) => {
    //ログインあるいはチャンネルに参加していないなら
    if ( !Userinfo.value.loggedin ) return;
    if ( !Userinfo.value.channelJoined.includes(msg.channelid) ) return;

    console.log("socket :: msgReceive : ↓");
    console.log(msg);

    //もしユーザーの名前リストに名前がなかったら
    if ( UserIndex.value[msg.userid] === undefined ) {
        //名前をリクエスト
        socket.emit("getInfoUser", {
            targetid: msg.userid,
            reqSender: {
                userid: Userinfo.value.userid, //ユーザーID
                sessionid: Userinfo.value.sessionid //セッションID
            }
        });

    }

    try{
        //DB配列に追加
        if ( MsgDB.value[msg.channelid] !== undefined ) {
            MsgDB.value[msg.channelid].push({
                messageid: msg.messageid,
                userid: msg.userid,
                channelid: msg.channelid,
                time: msg.time,
                content: msg.content,
                hasUrl : msg.hasUrl,
                urlData: msg.urlData,
                reaction: msg.reaction
            });
            
        } else { //配列が空なら新しく作成、配置
            MsgDB.value[msg.channelid] = [{
                messageid: msg.messageid,
                userid: msg.userid,
                channelid: msg.channelid,
                time: msg.time,
                content: msg.content,
                hasUrl : msg.hasUrl,
                urlData: msg.urlData,
                reaction: msg.reaction
            }];

        }

        //メンション数がデータになかったら新たに定義
        if ( MsgReadTime.value[msg.channelid] === null ) MsgReadTime.value[msg.channelid].mention = 0;

        //新着メッセージ数を更新
        if ( MsgReadTime.value[msg.channelid] === undefined ) { //セットされてなかったら新しく定義
            if ( msg.content.includes("@" + Userinfo.value.username) ) {
                MsgReadTime.value[msg.channelid] = {
                    time: msg.time, //最後に読んだ時間
                    new: 1,
                    mention: 0
                };

            } else {
                MsgReadTime.value[msg.channelid] = {
                    time: msg.time, //最後に読んだ時間
                    new: 0,
                    mention: 1
                };

            }

        } else { //すでにあるなら加算
            //メンションならメンションを加算
            if ( msg.content.includes("@" + Userinfo.value.username) ) {
                
                if ( MsgReadTime.value[msg.channelid].mention === null ) {
                    MsgReadTime.value[msg.channelid].mention = 0;

                } else {
                    MsgReadTime.value[msg.channelid].mention++;

                }

            } else { //そうじゃないなら普通に通知を加算
                MsgReadTime.value[msg.channelid].new++;

            }

        }

        //新着のメッセージを通知
        if (
            CONFIG_NOTIFICATION.value.ENABLE && //通知が有効である
            msg.userid !== Userinfo.value.userid && //送信者が自分じゃない
            !LIST_NOTIFICATION_MUTE_CHANNEL.value.includes(msg.channelid) && //ミュートリストにチャンネルが入っていない
            (!location.pathname.includes(msg.channelid) || document.hidden) //今いるチャンネルじゃなく、かつ違うタブなら
        ) {
            //すべてのメッセージを通知に出すようにしているなら通知
            if ( CONFIG_NOTIFICATION.value.NOTIFY_ALL ) {
                //通知を出す
                new Notification(ChannelIndex.value[msg.channelid].channelname, {
                    body: "#" + ( UserIndex.value[msg.userid]===undefined ? msg.userid : UserIndex.value[msg.userid].username) + ": " + msg.content,
                    icon: backendURI + "/img/" + msg.userid + ".jpeg"
                });

            } else if ( CONFIG_NOTIFICATION.value.NOTIFY_MENTION ) { //メンションで通知なら
                if ( msg.content.includes("@" + Userinfo.value.username) ) {
                    //通知を出す
                    new Notification(ChannelIndex.value[msg.channelid].channelname, {
                        body: "#" + ( UserIndex.value[msg.userid]===undefined ? msg.userid : UserIndex.value[msg.userid].username) + ": " + msg.content,
                        icon: backendURI + "/img/" + msg.userid + ".jpeg"
                    });

                }

            }

        }

    }
    catch(e) {
        console.log("Content :: msgDB書き込みエラー");
        console.log(e);

    }

});

//他人の名前の受け取り
socket.on("infoResult", (dat) => {
    if ( dat.type !== "user" ) { return; } //ユーザー情報じゃなければ取りやめ
    console.log("Content :: infoResult : 名前情報受け取り \\/")
    console.log(dat);

    let username = dat.username;
    let userid = dat.userid;
    let role = dat.role;

    UserIndex.value[userid] = {};

    //ユーザーインデックス更新
    UserIndex.value[userid].username = username; //名前
    UserIndex.value[userid].role = role; //ロール

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

    switch( dat.action ) {
        //削除する
        case "delete":
            //ループでIDが一致するメッセージを探す
            for ( let index in MsgDB.value[dat.channelid] ) {
                if ( MsgDB.value[dat.channelid][index].messageid === dat.messageid ) {
                    MsgDB.value[dat.channelid].splice(index,1); //削除

                }

            }
            break;

        //リアクションをつける
        case "reaction":
            //メッセージIDで探索して更新
            for ( let index in MsgDB.value[dat.channelid] ) {
                if ( MsgDB.value[dat.channelid][index].messageid === dat.messageid ) {
                    MsgDB.value[dat.channelid][index].reaction = dat.reaction; //リアクション更新

                }

            }
            break;

        //URLプレビュー用のデータを追加
        case "urlData":
            //メッセージIDで探索して更新
            for ( let index in MsgDB.value[dat.channelid] ) {
                if ( MsgDB.value[dat.channelid][index].messageid === dat.messageid ) {
                    //URlプレビューデータを更新
                    MsgDB.value[dat.channelid][index].urlData.data[dat.urlIndex] = dat.urlDataItem;

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
            userid: Userinfo.value.userid, //ユーザーID
            sessionid: Userinfo.value.sessionid //セッションID
        },
        channelid: channelid, //ほしい履歴のチャンネルID
        readLength: readLength, //ほしい長さ
        startLength: startLength //履歴を取得し始める位置
    });

}

//サーバー情報の受け取り
socket.on("serverinfo", (dat) => {
    console.log("serverinfo :: ");
    console.log(dat);

    //サーバーの基本情報の更新
    Serverinfo.value = {
        servername: dat.servername, //サーバーの名前
        registerAvailable: dat.registerAvailable, //登録できるかどうか
        inviteOnly: dat.inviteOnly //招待オンリーかどうか
    };

});

//ToDo:削除
//情報受け取り
socket.on("infoResult", (dat) => {
    console.log("socket :: infoResult : 情報受け取り!");
    console.log(dat);

    //データがサーバー用なら
    if ( dat.type === "server" ) {
        //サーバーの基本情報の更新
        Serverinfo.value = {
            servername: dat.servername, //サーバーの名前
            registerAvailable: dat.registerAvailable, //登録できるかどうか
            inviteOnly: dat.inviteOnly //招待オンリーかどうか
        };

    }

});

//チャンネル情報の更新
socket.on("infoChannel", (dat) => {
    //参加していないチャンネルならスルー
    if ( !Userinfo.value.channelJoined.includes(dat.channelid) ) {
        return;

    }

    console.log("socket :: infoChannel : チャンネル情報更新");

    //チャンネルデータを更新
    ChannelIndex.value[dat.channelid] = {
        channelname: dat.channelname, //チャンネル名
        description: dat.description, //チャンネル概要
        scope: dat.scope, //チャンネルの公開範囲
        historyReadCount: 0 //すでに読んだ履歴の数
    };

});

//プロフィール情報の受け取り
socket.on("infoUser", (dat) => {
    let username = dat.username;
    let userid = dat.userid;
    let role = dat.role;

    UserIndex.value[userid] = {};

    // console.log("socket :: infoUser : 情報北");
    // console.log(dat);

    //ユーザーインデックス更新
    UserIndex.value[userid].username = username; //名前
    UserIndex.value[userid].role = role; //ロール
    UserIndex.value[userid].banned = dat.banned; //BANされているかどうか
    UserIndex.value[userid].channelJoined = dat.channelJoined; //参加しているチャンネル

    //自分の情報の更新にだけ使うから
    if ( dat.userid !== Userinfo.value.userid ) { return; }

    //参加しているチャンネルリストの長さを比較をして減ったり増えたりしたチャンネルのデータを処理
    if ( dat.channelJoined.length !== Userinfo.value.channelJoined.length ) {
        //チャンネル数が増えているなら
        if ( dat.channelJoined.length > Userinfo.value.channelJoined.length ) {
            let channelNew = (dat.channelJoined).filter( cid => !(Userinfo.value.channelJoined).includes(cid) );
            
            console.log("socket :: チャンネル差 : ");
            console.log(channelNew);

            //新しく参加したチャンネル情報の取得
            for ( let c in channelNew ) {
                //リクエスト送信
                socket.emit("getInfoChannel", {
                    targetid: channelNew[c],
                    reqSender: {
                        userid: Userinfo.value.userid, //ユーザーID
                        sessionid: Userinfo.value.sessionid //セッションID
                    }
                });

            }

            //新しく参加したチャンネルの履歴を取得
            for ( let c in channelNew ) {
                getMessage(channelNew[c], 20); //リクエスト送信する
    
            }

        }

        //チャンネル数が減っている（チャンネルを抜けた）なら
        if ( dat.channelJoined.length < Userinfo.value.channelJoined.length ) {
            console.log("socket :: infoResult : チャンネル差が少ないから減らす");
            dat.channelid = Userinfo.value.channelJoined.filter(cid => !dat.channelJoined.includes(cid));

            console.log("socket :: infoResult : 今参加しているチャンネル -> " + dat.channelJoined);
            //自分が抜けたチャンネル分channelIndexを削る
            for (let c=0; c<Object.keys(ChannelIndex.value).length; c++ ) {
                //チャンネルIDをチャンネル情報リストからとる
                let channelid = Object.keys(ChannelIndex.value)[c];
                
                //チャンネルIDがユーザーが参加しているチャンネルIDリストに入っているかどうか調べる
                if ( !dat.channelJoined.includes(channelid) ) { //チャンネルがリストに入っていなければ
                    delete ChannelIndex.value[channelid]; //そのチャンネルIDのJSONを削除
                    delete MsgDB.value[channelid]; //そのチャンネルの履歴を削除

                    break;

                }

            }

        }

    }

    Userinfo.value = {
        username: dat.username,
        userid: Userinfo.value.userid, //ユーザーID
        role: dat.role, //ロール
        loggedin: true, //ログイン状態はそのまま
        sessionid: Userinfo.value.sessionid, //セッションIDはそのまま
        channelJoined: dat.channelJoined, //参加しているチャンネル
    }

});

//メッセージの履歴受け取り
socket.on("messageHistory", (history) => {
    //履歴がそもそも空なら何もしない
    if ( history === 0 ) {
        return;
    
    }

    console.log("socket :: messageHistory : history -> ");
    console.log(history);

    let channelid = ""; //履歴を入れるチャンネルID

    try {
        channelid = history[0].channelid; //受け取ったデータの中身使っちゃうんだよね
    }
    catch(e) {
        console.log("???");
        console.log(history);
        return;
    }

    let index = 0; //チャンネル参照インデックス変数

    //受信した履歴の中で新着のものかどうか調べる
    for ( index in history ) {
        //既読状態がそもそも無ければやらない
        if ( MsgReadTime.value[channelid] === undefined ) break;
        
        //既読状態の時間から新着メッセージ数を加算
        if ( parseInt(history[index].time) > parseInt(MsgReadTime.value[channelid].time) ) {
            //メンションされていたかどうかにあわせて既読状態を更新
            if ( history[index].content.includes("@" + Userinfo.value.username) ) {
                MsgReadTime.value[channelid].mention++; //メンション数を加算

            } else {
                MsgReadTime.value[channelid].new++; //新着数を加算

            }

        }

    }

    //履歴が存在しているなら履歴を頭から追加
    if ( ChannelIndex.value[channelid].historyReadCount !== 0 ) {
        //データの追加順的に逆だからここでソートしておく
        history = history.reverse();

        //履歴用配列の先頭から一つずつ履歴を追加
        for ( let index in history ) {
            MsgDB.value[channelid].unshift(history[index]);

        }
        
        //履歴の長さを計算
        ChannelIndex.value[channelid].historyReadCount += history.length;

    } else { //存在しないなら新しく追加
        MsgDB.value[channelid] = history;
        ChannelIndex.value[channelid].historyReadCount += history.length;

    }

});

//メッセージの更新
// socket.on("messageUpdate", (dat) => {
//     //メッセージ消したりリアクションされたり
//     /*
//     {
//         action: "delete"|"reaction",
//         channelid: dat.channelid,
//         messageid: dat.messageid,
//         ["reaction"だったら]
//         reaction: dat.reaction
//     }
//     */

//     switch( dat.action ) {
//         //削除する
//         case "delete":
//             //ループでIDが一致するメッセージを探す
//             for ( let index in msgDBbackup[dat.channelid] ) {
//                 if ( msgDBbackup[dat.channelid][index].messageid === dat.messageid ) {
//                     msgDBbackup[dat.channelid].splice(index,1); //削除

//                 }

//             }

//         default:
//             break;

//     }

// });

//認証結果
socket.on("authResult", (dat) => {
    //ユーザーデータの更新
    if ( dat.result ) { //もしログイン成功なら
        //ユーザー情報を更新
        Userinfo.value = {
            userid: dat.userid, //ユーザーID
            loggedin: true, //ログイン状態
            sessionid: dat.sessionid, //セッションID
            channelJoined: dat.channelJoined
        };

        //既読状態をクッキーから取得して設定に適用
        try {
            //クッキーから既読状態を取得
            let COOKIE_MsgReadTime = JSON.parse(getCookie("MsgReadTime"));
            console.log("socket :: authResult : クッキーからのMsgReadTime ->");
            console.log(Object.entries(COOKIE_MsgReadTime));

            //既読状態のJSONを配列化して使いやすくする
            let objCOOKIE_MsgReadTime = Object.entries(COOKIE_MsgReadTime);
            //既読状態の新着数とメンション数を0へ初期化(ToDoこれを記録する時点で0になるようにする)
            for ( let index in objCOOKIE_MsgReadTime ) {
                COOKIE_MsgReadTime[objCOOKIE_MsgReadTime[index][0]].new = 0;
                COOKIE_MsgReadTime[objCOOKIE_MsgReadTime[index][0]].mention = 0;

            }
            
            //既読状態をクッキーから取得
            MsgReadTime.value = COOKIE_MsgReadTime;
        }
        catch(e) {}

        //クッキーからチャンネルミュートリストを取得して設定に適用
        try {
            //クッキーからチャンネルミュートリストを取得
            let COOKIE_ListMute = getCookie("configListMute");

            //チャンネルミュート知るとをクッキーから取得
            LIST_NOTIFICATION_MUTE_CHANNEL.value = COOKIE_ListMute.split("::");
        }
        catch(e) {}

        //クッキーから通知設定を取得して設定に適用
        try {
            //クッキーから通知設定を読み込み
            let COOKIE_ConfigNotify = JSON.parse(getCookie("configNotify"));
            CONFIG_NOTIFICATION.value = COOKIE_ConfigNotify;
        }
        catch(e) {}

        //ユーザー情報をさらに取得
        socket.emit("getInfoUser", {
            targetid: dat.userid,
            reqSender: {
                userid: dat.userid,
                sessionid: dat.sessionid
            },
        });

        //クッキーにセッションIDを設定、寿命は15日
        setCookie("sessionid", dat.sessionid, 15);
        console.log("session id in cookie -> " + getCookie("sessionid"));

        //チャンネル情報の取得
        for ( let c in Userinfo.value.channelJoined ) {
            socket.emit("getInfoChannel", { //リクエスト送信
                targetid: Userinfo.value.channelJoined[c],
                reqSender: {
                    userid: Userinfo.value.userid, //ユーザーID
                    sessionid: Userinfo.value.sessionid //セッションID
                }
            });

        }

        //メッセージ履歴の取得
        for ( let cid in Userinfo.value.channelJoined ) {
            getMessage(Userinfo.value.channelJoined[cid], 20); //リクエスト送信する

        }

    }

});

//クッキー設定するやつ(MDNから参考)
export function setCookie(cname, cvalue, exdays) {
    const d = new Date();

    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000)); //寿命のための時間計算
    let expires = "expires="+d.toUTCString(); //寿命設定
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/"; //クッキー追加

}

//クッキーを取得(MDNから参考)
export function getCookie(cname) {
    let name = cname + "="; //検索するクッキーの名前を設定
    let decodedCookie = decodeURIComponent(document.cookie); //クッキー取得
    let ca = decodedCookie.split(';'); //クッキーを探せるようにするために分解

    //該当クッキーの探索開始
    for(let i = 0; i <ca.length; i++) {
        let c = ca[i];

        while ( c.charAt(0) == ' ' ) {
            c = c.substring(1);

        }
        if ( c.indexOf(name) == 0 ) {
            return c.substring(name.length, c.length);

        }

    }

    return "";

}