<!-- eslint-disable vue/multi-word-component-names -->
<script>
import { ref } from "vue";
import { useDisplay } from "vuetify";
import { getCONFIG } from "../../config.js";
import { setCookie } from "../../data/socket";
import { dataUser } from "../../data/dataUserinfo";
import ChannelConfig from "./HeadComponents/ChannelConfig.vue";
import ChannelPin from "./HeadComponents/ChannelPin.vue";

export default {
  setup() {
    const { mobile } = useDisplay();
    const { myUserinfo } = dataUser();
    const { LIST_NOTIFICATION_MUTE_CHANNEL } = getCONFIG();
    const buttonSize = ref(useDisplay().name);

    return { mobile, myUserinfo, LIST_NOTIFICATION_MUTE_CHANNEL, buttonSize };
  },

  components: { ChannelConfig, ChannelPin },
  props: ["channelInfo"],

  data() {
    return {
      //チャンネルメニューダイアログ用
      channelDialogShow: false,
      channelDialogId: "0001",
      channelPinsShow: false,
    };
  },

  computed: {
    //今いるパス(チャンネルID)を取得するだけ
    getPath() {
      // eslint-disable-next-line vue/no-side-effects-in-computed-properties
      this.channelDialogId = this.$route.params.id;
      return this.$route.params.id;
    },

    //ディスプレイのサイズから表示するボタンの要素のサイズを取得
    getDisplaySize() {
      switch (this.buttonSize) {
        case "xs":
          return "x-small";

        case "sm":
          return "small";

        case "md":
          return "default";

        case "lg":
          return "48";

        case "xl":
          return "large";

        case "xxl":
          return "96";

        default:
          return "small";
      }
    },

    //スマホかどうかを返す
    isMobile() {
      return this.mobile;
    }
  },

  methods: {
    //チャンネルのミュート状態を切り替える
    toggleMuteChannel() {
      //チャンネルIDを予め取得しておく
      let channelidHere = this.$route.params.id;

      //チャンネルミュートリスト入っていたら削除、なかったら追加
      if (this.LIST_NOTIFICATION_MUTE_CHANNEL.includes(channelidHere)) {
        //ミュートリストからチャンネルを削除
        this.LIST_NOTIFICATION_MUTE_CHANNEL.splice(
          this.LIST_NOTIFICATION_MUTE_CHANNEL.indexOf(channelidHere),
          1
        );
      } else {
        //ミュートリストへ追加
        this.LIST_NOTIFICATION_MUTE_CHANNEL.push(this.$route.params.id);
      }

      setCookie(
        "configListMute",
        this.LIST_NOTIFICATION_MUTE_CHANNEL.join("::"),
        7
      );
    },
  },
};
</script>

<template>

  <!-- チャンネル設定ダイアログ -->
  <ChannelConfig
    v-if="channelDialogShow"
    @closeDialog="channelDialogShow = false"
    v-model="channelDialogShow"
    :channelid="getPath"
    :channelInfo="channelInfo"
  />

  <!-- チャンネルのピン留め表示ダイアログ -->
  <ChannelPin
    v-if="channelPinsShow"
    v-model="channelPinsShow"
    :pins="channelInfo.pins!==undefined?channelInfo.pins:[]"
    :channelname="channelInfo.channelname"
    :channelid="getPath"
    @closePin="channelPinsShow=false"
  />

  <!-- ヘッダの表示部分(メイン) -->
  <v-card
    class="d-flex align-center rounded-0 px-1 pb-1 bottomShadow"
    style="width: 100%; height: 100%"
  >
    <!-- スマホUIだった時要のサイドバーボタン -->
    <v-btn
      v-if="isMobile"
      @click="$emit('toggleSidebar')"
      icon="mdi:mdi-menu-open"
      class="rounded-lg ma-0"
      variant="text"
    >
    </v-btn>
    <!-- チャンネル名、概要 -->
    <div
      @click="channelDialogShow = true"
      v-ripple
      :class="isMobile?'pa-2':null"
      class="d-flex flex-column justify-start rounded-lg flex-shrink-1 flex-grow-0 px-4"
      variant="tonal"
      style="width:calc(100% - 150px); cursor:pointer;"
    >

      <div style="white-space:nowrap;">

        <div class="overflow-x-hidden text-truncate text-h5">
          <span
            v-if="channelInfo.scope === 'private'"
            class="mdi mdi-lock"
          ></span>
          <v-chip v-if="channelInfo.previewmode" class="ma-1"
            >プレビュー</v-chip
          >

          <!-- 発言にロール制限があったら -->
          <span>
            <!-- ホバーしたら表示するテキスト -->
            <v-tooltip
              activator="parent"
              location="top center"
              origin="top center"
            >
              {{ channelInfo.canTalk }}以上が発言可能
            </v-tooltip>
            <v-icon
              v-if="channelInfo.canTalk !== 'Member' && channelInfo.canTalk !== undefined"
              icon="mdi:mdi-circle-medium"
              :color="channelInfo.canTalk === 'Admin' ? 'purple' : 'blue'"
              size="small"
            >
            </v-icon>
          </span>

          {{ channelInfo.channelname }}
        </div>

      </div>

      <v-divider v-if="!isMobile"></v-divider>

      <!-- チャンネル概要 -->
      <div
        v-if="!isMobile"
        color="grey"
      >
        <p class="text-truncate">
          {{ channelInfo.description }}
        </p>
      </div>

    </div>
    

    <!-- ボタン群 -->
    <div style="width:150px;">
      <div class="d-flex align-center justify-center flex-grow-1 flex-shrink-0">
        <!-- チャンネルの通知オン/オフボタン -->
        <v-btn
          v-if="!channelInfo.previewmode"
          @click="toggleMuteChannel"
          :size="getDisplaySize"
          icon=""
          class="rounded-lg ma-0"
          variant="text"
        >
          <v-icon
            v-if="!LIST_NOTIFICATION_MUTE_CHANNEL.includes($route.params.id)"
            >mdi:mdi-bell</v-icon
          >
          <v-icon v-else>mdi:mdi-bell-off</v-icon>
        </v-btn>

        <!-- プレビュー時用のチャンネルブラウザに戻るボタン -->
        <v-btn
          v-if="channelInfo.previewmode"
          @click="$router.push({ path: '/browser' })"
          :size="getDisplaySize"
          class="rounded-lg mx-1"
          color="secondary"
        >
          ブラウザへ戻る
        </v-btn>

        <!-- ピン留め表示ボタン -->
        <v-btn
          v-if="!isMobile"
          @click="() => (channelPinsShow = !channelPinsShow)"
          :size="getDisplaySize"
          icon=""
          class="rounded-lg ma-0"
          variant="text"
        >
          <v-icon>mdi:mdi-pin</v-icon>
        </v-btn>

        <!-- チャンネルメニューボタン -->
        <v-btn
          v-if="!isMobile"
          @click="() => (channelDialogShow = !channelDialogShow)"
          :size="getDisplaySize"
          icon=""
          class="rounded-lg ma-0"
          variant="text"
        >
          <v-icon>mdi:mdi-menu</v-icon>
        </v-btn>
      </div>
    </div>
  </v-card>

</template>

<style scoped>

.bottomShadow {
  box-shadow: 0px 8px 5px 0px var(--v-shadow-key-umbra-opacity, rgba(0, 0, 0, 0.2));
}

</style>
