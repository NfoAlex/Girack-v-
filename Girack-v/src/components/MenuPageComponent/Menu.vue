<script>
import { dataUser } from "../../data/dataUserinfo";
import { useDisplay } from "vuetify";

import Profile from "./Profile.vue";
import SessionManage from "./SessionManage.vue";
import Settings from "./Settings.vue";
import Members from "./Members.vue";
import Modlog from "./Modlog.vue";
import ServerSettings from "./ServerSettings.vue";
import AboutGirack from "./AboutGirack.vue";

export default {
  setup() {
    const { mobile } = useDisplay();
    const { myUserinfo } = dataUser();
    return { mobile, myUserinfo };
  },

  components: {
    Profile,
    SessionManage,
    Settings,
    Members,
    Modlog,
    ServerSettings,
    AboutGirack
  },
  
  data() {
    return {
      displayMenuDialog: false, //このメニューページを表示するための変数
      displayMenuPage: "" //表示するMenuコンポーネント
    };
  },

  computed: {
    //スマホかどうかだけを返す
    isMobile() {
      return this.mobile;
    }
  },

  mounted() {
    this.$nextTick(() => {
      //ブラウザ上のタブ名を設定
      document.title = "メニュー";
      this.displayMenuDialog = true;

      //URLにページを指定するクエリが入っているならそのページに移す
      if (this.$route.query.menuPage !== undefined) {
        this.displayMenuPage = this.$route.query.menuPage;
      } else {
        //デフォルトはプロフィールページ
        this.displayMenuPage = "Profile";
      }
    });
  },

  unmounted() {
    //Menuを閉じる際はクエリを空にする
    this.$router.push({ query: {  } });
  }
};
</script>

<template>
  <v-dialog
    v-model="displayMenuDialog"
    scrollable
    max-width="1100px"
  >
    <v-card class="d-flex flex-row mx-auto" height="75vh" width="100%">

      <!-- サイドバー -->
      <div
        class="pt-2 flex-shrink-0"
        style="
          width: 35%;
          max-width: 300px;
          height: 85vh;
          overflow-y: auto;
          box-sizing: border-box;
          border-right: 0.1px #424242 solid;
        "
      >
        <p class="pa-2 text-h6">メニュー</p>

        <v-card
          @click="displayMenuPage='Profile'"
          class="rounded-0 d-flex align-center pa-3"
          :variant="displayMenuPage==='Profile'?'tonal':'text'"
          v-ripple
        >
          <v-icon class="mr-2"> mdi:mdi-account </v-icon>
          プロフィール
        </v-card>
        
        <v-card
          @click="displayMenuPage='SessionManage'"
          class="rounded-0 d-flex align-center pa-3"
          :variant="displayMenuPage==='SessionManage'?'tonal':'text'"
          v-ripple
        >
          <v-icon class="mr-2"> mdi:mdi-folder-key </v-icon>
          セッション管理
        </v-card>

        <v-card
          @click="displayMenuPage='Settings'"
          class="rounded-0 d-flex align-center pa-3"
          :variant="displayMenuPage==='Settings'?'tonal':'text'"
          v-ripple
        >
          <v-icon class="mr-2"> mdi:mdi-cog </v-icon>
          設定
        </v-card>

        <v-card
          @click="displayMenuPage='Modlog'"
          class="rounded-0 d-flex align-center pa-3"
          :variant="displayMenuPage==='Modlog'?'tonal':'text'"
          v-ripple
        >
          <v-icon class="mr-2"> mdi:mdi-security </v-icon>
          監査ログ
        </v-card>

        <v-card
          @click="displayMenuPage='Members'"
          class="rounded-0 d-flex align-center pa-3"
          :variant="displayMenuPage==='Members'?'tonal':'text'"
          v-ripple
        >
          <v-icon class="mr-2"> mdi:mdi-account-group </v-icon>
          メンバー
        </v-card>

        <v-card
          v-if="myUserinfo.role === 'Admin'"
          @click="displayMenuPage='ServerSettings'"
          class="rounded-0 d-flex align-center pa-3"
          :variant="displayMenuPage==='ServerSettings'?'tonal':'text'"
          v-ripple
        >
          <v-icon class="mr-2"> mdi:mdi-server </v-icon>
          サーバー管理
        </v-card>
      
        <v-card
          @click="displayMenuPage='About'"
          class="rounded-0 d-flex align-center pa-3"
          :variant="displayMenuPage==='About'?'tonal':'text'"
          v-ripple
        >
          <v-icon class="mr-2"> mdi:mdi-information </v-icon>
          Girackについて
        </v-card>
        
      </div>

      <!-- メインウィンドウ -->
      <div
        class="flex-grow-1"
        style="overflow-y:auto; height:80vh;"
      >
        <Profile v-if="displayMenuPage==='Profile'" />
        <SessionManage v-if="displayMenuPage==='SessionManage'" />
        <Settings v-if="displayMenuPage==='Settings'" />
        <Modlog v-if="displayMenuPage==='Modlog'" />
        <Members v-if="displayMenuPage==='Members'" />
        <ServerSettings v-if="displayMenuPage==='ServerSettings'" />
        <AboutGirack v-if="displayMenuPage==='About'" />
      </div>

    </v-card>
  </v-dialog>
</template>
