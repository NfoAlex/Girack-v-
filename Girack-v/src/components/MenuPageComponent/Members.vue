<!-- eslint-disable vue/multi-word-component-names -->
<script>
import { getSocket } from "../../data/socket";
import Userpage from "../Userpage.vue";
import { dataUser } from "../../data/dataUserinfo.js";

const socket = getSocket();
const { myUserinfo } = dataUser();

export default {
  components: { Userpage },

  data() {
    return {
      userList: [], //ユーザーリストそのもの用の配列
      userListDisplay: [], //表示する用の配列
      imgsrc: window.location.origin + "/img/",

      //検索用
      nameSearchText: "",

      //ユーザーページ用
      userDialogShow: false,
      userDialogUserid: "",
    };
  },

  watch: {
    //ユーザーページが閉じたのを検知したらユーザーリストを更新
    userDialogShow: {
      handler() {
        //もしユーザーページを閉じたのなら
        if (!this.userDialogShow) {
          //ユーザーリストの情報取得
          socket.emit("getInfoList", {
            target: "user",
            reqSender: {
              userid: myUserinfo.value.userid,
              sessionid: myUserinfo.value.sessionid,
            },
          });
        }
      },
    },
    //名前検索の入力テキストの監視
    nameSearchText: {
      handler() {
        //もし検索する名前の名前が２文字以上なら
        if (this.nameSearchText.length > 1) {
          //表示用配列をユーザーリストをフィルターして設定
          this.userListDisplay = this.userList.filter((u) =>
            u.name.includes(this.nameSearchText)
          );
        } else {
          //表示配列の初期化
          this.userListDisplay = this.userList;
        }
      },
    },
  },

  methods: {
    //ユーザーリストの受信用
    SOCKETinfoList(dat) {
      //型がユーザーリストだったらデータを登録
      if (dat.type === "user") {
        this.userList = dat.userList; //ユーザーリストを設定

        console.log("Members :: mounted : データ受信 -> ", dat);

        //名前順でソートして表示用の配列へ追加
        this.userListDisplay = dat.userList.sort((u1, u2) => {
          let U1 = u1.name.toLowerCase();
          let U2 = u2.name.toLowerCase();

          return U1 < U2 ? -1 : U1 > U2 ? 1 : 0;
        });
      }
    },
  },

  mounted() {
    //ユーザーリストの受信用
    socket.on("infoList", this.SOCKETinfoList);

    //ユーザーリストの情報取得
    socket.emit("getInfoList", {
      target: "user",
      reqSender: {
        userid: myUserinfo.value.userid,
        sessionid: myUserinfo.value.sessionid,
      },
    });
  },

  unmounted() {
    //通信重複防止
    socket.off("infoList", this.SOCKETinfoList);
  },
};
</script>

<template>
  <!-- 一つ下のDIVのCSS適用するために囲んでいる -->
  <div>
    <div
      class="mx-auto d-flex flex-column justify-space-evenly"
      style="width: 90%"
    >
      <!-- ユーザーページ用 -->
      <Userpage
        v-if="userDialogShow"
        v-model="userDialogShow"
        :userid="userDialogUserid"
      />

      <div style="height: 8vh">
        <div>
          <p class="text-truncate" style="font-size: min(4vh, 36px)">
            メンバーリスト
          </p>
        </div>
      </div>

      <div style="">
        <!-- ユーザー検索バー -->
        <div class="mx-auto" style="width: 90%">
          <v-text-field
            v-model="nameSearchText"
            density="compact"
            variant="solo"
            placeholder="名前検索(Aa 区別有り)"
          >
          </v-text-field>
        </div>
      </div>

      <v-virtual-scroll :items="userListDisplay">
        <template v-slot:default="{ item }">
          <v-card
            color="grey"
            @click="
              () => {
                userDialogUserid = item.userid;
                userDialogShow = true;
              }
            "
            class="pa-3 rounded-lg d-flex align-center"
            style="margin-top: 12px"
          >
            <!-- アバター -->
            <v-avatar :image="imgsrc + item.userid"></v-avatar>

            <!-- オンライン状態 -->
            <v-icon
              style="margin-left: 2%"
              :color="item.state.loggedin ? 'green' : 'grey'"
            >
              mdi:mdi-circle-medium
            </v-icon>

            <!-- ユーザー名 -->
            <span
              class="text-truncate flex-shrink-1 flex-grow-0"
              style="margin: 0 6px"
            >
              {{ item.name }}
            </span>

            <!-- BANバッジ -->
            <div class="me-auto flex-grow-0">
              <v-chip v-if="item.banned" size="small" color="red">
                BANNED
              </v-chip>
            </div>

            <!-- ロールバッジ -->
            <div class="flex-grow-0 flex-shrink-1">
              <v-chip v-if="item.role === 'Admin'" size="small" color="purple"
                >Admin</v-chip
              >
              <v-chip v-if="item.role === 'Moderator'" size="small" color="blue"
                >Moderator</v-chip
              >
            </div>
          </v-card>
        </template>
      </v-virtual-scroll>
    </div>
  </div>
</template>
