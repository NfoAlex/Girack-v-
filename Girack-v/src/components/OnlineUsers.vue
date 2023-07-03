<script>
import { getSocket, backendURI } from "../data/socket";
import { dataUser } from "../data/dataUserinfo";
import Userpage from "./Userpage.vue";

const socket = getSocket();
let loopGetSessionOnline = null; //オンラインユーザー取得ループ用

export default {
  setup() {
    const { myUserinfo } = dataUser(); //ユーザー情報
    return { myUserinfo };
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

      imgsrc: backendURI + "/img/",
    };
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

  <!-- ユーザーリストここから -->
  <div
    class="mx-auto d-flex flex-column justify-space-evenly"
    style="width: 95%; height: 100vh"
  >
    <!-- ページヘッダ -->
    <div class="d-flex align-center ma-5" style="height: 5vh">
      <p
        style="font-size: min(4vh, 36px); margin-left: 8px"
        class="text-truncate me-auto"
      >
        オンラインユーザーリスト
      </p>
      <!-- メンバーページへ行くボタン -->
      <v-btn
        @click="$router.push({ path: '/menu/members' })"
        class="ma-3 rounded-lg"
        size="large"
        color="secondary"
      >
        <v-icon class="ma-1">mdi:mdi-account-group</v-icon>
        全メンバーを見る
      </v-btn>
    </div>

    <!-- リスト表示 -->
    <div style="overflow-y: auto; margin-top: 3vh">
      <v-virtual-scroll height="90vh" :items="userListDisplay">
        <template v-slot:default="{ item }">
          <v-card
            @click="
              () => {
                userDialogShow = true;
                userDialogUserid = item.userid;
              }
            "
            class="rounded-lg card mx-auto pa-3 d-flex align-center"
            width="97.5%"
            color="grey"
          >
            <v-avatar
              style="margin: 0 16px"
              :image="imgsrc + item.userid"
            ></v-avatar>
            <span class="me-auto text-truncate">
              {{ item.name }}
            </span>

            <span v-if="item.role !== 'Member'" style="float: right">
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
.card {
  width: 100%;
  margin: 16px 0;
}
</style>
