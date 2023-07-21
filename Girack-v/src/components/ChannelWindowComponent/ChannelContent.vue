<!-- eslint-disable vue/multi-word-component-names -->
<script>
import {
  getSocket,
  backendURI,
  getMessage,
  setCookie,
  updateMsgReadState
} from "../../data/socket.js";
import { dataMsg } from "../../data/dataMsg";
import { dataChannel } from "../../data/dataChannel";
import { getReplyState } from "./ChannelInput.vue";
import { dataUser } from "../../data/dataUserinfo";
import { useDisplay } from "vuetify";
import { getCONFIG } from "../../config.js";
import ContentHoverMenu from "./ContentComponents/ContentHoverMenu.vue";
import Userpage from "../Userpage.vue";
import ContentURLpreview from "./ContentComponents/ContentURLpreview.vue";
import ContentMessageRender from "./ContentComponents/ContentMessageRender.vue";
import ContentMessageEditing from "./ContentComponents/ContentMessageEditing.vue";
import ContentNewMessageLine from "./ContentComponents/ContentNewMessageLine.vue";
import ContentSystemMessageRender from "./ContentComponents/ContentSystemMessageRender.vue";
import ContentAttatchmentRender from "./ContentComponents/ContentAttatchmentRender.vue";

const socket = getSocket();

