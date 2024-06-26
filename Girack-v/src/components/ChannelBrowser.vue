<script>
import { useDisplay } from "vuetify";
import { getSocket, Serverinfo, deleteMsgHistory } from "../data/socket";
import { dataMsg } from "../data/dataMsg";
import { dataChannel } from "../data/dataChannel";
import { dataUser } from "../data/dataUserinfo";

const socket = getSocket();

export default {
  setup() {
    const { mobile } = useDisplay();
    const { myUserinfo } = dataUser(); //自分のユーザー情報をインポート
    const { PreviewChannelData } = dataChannel();
    const { MsgDB } = dataMsg();
    return { mobile, PreviewChannelData, myUserinfo, MsgDB, Serverinfo, deleteMsgHistory };
  },

  data() {
    return {
      channelList: [],
      channelListData: [],
      channelJoined: [],
      sortMethod: "nameAtoZ", //nameAtoZ, nameZtoA, id1to9, id9to1

      overlayChannelRemove: false, //チャンネル消去オーバーレイ
      overlayChannelCreate: false, //チャンネル作成オーバーレイ

      //チャンネル作成用変数群
      channelCreateName: "", //作りたいチャンネルの名前
      channelCreateDescription: "テキストチャンネル。",
      channelCreatePrivate: false, //作りたいチャンネルの公開設定

      //チャンネル削除用変数群
      channelRemovingId: "", //消そうとしているチャンネルのID
      channelRemovingName: "", //消そうとしているチャンネルの名前
    };
  },

  emits: ["toggleSidebar"],

  watch: {
    //ユーザー情報の変更を監視
    myUserinfo: {
      //変更を検知したらチャンネルリストを再取得
      handler(U) {
        //U => 変更されたあとのUserinfo
        socket.emit("getInfoList", {
          target: "channel",
          reqSender: {
            userid: U.userid, //ユーザーID
            sessionid: U.sessionid, //セッションID
          },
        });
      },
      deep: true, //JSONの階層ごと監視するため
    },
  },

  computed: {
    isMobile() {
      return this.mobile;
    }
  },

  methods: {
    //チャンネルへ参加する処理
    channelJoin(channelid) {
      //参加しまぁす！
      socket.emit("channelAction", {
        action: "join",
        channelid: channelid, //参加するチャンネルのid
        userid: this.myUserinfo.userid, //参加する人のユーザーID(この場合自分)
        reqSender: {
          userid: this.myUserinfo.userid,
          sessionid: this.myUserinfo.sessionid,
        },
      });

      //チャンネルリストを再取得
      socket.emit("getInfoList", {
        target: "channel",
        reqSender: {
          userid: this.myUserinfo.userid, //ユーザーID
          sessionid: this.myUserinfo.sessionid, //セッションID
        },
      });
    },

    //チャンネルのプレビューをする
    channelPreview(channelid) {
      //一つ前のプレビュー用履歴を削除する
      this.deleteMsgHistory(channelid);

      this.$router.push({ path: "/c/" + channelid }); //そのページへ移動
    },

    //チャンネルから退出
    channelLeave(channelid) {
      //抜けます。
      socket.emit("channelAction", {
        action: "leave",
        channelid: channelid, //抜けるチャンネルのID
        userid: this.myUserinfo.userid, //抜ける人のユーザーID(この場合自分)
        reqSender: {
          userid: this.myUserinfo.userid,
          sessionid: this.myUserinfo.sessionid,
        },
      });

      //チャンネルリストを再取得
      socket.emit("getInfoList", {
        target: "channel",
        reqSender: {
          userid: this.myUserinfo.userid, //ユーザーID
          sessionid: this.myUserinfo.sessionid, //セッションID
        },
      });
    },

    //チャンネル作成!
    channelCreate() {
      //チャンネル作りたい!
      socket.emit("channelCreate", {
        channelname: this.channelCreateName, //作るチャンネルの名前
        description: this.channelCreateDescription, //作るチャンネルの概要
        scope: this.channelCreatePrivate ? "private" : "public", //作るチャンネルの公開範囲
        reqSender: {
          userid: this.myUserinfo.userid,
          sessionid: this.myUserinfo.sessionid,
        },
      });
      this.overlayChannelCreate = false; //チャンネル作成ダイアログを非表示
    },

    //チャンネル削除の確認
    channelRemove(cid) {
      //チャンネル消したい!
      this.channelRemovingId = cid; //これから消すID
      this.channelRemovingName = this.channelList[cid].name; //名前設定
      this.overlayChannelRemove = true; //ダイアログ表示
    },

    //チャンネル削除する
    channelRemoveConfirm(cid) {
      this.overlayChannelRemove = false; //ダイアログ非表示
      this.channelRemovingName = ""; //変数内の名前初期化
      this.channelRemovingId = ""; //変数内のチャンネルID初期化

      //チャンネル消したい!
      socket.emit("channelRemove", {
        channelid: cid, //消すチャンネルのID
        reqSender: {
          userid: this.myUserinfo.userid,
          sessionid: this.myUserinfo.sessionid,
        },
      });
    },

    //表示するチャンネルデータをソート方法に準じてソートする
    sortDisplay() {
      switch (this.sortMethod) {
        //名前順でソート、表示
        case "nameAtoZ":
          this.channelList = this.channelListData.sort((channel1, channel2) => {
            //大文字小文字の差を無くす
            let _channel1 = channel1.name.toLowerCase();
            let _channel2 = channel2.name.toLowerCase();

            return _channel1 < _channel2 ? -1 : _channel1 > _channel2 ? 1 : 0;
          });
          break;

        //名前逆順でソート、表示
        case "nameZtoA":
          this.channelList = this.channelListData.sort((channel1, channel2) => {
            //大文字小文字の差を無くす
            let _channel1 = channel1.name.toLowerCase();
            let _channel2 = channel2.name.toLowerCase();

            return _channel1 > _channel2 ? -1 : _channel1 < _channel2 ? 1 : 0;
          });
          break;

        //チャンネルID順でソート、表示
        case "id1to9":
          this.channelList = this.channelListData.sort((channel1, channel2) => {
            console.log("ChannelBrowser :: sortDisplay : データ->", channel1, channel2);
            let channel1id = channel1.channelid;
            let channel2id = channel2.channelid;
            return channel1id < channel2id ? -1 : channel1id > channel2id ? 1 : 0;
          });
          break;

        //チャンネルID逆順でソート、表示
        case "id9to1":
          this.channelList = this.channelListData.sort((channel1, channel2) => {
            console.log("ChannelBrowser :: sortDisplay : データ->", channel1, channel2);
            let channel1id = channel1.channelid;
            let channel2id = channel2.channelid;
            return channel1id > channel2id ? -1 : channel1id < channel2id ? 1 : 0;
          });
          break;

        default:
          break;
      }
    },

    //チャンネルリストの取得
    SOCKETinfoList(dat) {
      //型が違うかデータが無効なら関数を終わらせる
      if (dat.type !== "channel" || dat === -1) {
        console.log("ChannelBrwoser :: infoList : データ違うっぽい???");
        return;
      }

      //チャンネル情報のJSONを配列化
      let ArrayChannelList = Object.entries(dat.channelList);
      //配列化したデータの中のチャンネル情報のみを入れるよう配列
      let ArrayChannelListFiltered = [];

      //チャンネル情報のみを抜き出して配列へ追加
      for (let channelObject of ArrayChannelList) {
        //あらかじめチャンネルIDを設定しておく
        channelObject[1].channelid = channelObject[0];
        //配列化用変数へプッシュ
        ArrayChannelListFiltered.push(channelObject[1]);
      }

      //受信データを配列化したものを保存
      this.channelListData = ArrayChannelListFiltered;

      //ソート、表示
      this.sortDisplay();

      // console.log("ChannelBrwoser :: infoList : dat ↓ ");
      // console.log(dat);
    },
  },

  mounted() {
    //プレビュー用のチャンネルIDを初期化
    this.PreviewChannelData.channelid = null;

    //チャンネルリストの取得
    socket.emit("getInfoList", {
      target: "channel",
      reqSender: {
        userid: this.myUserinfo.userid, //ユーザーID
        sessionid: this.myUserinfo.sessionid, //セッションID
      },
    });

    //結果受け取り
    socket.on("infoList", this.SOCKETinfoList);

    document.title = "チャンネルブラウザ"; //タブ名を変更
  },

  unmounted() {
    //通信重複防止
    socket.off("infoList", this.SOCKETinfoList);
  },
};
</script>

