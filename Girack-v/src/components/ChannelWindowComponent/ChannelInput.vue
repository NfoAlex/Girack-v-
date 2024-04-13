<!-- eslint-disable vue/multi-word-component-names -->
<script>
import { useDisplay } from "vuetify";
import { getSocket, Serverinfo, getCookie, setCookie } from "../../data/socket.js";
import { dataMsg } from "../../data/dataMsg";
import { dataChannel } from "../../data/dataChannel";
import { dataUser } from "../../data/dataUserinfo";
import { ref } from "vue";

const socket = getSocket();

//返信モード
const ReplyState = ref({
  isReplying: false,
  messageid: "0",
});

const InputState = ref({
  isTyping: false,
});

export function getInputState() {
  return { ReplyState, InputState };
}

export default {
  setup() {
    const { mobile } = useDisplay();
    const { ReplyState, InputState } = getInputState();
    const { myUserinfo, UserIndex } = dataUser();
    const { ChannelIndex } = dataChannel();
    const { MsgDB } = dataMsg();

    return {
      mobile,
      ReplyState,
      InputState,
      myUserinfo,
      ChannelIndex,
      MsgDB,
      UserIndex,
      Serverinfo,
    };
  },

  props: ["channelInfo"],

  data() {
    return {
      uri: window.location.origin,
      txt: "", //入力した文字
      fxTwitButtonDisplay: false, //fxTwitter化するボタンを表示するかどうか
      fxTwitternize: true, //fxTwitter化するかどうか
      fileInputData: [], //アップロードするファイル

      dialogChannelMove: false, //チャンネル移動確認ダイアログ
      confirmingChannelMove: false, //チャンネル移動中に待つ時用
      channelidBefore: "", //一つ前のチャンネルID

      //返信情報として表示する部分
      contentDisplay: {
        username: "",
        content: "",
      },

      searchMode: {
        enabled: false, //検索モードに入っているかどうか
        selectedIndex: 0, //選択しているもの
        searchStartingAt: 0, //検索モードに入った文字位置
        searchEndingAt: 100, //検索文字列の範囲終わり(文字列全体の長さ - searchStartingAt)
        txtLengthWhenStartSearching: 0, //検索をし始めたときの文字列全体の長さ
        searchingTerm: "", //ToDo::(!現在未使用!)検索するもの("user" | "channel")
        searchingQuery: "", //検索してる文字列
      },

      searchDisplayArray: [], //検索するときに表示する配列
      userHereArray: [], //このチャンネルに参加しているユーザー配列
    };
  },

  watch: {
    //返信状態が変わったらメッセージの取得を開始
    ReplyState: {
      handler() {
        this.getMessage(); //返信先のメッセージ取得
        this.$el.querySelector("#inp").focus(); //入力欄へフォーカス
      },
      deep: true,
    },

    //ページの変更を監視
    $route: {
      handler(newPage, oldPage) {
        //プレビュー中なら何もしない
        if (this.channelInfo.previewmode) return -1;

        //返信中であり、移動中ではないのなら移動の確認ダイアログを出す
        if (
          ReplyState.value.isReplying &&
          newPage.params.id !== this.channelidBefore
        ) {
          this.channelidBefore = oldPage.params.id; //ひとつ前のチャンネルを設定
          this.dialogChannelMove = true; //確認ダイアログを表示
        }

        //チャンネル以外の場合、以降の処理をスキップする
        if (!newPage.path.startsWith("/c/")) {
          return 0;
        }

        //ここに参加している人リストを取得
        socket.emit("getInfoChannelJoinedUserList", {
          targetid: this.getPath,
          reqSender: {
            userid: this.myUserinfo.userid,
            sessionid: this.myUserinfo.sessionid,
          },
        });

        //入力欄に表示するためのチャンネル名を取得
        this.channelname = this.channelInfo.channelname;

        //レンダーを待ってから入力欄へフォーカス
        this.$nextTick(() => {
          try { //プレビューから戻ってくることを想定してtry
            if (!this.isMobile) this.$el.querySelector("#inp").focus();
          } catch(e) {
            console.log("ChannelInput :: watch($route) : 入力欄へのフォーカスができなかった");
          }
        });
      },
    },

    //入力したテキストを監視してユーザー名を検索しようとしているか調べる、あとfxTwitter
    txt() {
      //もし１文字以上入力されていたら入力している状態と保存
      if (this.txt.length > 0) {
        this.InputState.isTyping = true;
      } else {
        this.InputState.isTyping = false;
      }

      //fxTwitter用のURL判別処理
      this.checkFxTwitter()

      //@が入力されたら検索モードに入る
      if (this.txt[this.txt.length - 1] === "@") {
        this.searchMode.enabled = true; //検索モードを有効化
        this.searchMode.searchStartingAt = this.txt.length - 1; //検索し始めた文字位置を記憶
        this.searchMode.selectedIndex = 0; //ユーザー選択番号を0(初期化)

        //最新のチャンネルに参加している人リストを取得
        socket.emit("getInfoChannelJoinedUserList", {
          targetid: this.getPath,
          reqSender: {
            userid: this.myUserinfo.userid,
            sessionid: this.myUserinfo.sessionid,
          },
        });
      }

      //スペースが入力された、あるいは文字が空になったら検索モードを終了
      if (
        this.txt[this.txt.length - 1] === " " ||
        this.txt[this.txt.length - 1] === "　" ||
        this.txt.length === 0
      ) {
        this.searchMode.enabled = false;
      }

      //検索モードに入っているなら検索する
      if (this.searchMode.enabled) {
        //検索文字列の範囲終わりを取得
        this.searchMode.searchEndingAt =
          this.txt.length -
          this.searchMode.txtLengthWhenStartSearching +
          this.searchMode.searchStartingAt;
        //もし開始文字位置と検索範囲終わり位置がかたよったら検索モードを無効化して関数を止める
        if (
          this.searchMode.searchStartingAt + 1 >
          this.searchMode.searchEndingAt
        ) {
          this.searchMode.enabled = false;
          return;
        }

        //検索文字列を取得
        this.searchMode.searchingQuery = this.txt.substring(
          this.searchMode.searchStartingAt + 1,
          this.searchMode.searchEndingAt
        );

        //検索語で配列をフィルターして標示用の配列へ設定
        this.searchDisplayArray = this.channelJoinedUserArray.filter((u) => {
          //ユーザー名に検索語が含まれていたら表示する配列へ追加(全部小文字にしてる)
          if ((u.username).toLowerCase().includes((this.searchMode.searchingQuery).toLowerCase())) {
            return u.username;
          }
        });
      }
    },
  },

  computed: {
    //現在のパスからチャンネルのID返すだけ
    getPath() {
      return this.$route.params.id; //パス
    },

    //スマホかどうかを返すだけ
    isMobile() {
      return this.mobile;
    }
  },

  methods: {
    //Enterキーのトリガー処理
    EnterTrigger(event) {
      //変換中のEnterなら処理させない
      if (event.keyCode !== 13) return;

      //Shiftが同時に押されていたら改行するだけ
      if (event.shiftKey) {
        //現在の入力欄上のカーソル位置
        let currentTxtCursor = this.$el.querySelector("#inp").selectionStart;

        //テキストを現在のカーソル位置をもとに分裂させる
        let txtBefore = this.txt.slice(0, currentTxtCursor);
        let txtAfter = this.txt.slice(currentTxtCursor);

        //改行を挿入
        this.txt = txtBefore + "\n" + txtAfter;

        //カーソル位置を改行のすぐ次へ移動
        this.$nextTick(() => {
          this.$el
            .querySelector("#inp")
            .setSelectionRange(currentTxtCursor + 1, currentTxtCursor + 1);
        });

        //ここでトリガー処理を停止
        return;
      }

      //もしメンションのゆーざー検索が有効ならメンション文を打ち込む、違うならメッセージ送信
      if (this.searchMode.enabled) {
        //メンション文打ち込み開始
        this.replaceQueryWithName(
          this.searchDisplayArray[this.searchMode.selectedIndex].userid
        );
        //検索モードを終了
        this.searchMode.enabled = false;

        //もし250文字以内ならメッセージ送信
      } else if (this.txt.length <= this.Serverinfo.config.MESSAGE.MESSAGE_TXT_MAXLENGTH) {
        //メッセージ送信開始
        this.msgSend(event);
      }
    },

    //テキスト入力中の@押された時のトリガー処理
    AtsignTrigger() {
      this.searchMode.enabled = true; //検索モードに入る
      this.searchMode.txtLengthWhenStartSearching = this.txt.length; //検索に入った時の文字の長さ取得
      this.searchMode.selectedIndex = 0; //選択を初期化
      this.searchMode.searchStartingAt =
        document.querySelector("#inp").selectionStart;
    },

    //下十字キーのトリガー(メンション時のユーザー検索用)
    arrowDownTrigger(e) {
      if (this.searchMode.enabled) {
        e.preventDefault();
        this.changeMentionUserSelect("down");
      }
    },

    //上十字キーのトリガー(メンション時のユーザー検索用)
    arrowUpTrigger(e) {
      if (this.searchMode.enabled) {
        e.preventDefault();
        this.changeMentionUserSelect("up");
      }
    },

    //メッセージを送信する
    msgSend() {
      //fxTwitter化する
      if (this.fxTwitternize) { //そもそもする設定？
        this.txt = this.txt.replaceAll("https://x.com/", "https://fxtwitter.com/");
        this.txt = this.txt.replaceAll("https://twitter.com/", "https://fxtwitter.com/");
      }

      //送信ｨﾝ!
      socket.emit("msgSend", {
        userid: this.myUserinfo.userid, //名前
        channelid: this.getPath, //チャンネルID
        sessionid: this.myUserinfo.sessionid, //セッションID);
        replyData: {
          //返信データ
          isReplying: ReplyState.value.isReplying, //これは返信かどうか
          messageid: ReplyState.value.isReplying
            ? ReplyState.value.messageid
            : null, //返信先のメッセージID
        },
        fileData: {
          //ファイル添付データ
          isAttatched: this.fileInputData.length !== 0 ? true : false, //添付しているかどうか
          attatchmentData: this.fileInputData, //ファイルデータそのもの
        },
        content: this.txt, //メッセージの本文
        reqSender: {
          userid: this.myUserinfo.userid,
          sessionid: this.myUserinfo.sessionid,
        },
      });

      this.txt = ""; //入力欄を空に
      this.fileInputData = []; //ファイルを空に

      this.resetReply(); //返信状態を初期化
      document.querySelector("#inp").focus(); //入力欄へフォーカス
    },

    //返信状態を初期化して閉じる
    resetReply() {
      ReplyState.value.isReplying = false;
      ReplyState.value.messageid = "0";
    },

    //アップロードしたいファイルを入力
    fileInputRef() {
      console.log("Input :: fileInputRef : ファイルを入力");
      console.log(this.$refs.fileInput);
      this.$refs.fileInput.click(); //ファイルアップロードボタンを仮想的にクリック
    },

    //ファイル入力の受け取り
    fileInput() {
      //inputに入力されたファイルの数ぶん処理する
      for (let index in this.$refs.fileInput.files) {
        //100MBよりもでかいならパス
        if (
          this.$refs.fileInput.files[index].size >= this.Serverinfo.config.MESSAGE_FILE_MAXSIZE ||
          this.$refs.fileInput.files[index].size < 1 ||
          this.$refs.fileInput.files[index].size === undefined
        ) {
          console.log("Input :: fileInput : ファイル入力エラー");
        } else {
          //ファイルデータ用配列へファイルデータを追加
          this.fileInputData.push({
            name: this.$refs.fileInput.files[index].name,
            size: this.$refs.fileInput.files[index].size,
            type: this.$refs.fileInput.files[index].type,
            buffer: this.$refs.fileInput.files[index],
          });
        }
      }
    },

    //クリップボードからのファイル受け取り
    async fileInputFromClipboard(event) {
      const files = event.clipboardData.files; //イベントデータからクリップボードのファイル取得

      //格納されたデータ分処理
      for ( let index in files ) {
        const item = files[index]; //データ抽出
        //もしデータがオブジェクト型ならファイルデータ配列へプッシュ
        if (typeof(item) === "object") {
          try {
            //ファイルデータ用配列へファイルデータを追加
            this.fileInputData.push({
              name: files[index].name,
              size: files[index].size,
              type: files[index].type,
              buffer: files[index],
            });
          } catch(e) {
            console.log("Input :: fileInputFromClipboard : ファイル入力エラー");
          }
        }
      }
    },

    //メンション用のユーザー検索時にクリックされたらユーザーIDを自動入力する部分
    replaceQueryWithName(targetUserid) {
      console.log(
        "Input :: replaceQueryWithName : 置き換えるユーザーid->",
        targetUserid,
        " 文字位置->",
        this.searchMode.searchStartingAt
      );

      //入力テキストの@部分をメンション文で代入
      if (this.searchMode.searchingQuery === "") {
        this.txt =
          this.txt.substring(0, this.searchMode.searchStartingAt) +
          ("@/" + targetUserid + "/ ") +
          this.txt.substring(this.searchMode.searchStartingAt + 1);
      } else {
        this.txt = this.txt.replace(
          "@" + this.searchMode.searchingQuery,
          "@/" + targetUserid + "/ "
        );
      }

      //入力欄へフォーカスしなおす
      this.$el.querySelector("#inp").focus();
    },

    //fxTwitter用のURL判別処理(watch(txt)で反応してます)
    checkFxTwitter() {
      //TwitterURLを判別するための正規表現条件
      const twtRegexes = [
        /https?:\/\/twitter\.com\/(\w+)\/status(es)?\/(\d+)/g,
        /https?:\/\/x\.com\/(\w+)\/status(es)?\/(\d+)/,
      ];

      //ツイートの存在記録用変数
      let twitterURLAvailable = false;
      //当てはまったURLのリスト
      let matchResultURLs = [];

      //正規表現条件を一つずつ確認
      for (let reg in twtRegexes) {
        //検査
        let matchResult = this.txt.match(twtRegexes[reg]);

        //console.log("ChannelInput :: watch(txt) : twitterRegextest->", matchResult);

        //見つかったらツイートがあると記録
        if (matchResult !== null) {
          twitterURLAvailable = true;
          matchResultURLs.push(matchResult);
        }
      }

      //もしツイートのURLがあるんだったらボタンを表示、そうでなければ非表示
      if (twitterURLAvailable) {
        this.fxTwitButtonDisplay = true; //表示
      } else {
        this.fxTwitButtonDisplay = false; //非表示
      }
    },

    //メンション用のユーザー検索の十字キーでのユーザー選択変更部分
    changeMentionUserSelect(pickDireciton) {
      //もしキー入力が下矢印で、かつ選択しているインデックス番号が(検索結果配列の長さ-1)未満なら
      if (
        pickDireciton === "down"
          &&
        this.searchDisplayArray.length - 1 > this.searchMode.selectedIndex
      ) {
        this.searchMode.selectedIndex += 1; //インデックスを進める
      }

      //もしキー入力が上矢印で、かつ選択しているインデックス番号が0より上だったら
      if (pickDireciton === "up" && this.searchMode.selectedIndex > 0) {
        this.searchMode.selectedIndex -= 1; //インデックスを戻す
      }

      //もし選択するものがないなら(メンションモードじゃない時など)処理を停止
      if (this.$refs.optionsItem === undefined) return;

      //選択しているユーザーの高さ取得してその位置にスクロールする
      //選択しているユーザーの要素の高さ全部同じになるはず
      let itemPosition =
        this.$refs.optionsItem[this.searchMode.selectedIndex].$el.clientHeight;
      //どれくらいスクロールするかの計算(上を空けてスクロールするために２個分空ける)
      let scrollingPosition =
        itemPosition * (this.searchMode.selectedIndex - 2);
      //スクロール位置の計算が0未満になったなら0にする
      if (scrollingPosition < 0) scrollingPosition = 0;
      //スクロール
      this.$refs.optionsList.$el.scrollTo(0, scrollingPosition);
    },

    //一つ前のチャンネルに戻る
    goBackToPreviousChannel() {
      this.$router.push({ path: "/c/" + this.channelidBefore }); //一つ前のチャンネルへ移動
      this.dialogChannelMove = false; //ダイアログを閉じた状態にする
    },

    //履歴からメッセージを取得
    getMessage() {
      //今いるチャンネルの履歴を取得
      let MsgDBHere = this.MsgDB[this.getPath];

      //console.log("Input getMessage : using ", MsgDBHere);

      //履歴から一致するメッセージIDのものを探す
      for (let index in MsgDBHere) {
        //一致していたら表示用変数へ取り込む
        if (MsgDBHere[index].messageid === ReplyState.value.messageid) {
          this.contentDisplay = {
            username: this.UserIndex[MsgDBHere[index].userid].username, //名前
            content: MsgDBHere[index].content, //メッセージ本文
          };
          break;
        }
      }
    },

    //自分が話せるチャンネルかどうか判別
    checkCanITalk() {
      //それぞれ条件判別
      //Adminなら問答無用で話せる
      if (this.myUserinfo.role === "Admin") return true;
      //Moderatorで話せるロールがAdmin指定でないなら話せる
      if (
        this.myUserinfo.role === "Moderator" &&
        this.channelInfo.canTalk !== "Admin"
      )
        return true;
      //Memberで話せるロールがMemberなら話せる
      if (
        this.myUserinfo.role === "Member" &&
        this.channelInfo.canTalk === "Member"
      )
        return true;

      //どれにも当てはまらないなら話せない
      return false;
    },

    //ファイルサイズの値を読める形の単位に変換(https://stackoverflow.com/questions/10420352/converting-file-size-in-bytes-to-human-readable-string)
    humanFileSize(bytes, si = false, dp = 1) {
      const thresh = si ? 1000 : 1024;

      //文字列ならeが含まれるか調べる
      if (typeof bytes === "string") {
        //略式サイズなら数字に変換
        if (bytes.includes("e")) {
          let NumOfZeros = bytes.slice(bytes.length - 1); //使う0の数
          let ZerosInString = ""; //0を入れる変数
          for (let i = 0; i < NumOfZeros; i++) {
            ZerosInString += "0";
          } //追加

          //文字列を統合して数字にする
          bytes = parseInt(bytes.split("e")[0] + ZerosInString);
        }
      }

      if (Math.abs(bytes) < thresh) {
        return bytes + " B";
      }

      const units = si
        ? ["kB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]
        : ["KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB", "YiB"];
      let u = -1;
      const r = 10 ** dp;

      do {
        bytes /= thresh;
        ++u;
      } while (
        Math.round(Math.abs(bytes) * r) / r >= thresh &&
        u < units.length - 1
      );

      return bytes.toFixed(dp) + " " + units[u];
    },

    //チャンネルへ参加している人リストの受信
    SOCKETinfoChannelJoinedUserList(channelJoinedUserList) {
      this.channelJoinedUserArray = channelJoinedUserList;
    },
  },

  mounted() {
    //チャンネルへ参加している人リストの受信
    socket.on(
      "infoChannelJoinedUserList",
      this.SOCKETinfoChannelJoinedUserList
    );
    //ここに参加している人リストを取得
    socket.emit("getInfoChannelJoinedUserList", {
      targetid: this.getPath,
      reqSender: {
        userid: this.myUserinfo.userid,
        sessionid: this.myUserinfo.sessionid,
      },
    });
    //プレビューじゃないならにフォーカスする
    if (!this.channelInfo.previewmode) this.$el.querySelector("#inp").focus();
    //cookieに保存している「最後に入力していた値」を入力フォームの初期値に設定
    let previousText = getCookie("previousText");
    this.txt = previousText;
  },

  unmounted() {
    //socketの重複防止
    socket.off(
      "infoChannelJoinedUserList",
      this.SOCKETinfoChannelJoinedUserList
    );
    //メニューページなどにいったら返信状態をリセット
    this.resetReply();
    //直前に入力していた値をcookieに保存。有効期限は1日
    setCookie("previousText", this.txt, 1);
  },
};
</script>

<template>
  <div v-if="!channelInfo.previewmode">
    <!-- 返信する前にチャンネル移動しようとしたときの警告 -->
    <v-dialog v-model="dialogChannelMove" width="40vh">
      <v-card class="pa-5">
        <v-card-title> 確認 </v-card-title>
        <v-card-text>
          <p>まだ返信を終えていません。チャンネル移動しますか？</p>
        </v-card-text>
        <v-card-action>
        <v-btn
          @click="
            resetReply();
            dialogChannelMove = false;
          "
          class="rounded ma-1"
          color="primary"
        >
          いいよ
        </v-btn>
        <v-btn
          @click="goBackToPreviousChannel()"
          class="rounded ma-1"
          variant="text"
        >
          だめ
        </v-btn>
        </v-card-action>
      </v-card>
    </v-dialog>

    <!-- fxTwitter化ボタン -->
    <div v-if="fxTwitButtonDisplay" class="mx-auto" style="width:95%; height:fit-content;">
      <v-checkbox
        v-model="fxTwitternize"
        density="compact"
        label="fx化する"
        hide-details="auto"
      >
      </v-checkbox>
    </div>

    <!-- 返信部分 -->
    <div
      v-if="ReplyState.isReplying"
      class="my-1 d-flex align-center mx-auto"
      style="width:95%;"
    >
      <v-icon class=""> mdi:mdi-reply </v-icon>
      <!-- 返信キャンセルボタン -->
      <v-btn
        class="rounded mx-2 elevation-0"
        icon=""
        color="secondary"
        size="x-small"
        @click="resetReply"
      >
        <v-icon> mdi:mdi-close </v-icon>
      </v-btn>
      <!-- 返信先 -->
      <p class="text-truncate">
        {{ contentDisplay.username }} :: {{ contentDisplay.content }}
      </p>
      
    </div>

    <!-- ファイルアップロードデータの表示 -->
    <div v-if="Object.keys(fileInputData).length>0" class="d-flex ma-1 align-center">
      <span class="d-flex">
        <v-btn
          @click="fileInputData=[];"
          class="rounded-lg"
          icon="mdi:mdi-trash-can-outline"
          size="x-small"
        >
        </v-btn>
        <v-card class="ma-1">
          {{ Object.keys(fileInputData).length }}
        </v-card>
        <v-divider class="ma-1" vertical>
        </v-divider>
      </span>

      <div class="fileList" style="margin:0 1.5%; overflow-x:auto;">
        <span class="d-flex align-center" style="width:fit-content;">
          <v-card
            color="secondary"
            style="margin-right:8px;"
            class="pa-2 rounded-lg d-flex justify-space-between align-center"
            v-for="(file, index) in fileInputData"
            :key="index"
          >
            <span class="text-truncate">{{ file.name }}</span>
            <v-chip style="margin: 0 4px" size="small">
              {{ humanFileSize(file.size, true) }}
            </v-chip>
            <v-icon
              @click="fileInputData.splice(index, 1)"
              style="margin-left: 4px"
            >
              mdi:mdi-close-circle
            </v-icon>
          </v-card>
        </span>
      </div>
    </div>

    <!-- ファイル受け取り部分(非表示) -->
    <input
      @change="fileInput"
      type="file"
      ref="fileInput"
      style="display: none"
      multiple
    />

    <div
      style="width:95%; height:fit-content; position:relative;"
      class="mt-2 mx-auto d-flex justify-space-between align-center"
    >

      <!-- メンションウィンドウ -->
      <v-card
        v-if="searchMode.enabled"
        width="100%"
        position="absolute"
        max-height="30vh"
        ref="optionsList"
        class="rounded-lg"
        style="bottom:101%; overflow-y:auto; z-index:100;"
      >
        <v-list-item
          ref="optionsItem"
          v-for="(i, index) in searchDisplayArray"
          :key="index"
        >
          <span
            @click="replaceQueryWithName(i.userid)"
            style="cursor: pointer"
          >
            <v-avatar size="3%">
              <v-img :src="uri + '/img/' + i.userid"> </v-img>
            </v-avatar>

            <span style="margin-left: 8px">
              <span v-if="index === searchMode.selectedIndex"> ⇒ </span>
              {{ i.username }}
            </span>
          </span>
        </v-list-item>
      </v-card>

      <!-- テキスト入力欄(textarea) -->
      <v-textarea
        id="inp"
        ref="inp"
        :disabled="!checkCanITalk()"
        :placeholder="
          checkCanITalk()
            ? channelInfo.channelname + 'へ送信'
            : channelInfo.channelname +
              ' : ' +
              channelInfo.canTalk +
              '以上が発言可能'
        "
        @keydown.enter.prevent="EnterTrigger"
        @keydown.@="AtsignTrigger"
        @keydown.up="arrowUpTrigger"
        @keydown.down="arrowDownTrigger"
        @paste="fileInputFromClipboard"
        variant="solo"
        max-rows="5"
        clearable
        no-resize
        auto-grow
        v-model="txt"
        v-bind="props"
        rows="1"
      >
        <!-- ファイルアップロード部分 -->
        <template v-slot:prepend-inner>
          <!-- ファイルアップロードボタン -->
          <v-btn
            @click="fileInputRef"
            variant="text"
            size="x-small"
            icon="mdi:mdi-plus"
            class="rounded-lg mr-2"
          >
            <v-icon> mdi:mdi-plus </v-icon>
            <v-tooltip activator="parent" location="top">
              {{
                humanFileSize(
                  Serverinfo.config.MESSAGE.MESSAGE_FILE_MAXSIZE,
                  true
                )
              }}まで
            </v-tooltip>
          </v-btn>
          <!-- 線 -->
          <v-divider vertical thickness="2" class="mr-1"></v-divider>
        </template>

        <!-- 送信ボタン -->
        <template v-slot:append-inner>
          <v-btn
            @click="msgSend(null, 'byBtn')"
            :disabled="
              txt.length > Serverinfo.config.MESSAGE.MESSAGE_TXT_MAXLENGTH
            "
            icon=""
            size="small"
            class="rounded ml-1"
            elevation="0"
            color="primary"
          >
            <v-icon
              v-if="txt.length <= Serverinfo.config.MESSAGE.MESSAGE_TXT_MAXLENGTH"
              icon="mdi:mdi-send-outline"
            ></v-icon>
            <span
              v-if="txt.length > Serverinfo.config.MESSAGE.MESSAGE_TXT_MAXLENGTH"
              >{{
                Serverinfo.config.MESSAGE.MESSAGE_TXT_MAXLENGTH - txt.length
              }}</span
            >
            <v-tooltip activator="parent" location="top"> 送信! </v-tooltip>
          </v-btn>
        </template>
      </v-textarea>
    </div>
  </div>
</template>

<style scoped>

.fileList::-webkit-scrollbar{
  display:none;
}

</style>
