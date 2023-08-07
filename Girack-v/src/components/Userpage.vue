<!-- eslint-disable vue/multi-word-component-names -->
<script>
import { useDisplay } from "vuetify";
import { getSocket } from "../data/socket";
import { dataChannel } from "../data/dataChannel";
import { dataUser } from "../data/dataUserinfo";

const socketUserpage = getSocket();

export default {
  props: ["userid"],

  setup() {
    const { mobile } = useDisplay();
    const { myUserinfo, UserIndex } = dataUser();
    const { ChannelIndex, PreviewChannelData } = dataChannel();
    return { mobile, myUserinfo, UserIndex, ChannelIndex, PreviewChannelData };
  },

  data() {
    return {
      targetinfo: {
        userid: "000",
        username: "Loading...",
        role: "loading",
        banned: false,
        channelJoined: [],
        loggedin: false,
      },
      imgsrc: window.location.origin + "/img/",
      roleList: [],

      //そのユーザーの情報
      targetUserRole: "Member",
      targetUserBanned: false,
      targetUserJoinedChannelList: [],
      manageDisabled: false,

      //削除確認表示
      deleteConfirmCheckDisplay: false,

      //ユーザーページ下のタブ用
      tab: "",
    };
  },

  watch: {
    //ロール選択の監視
    targetUserRole: {
      handler() {
        //もし今のロールと同じならスルー
        if (this.targetinfo.role === this.targetUserRole) {
          console.log("Userpage :: watch(targetUserRole) : 同じだから変更ナシ");
        } else {
          //変わった瞬間ロール更新を送信
          //ロールの更新を通知
          socketUserpage.emit("mod", {
            targetid: this.userid,
            action: {
              change: "role",
              value: this.targetUserRole,
            },
            reqSender: {
              userid: this.myUserinfo.userid,
              sessionid: this.myUserinfo.sessionid,
            },
          });
        }
      },
    },
  },

  computed: {
    isMobile() {
      console.log("isMobile->", this.mobile);
      return this.mobile;
    }
  },

  methods: {
    //BANする関数
    banUser() {
      //BANトリガーを送信
      socketUserpage.emit("mod", {
        targetid: this.userid,
        action: {
          change: "ban",
          value: this.targetinfo.banned ? false : true, //true=>BANする、false=>解除
        },
        reqSender: {
          userid: this.myUserinfo.userid,
          sessionid: this.myUserinfo.sessionid,
        },
      });
    },

    //ユーザーを削除する関数
    deleteUser() {
      //削除すると送信
      socketUserpage.emit("mod", {
        targetid: this.userid,
        action: {
          change: "delete",
        },
        reqSender: {
          userid: this.myUserinfo.userid,
          sessionid: this.myUserinfo.sessionid,
        },
      });

      //ユーザーページを閉じる
      this.$emit("closeUserpage");
    },

    //ユーザー名の変更を強制にする
    changeTargetUsername() {
      console.log("userpage :: methods: まだ途中...");
      socketUserpage.emit("changeProfile", {
        name: "User" + (Math.floor(Math.random()*999999)).toString().padStart(6,0), //更新する名前
        targetid: this.userid, //対象ユーザーID(自分)
        reqSender: {
          //セッション認証に必要な情報送信
          userid: this.myUserinfo.userid,
          sessionid: this.myUserinfo.sessionid,
        },
      });
    },

    //ロールの色を返す
    getRoleColor(role) {
      switch (role) {
        case "Admin":
          return "purple";

        case "Moderator":
          return "blue";

        case "Member":
          return "white";
      }
    },

    //メンバーページから開かれたものか確認
    checkOpenedFromMemberPage() {
      //メンバーページから開かれたものなら
      if (
        this.$route.path === "/menu/members" &&
        this.myUserinfo.userid !== this.userid
      ) {
        return true;
      } else {
        return false;
      }
    },

    //チャンネルボタンをクリックされたときの移動用
    gotoChannel(channelid, index) {
      //もし参加しているチャンネルならそのまま移動
      if (this.ChannelIndex[channelid] !== undefined) {
        this.$router.push({ path: "/c/" + channelid });

        //参加していないチャンネルならプレビューモードとして参加
      } else {
        //プレビュー用データへデータを設定
        this.PreviewChannelData = {
          channelid: channelid,
          channelname: this.targetUserJoinedChannelList[index].channelname,
          description: this.targetUserJoinedChannelList[index].description,
          scope: this.targetUserJoinedChannelList[index].scope,
          previewmode: true,
        };
        //そのチャンネルへ移動
        this.$router.push({ path: "/c/" + channelid });
      }
    },

    SOCKETtargetinfo(dat) {
      //受信した情報がこいつのと確認して処理
      if (dat.userid === this.userid) {
        this.targetinfo = dat; //表示する情報に設定

        console.log("Userpage :: infoUser : data ", dat);

        //ターゲットユーザーの情報を設定
        this.targetUserRole = this.targetinfo.role;
        this.targetUserBanned = this.targetinfo.banned;

        //自分とターゲットのユーザーのロールによって管理を無効化
        if (
          //自分がAdminではなく、かつターゲットのユーザーがAdminなら
          (this.targetinfo.role === "Admin" &&
            this.myUserinfo.role !== "Admin") ||
          this.targetinfo.role === "Deleted" //消されたユーザーなら
        ) {
          //条件にひっかかっても自分だったらスルー
          if (this.myUserinfo.userid !== this.targetinfo.userid) {
            this.manageDisabled = true; //管理を無効化
          }
        }

        //参加しているチャンネルリストの情報取得
        for (let index in dat.channelJoined) {
          socketUserpage.emit("getInfoChannel", {
            targetid: dat.channelJoined[index],
            reqSender: {
              userid: this.myUserinfo.userid,
              sessionid: this.myUserinfo.sessionid,
            },
          });
        }
      }
    },

    SOCKETtargetUserJoinedChannelList(dat) {
      //もしチャンネルデータが空ならなにもしない
      if (dat.channelname === null) return -1;

      //表示するチャンネル参加リストの配列へ追加
      this.targetUserJoinedChannelList.push({
        channelname: dat.channelname,
        channelid: dat.channelid,
        description: dat.description,
        scope: dat.scope,
      });

      console.log(
        "Userpage :: mounted : チャンネル情報リスト->",
        this.targetUserJoinedChannelList
      );
    },
  },

  mounted() {
    //自分のロールに合わせて選べるロールの範囲を設定
    if (this.myUserinfo.role === "Admin") {
      //Adminなら全員選べるようにする
      this.roleList = ["Admin", "Moderator", "Member"];
    } else if (this.myUserinfo.role === "Moderator") {
      //ModeratorならModerator以下
      this.roleList = ["Moderator", "Member"];
    } else {
      this.roleList = [];
    }

    //参加チャンネルの情報取得
    socketUserpage.on("infoChannel", this.SOCKETtargetUserJoinedChannelList);

    //ユーザーの情報受け取り
    socketUserpage.on("infoUser", this.SOCKETtargetinfo);

    //レンダー待ってからユーザー情報の取得
    this.$nextTick(() => {
      //自分じゃなければ情報取得
      if (this.userid !== dataUser().myUserinfo.value.userid) {
        //ユーザー情報の取得
        socketUserpage.emit("getInfoUser", {
          targetid: this.userid,
          reqSender: {
            userid: dataUser().myUserinfo.value.userid,
            sessionid: dataUser().myUserinfo.value.sessionid,
          },
        });
      } else {
        //表示用情報に自分の情報割り当て
        this.targetinfo = this.myUserinfo;
        this.targetUserRole = this.myUserinfo.role;

        //参加しているチャンネル情報すべて取得
        for (let index in this.targetinfo.channelJoined) {
          //チャンネル情報のリクエスト送信
          socketUserpage.emit("getInfoChannel", {
            targetid: this.targetinfo.channelJoined[index],
            reqSender: {
              userid: this.targetinfo.userid,
              sessionid: this.targetinfo.sessionid,
            },
          });
        }
      }
    });

    console.log("Userpage :: mounted");
  },

  unmounted() {
    //socket通信の重複防止
    socketUserpage.off("infoUser", this.SOCKETtargetinfo);
    socketUserpage.off("infoChannel", this.SOCKETtargetUserJoinedChannelList);
  },
};
</script>