export default {
  setup() {
    const { InputState } = getReplyState();
    const { myUserinfo, UserIndex } = dataUser(); //ユーザー情報
    const { MsgDB, StateScrolled, MsgReadTime } = dataMsg(); //履歴用DB
    const { PreviewChannelData, ChannelIndex } = dataChannel();
    const { CONFIG_DISPLAY } = getCONFIG();

    return {
      InputState,
      myUserinfo,
      MsgDB,
      MsgReadTime,
      UserIndex,
      StateScrolled,
      ChannelIndex,
      PreviewChannelData,
      CONFIG_DISPLAY,
    };
  },

  components: {
    Userpage,
    ContentURLpreview,
    ContentHoverMenu,
    ContentMessageRender,
    ContentMessageEditing,
    ContentSystemMessageRender,
    ContentAttatchmentRender,
    ContentNewMessageLine,
  },

  props: ["MsgDBActive", "channelInfo", "isMobile"],

  data() {
    return {
      uri: backendURI, //バックエンドのURI
      StateFocus: true, //Girackにフォーカスしているかどうか
      msgDisplayNum: 25,
      msgIdEditing: "xxxxxxx",

      //watchする時のハンドラ用
      watcherRoute: {},
      watcherMsgDB: {},

      //ホバー処理用
      msgHovered: false, //ホバーされたかどうか
      msgIdHovering: 0, //ホバーされたメッセージのID

      //ユーザーページ用
      userDialogShow: false,
      userDialogUserid: "00000001",

      //ユーザーロールの色を返す
      userRoleColor: {
        Admin: "purple",
        Moderator: "blue",
        Member: "white",
        Deleted: "black",
      },

      goBottom: "goBottom", //下に行くボタン用CSSクラス
    };
  },

  computed: {
    //現在いるパス(チャンネルID)を返すだけ
    getPath() {
      return this.$route.params.id;
    },

    //デバイスのサイズ基準を出す(lgとかsmとか)
    getDisplaySize() {
      return useDisplay().name.value;
    },

    //表示する履歴数を設定
    // eslint-disable-next-line vue/return-in-computed-property
    cropMessage() {
      try {
        //履歴を表示し始める位置数計算
        let displayStartPosition = this.MsgDBActive.length - this.msgDisplayNum;
        //もし開始位置が0未満なら0にする
        if (displayStartPosition < 0) displayStartPosition = 0;

        /*
        console.log(
          "Content :: cropMessage : 履歴を出力します 範囲->",
          this.msgDisplayNum
        );
        */

        //履歴を削って返す
        return this.MsgDBActive.slice(displayStartPosition);
      } catch (e) {
        console.log("Content :: cropMessage : MsgDBが空...?");
      }
    },
  },

  mounted() {
    //ブラウザ上のタブ名を設定
    document.title = this.channelInfo.channelname;

    //レンダー完了を待ってからスクロール
    this.$nextTick(() => {
      this.scrollIt();
    });
  },

  //KeepAliveを通して新しくチャンネルに移動したとき
  activated() {
    //watch開始
      //チャンネル移動の監視
    this.watcherRoute = this.$watch("$route", function (newPage, oldPage) {
      //ページが切り替わったらユーザーページを閉じるように
      this.userDialogShow = false;
      //もしひとつ前がプレビューのものだったなら履歴データと既読状態を削除
      try {
        if (this.PreviewChannelData.channelid === oldPage.params.id) {
          delete this.MsgDB[oldPage.params.id];
          delete this.MsgReadTime[oldPage.params.id];
        }
      } catch (e) {
        console.error(e);
      }

      //レンダーを待ってからスクロール
      this.$nextTick(() => {
        //チャンネル以外のページ場合、これ以降の処理をスキップする
        if (!newPage.path.startsWith("/c/")) {
          //console.log("Content :: watch($route) : スクロールしないわ", this.channelInfo.channelid, newPage.params.id);
          return 0;
        }

        //ブラウザ上のタブ名を設定
        document.title = this.ChannelIndex[newPage.params.id].channelname;

        //プレビューモードならここで止める(チャンネルインデックスにあるかどうか)
        if (!Object.keys(this.ChannelIndex).includes(newPage.params.id))
          return 0;
        //そもそも履歴データがないなら(あるいは読み込みエラーがあるなら)止める
        try {
          if (this.MsgDB[newPage.params.id].length === 0) return 0; //履歴の長さが0なら
          //比較用既読時間を更新
          let latestTime = this.MsgDB[oldPage.params.id].slice(-1)[0].time;
          this.MsgReadTime[oldPage.params.id].timeBefore = latestTime;
        } catch (e) {
          return 0; //エラーでも止める
        }
      });
    });
      //メッセージDB更新の監視
    this.watcherMsgDB = this.$watch(
      "MsgDBActive",
      function () {
        //console.log("current state ->", this.StateScrolled, this.StateFocus, this.CONFIG_DISPLAY.CONTENT_SCROLL_ONNEWMESSAGE);
        //フォーカスしていることが前提
        if (this.StateScrolled) {
          //もしスクロールしきった状態、または新着が来るととにかくスクロールするという設定なら
          if ((this.StateFocus && this.StateScrolled) || this.CONFIG_DISPLAY.CONTENT_SCROLL_ONNEWMESSAGE) {
            //レンダーを待ってからスクロール
            this.$nextTick(() => {
              this.scrollIt(); //スクロールする
              this.msgDisplayNum = 25; //メッセージの表示数の初期化

              //プレビューならここで停止
              if (this.channelInfo.previewmode) return 0;
              //もしフォーカスしているなら
              if (this.StateFocus) {
                //比較用既読時間を更新
                let latestTime = this.MsgDBActive.slice(-1)[0].time;
                this.MsgReadTime[this.getPath].timeBefore = latestTime;
              }
            });
          }
        }
      },
      {
        deep: true,
      }
    );
    
    //ウィンドウのフォーカス監視開始
    window.addEventListener("focus", this.setFocusStateTrue);
    window.addEventListener("blur", this.setFocusStateFalse);
    //キーの監視開始
    window.addEventListener("keydown", this.initMsgReadTimeBefore);
    window.addEventListener("keydown", this.startEditingMyRecentMessage);

    //レンダーを待ってからスクロールする
    this.$nextTick(() => {
      this.scrollIt();
    });
  },

  //別チャンネルへ移動するとき(keepAliveの対象が変わるとき)あるいは別ページに行ったとき
  deactivated() {
    //watch監視停止
    this.watcherRoute();
    this.watcherMsgDB();

    //ウィンドウのフォーカス監視を取りやめ
    window.removeEventListener("focus", this.setFocusStateTrue);
    window.removeEventListener("blur", this.setFocusStateFalse);
    //キーの監視終了
    window.removeEventListener("keydown", this.initMsgReadTimeBefore);
    window.addEventListener("keydown", this.startEditingMyRecentMessage);
  },

  //マウント外れた時
  unmounted() {
    //ウィンドウのフォーカス監視を取りやめ
    window.removeEventListener("focus", this.setFocusStateTrue);
    window.removeEventListener("blur", this.setFocusStateFalse);
  },

  methods: {
    //ユーザーの情報取得するだけ
    getUserStats(userid, category) {
      switch (category) {
        //ロールを返す
        case "role":
          try {
            return this.UserIndex[userid].role;
          } catch (e) {
            return "Member";
          }

        //BANされたかどうかを返す
        case "banned":
          try {
            return this.UserIndex[userid].banned;
          } catch (e) {
            return false;
          }

        //変なエラー避け
        default:
          console.log("なにもないね");
          return null;
      }
    },

    //絵文字を取得するだけ(ToDo:別コンポーネントとして独立)
    getReaction(reaction) {
      switch (reaction) {
        case "smile":
          return "😀";

        case "thinking_face":
          return "🤔";

        case "smirk":
          return "😏";

        case "cold_sweat":
          return "😰";

        default:
          return reaction;
      }
    },

    //さらに過去の履歴(10件)を取得する
    getHistory() {
      console.log(
        "履歴ほしいね :  path -> " +
          this.getPath +
          ", hrcount -> " +
          this.ChannelIndex[this.getPath].historyReadCount
      );
      getMessage(this.getPath, 15, this.MsgDBActive.length);
    },

    //指定された履歴の日付を取得
    getHistoryDate(index) {
      let time = this.cropMessage[index].time;
      let timestamp = "";

      timestamp += time.slice(0, 4) + "/";
      timestamp += time.slice(4, 6) + "/";
      timestamp += time.slice(6, 8);

      return timestamp;
    },

    //表示する履歴を拡張する
    cropMessageExtend() {
      //もし表示する数が履歴の長さより長かったらさらに深い履歴をサーバーから取得する
      if (this.msgDisplayNum + 15 > this.MsgDBActive.length) this.getHistory();
      this.msgDisplayNum += 15;
    },

    //アバターを表示するかどうか
    checkShowAvatar(userid, index) {
      try {
        //分(min)差計算
        let msgTimeMinBefore = parseInt(
          this.cropMessage[index - 1].time.slice(10, 12)
        );
        let msgTimeMinThis = parseInt(
          this.cropMessage[index].time.slice(10, 12)
        );
        //分差計算
        let timeMinDifference = msgTimeMinThis - msgTimeMinBefore;

        //時(h)差計算
        let msgTimeHourBefore = parseInt(
          this.cropMessage[index - 1].time.slice(8, 10)
        );
        let msgTimeHourThis = parseInt(
          this.cropMessage[index].time.slice(8, 10)
        );
        //時差計算
        let timeHourDifference = msgTimeHourThis - msgTimeHourBefore;

        //日付がそもそも違うなら見せる
        if (this.checkDateDifference(index)) return true;

        //メッセージ履歴のインデックス番号より一つ前と同じユーザーIDなら表示しない(false)と返す
        if (this.cropMessage[index - 1].userid === userid) {
          //このメッセージの一つ前のメッセージのユーザーID
          //条件でアバターを見せるか見せないか決める
          if (
            timeMinDifference < -55 ||
            timeMinDifference > 4 ||
            timeHourDifference !== 0
          ) {
            return true;
          } else {
            return false;
          }
        } else {
          return true; //違うから表示する
        }
      } catch (e) {
        return true; //最初だったりするときはとにかく表示する
      }
    },

    //メッセージに背景をつけるために一つの送信者からの最初か、最後かまたは途中のメッセージか調べる
    checkMsgPosition(userid, index) {
      if (this.MsgDBActive === undefined || this.cropMessage.length <= 0)
        return;

      let AvatarNeedToShowBefore = false;
      let AvatarNeedToShow = false;
      let AvatarNeedToShowNext = false;

      //アバターを見せる必要があるかどうか前、次、今の位置分調べておく
      //前
      try {
        //そもそも一つ前のメッセージが存在するか確認
        if (this.cropMessage[index - 1] !== undefined) {
          AvatarNeedToShowBefore = this.checkShowAvatar(
            this.cropMessage[index - 1].userid,
            index - 1
          );
        }
      } catch (e) {
        console.error(e);
      }

      //今の位置
      try {
        AvatarNeedToShow = this.checkShowAvatar(userid, index);
      } catch (e) {
        console.error(e);
      }

      //次
      try {
        //そもそも次のメッセージが存在するか確認
        if (this.cropMessage[index + 1] !== undefined) {
          AvatarNeedToShowNext = this.checkShowAvatar(
            this.cropMessage[index + 1].userid,
            index + 1
          );
        }
      } catch (e) {
        console.error(e);
      }

      let SameWithBefore = false; //ひとつ前と送信者が同じかどうか
      let SameWithNext = false; //次と送信者同じかどうか

      //一つ前と送信者が今のと同じならそう記録
      try {
        //まず一つ前のメッセージがあるか確認
        if (this.cropMessage[index - 1] !== undefined) {
          if (this.cropMessage[index - 1].userid === userid) {
            SameWithBefore = true;
          }
        }
      } catch (e) {
        console.error(e);
      }

      //次の送信者が今のと同じならそう記録
      try {
        //まず次のメッセージがあるか確認
        if (this.cropMessage[index + 1] !== undefined) {
          if (this.cropMessage[index + 1].userid === userid) {
            SameWithNext = true;
          }
        }
      } catch (e) {
        console.error(e);
      }

      //ここから条件処理
      if (AvatarNeedToShowBefore) {
        //一つ前でアバター出てるか
        if (AvatarNeedToShow) {
          if (SameWithNext) {
            if (AvatarNeedToShowNext) {
              return "msgBackgroundSingle";
            } else {
              return "msgBackgroundTop";
            }
          } else {
            return "msgBackgroundSingle";
          }
        } else {
          if (AvatarNeedToShowNext) {
            return "msgBackgroundEnd";
          }

          if (SameWithBefore) {
            if (SameWithNext) {
              return "msgBackgroundMid";
            } else {
              return "msgBackgroundEnd";
            }
          } else {
            return "msgBackgroundEnd";
          }
        }
      } else if (AvatarNeedToShowNext) {
        if (AvatarNeedToShow) {
          if (AvatarNeedToShowNext) {
            return "msgBackgroundSingle";
          } else {
            return "msgBackgroundTop";
          }
        } else {
          return "msgBackgroundEnd";
        }
      } else {
        if (AvatarNeedToShow) {
          if (SameWithNext) {
            return "msgBackgroundTop";
          } else {
            return "msgBackgroundSingle";
          }
        } else {
          if (SameWithNext) {
            return "msgBackgroundMid";
          } else if (SameWithBefore) {
            return "msgBackgroundEnd";
          } else {
            return "msgBackgroundSingle";
          }
        }
      }
    },

    //一つ前の履歴から１日が空いてるなら日付の線みたいなのを出す
    checkDateDifference(index) {
      try {
        //もし一つ前のメッセージが存在しないなら処理を停止
        if (this.cropMessage[index - 1] === undefined) return 0;

        //日を取得
        let msgDateBefore = parseInt(
          this.cropMessage[index - 1].time.slice(6, 8)
        );
        let msgDateThis = parseInt(this.cropMessage[index].time.slice(6, 8));
        //日付の差を計算
        let dateDifference = msgDateBefore - msgDateThis;

        //条件で日付線出すか決める
        if (dateDifference !== 0) {
          return true; //表示する
        } else {
          return false; //表示しない
        }
      } catch (e) {
        console.error(e);
      }
    },

    //新着メッセージ数を返す
    checkReadTime(channelid) {
      try {
        return this.MsgReadTime[channelid].new; //データ返す
      } catch (e) {
        return 0;
      }
    },

    //スクロールさせるだけの関数
    scrollIt() {
      //レンダーを待ってからスクロール
      this.$nextTick(() => {
        const channelWindow = document.querySelector("#channelWindow"); //スクロール制御用
        channelWindow.scrollTo(0, channelWindow.scrollHeight); //スクロール
        this.setScrollState(true); //スクロール状態を"した"と設定
      });
    },

    //ホバー時アクション
    mouseOverMsg(msgId, bool) {
      if (bool === "on") {
        this.msgHovered = true;
        this.msgIdHovering = msgId;
      }

      if (bool === "off") {
        this.msgHovered = false;
        this.msgIdHovering = null;
      }
    },

    //削除したりリアクションしたり編集(ToDo)したり
    messageAction(msgId, act, reaction) {
      //リアクションする
      if (act === "reaction") {
        //リアクションしたことを送信
        socket.emit("actMessage", {
          action: "reaction",
          channelid: this.getPath,
          messageid: msgId,
          reaction: reaction, //送るリアクション
          reqSender: {
            userid: this.myUserinfo.userid,
            sessionid: this.myUserinfo.sessionid,
          },
        });
      }
    },

    //スクロール位置によって既読にしたり"下に行く"ボタンを表示させたりする
    setScrollState(event, forcingTrue) {
      //s => bool
      const channelWindow = document.querySelector("#channelWindow"); //スクロール制御用

      //一番下かどうか調べる？
      if (
        (
          forcingTrue || //そもそも引数でtrueと渡されているなら
          channelWindow.scrollTop + channelWindow.clientHeight + 32 >=
            channelWindow.scrollHeight || //スクロール位置を計算
          channelWindow.scrollHeight <= channelWindow.clientHeight //もし縦幅がそもそも画面におさまっているなら
        )
          &&
        this.StateFocus //かつフォーカスされていたら
      ) {
        this.StateScrolled = true; //スクロールしきったと保存

        //プレビューあるいは新着メッセージが来ているのなら
        if (this.channelInfo.previewmode) return -1;

        try {
          //もし新着数とメンション数が0じゃなければ0に初期化する
          if (
            this.MsgReadTime[this.getPath].new !== 0 ||
            this.MsgReadTime[this.getPath].mention !== 0
          ) {
            //最新のメッセージを取得するために履歴の長さを予め取得
            let latestTime = this.MsgDBActive.slice(-1)[0].time;
            //スクロールだけでは新着線は消さないため保存
            let timeBefore = this.MsgReadTime[this.getPath].timeBefore;

            //既読状態をセット
            this.MsgReadTime[this.getPath] = {
              //既読時間を最新メッセージの時間に設定
              time: latestTime,
              //保存したのをそのままキープさせる
              timeBefore: timeBefore,
              //新着メッセージ数を0に
              new: 0,
              //メンション数を0に
              mention: 0,
            };

            //既読状態をサーバーへ同期させる
            updateMsgReadState();
          }
        } catch (e) {
          console.log("Content :: setScrollState : 既読状態の更新できなかった", e);
          this.MsgReadTime[this.getPath] = {
            //既読時間を最新メッセージの時間に設定
            time: 0,
            //新着メッセージ数を0に
            new: 0,
            //メンション数を0に
            mention: 0,
          };
        }

        //既読状態をCookieへ書き込み
        setCookie("MsgReadTime", JSON.stringify(this.MsgReadTime), 7);
        let FLAGThereIsNewMessages = false; //新着アリという印

        //新着を確認してfaviconを戻すかどうか決める
        for (let key in this.MsgReadTime) {
          try {
            //既読状態をループで計算して新着があればループを断ち切る
            if (
              this.MsgReadTime[key].new !== 0 ||
              this.MsgReadTime[key].mention !== 0
            ) {
              FLAGThereIsNewMessages = true; //メッセージあるぜと登録
              break;
            }
          } catch(e) {console.log(e)}
        }

        //もしメッセージがアリじゃないのなら通常faviconに
        if (!FLAGThereIsNewMessages) {
          //faviconを通常表示に
          document.querySelector("link[rel~='icon']").href = "/icon.svg";
        }
      } else {
        this.StateScrolled = false; //スクロールしきってないと保存
      }
    },

    //このウィンドウにいるかどうかを設定する
    setFocusStateTrue() {
      this.StateFocus = true;
      this.setScrollState(); //既読チェック
    },

    //このウィンドウにいるかどうかを設定する
    setFocusStateFalse() {
      this.StateFocus = false;
    },

    //escキーで新着線を非表示にする
    initMsgReadTimeBefore(event) {
      //escなら
      if (event.key === "Escape") {
        if (this.StateScrolled) {
          //比較用既読状態を初期化
          this.MsgReadTime[this.getPath].timeBefore =
            this.MsgReadTime[this.getPath].time;
        }
        //スクロールさせる
          this.scrollIt();
      }
    },

    //十字キーから、自分の一番直近のメッセージの編集を始める
    startEditingMyRecentMessage(event) {
      //押されたのが上矢印キー、かつ入力中でないのなら
      if (event.key === "ArrowUp" && !this.InputState.isTyping) {
        //メッセージ履歴の長さ
        let msgLength = this.MsgDBActive.length-1;
        //調べるメッセージのインデックス始まり(表示し始めてるところ)
        let msgLookingNum = this.MsgDBActive.length - this.msgDisplayNum;
        //表示インデックスが0未満なら0に設定
        if (msgLength < msgLookingNum) msgLookingNum = 0;

        //配列を逆から探してユーザーIDが一致するものを探す
        for (let i = msgLength; i >= msgLookingNum; i--) {
          if (this.MsgDBActive[i].userid === this.myUserinfo.userid) {
            //編集中のメッセージIDを設定
            this.msgIdEditing = this.MsgDBActive[i].messageid;
            break;
          }
        }
      }
    },

    //メッセージの時間を出力する関数
    printDate(time) {
      let t = new Date(); //時間取得用
      let y = t.getFullYear().toString(); //今年 (４桁)
      let m = (t.getMonth() + 1).toString().padStart(2, 0); //月 (0も含めて２桁に)
      let d = t.getDate().toString().padStart(2, 0); //日 (0も含めて２桁に)

      let timestamp = ""; //出力予定の文字列

      //もし去年以上からのメッセージだったら
      if (time.slice(0, 4) !== y) {
        //今年とデータのタイムスタンプが違っていたら
        timestamp += time.slice(0, 4) + "/";
        timestamp += time.slice(4, 6) + "/";
        timestamp += time.slice(6, 8);

        //表記を返す(時間を足して)
        return (
          timestamp +
          " " +
          time.slice(8, 10) +
          ":" +
          time.slice(10, 12) +
          ":" +
          time.slice(12, 14)
        );
      }

      //↓これいる？
      //もし先月以上前のメッセージだったら
      if (time.slice(4, 6) !== m) {
        //今月とデータのタイムスタンプが違っていたら
        timestamp += time.slice(4, 6) + "/";
        timestamp += time.slice(6, 8);

        //表記を返す(時間を足して)
        return (
          timestamp +
          " " +
          time.slice(8, 10) +
          ":" +
          time.slice(10, 12) +
          ":" +
          time.slice(12, 14)
        );
      }

      //もし昨日以上前のメッセージだったら
      if (time.slice(6, 8) !== d) {
        //今日とデータのタイムスタンプが違っていたら
        timestamp += time.slice(4, 6) + "/";
        timestamp += time.slice(6, 8);

        //表記を返す(時間を足して)
        return (
          timestamp +
          " " +
          time.slice(8, 10) +
          ":" +
          time.slice(10, 12) +
          ":" +
          time.slice(12, 14)
        );
      }

      //普通に今日だったら
      return (
        " 今日 " +
        time.slice(8, 10) +
        ":" +
        time.slice(10, 12) +
        ":" +
        time.slice(12, 14)
      );
    },
  },
};
</script>

