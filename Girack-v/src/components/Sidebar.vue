<!-- eslint-disable vue/multi-word-component-names -->
<script lang="js">
//Sidebar.vue
import { useDisplay } from "vuetify";
import { getSocket, updateMsgReadState, Serverinfo, CLIENT_FULL_LOADED } from "../data/socket";
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
      visibleReadAllButton: false,
      thisURL: window.location.origin,

      disconnected: false,

      loggedin: false,
      channelJoined: [],
    };
  },

  watch: {
    //URLの変更を検知
    $route() {
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
    },

    //全チャンネルを既読にする
    readAllChannels() {
      //チャンネルの数分既読にする
      for (let channelid in this.ChannelIndex) {
        try {
          //そのチャンネルの最新メッセージの時間を読み込む
          let latestTime = this.MsgDB[channelid][0].time;
          
          //既読状態を最新へセット
          this.MsgReadTime[channelid] = {
            //既読時間を最新メッセージの時間に設定
            time: latestTime,
            //新着線基準時間を最新メッセージの時間に設定
            timeBefore: latestTime,
            //新着メッセージ数を0に
            new: 0,
            //メンション数を0に
            mention: 0,
          };
        } catch(e) {
          console.log("Sidebar :: readAllChannels : e->", e); //何もしない
        }
      }

      //既読状態を更新させる
      updateMsgReadState();
    },

    //Shiftキーが押された時全既読ボタンの表示
    showReadAllButton(event) {
      if (event.code === "ShiftLeft" && this.CONFIG_DISPLAY.SIDEBAR_SHOWREADALL_BYHOLDSHIFTKEY) {
        this.visibleReadAllButton = true;
      }
    },

  //Shiftキーを離した時全既読ボタンの非表示
    hideReadAllButton(event) {
      if (event.code === "ShiftLeft") {
        this.visibleReadAllButton = false;
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

    //Shiftキーおしっぱの時だけ全既読ボタンを表示
    document.addEventListener("keydown", this.showReadAllButton);
    document.addEventListener("keyup", this.hideReadAllButton);
  },

  unmounted() {
    //通信重複防止
    socket.off("sessionOnlineUpdate");
    socket.off("serverinfo");
    //Shiftキーの監視停止
    document.removeEventListener("keydown", this.showReadAllButton);
    document.removeEventListener("keyup", this.hideReadAllButton);
  },
};
</script>

<template>
  <div>
    <div
      :class="isMobile?'channelBarMobile':'channelBarDesk'"
      class="d-flex flex-column"
    >

      <v-card
        style="height:75px;"
        class="rounded-0 elevation-6"
      >
        asdf
      </v-card>

      <!-- メニューボタン/プロフィールカード -->
      <RouterLink to="/menu/profile" style="width:100%" class="mx-auto">
        <v-card
          class="rounded-0 d-flex justify-start align-center py-2 text-truncate"
          :variant="$route.path.includes('menu')?'tonal':'text'"
          v-ripple
        >
          <!-- 三点メニューアイコン -->
          <v-icon size="large" class="mx-2">mdi:mdi-dots-vertical</v-icon>
          <!-- ホバーしたら表示するテキスト -->
          <v-tooltip activator="parent" location="top"> メニュー </v-tooltip>

          <!-- アイコン-->
          <div class="mx-2">
            <v-avatar size="24">
              <v-img
                :alt="myUserinfo.userid"
                :src="thisURL + '/img/' + myUserinfo.userid"
              ></v-img>
            </v-avatar>
          </div>

          <div class="d-flex flex-column mx-2">
            <!-- ロールバッジ-->
            <v-chip
              v-if="myUserinfo.role !== 'Member'"
              :color="myUserinfo.role === 'Admin' ? 'purple' : 'blue'"
              size="x-small"
              :elevation="2"
            >
              <!-- ここはロール ⇒⇒⇒ -->{{ myUserinfo.role }}
            </v-chip>

            <!-- ユーザー名-->
            <p class="text-subtitle-2 text-truncate">
              {{ myUserinfo.username }}
            </p>
          </div>

        </v-card>
      </RouterLink>

      <!-- ここからボタン群 -->
      <nav style="margin: 2% auto; width: 100%">
        <!-- FOR DEBUGGING ONLY -->
        <RouterLink :to="'/jsonviewer'">
          <v-card
            v-if="myUserinfo.role === 'Admin' && !isMobile"
            class="d-flex justify-start px-3 align-center rounded-0"
            :variant="checkSameLocation('jsonviewer') ? 'tonal' : 'text'"
            :class="isMobile?'pa-3':'pa-2'"
            :style="isMobile?'font-size: calc(8px + 0.75vb)':'font-size: calc(6px + 0.75vb)'"
          >
            <v-icon size="small">mdi:mdi-shield-bug</v-icon>
            <span class="text-truncate ml-1"> JSONviewer </span>
          </v-card>
        </RouterLink>

        <!-- チャンネルブラウザ -->
        <RouterLink :to="'/browser'">
          <v-card
            class="d-flex justify-start align-center rounded-0"
            :variant="checkSameLocation('browser') ? 'tonal' : 'text'"
            :class="isMobile?'pa-3':'pa-2'"
            :style="isMobile?'font-size: calc(8px + 0.75vb)':'font-size: calc(6px + 0.75vb)'"
          >
            <v-icon size="small">mdi:mdi-text-search</v-icon>
            <span class="text-truncate ml-1"> チャンネルブラウザ </span>
          </v-card>
        </RouterLink>

        
      </nav>

      <v-divider></v-divider>
      
      <!-- ここからチャンネルボタン部分  -->
      <div
        v-if="CLIENT_FULL_LOADED"
        class="mx-auto scroll"
        style="overflow-y: auto; width: 100%;"
      >
        <!-- 全チャンネルを既読するボタン -->
        <v-btn
          @click="readAllChannels"
          elevation="0"
          variant="text"
          size="x-small"
          class="rounded-pill text-disabled"
          style="width:100%;"
          :style="
            (
              (visibleReadAllButton||!CONFIG_DISPLAY.SIDEBAR_SHOWREADALL_BYHOLDSHIFTKEY)
              &&
              CONFIG_DISPLAY.SIDEBAR_SHOWREADALL_ENABLED
            ) ? 'visibility:visible;' : 'visibility:hidden;'
          "
        >
          全部既読にする
        </v-btn>

        <!-- ここからチャンネルボタン連続表示 -->
        <draggable
          v-model="ChannelOrder"
          item-key="id"
          :disabled="isMobile"
        >

          <template #item="{element}">
            <div v-if="ChannelIndex[element]!==undefined">
              <RouterLink :to="'/c/' + element">

                <v-card
                  @click="$emit('closeSidebar')"
                  :ripple="false"
                  :variant="checkSameLocation(element) ? 'tonal' : 'text'"
                  class="rounded-0 d-flex align-center"
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
                    class="me-auto text-truncate ml-1"
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