<template>
  <v-dialog :class="isMobile?'userPageMobile':'userPageDesk'" class="mx-auto">
    <v-card
      elevation="6"
      style="width:100%;"
      class="mx-auto d-flex flex-column align-self-start pa-1 text-center rounded-lg"
    >
      <div>
        <!-- ユーザー名とアイコンとロール -->
        <v-card
          color="secondary"
          elevation="12"
          width="70%"
          style="overflow-y: auto"
          class="mx-auto boxProfile rounded-lg"
        >
          <!-- アバター -->
          <v-avatar
            style="margin-top: 16px"
            size="20%"
            :image="imgsrc + userid"
          ></v-avatar>

          <!-- ユーザー情報 -->
          <div class="ma-3">
            <v-chip v-if="targetinfo.banned" color="red" size="small"
              >BANされています</v-chip
            >
            <p class="text-overline"># {{ userid }}</p>

            <p v-if="targetinfo.loggedin && userid !== myUserinfo.userid">
              <v-chip
                class="ma-1"
                variant="flat"
                color="success"
                size="x-small"
              >
                オンライン
              </v-chip>
            </p>

            <p>
              <v-chip
                v-if="userid === myUserinfo.userid"
                color="green"
                size="small"
              >
                あなた
              </v-chip>
            </p>

            <v-chip
              :color="getRoleColor(targetinfo.role)"
              class="ma-1"
              size="small"
            >
              {{ targetinfo.role }}
            </v-chip>

            <p class="text-h5 text-truncate">
              {{ targetinfo.username }}
            </p>
          </div>
        </v-card>

        <!-- タブ -->
        <v-tabs
          bg-color="grey"
          class="mx-auto rounded-lg"
          fixed-tabs
          style="width: fit-content"
          v-model="tab"
        >
          <v-tab value="channel"> チャンネル </v-tab>
          <v-tab
            v-if="myUserinfo.role !== 'Member' && !manageDisabled"
            value="mod"
          >
            管理
          </v-tab>
          <v-tab
            v-if="myUserinfo.role === 'Admin' && checkOpenedFromMemberPage()"
            value="delete"
          >
            <p style="color: pink">削除</p>
          </v-tab>
        </v-tabs>
      </div>

      <v-divider style="margin-top: 16px"></v-divider>

      <!-- タブの中身 -->
      <v-window v-model="tab" style="overflow-y: auto">
        <!-- 参加しているチャンネル -->
        <v-window-item value="channel" class="ma-5">
          <v-card
            @click="gotoChannel(item.channelid, index)"
            v-for="(item, index) in targetUserJoinedChannelList"
            variant="tonal"
            class="mx-auto rounded-lg d-flex align-center"
            style="margin-top: 8px; padding: 6px 4%; width: 75%"
            :key="index"
          >
            <!-- プライベートチャンネル用鍵マーク -->
            <v-icon v-if="item.scope === 'private'" style="margin-right: 8px">
              mdi:mdi-lock-outline
            </v-icon>

            <!-- 普通のチャンネル -->
            <v-icon v-else style="margin-right: 8px"> mdi:mdi-pound </v-icon>

            <span class="text-truncate">
              {{ item.channelname }}
            </span>
          </v-card>
        </v-window-item>

        <!-- ユーザー管理タブ -->
        <v-window-item value="mod" class="ma-5">
          <div class="d-flex flex-column align-center">
            <!-- ロール選択 -->
            <v-select
              class="mx-auto"
              v-model="targetUserRole"
              style="width: 100%; max-width: 200px"
              density="compact"
              label="ロール"
              :items="roleList"
            ></v-select>

            <!-- ユーザー名変更させるボタン -->
            <v-btn
              @click="changeTargetUsername"
              width="50%"
              class="ma-3 rounded-lg"
              color="grey"
            >
              ユーザー名を初期化
              <v-tooltip
                activator="parent"
                location="top center"
              >
                User_[ユーザーID]にします
              </v-tooltip>
            </v-btn>

            <v-divider width="50%" class="ma-3"></v-divider>

            <!-- BANボタン(と解除ボタン) -->
            <v-btn
              @dblclick="banUser"
              v-if="!targetinfo.banned" 
              width="50%"
              color="error"
            >
              <v-icon>mdi:mdi-account-cancel</v-icon> BAN
              <v-tooltip
                activator="parent"
                location="top center"
              >
                ダブルクリックでBAN
              </v-tooltip>
            </v-btn>
            <v-btn @dblclick="banUser" v-if="targetinfo.banned" color="info">
              <v-icon>mdi:mdi-account-heart</v-icon>BANを解除
              <v-tooltip
                activator="parent"
                location="top center"
              >
                ダブルクリックで解除
              </v-tooltip>
            </v-btn>
          </div>
        </v-window-item>

        <!-- ユーザー削除タブ(メンバーページからだけ) -->
        <v-window-item value="delete" class="ma-5">
          <v-btn
            v-if="!deleteConfirmCheckDisplay"
            @dblclick="deleteConfirmCheckDisplay = true"
            class="rounded-lg"
            color="error"
            size="large"
            variant="tonal"
          >
            このユーザーを削除
            <v-tooltip
              activator="parent"
              location="top center"
            >
              ダブルクリックで確認へ
            </v-tooltip>
          </v-btn>
          <v-btn
            v-if="deleteConfirmCheckDisplay"
            @dblclick="deleteUser()"
            class="rounded-lg"
            color="error"
            size="large"
            elevation="12"
          >
            本当にいいの?
            <v-tooltip
              activator="parent"
              location="top center"
            >
              ダブルクリックで削除
            </v-tooltip>
          </v-btn>
        </v-window-item>
      </v-window>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.userPageDesk {
  width: 100%;
  max-width: 650px;
  height: 80vh;
  width: 50vw;
  max-height: 85vh;
}
.userPageMobile {
  width: 100vw;
}

.boxProfile {
  margin-top: 16px;
  margin-bottom: 24px;
}

</style>
