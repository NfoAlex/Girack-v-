<!-- eslint-disable vue/multi-word-component-names -->
<script lang="js">
//Sidebar.vue
import { useDisplay } from "vuetify";
import { getSocket, Serverinfo, CLIENT_FULL_LOADED } from "../data/socket";
import { dataMsg } from "../data/dataMsg";
import { dataChannel } from "../data/dataChannel";
import { dataUser } from "../data/dataUserinfo";
import { getCONFIG } from "../config";
import draggable from 'vuedraggable';

const socket = getSocket();

export default {
  setup() {
    const { mobile } = useDisplay();
    const { myUserinfo } = dataUser();
    const { MsgReadTime, MsgDB } = dataMsg();
    const { ChannelIndex, ChannelOrder } = dataChannel();
    const { CONFIG_DISPLAY } = getCONFIG();

    return {
      mobile,
      myUserinfo,
      MsgReadTime,
      MsgDB,
      ChannelIndex,
      ChannelOrder,
      Serverinfo,
      CLIENT_FULL_LOADED,
      CONFIG_DISPLAY,
    };
  },

  props: ["sessionOnlineNum"], //オンライン人数用

  components: { draggable },

  data() {
    return {
      servername: "",
      displayusername: "Null",
      thisURL: window.location.origin,

      disconnected: false,

      loggedin: false,
      channelJoined: [],
    };
  },

  watch: {
    //URLの変更を検知
    $route(r) {
      //もしスマホならサイドバーを閉じる
      if (this.isMobile) {
        this.$emit("closeSidebar");
      }
    },

    //チャンネルの順番の変化を監視
    ChannelOrder: {
      handler() {
        //チャンネルの順番を送信して同期させる
        socket.emit("updateUserSaveChannelOrder", {
          channelOrder: this.ChannelOrder,
          reqSender: {
            userid: this.myUserinfo.userid,
            sessionid: this.myUserinfo.sessionid
          }
        });
      },
      deep: true
    },
  },

  computed: {
    //スマホかどうかを返す
    isMobile() {
      return this.mobile;
    }
  },

  methods: {
    //新着メッセージ数を返す
    checkReadTime(channelid, term) {
      //term => ほしい値
      try {
        //termの値で返すものを選ぶ
        switch (term) {
          //新着数
          case "new":
            if (this.MsgReadTime[channelid].new > 20) return "+20";
            return this.MsgReadTime[channelid].new; //新着数を返す

          //メンション数
          case "mention":
            return this.MsgReadTime[channelid].mention; //メンション数を返す
        }
      } catch (e) {
        return null;
      }
    },

    //場所確認、trueを返す
    checkSameLocation(id) {
      //パスが同じなのかどうか
      if (this.$route.path.includes(id)) {
        return true;
      } else {
        return false;
      }
    }
  },

  mounted() {
    //サーバー情報の受信
    socket.on("serverinfo", (dat) => {
      //サーバー情報きたら
      this.servername = dat.servername; //表示する名前を変更
    });

    //サーバー切断時
    socket.on("disconnect", () => {
      this.disconnected = true;
    });

    //サーバーの再接続時
    socket.on("connect", () => {
      this.disconnected = false;
    });
  },

  unmounted() {
    //通信重複防止
    socket.off("sessionOnlineUpdate");
    socket.off("serverinfo");
  },
};
</script>

