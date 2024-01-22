<script>
import { getSocket } from "../data/socket";
import { dataUser } from "../data/dataUserinfo";
import { useDisplay } from "vuetify";
import Userpage from "./Userpage.vue";

const socket = getSocket();
let loopGetSessionOnline = null; //オンラインユーザー取得ループ用

export default {
  setup() {
    const { mobile } = useDisplay();
    const { myUserinfo } = dataUser(); //ユーザー情報
    return { mobile, myUserinfo };
  },

  components: { Userpage },

  data() {
    return {
      OnlineSession: [], //オンラインのユーザーが入る配列
      OnlineSessionReady: false, //初期ロードできたかどうか

      userDialogShow: false, //ユーザーページのダイアログ
      userDialogUserid: "", //ユーザーページ用に使うID
      userList: [], //ユーザーリストが入る配列
      userListReady: false, //ユーザーリストがロードできたかどうか

      userListDisplay: [], //表示されるユーザーリスト

      imgsrc: window.location.origin + "/img/",
    };
  },

  computed: {
    //スマホかどうかだけを返す
    isMobile() {
      return this.mobile;
    }
  },

  methods: {
    //表示する用のリストを整形
    setUsernameFromList() {
      this.userListDisplay = this.userList.filter((u) =>
        u.state.loggedin === true ? u : null
      );
    },

    //オンラインユーザーの受け取り
    SOCKETresultSessionOnline(result) {
      this.OnlineSession = result;
      this.OnlineSessionReady = true;
    },

    //ユーザーリストの受信用
    SOCKETinfoList(dat) {
      //型がユーザーリストだったらデータを登録
      if (dat.type === "user") {
        //ソートして表示用の配列へ追加
        this.userList = dat.userList.sort((u1, u2) => {
          if (u1.name < u2.name) {
            return -1;
          } else {
            return 1;
          }
        });

        this.setUsernameFromList();
      }
      this.userListReady = true;
    },
  },

  mounted() {
    //オンラインユーザーの受け取り
    socket.on("resultSessionOnline", this.SOCKETresultSessionOnline);

    //ユーザーリストの受信用
    socket.on("infoList", this.SOCKETinfoList);

    //初回でユーザーリストを取得
    socket.emit("getInfoList", {
      target: "user",
      reqSender: {
        userid: this.myUserinfo.userid,
        sessionid: this.myUserinfo.sessionid,
      },
    });

    //ユーザーリストの情報取得
    loopGetSessionOnline = setInterval(() => {
      socket.emit("getInfoList", {
        target: "user",
        reqSender: {
          userid: this.myUserinfo.userid,
          sessionid: this.myUserinfo.sessionid,
        },
      });
    }, 500);
  },

  unmounted() {
    //通信重複防止
    socket.off("resultSessionOnline", this.SOCKETresultSessionOnline);
    socket.off("infoList", this.SOCKETinfoList);
    //ループ削除
    clearInterval(loopGetSessionOnline);
  },
};
</script>

<template>
  <!-- ユーザーページ用ダイアログ -->
  <Userpage
    v-if="userDialogShow"
    v-model="userDialogShow"
    :userid="userDialogUserid"
  />

  <!-- グローバルヘッダ -->
  <v-card
      style="height:75px;"
      class="rounded-0 elevation-6 px-5 d-flex align-center"
      :loading="!userListReady"
    >

      <!-- タイトル -->
      <p class="text-h6 me-auto">
        オンラインユーザーリスト
      </p>

      <!-- メンバーページへ行くボタン -->
      <v-btn
        @click="$router.push({ path: '/menu/members' })"
        class="ma-2 rounded-lg flex-shrink-0"
        size="large"
        color="secondary"
        icon=""
      >
        <v-icon class="ma-1">mdi:mdi-account-group</v-icon>
        <v-tooltip activator="parent" location="bottom">
          全ユーザーを見る
        </v-tooltip>
      </v-btn>

    </v-card>

  <!-- ユーザーリストここから -->
  <div
    class="mx-auto d-flex flex-column justify-space-evenly"
    style="width: 95%;"
  >

    <!-- リスト表示 -->
    <div style="overflow-y: auto;width: 100%;">
      <v-virtual-scroll height="90vh" :items="userListDisplay">
        <template v-slot:default="{ item }">
          <v-card
            @click="
              () => {
                userDialogShow = true;
                userDialogUserid = item.userid;
              }
            "
            class="card mx-auto pa-3 d-flex align-center"
            width="97.5%"
            style="margin: 16px 0;"
            color="grey"
          >
            <v-avatar
              style="margin: 0 16px"
              :image="imgsrc + item.userid"
            ></v-avatar>
            <span class="me-auto text-truncate">
              {{ item.name }}
            </span>

            <span v-if="item.role !== 'Member'">
              <v-chip :color="item.role === 'Admin' ? 'purple' : 'blue'">
                {{ item.role }}
              </v-chip>
            </span>
          </v-card>
        </template>
      </v-virtual-scroll>
    </div>
  </div>
</template>

<style scoped>
</style>