<template>
  <!-- チャンネル作成用ダイアログ -->
  <v-dialog
    v-model="overlayChannelCreate"
    class="align-center justify-center"
    style="width: 50%"
  >
    <v-card class="pa-4">
      <v-card-title> チャンネル作成 </v-card-title>

      <v-card-text>
        <p>チャンネル名</p>
        <v-text-field
          v-model="channelCreateName"
          maxlength="32"
          counter
        >
        </v-text-field>

        <p>概要</p>
        <v-textarea
          maxlength="128"
          rows="3"
          no-resize
          counter
          placeholder="テキストチャンネル。"
          v-model="channelCreateDescription"
        >
        </v-textarea>

        <v-checkbox
          v-model="channelCreatePrivate"
          label="プライベートチャンネル"
        ></v-checkbox>
      </v-card-text>

      <v-divider class="mb-2"></v-divider>

      <v-card-actions>
        <v-btn
          @click="channelCreate"
          color="primary"
        >
          作成!
        </v-btn>
        <v-btn
          @click="() => overlayChannelCreate=false"
          variant="text"
          class="mx-2"
          color=""
        >
          キャンセル
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- チャンネル削除用ダイアログ -->
  <v-dialog
    v-model="overlayChannelRemove"
    class="align-center justify-center"
    style="width: 40%"
  >
    <v-card class="pa-4">
      <v-card-title class="">
        削除の確認
      </v-card-title>

      <v-card-text>
        <p>チャンネル名 :</p>
        <code>
          {{ channelRemovingName }}
        </code>
      </v-card-text>

      <v-divider class="my-2"></v-divider>

      <v-card-actions>
        <v-btn
          @click="channelRemoveConfirm(channelRemovingId)"
          color="red"
        >
          削除
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- グローバルヘッダ -->
  <v-card
    style="height:75px;"
    class="rounded-0 elevation-6 px-5 d-flex align-center"
  >
    <!-- スマホ用ボタン -->
    <v-btn
      v-if="isMobile"
      @click="$emit('toggleSidebar')"
      icon=""
      class="flex-shrink-0"
      variant="text"
      size="small"
    >
      <v-icon>mdi:mdi-menu-open</v-icon>
    </v-btn>
    <v-divider v-if="isMobile" vertical inset></v-divider>

    <p class="text-h6 me-auto">
      チャンネルブラウザ
    </p>

    <!-- チャンネル作成ボタン -->
    <v-btn
      @click="overlayChannelCreate = true"
      v-if="
        Serverinfo.config.CHANNEL.CHANNEL_CREATE_AVAILABLE ||
        myUserinfo.role === 'Admin'
      "
      color="primary"
      icon=""
      class="rounded"
    >
      <v-icon icon="mdi:mdi-plus"> </v-icon>
      <v-tooltip activator="parent" location="bottom">
        チャンネル作成
      </v-tooltip>
    </v-btn>

  </v-card>

  <!-- ここから表示部分 -->
  <div style="height:calc(100vh - 75px); width:90%;" class="d-flex mx-auto flex-column">
    
    <!-- ボタンと検索バー -->
    <div class="d-flex justify-start align-center my-3">

      <!-- 名前順 -->
      <v-btn
        @click="() => { sortMethod='nameZtoA'; sortDisplay(); }"
        v-if="sortMethod==='nameAtoZ'"
        class="rounded"
        icon=""
      >
        <v-icon>mdi:mdi-sort-alphabetical-ascending</v-icon>
        <v-tooltip
          activator="parent"
          location="top"
        >
          名前順 (A→Z)
        </v-tooltip>
      </v-btn>

      <!-- 名前逆順 -->
      <v-btn
        @click="() => { sortMethod='id1to9'; sortDisplay(); }"
        v-if="sortMethod==='nameZtoA'"
        class="rounded"
        icon=""
      >
        <v-icon>mdi:mdi-sort-alphabetical-descending</v-icon>
        <v-tooltip
          activator="parent"
          location="top"
        >
          名前順 (Z→A)
        </v-tooltip>
      </v-btn>

      <!-- チャンネルID順 -->
      <v-btn
        @click="() => { sortMethod='id9to1'; sortDisplay(); }"
        v-if="sortMethod==='id1to9'"
        class="rounded"
        icon=""
      >
        <v-icon>mdi:mdi-sort-numeric-ascending</v-icon>
        <v-tooltip
          activator="parent"
          location="top"
        >
          チャンネルID順 (01→99)
        </v-tooltip>
      </v-btn>

      <!-- チャンネルID逆順 -->
      <v-btn
        @click="() => { sortMethod='nameAtoZ'; sortDisplay(); }"
        v-if="sortMethod==='id9to1'"
        class="rounded"
        icon=""
      >
        <v-icon>mdi:mdi-sort-numeric-descending</v-icon>
        <v-tooltip
          activator="parent"
          location="top"
        >
          チャンネルID順 (99→01)
        </v-tooltip>
      </v-btn>
      
    </div>

    <v-divider></v-divider>

    <!-- チャンネルカード -->
    <div class="channelList pb-5 flex-grow-1" style="overflow-y: auto">
      <v-card
        variant="tonal"
        class="mt-4"
        v-for="c in Object.entries(channelList)"
        :key="c[1].channelid"
      >
        <div class="d-flex align-center py-1 px-3">
          <v-icon icon="mdi:mdi-pound" class="pr-2"></v-icon>
          <v-icon icon="mdi:mdi-lock" v-if="c[1].scope === 'private'" class="pr-2"></v-icon>

          <!-- チャンネル名 -->
          <span class="text-h6 me-auto">
            {{
              c[1].name.length > 50
                ? c[1].name.substring(60, 0) + "..."
                : c[1].name
            }}
            <v-tooltip
              v-if="c[1].name.length > 50"
              activator="parent"
              location="start"
              class="overflow-x-hidden"
            >
              {{ c[1].name }}
            </v-tooltip>
          </span>

          <!-- ボタン群 -->
          <!-- 削除ボタン -->
          <v-btn
            @click="channelRemove(c[1].channelid)"
            v-if="
              Serverinfo.config.CHANNEL.CHANNEL_DELETE_AVAILABLEFORMEMBER ||
              myUserinfo.role !== 'Member'
            "
            variant="text"
            icon=""
            color="red"
            size="small"
            style="margin-right: 4px"
            class="rounded"
          >
            <v-icon icon="mdi:mdi-delete-forever"></v-icon>
          </v-btn>

          <!-- プレビューボタン -->
          <v-btn
            v-if="!myUserinfo.channelJoined.includes(c[1].channelid)"
            @click="channelPreview(c[1].channelid)"
            icon=""
            size="small"
            class="rounded"
            variant="text"
          >
            <v-icon> mdi:mdi-eye </v-icon>
          </v-btn>

          <!-- 参加/退出ボタン -->
          <v-btn
            v-if="!myUserinfo.channelJoined.includes(c[1].channelid)"
            @click="channelJoin(c[1].channelid)"
            variant="tonal"
            class=""
            size="small"
            >参加</v-btn
          >
          <v-btn
            v-else
            @click="channelLeave(c[1].channelid)"
            variant="outlined"
            class=""
            size="small"
            >退出</v-btn
          >

        </div>

        <v-divider class=""></v-divider>

        <!-- 概要 -->
        <p class="py-4 px-3">
          {{
            c[1].description.length > 150
              ? c[1].description.substring(150, 0) + "..."
              : c[1].description
          }}
        </p>
      </v-card>
    </div>
  </div>
</template>

<style scoped>
.channelList {
  scrollbar-width: 5px; /* Firefox用 */
}

.channelList::-webkit-scrollbar {
  width: 5px;
}

.channelList::-webkit-scrollbar-track {
  background-color: rgba(0, 0, 0, 0);
}

.channelList::-webkit-scrollbar-thumb {
  background-color: #666;
}
</style>