<template>
  <div>
    <div
      :class="isMobile?'channelBarMobile':'channelBarDesk'"
      class="d-flex flex-column"
      style="background-color: #1c1b1e"
    >
      <!-- インスタンス名 -->
      <div class="mx-auto" style="margin: 16px 0; width: 90%">
        <p style="text-align: center" class="mx-auto text-truncate text-h6">
          {{ Serverinfo.servername || "..." }}
        </p>
      </div>

      <!-- メニューボタン/プロフィールカード -->
      <RouterLink to="/menu/profile">
        <v-card
          class="mx-auto rounded-lg"
          color="secondary"
          width="80%"
          v-ripple
        >
          <!-- 三点メニューアイコン -->
          <div style="width: fit-content" class="mx-auto">
            <v-icon size="large">mdi:mdi-dots-horizontal</v-icon>
          </div>
          <!-- ホバーしたら表示するテキスト -->
          <v-tooltip activator="parent" location="top"> メニュー </v-tooltip>

          <!-- アイコン-->
          <div class="mx-auto" style="width: fit-content; margin-top: 10%">
            <v-avatar style="width: 4vmax; height: auto; margin-bottom: 12px">
              <v-img
                :alt="myUserinfo.userid"
                :src="thisURL + '/img/' + myUserinfo.userid"
              ></v-img>
            </v-avatar>
          </div>

          <!-- ロールバッジ-->
          <div style="width: fit-content" class="mx-auto">
            <v-chip
              v-if="myUserinfo.role !== 'Member'"
              :color="myUserinfo.role === 'Admin' ? 'purple' : 'blue'"
              size="x-small"
              :elevation="6"
            >
              <!-- ここはロール ⇒⇒⇒ -->{{ myUserinfo.role }}
            </v-chip>
          </div>

          <!-- ユーザー名-->
          <v-card-text class="text-subtitle-1 text-center mx-auto">
            <span>
              {{ myUserinfo.username }}
            </span>
          </v-card-text>
        </v-card>
      </RouterLink>

      <!-- オンライン人数表示 -->
      <RouterLink :to="'/onlineuser'">
        <v-card
          style="font-size: calc(6px + 0.65vb); margin-top: 8px; width: 80%"
          class="mx-auto pa-2 rounded-lg d-flex justify-center align-center"
          color="#222"
          v-ripple
        >
          <v-icon
            v-if="sessionOnlineNum >= 2"
            style="margin-right: 4px"
            size="small"
            :color="disconnected ? 'red' : 'green'"
            >mdi:mdi-circle</v-icon
          >
          <span v-else>🥲</span>
          <span v-if="!disconnected">{{ sessionOnlineNum }}人がオンライン</span>
          <span v-else>サーバーオフライン</span>
        </v-card>
      </RouterLink>

      <!-- ここからボタン群 -->
      <nav style="margin: 2% auto; width: 97%">
        <!-- FOR DEBUGGING ONLY -->
        <RouterLink :to="'/jsonviewer'">
          <v-card
            v-if="myUserinfo.role === 'Admin' && !isMobile"
            :variant="checkSameLocation('jsonviewer') ? 'tonal' : 'text'"
            class="d-flex justify-center align-center rounded-pill"
            :class="isMobile?'pa-3':'pa-2'"
            :style="isMobile?'font-size: calc(8px + 0.75vb)':'font-size: calc(6px + 0.75vb)'"
          >
            <v-icon>mdi:mdi-shield-bug</v-icon>
            <span class="text-truncate"> JSONviewer </span>
          </v-card>
        </RouterLink>

        <RouterLink :to="'/browser'">
          <v-card
            class="d-flex justify-center align-center rounded-lg"
            :variant="checkSameLocation('browser') ? 'tonal' : 'text'"
            :class="isMobile?'pa-3':'pa-2'"
            :style="isMobile?'font-size: calc(8px + 0.75vb)':'font-size: calc(6px + 0.75vb)'"
          >
            <v-icon>mdi:mdi-text-search</v-icon>
            <span class="text-truncate"> チャンネルブラウザ </span>
          </v-card>
        </RouterLink>

        <v-divider style="margin: 5% 0"></v-divider>
      </nav>

      <!-- ここからチャンネルボタン描写  -->
      <div
        v-if="CLIENT_FULL_LOADED"
        class="mx-auto scroll"
        style="overflow-y: auto; width: 97%; margin-bottom: 8px; padding-bottom: 3vh;"
      >
        <draggable
          v-model="ChannelOrder"
          item-key="id"
        >
          <template #item="{element}">
            <div v-if="ChannelIndex[element]!==undefined">
              <RouterLink :to="'/c/' + element">
                <v-card
                  @click="$emit('closeSidebar')"
                  :ripple="false"
                  :variant="checkSameLocation(element) ? 'tonal' : 'text'"
                  class="rounded-lg d-flex align-center my-1"
                  :class="isMobile?'pa-3':'pa-2'"
                  :style="isMobile?'font-size: calc(8px + 0.75vb)':'font-size: calc(6px + 0.75vb)'"
                >
                  <!-- チャンネル名前の#の部分 -->
                  <div class="flex-shrink-1">
                    <v-icon v-if="ChannelIndex[element].scope !== 'private'" size="small"
                      >mdi:mdi-pound
                    </v-icon>
                    <v-icon v-else size="small">mdi:mdi-lock-outline</v-icon>
                    <!-- プライベートチャンネル用鍵マーク -->
                  </div>

                  <!-- チャンネル名 -->
                  <div
                    style="margin-left: 4px"
                    class="me-auto text-truncate"
                    :class="
                      checkReadTime(element, 'new') ||
                      checkReadTime(element, 'mention') ||
                      checkSameLocation(element)
                        ?
                      'text-high-emphasis' : 'text-disabled'
                    "
                  >
                    {{ ChannelIndex[element].channelname }}
                  </div>

                  <!-- メンションマーク -->
                  <v-badge
                    v-if="checkReadTime(element, 'mention')"
                    :content="checkReadTime(element, 'mention')"
                    color="orange"
                    inline
                  ></v-badge>

                  <!-- 新着マーク -->
                  <v-badge
                    v-if="checkReadTime(element, 'new')"
                    :content="checkReadTime(element, 'new')"
                    inline
                  ></v-badge>
                </v-card>
              </RouterLink>
            </div>
          </template>
        </draggable>
      </div>
    </div>
  </div>
</template>

<style scoped>
.channelBarDesk {
  max-width: 300px;
  width: 25vw;
  height: 100vh;

  box-sizing: border-box;
  border-right: 0.1px #424242 solid;
}

.channelBarMobile {
  width:100vw;
  height:100vh;
}

.scroll::-webkit-scrollbar {
  width: 5px;
}

.scroll::-webkit-scrollbar-track {
  background-color: rgba(0, 0, 0, 0);
}

.scroll::-webkit-scrollbar-thumb {
  background-color: #666;
}
</style>
