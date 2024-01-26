<script>
import { getSocket, Serverinfo } from "../../../data/socket";
import { useDisplay } from "vuetify";
import { dataUser } from "../../../data/dataUserinfo";
import ContentMessageRender from "../ContentComponents/ContentMessageRender.vue";
import Userpage from "../../Userpage.vue";

const socket = getSocket();

export default {
  components: { Userpage, ContentMessageRender },
  props: ["channelid", "channelInfo"],

  setup() {
    const { mobile } = useDisplay();
    const { myUserinfo } = dataUser();
    return { mobile, myUserinfo, Serverinfo };
  },

  data() {
    return {
      channelTargetInfo: {}, //表示するチャンネル情報
      channelJoinedUser: [],
      roleList: [], //しゃべれる人ロールリスト

      //ユーザーページ用
      userDialogShow: false,
      userDialogUserid: "00000001",

      //ユーザー招待時の検索用
      userSearchShow: false,
      userSearchQuery: "",
      userSearchResult: [],

      //名前と概要の編集用
      descriptionEditing: false, //チャンネル概要の編集状態
      descriptionText: "...", //チャンネル概要
      channelnameEditing: false, //チャンネルの編集状態
      channelnameText: "...", //チャンネルの名前

      //チャンネルの公開範囲と話せるロール
      scopeIsPrivate: false, //チャンネルがプレイベートかどうか
      channelCanTalk: "Member", //話せるロール

      tab: "", //タブの移動用
      imgsrc: window.location.origin + "/img/", //アイコン用
    };
  },

  watch: {
    //ユーザー検索ダイアログ
    userSearchQuery: {
      handler() {
        //もし検索画面を開いてるなら
        if (this.userSearchShow) {
          //検索クエリーを送信
          socket.emit("searchUserDynamic", {
            query: this.userSearchQuery,
            reqSender: {
              userid: this.myUserinfo.userid,
              sessionid: this.myUserinfo.sessionid,
            },
          });
        }
      },
    },

    //検索画面を開いたときに空クエリーで一度検索
    userSearchShow: {
      handler() {
        socket.emit("searchUserDynamic", {
          query: "",
          reqSender: {
            userid: this.myUserinfo.userid,
            sessionid: this.myUserinfo.sessionid,
          },
        });
      }
    },

    //チャンネルで話せるロールが更新された時チャンネル設定を更新
    channelCanTalk: {
      handler() {
        this.updateChannel();
      },
    },
  },

  computed: {
    isMobile() {
      return this.mobile;
    }
  },

  methods: {
    //編集モードを切り替える
    switchEditing(cat, mode) {
      switch (cat) {
        //概要欄の編集切り替え
        case "desc":
          if (!mode) {
            this.descriptionEditing = false;
          } else {
            this.descriptionEditing = true;
          }
          break;

        //チャンネル名の編集切り替え
        case "channelname":
          if (!mode) {
            this.channelnameEditing = false;
          } else {
            this.channelnameEditing = true;
          }
          break;
      }
    },

    //チャンネルの更新をする
    updateChannel() {
      //チャンネル設定の更新
      socket.emit("changeChannelSettings", {
        targetid: this.channelid,
        channelname: this.channelnameText,
        description: this.descriptionText,
        scope: this.scopeIsPrivate ? "private" : "public",
        canTalk: this.channelCanTalk,
        reqSender: {
          userid: this.myUserinfo.userid,
          sessionid: this.myUserinfo.sessionid,
        },
      });

      //編集を閉じる
      this.switchEditing("desc", false);
      this.switchEditing("channelname", false);
    },

    //検索するユーザーがすでにチャンネルに参加しているかどうかを調べる
    checkUserJoined(userid) {
      //チャンネルに参加しているユーザーリストから調べる
      for (let index in this.channelJoinedUser) {
        //検索されたユーザーのユーザーIDが参加リストにあるか
        if (this.channelJoinedUser[index].userid === userid) {
          return true;
        }
      }

      return false; //なかったらないで
    },

    //チャンネルへユーザーを追加
    inviteUser(targetUserid) {
      console.log("ChannelConfig :: inviteUser : が実行された");
      //チャンネルに参加させる
      socket.emit("channelAction", {
        action: "join",
        channelid: this.channelid,
        userid: targetUserid,
        reqSender: {
          userid: this.myUserinfo.userid,
          sessionid: this.myUserinfo.sessionid,
        },
      });

      //チャンネルに参加しているユーザーリストを取得、更新する
      socket.emit("getInfoChannelJoinedUserList", {
        targetid: this.channelid,
        reqSender: {
          userid: this.myUserinfo.userid,
          sessionid: this.myUserinfo.sessionid,
        },
      });
    },

    //チャンネルから特定のユーザーを蹴る
    kickUser(targetUserid) {
      console.log(
        "ChannelConfig :: kickUser : kicking user -> " + targetUserid
      );

      //チャンネルからキック
      socket.emit("channelAction", {
        action: "leave",
        channelid: this.channelid,
        userid: targetUserid,
        reqSender: {
          userid: this.myUserinfo.userid,
          sessionid: this.myUserinfo.sessionid,
        },
      });

      //チャンネルに参加しているユーザーリストを取得、更新する
      socket.emit("getInfoChannelJoinedUserList", {
        targetid: this.channelid,
        reqSender: {
          userid: this.myUserinfo.userid,
          sessionid: this.myUserinfo.sessionid,
        },
      });
    },

    //参加しているユーザーをリスト化
    SOCKETinfoChannelJoinedUserList(channelJoinedUserList) {
      //ユーザー名でソートして追加
      this.channelJoinedUser = channelJoinedUserList.sort((u1, u2) => {
        if (u1.username > u2.username) {
          return 1;
        } else {
          return -1;
        }
      });
    },

    //ユーザーの検索結果をリスト化
    SOCKETinfoSearchUser(result) {
      this.userSearchResult = result;
    },
  },

  mounted() {
    //自分のロールに合わせて選べるロールの範囲を設定
    if (this.myUserinfo.role === "Admin") {
      //Adminなら全員選べるようにする
      this.roleList = ["Admin", "Moderator", "Member"];
    } else if (
      this.myUserinfo.role === "Moderator" &&
      this.channelInfo.canTalk !== "Admin"
    ) {
      //Moderatorかつロール制限がAdminじゃないならModerator以下
      this.roleList = ["Moderator", "Member"];
    } else {
      this.roleList = [];
    }

    //表示するデータをチャンネル情報から取得して設定
    this.channelTargetInfo = this.channelInfo;
    this.channelnameText = this.channelInfo.channelname;
    this.descriptionText = this.channelInfo.description;
    this.scopeIsPrivate = this.channelInfo.scope === "private" ? true : false;
    this.channelCanTalk = this.channelInfo.canTalk;

    //チャンネル参加者リストを受信
    socket.on(
      "infoChannelJoinedUserList",
      this.SOCKETinfoChannelJoinedUserList
    );

    //ユーザー名検索の結果受け取り用
    socket.on("infoSearchUser", this.SOCKETinfoSearchUser);

    //チャンネルに参加しているユーザーリストを取得
    socket.emit("getInfoChannelJoinedUserList", {
      targetid: this.channelid,
      reqSender: {
        userid: this.myUserinfo.userid,
        sessionid: this.myUserinfo.sessionid,
      },
    });
  },

  unmounted() {
    //通信重複防止
    socket.off(
      "infoChannelJoinedUserList",
      this.SOCKETinfoChannelJoinedUserList
    );
    socket.off("infoSearchUser", this.SOCKETinfoSearchUser);
  },
};
</script>