<template>
  <div
    id="channelWindow"
    @scroll="setScrollState"
    style="height: 100%; width: 100%; overflow-y: auto"
  >
    <!-- ユーザーページ用 -->
    <div>
      <Userpage
        v-if="userDialogShow"
        v-model="userDialogShow"
        :userid="userDialogUserid"
      />
    </div>

    <!-- 履歴が空なら -->
    <div
      id="rirekikara"
      style="padding: 10%"
      v-if="MsgDBActive === undefined || MsgDBActive.length === 0"
    >
      <p class="text-subtitle-1" style="text-align: center">あなたが最初!</p>
    </div>

    <!-- 履歴読み込みボタン -->
    <div
      v-if="MsgDBActive !== undefined"
      style="
        display: flex;
        margin: 8px 0;
        flex-direction: row;
        justify-content: space-around;
      "
    >
      <v-btn
        v-if="!channelInfo.previewmode"
        size="small"
        @click="cropMessageExtend"
        variant="text"
        >↑過去を読み込む</v-btn
      >
      <v-btn v-else class="rounded-lg" size="small" variant="text"
        >履歴を読み込むにはチャンネルに参加してください...</v-btn
      >
    </div>

    <!-- !!!こっからメッセージ表示!!! -->
    <div
      style="z-index: 1"
      v-for="(m, index) in cropMessage"
      :key="m.messageid"
    >
      <!-- 日付線 -->
      <div
        v-if="checkDateDifference(index)"
        style="width: 100%; padding: 12px 0"
      >
        <v-divider>asdf</v-divider>
        <p
          class="text-subtitle-1"
          :class="
            CONFIG_DISPLAY.CONTENT_DATELINE_SHOWONLEFT
              ? 'text-left'
              : 'text-center'
          "
          style="margin-left: 1.5%"
        >
          {{ getHistoryDate(index) }}
        </p>
      </div>

      <!-- ここからflexで表示するメッセージ-->
      <div
        v-if="m.isSystemMessage === undefined || m.isSystemMessage === false"
        :id="m.messageid"
        class="d-flex justify-end"
        style="margin: 0px 12px"
      >
        <!-- アバター -->
        <v-avatar
          v-if="checkShowAvatar(m.userid, index)"
          class="mx-auto flex-shrink-1"
          width="5vw"
          style="max-width: 20%"
        >
          <v-img
            v-if="getUserStats(m.userid, 'role') !== 'Deleted'"
            @click="
              () => {
                userDialogShow = true;
                userDialogUserid = m.userid;
              }
            "
            class="pointed"
            :alt="m.userid"
            :src="uri + '/img/' + m.userid"
          >
          </v-img>

          <!-- 消去されているユーザーなら -->
          <v-img v-else :alt="m.userid" :src="uri + '/img/' + m.userid">
          </v-img>
        </v-avatar>

        <!-- アバターを表示しないときの空欄ホルダー -->
        <v-avatar
          v-else
          class="mx-auto flex-shrink-1"
          width="5vw"
          style="max-width: 20%; height: 0 !important"
        >
          <v-img
            v-if="getUserStats(m.userid, 'role') !== 'Deleted'"
            :alt="m.userid"
          >
          </v-img>
        </v-avatar>

        <!-- メッセージ本体 -->
        <span
          :class="[
            msgHovered && msgIdHovering === m.messageid ? 'hovered' : null,
            checkMsgPosition(m.userid, index),
          ]"
          class="flex-grow-1"
          style="
            width: 90%;
            margin-left: 8px;
            padding-left: 1.5%;
            padding-right: 1.5%;
          "
        >
          <!-- メッセージ本体 -->
          <!-- v-menuはホバーメニュー用 -->
          <v-menu
            open-on-hover
            :open-on-click="false"
            open-delay="100"
            close-delay="0"
            transition="none"
            :close-on-content-click="false"
            location="end top"
            origin="overlap"
          >
            <!-- ホバーで反応する範囲 -->
            <template v-slot:activator="{ props }">
              <div
                v-bind="props"
                @mouseover="mouseOverMsg(m.messageid, 'on')"
                @mouseleave="mouseOverMsg(m.messageid, 'off')"
              >
                <!-- 過去を表示していたら -->
                <span
                  v-if="index === msgDisplayNum - 25 && msgDisplayNum !== 25"
                  class="d-flex align-center"
                >
                  <v-divider class="flex-grow-0 flex-shrink-1"></v-divider>
                  <span class="flex-grow-1 flex-shrink-0" style="margin: 0 8px"
                    >ここから過去</span
                  >
                  <v-divider class="flex-grow-0 flex-shrink-1"></v-divider>
                </span>

                <!-- ユーザー名と時間表記 -->
                <div
                  class="text-h6 d-flex align-center"
                  v-if="checkShowAvatar(m.userid, index)"
                >
                  <!-- ユーザー名 -->
                  <span class="text-truncate">
                    {{
                      UserIndex[m.userid] !== undefined
                        ? UserIndex[m.userid].username
                        : m.userid
                    }}
                  </span>

                  <!-- ロールバッジ -->
                  <v-chip
                    v-if="
                      getUserStats(m.userid, 'role') !== 'Member' &&
                      CONFIG_DISPLAY.CONTENT_SHOW_ROLE
                    "
                    style="margin-left: 8px"
                    :color="this.userRoleColor[getUserStats(m.userid, 'role')]"
                    size="x-small"
                    :elevation="6"
                  >
                    {{ getUserStats(m.userid, "role") }}
                  </v-chip>

                  <!-- BANされたバッジ -->
                  <v-chip
                    v-if="getUserStats(m.userid, 'banned')"
                    color="red"
                    style="margin-left: 8px"
                    size="x-small"
                    :elevation="6"
                  >
                    BANNED
                  </v-chip>

                  <!-- タイムスタンプ -->
                  <span
                    class="text-caption"
                    style="margin-left: 8px; color: #999"
                  >
                    {{ printDate(m.time) }}
                  </span>
                </div>

                <!-- 返信データ -->
                <p
                  class="text-truncate ma-0"
                  style="margin-top: 8px !important"
                  v-if="
                    m.replyData !== undefined ? m.replyData.isReplying : false
                  "
                >
                  <a :href="'#' + m.replyData.messageid">
                    <!-- 返信アイコン -->
                    <v-icon>mdi:mdi-reply</v-icon>
                    <!-- 返信する人の名前 -->
                    <v-chip
                      size="small"
                      color="grey"
                      variant="flat"
                      style="cursor: pointer"
                    >
                      {{
                        UserIndex[m.replyData.userid] !== undefined
                          ? UserIndex[m.replyData.userid].username
                          : m.replyData.userid
                      }}
                    </v-chip>
                  </a>
                  <!-- 返信内容 -->
                  :
                  <ContentMessageRender
                    class="text-medium-emphasis"
                    :content="m.replyData.content"
                  />
                </p>

                <!-- メッセージ本文と編集中表示 -->
                <ContentMessageRender v-if="msgIdEditing!==m.messageid" :content="m.content" />
                <ContentMessageEditing
                  v-else
                  @update-editing-message="(mID)=>{msgIdEditing=mID}"
                  :channelid="m.channelid"
                  :content="m.content"
                  :messageid="m.messageid"
                >
                </ContentMessageEditing>

                <!-- メッセージが編集されていたら -->
                <p v-if="m.isEdited" class="text-disabled text-caption">
                  編集済み
                </p>

                <!-- ファイル添付表示 -->
                <ContentAttatchmentRender
                  v-if="m.fileData"
                  :fileData="m.fileData"
                  :channelid="getPath"
                />

                <!-- URLプレビュー用 -->
                <ContentURLpreview v-if="m.hasUrl" :urlData="m.urlData" />

                <!-- リアクション -->
                <div>
                  <v-chip
                    @click="messageAction(m.messageid, 'reaction', r[0])"
                    style="
                      margin-top: 4px;
                      margin-right: 8px;
                      margin-bottom: 4px;
                      user-select: none;
                      -webkit-user-select: none;
                    "
                    size="small"
                    color="white"
                    v-for="r in Object.entries(m.reaction)"
                    :key="r"
                  >
                    {{ getReaction(r[0]) }} {{ r[1] }}
                  </v-chip>
                </div>
              </div>
            </template>
            <!-- ここからホバーメニュー -->
            <ContentHoverMenu
              @update-editing-message="(mID)=>{msgIdEditing=mID}"
              style="z-index: 30"
              :m="m"
              :userrole="getUserStats(m.userid, 'role')"
              :channelid="getPath"
            />
          </v-menu>
        </span>
      </div>

      <!-- システムメッセージ -->
      <div style="width: 100%" v-if="m.isSystemMessage === true">
        <ContentSystemMessageRender :content="m.content" />
      </div>

      <!-- 新着メッセージ線 -->
      <ContentNewMessageLine :m="m" :index="index" :MsgDBActive="MsgDBActive" />
    </div>

    <!-- 一番下にスクロールするボタン -->
    <v-btn
      v-if="!StateScrolled && CONFIG_DISPLAY.CONTENT_GOBOTTOMFAB_SHOW"
      @click="scrollIt"
      style="
        z-index: 20;
        padding: 0;
        position: sticky;
        left: 100%;
        bottom: 32px;
        margin-right: 1.5% !important;
      "
      icon=""
      :size="getDisplaySize === 'xxl' ? '128' : 'x-large'"
      :elevation="6"
      position="fixed"
      class="rounded-lg mx-auto"
    >
      <v-badge
        v-if="checkReadTime(getPath) !== 0"
        color=""
        :content="checkReadTime(getPath)"
        inline
      >
      </v-badge>
      <v-icon v-if="!checkReadTime(getPath)" icon="mdi:mdi-arrow-down-thick">
        mdi:mdi-arrow-down-thick
      </v-icon>
    </v-btn>
  </div>
