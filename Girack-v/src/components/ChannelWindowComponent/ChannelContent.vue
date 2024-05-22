<!-- eslint-disable vue/multi-word-component-names -->
<script>
import {
  getMessage,
  updateMsgReadState
} from "../../data/socket.js";
import { dataMsg } from "../../data/dataMsg";
import { dataChannel } from "../../data/dataChannel";
import { getInputState } from "./ChannelInput.vue";
import { dataUser } from "../../data/dataUserinfo";
import { useDisplay } from "vuetify";
import { getCONFIG } from "../../config.js";
import ContentRender from "./ContentComponents/ContentRender.vue";
import ContentNewMessageLine from "./ContentComponents/ContentNewMessageLine.vue";
import ContentSystemMessageRender from "./ContentComponents/ContentSystemMessageRender.vue";

export default {
  setup() {
    const { InputState } = getInputState();
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
    ContentRender,
    ContentSystemMessageRender,
    ContentNewMessageLine,
  },

  props: ["MsgDBActive", "channelInfo"],

  data() {
    return {
      StateFocus: true, //Girackにフォーカスしているかどうか
      msgDisplayNum: 65,
      msgIdEditing: "xxxxxxx",

      //watchする時のハンドラ用
      watcherRoute: {},
      watcherMsgDB: {},
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
        //履歴を削って返す
        return this.MsgDBActive.slice(0,this.msgDisplayNum);
      } catch (e) {
        console.log("Content :: cropMessage : MsgDBが空...?");
      }
    },
  },

  mounted() {
    //ブラウザ上のタブ名を設定
    document.title = this.channelInfo.channelname;
  },

  //KeepAliveを通して新しくチャンネルに移動したとき
  activated() {
    //プレビューならこのタイミングで履歴取得
    if (this.channelInfo.previewmode) {
      getMessage(this.getPath, 25, 0); //履歴を取得
    }

    //ブラウザ上のタブ名を設定
    document.title = this.channelInfo.channelname;

    //watch開始
      //チャンネル移動の監視
    this.watcherRoute = this.$watch("$route", function (newPage, oldPage) {
      //チャンネルのロードを待ってからやつ処理
      this.$nextTick(() => {
        //チャンネル以外のページ場合、これ以降の処理をスキップする
        if (!newPage.path.startsWith("/c/")) {
          return 0;
        }

        //プレビューモードならここで止める(チャンネルインデックスにあるかどうか)
        if (!Object.keys(this.ChannelIndex).includes(newPage.params.id))
          return 0;
        //そもそも履歴データがないなら(あるいは読み込みエラーがあるなら)止める
        try {
          if (this.MsgDB[newPage.params.id].length === 0) return 0; //履歴の長さが0なら
          //比較用既読時間を更新
          let latestTime = this.MsgDB[oldPage.params.id][0].time;
          this.MsgReadTime[oldPage.params.id].timeBefore = latestTime;
        } catch (e) {
          return 0; //エラーでも止める
        }
      });
    });
      //メッセージDB更新の監視
    this.watcherMsgDB = this.$watch("MsgDBActive", function () {
        //console.log("current state ->", this.StateScrolled, this.StateFocus, this.CONFIG_DISPLAY.CONTENT_SCROLL_ONNEWMESSAGE);
        //フォーカスしていることが前提
        if (this.StateScrolled) {
          //もしスクロールしきった状態、または新着が来るととにかくスクロールするという設定なら
          if (this.StateFocus || this.CONFIG_DISPLAY.CONTENT_SCROLL_ONNEWMESSAGE) {
            //レンダーを待ってから処理
            this.$nextTick(() => {
              this.msgDisplayNum = 65; //メッセージの表示数の初期化

              //作成したチャンネルで履歴の長さが表示数を超えたとき、フェッチできる履歴があると設定
              if (this.MsgDBActive.length >= this.msgDisplayNum) {
                // eslint-disable-next-line vue/no-mutating-props
                this.channelInfo.haveAllHistory = false;
              }

              //プレビューならここで停止
              if (this.channelInfo.previewmode) return 0;
              //もしフォーカスしているなら
              if (this.StateFocus) {
                this.setScrollState(); //スクロール状態の確認
                try {
                  //比較用既読時間を更新
                  let latestTime = this.MsgDBActive[0].time;
                  this.MsgReadTime[this.getPath].timeBefore = latestTime;
                } catch(e) {
                  console.log("ChannelContent :: watch(MsgDBActive) : 履歴DB更新->", e);
                }
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
    window.removeEventListener("keydown", this.startEditingMyRecentMessage);
  },

  //マウント外れた時
  unmounted() {
    //ウィンドウのフォーカス監視を取りやめ
    window.removeEventListener("focus", this.setFocusStateTrue);
    window.removeEventListener("blur", this.setFocusStateFalse);
  },

  methods: {
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
      if (
        this.msgDisplayNum + 30 > this.MsgDBActive.length
          &&
        !this.channelInfo.fetchingHistory
      ) {
        // eslint-disable-next-line vue/no-mutating-props
        this.channelInfo.fetchingHistory = true; //履歴取得中と設定
        getMessage(this.getPath, 15, this.MsgDBActive.length); //履歴の取得
      }
      this.msgDisplayNum += 30; //表示数拡大
    },

    //一つ前の履歴から１日が空いてるなら日付の線みたいなのを出す
    checkDateDifference(index) {
      try {
        //もし一つ前のメッセージが存在しないなら処理を停止
        if (this.cropMessage[index + 1] === undefined || this.cropMessage[index + 1].isSystemMessage) return 0;

        //一つ前のメッセージの日、月、年を取得
        let msgDayBefore = parseInt(
          this.cropMessage[index + 1].time.slice(6, 8)
        );
        let msgMonthBefore = parseInt(
          this.cropMessage[index + 1].time.slice(4, 6)
        );
        let msgYearBefore = parseInt(
          this.cropMessage[index + 1].time.slice(0, 4)
        );

        //調べているメッセージの日、月、年を取得
        let msgDayThis = parseInt(this.cropMessage[index + 1].time.slice(6, 8));
        let msgMonthThis = parseInt(this.cropMessage[index + 1].time.slice(4, 6));
        let msgYearThis = parseInt(this.cropMessage[index + 1].time.slice(0, 4));

        //日付の差を計算
        let dayDifference = (msgDayBefore !== msgDayThis);
        let monthIsDifferent = (msgMonthBefore !== msgMonthThis);
        let yearIsDifferent = (msgYearBefore !== msgYearThis);

        //条件で日付線出すか決める
        if (dayDifference  || monthIsDifferent || yearIsDifferent) {
          return true; //表示する
        } else {
          return false; //表示しない
        }
      } catch (e) {
        console.log("ChannelContent :: checkDateDifference : エラー->", this.cropMessage[index + 1], e);
        return false;
      }
    },

    //新着メッセージ数を返す
    checkReadTime(channelid) {
      try {
        //console.log("ChannelContent :: checkReadTime : 既読状態のトリガーになってる");
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

    //スクロール位置によって既読にしたり"下に行く"ボタンを表示させたりする
    setScrollState(event, forcingTrue) {
      //s => bool
      const channelWindow = document.querySelector("#channelWindow"); //スクロール制御用

      //一番下であり、かつフォーカスしているかどうか調べる
      if (
        (
          forcingTrue || //そもそも引数でtrueと渡されているなら
          (
            channelWindow.scrollTop >= -4 ||
            channelWindow.scrollHeight <= channelWindow.clientHeight //もし縦幅がそもそも画面におさまっているなら
          )
        )
        &&
        this.StateFocus
      ) {
        this.StateScrolled = true; //スクロールしきったと保存

        //プレビューなら
        if (this.channelInfo.previewmode) return -1;

        try {
          //もし新着数とメンション数が0じゃなければ0に初期化する
          if (
            this.MsgReadTime[this.getPath].new !== 0 ||
            this.MsgReadTime[this.getPath].mention !== 0
          ) {
            //最新のメッセージを取得するために履歴の長さを予め取得
            let latestTime = this.MsgDBActive[0].time;
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
          } catch(e) {console.log("ChannelContent :: setScrollState : e-> ", e)}
        }

        //もしメッセージがアリじゃないのなら通常faviconに
        if (!FLAGThereIsNewMessages) {
          //faviconを通常表示に
          document.querySelector("link[rel~='icon']").href = "/icon.svg";
        }
      } else if ( //もし一番上にスクロールしているなら履歴読み込み
        channelWindow.scrollHeight + channelWindow.scrollTop <= channelWindow.clientHeight + 1
          &&
        this.CONFIG_DISPLAY.CONTENT_SCROLL_AUTOFETCHHISTORY //自動で履歴取得するように設定してるなら
          &&
        !this.channelInfo.haveAllHistory //履歴をすべて持っていない
          &&
        !this.channelInfo.fetchingHistory //履歴取得中でない
      ) {
        //console.log("ChannelContent :: setScrollState : 履歴拡張します...");
        //表示拡張させて履歴取得させる(スクロール位置が残ってしまわないように遅延はさむ)
        setTimeout(this.cropMessageExtend, 50); //0.05秒待ってから履歴取得
      } else {
        this.StateScrolled = false; //スクロールしきってないと保存
      }
    },

    //このウィンドウにいるかどうかを設定する(true)
    setFocusStateTrue() {
      this.StateFocus = true;
      this.setScrollState(); //既読チェック
    },

    //このウィンドウにいるかどうかを設定する(false)
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
        //配列を逆から探してユーザーIDが一致するものを探す
        for (let i = 0; i <= this.msgDisplayNum; i++) {
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
    class="d-flex flex-column-reverse"
    @scroll="setScrollState"
    style="overflow-y:auto; height:100%;"
  >

    <!-- 一番下にスクロールするボタン -->
    <v-btn
      v-if="!StateScrolled && CONFIG_DISPLAY.CONTENT_GOBOTTOMFAB_SHOW"
      @click="scrollIt"
      position="absolute"
      style="
        z-index: 20;
        padding: 0;
        right: 3vw;
        bottom: 6em;
      "
      icon=""
      :size="getDisplaySize === 'xxl' ? '128' : 'x-large'"
      :elevation="6"
      class="rounded mx-auto"
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

    <!-- !!!このdivでメッセージ表示!!! -->
    <div
      v-for="(m, index) in cropMessage"
      :key="m.messageid"
    >

      <!-- 日付線 -->
      <div
        v-if="checkDateDifference(index)"
        style="width: 100%; padding: 12px 0"
      >
        <v-divider></v-divider>
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
      
      <!-- メッセージそのもの-->
      <ContentRender
        :m="m"
        :index="index"
        :MsgDBActive="MsgDBActive"
        :msgDisplayNum="msgDisplayNum"
        :msgEditing="msgIdEditing===m.messageid?true:false"
        @edit-message="(msgId) => msgIdEditing=msgId"
        @close-editing="msgIdEditing='xxxxxx';"
      />

      <!-- システムメッセージ -->
      <div style="width: 100%" v-if="m.isSystemMessage === true">
        <ContentSystemMessageRender :content="m.content" />
      </div>

      <!-- 新着メッセージ線 -->
      <span v-if="!channelInfo.previewmode">
        <ContentNewMessageLine
          :m="m"
          :index="index"
          :MsgDBActive="MsgDBActive"
          :msgDisplayNum="msgDisplayNum"
        />
      </span>
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
      v-if="MsgDBActive !== undefined && !CONFIG_DISPLAY.CONTENT_SCROLL_AUTOFETCHHISTORY"
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

    <!-- 履歴取得状態表示 -->
    <div
      v-if="
        CONFIG_DISPLAY.CONTENT_SCROLL_AUTOFETCHHISTORY
          &&
        !channelInfo.haveAllHistory
          &&
        (channelInfo.fetchingHistory !== true)
      "
      class="d-flex justify-center my-5"
    >
      <p v-if="!channelInfo.fetchingHistory">スクロールして履歴を取得</p>
      <p v-else>ロード中...</p>
    </div>

    <div 
      v-if="channelInfo.haveAllHistory"
      class="d-flex justify-center my-5"
    >
      これで最後
    </div>

    
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
.pointed {
  cursor: pointer;
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