<template>
  <v-dialog
    :transition="isMobile?'dialog-bottom-transition':'dialog-transition'"
    :fullscreen="isMobile?true:false"
    style="overflow-y: auto;"
    :class="isMobile?'ChannelConfigCardMobile':'channelConfigCardDesk'"
  >
    <!-- ユーザーページ用 -->
    <Userpage
      v-if="userDialogShow"
      class="mx-auto"
      v-model="userDialogShow"
      :userid="userDialogUserid"
    />

    <!-- チャンネルへユーザーを招待するときのユーザー検索画面 -->
    <v-dialog v-model="userSearchShow" width="75vw" style="max-width: 600px">
      <v-text-field
        variant="solo"
        placeholder="ユーザー名で検索"
        v-model="userSearchQuery"
      >
      </v-text-field>

      <!-- 検索結果 -->
      <div
        class="channelScrollbar channelScrollbarDarker"
        style="
          height: 60vh;
          max-height: 650px;
          max-width: 910px;
          overflow-y: auto;
        "
      >
        <v-card
          v-for="user in userSearchResult"
          style="padding: 16px 0; margin-top: 8px; width: 95%"
          class="mx-auto text-left rounded-lg d-flex flex-row align-center"
          :key="user"
        >
          <!-- アバター -->
          <v-avatar
            style="margin-left: 32px"
            size="32"
            :image="imgsrc + user.userid"
          >
          </v-avatar>

          <!-- ユーザー名 -->
          <span
            class="text-center text-truncate flex-shrink-1 flex-grow-0 me-auto"
            style="margin-left: 16px"
          >
            {{ user.username }}
          </span>

          <!-- ユーザーを追加するボタン -->
          <span style="margin-right: 5%">
            <v-btn
              @click="inviteUser(user.userid)"
              v-if="!checkUserJoined(user.userid)"
              icon="mdi:mdi-account-plus"
              class="rounded-lg"
              variant="text"
            >
            </v-btn>
            <v-btn
              v-else
              icon="mdi:mdi-account-check"
              class="rounded-lg"
              variant="text"
            >
            </v-btn>
          </span>
        </v-card>
      </div>
    </v-dialog>

    <span 
      class="d-flex flex-column mx-auto justify-center"
      :style="isMobile?'height:100vh':'height:100%;'"
      style="width:100%;"
    >
      <!-- スマホレイアウト時の空白ホルダー -->
      <span
        @click="$emit('closeDialog')"
        v-if="isMobile"
        style="height:15vh; width:100vw;"
      >
      </span>

      <!-- チャンネルメニュー本体 -->
      <v-card :style="isMobile?'height:85vh':'height:85vh'" class="d-flex flex-column rounded-lg px-4 py-3">
        <!-- タブバー含めて上部分 -->
        <div>
          <!-- チャンネル名とバッジ -->
          <div class="py-7">
            <div :class="isMobile?'text-h6':'text-h4'">

              <!-- チャンネル名 -->
              <span v-if="!channelnameEditing" class="d-flex align-center">
                <!-- (#)のアイコン -->
                <v-icon size="x-small">mdi:mdi-pound</v-icon>
                <!-- (錠前)プライベートチャンネル用アイコン -->
                <v-icon v-if="scopeIsPrivate" size="x-small">mdi:mdi-lock</v-icon>
              
                <p
                  class="text-truncate mx-1 me-auto"
                >
                  {{ channelnameText }}
                </p>
                <!-- 編集ボタン -->
                <v-btn
                  @click="switchEditing('channelname', true)"
                  icon="mdi:mdi-pencil"
                  class="rounded"
                  size="small"
                  color="grey"
                >
                </v-btn>
              </span>

              <!-- 編集中のチャンネル名 -->
              <v-text-field
                v-else
                counter
                maxlength="32"
                v-model="channelnameText"
              >
                <!-- 確定とキャンセルのアイコン -->
                <template v-slot:append-inner>
                  <v-icon @click="updateChannel">mdi:mdi-check-bold</v-icon>
                  <v-icon @click="switchEditing('channelname', false)"
                    >mdi:mdi-window-close</v-icon
                  >
                </template>
              </v-text-field>
            </div>
          </div>

          <!-- チャンネル概要 -->
          <v-card
            @dblclick="switchEditing('desc', true)"
            class="channelScrollbar pa-3 elevation-4"
            style="min-height: 75px; overflow-y: auto;"
            max-height="50%"
            color="cardInner"
          >
            <!-- 概要欄 -->
            <div v-if="!descriptionEditing">
              <ContentMessageRender :content="descriptionText" />
              <p class="text-caption" style="margin-top: -2px; color: #555">
                ダブルクリックで編集
              </p>
            </div>

            <!-- 編集中の概要欄 -->
            <div v-if="descriptionEditing">
              <v-textarea
                no-resize
                counter
                maxlength="128"
                rows="3"
                v-model="descriptionText"
                label="概要"
              >
                <!-- 確定とキャンセルのアイコン -->
                <template v-slot:append-inner>
                  <v-icon
                    @click="updateChannel"
                    :disabled="descriptionText.length >= 128"
                    >mdi:mdi-check-bold</v-icon
                  >
                  <v-icon @click="switchEditing('desc', false)"
                    >mdi:mdi-window-close</v-icon
                  >
                </template>
              </v-textarea>
            </div>
          </v-card>

          <!-- タブ -->
          <v-tabs
            v-model="tab"
            style="width: fit-content;"
            class="mt-2"
          >
            <v-tab value="userJoined">
              <!-- バッジで人数を表示 -->
              <v-badge floating :content="channelJoinedUser.length">参加者</v-badge>
            </v-tab>
            <v-tab v-if="!channelInfo.previewmode" value="manage">管理</v-tab>
          </v-tabs>
          <v-divider
            class=""
          ></v-divider>
        </div>

        <!-- タブの中身を知りたくて─────────── -->
        <v-window v-model="tab" style="overflow-y:auto; height:100%;" class="pt-0">

          <!-- チャンネル参加者リスト -->
          <v-window-item value="userJoined" class="channelScrollbar">
            <div class="pb-3">

              <!-- ユーザー招待ボタン -->
              <span>
                <v-btn
                  v-if="!channelInfo.previewmode"
                  @click="
                    () => {
                      userSearchShow = !userSearchShow;
                    }
                  "
                  variant="text"
                  block
                  size="large"
                >
                  <v-icon>mdi:mdi-account-plus</v-icon>
                </v-btn>
              </span>

              <!-- ここからチャンネル参加者 -->
              <v-card
                @click="
                  () => {
                    userDialogUserid = u.userid;
                    userDialogShow = true;
                  }
                "
                class="mt-1 py-1 px-3 d-flex justify-center align-center"
                style="width: 100%;"
                variant="text"
                v-for="u in channelJoinedUser"
                :key="u"
              >
                <v-avatar
                  size="32"
                  :image="imgsrc + u.userid"
                ></v-avatar>
                <!-- オンライン状態 -->
                <v-icon
                  :class="!u.loggedin ? 'hideOnlineIcon' : null"
                  :color="u.loggedin ? 'green' : null"
                >
                  mdi:mdi-circle-medium
                </v-icon>
                <span
                  class="text-truncate me-auto"
                >
                  {{ u.username }}
                </span>
                <span
                  v-if="myUserinfo.role !== 'Member'"
                  style="float: right"
                  class="text-center"
                >
                  <v-btn
                    @click.stop="kickUser(u.userid)"
                    size="small"
                    class="rounded-lg"
                    variant="text"
                    icon="mdi:mdi-karate"
                  >
                  </v-btn>
                </span>
              </v-card>

            </div>
          </v-window-item>

          <!-- チャンネル管理タブ -->
          <v-window-item value="manage" style="overflow-y: auto">
            <div class="pb-3">

              <!-- プラベチャンネルのスイッチ -->
              <v-checkbox
                v-model="scopeIsPrivate"
                :disabled="myUserinfo.role==='Member'&&!Serverinfo.config.CHANNEL.CHANNEL_PRIVATIZE_AVAILABLEFORMEMBER"
                @click="
                  scopeIsPrivate = !scopeIsPrivate;
                  updateChannel();
                "
                color="grey"
              >
                <template v-slot:label>
                  <v-icon>mdi:mdi-lock</v-icon>
                  プライベートチャンネル
                </template>
              </v-checkbox>

              <!-- ロール選択 -->
              <v-select
                class="mx-auto"
                v-model="channelCanTalk"
                :disabled="myUserinfo.role==='Member'"
                style="width: 100%;"
                label="話せるロール"
                :items="roleList"
                persistent-hint
                hint="ロールを満たしていなくてもチャンネル閲覧は可能です。"
              ></v-select>

            </div>
          </v-window-item>
        </v-window>

      </v-card>
    </span>
  </v-dialog>
</template>

<style scoped>

.channelConfigCardMobile {
  width: 100vw;
  height: 100vh;
}

.channelConfigCardDesk {
  width: 60vw;
  max-width: 850px;
}

.hideOnlineIcon {
  visibility: hidden;
}


/* スクロールバー用 */

.channelScrollbar::-webkit-scrollbar {
  width: 5px;
}

.channelScrollbar::-webkit-scrollbar-track {
  background-color: rgba(0, 0, 0, 0);
}

.channelScrollbar::-webkit-scrollbar-thumb {
  background-color: #666;
}

/* ユーザー検索用 */
.channelScrollbarDarker::-webkit-scrollbar-thumb {
  background-color: #333;
}
</style>