</template>

<style scoped>
.goBottom {
  position: absolute;
  right: 1vw;
  bottom: 10vh;

  width: 4vmax;
  max-width: 5vh;

  height: 4vmax;
  max-height: 5vh;

  background-color: #49454f;
}

.hovered {
  background-color: #444 !important;
}

.pointed {
  cursor: pointer;
}

.msgBackgroundMid {
  border-radius: 0px;
  background-color: #333;

  padding-top: 2px !important;
  padding-bottom: 2px !important;
}

.msgBackgroundTop {
  border-top-right-radius: 12px;
  border-top-left-radius: 12px;
  background-color: #333;

  margin-top: 6px;
  padding-top: 8px !important;
  padding-bottom: 2px !important;
}

.msgBackgroundEnd {
  border-bottom-left-radius: 12px;
  border-bottom-right-radius: 12px;
  background-color: #333;

  margin-bottom: 6px;
  padding-bottom: 8px !important;
  padding-top: 2px !important;
}

.msgBackgroundSingle {
  border-radius: 12px;
  background-color: #333;

  margin: 6px 0;
  padding-top: 8px;
  padding-bottom: 8px;
}

/* スクロールバー用 */
#channelWindow::-webkit-scrollbar {
  width: 10px;
}

#channelWindow::-webkit-scrollbar-track {
  background-color: rgba(0, 0, 0, 0);
}

#channelWindow::-webkit-scrollbar-thumb {
  background-color: #666;
}
</style>
