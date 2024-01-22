<script>
import { dataUser } from "../../data/dataUserinfo";
import { useDisplay } from "vuetify";

import Profile from "./Profile.vue";
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

  methods: {
    //今いるページが指定のアドレスのものかどうか
    isThisActive(p) {
      //現在のパスを取得して引数を含めているか調べる
      if (this.$route.path.includes(p)) {
        return true;
      } else {
        return false;
      }
    },
  },

  mounted() {
    this.$nextTick(() => {
      //ブラウザ上のタブ名を設定
      document.title = "メニュー";
      this.displayMenuDialog = true;
      this.displayMenuPage = "Profile";
    });
    
    // this.$router.push("/")
  },
};
</script>

<template>
  <v-dialog
    v-model="displayMenuDialog"
    scrollable
  >
    <v-card class="d-flex flex-row" height="75vh">

      <!-- サイドバー -->
      <div class="pa-2" style="width: 30%; max-width: 200px; height: 100%; overflow-y: auto">
        <!-- スマホUI用 -->
        <v-card
          v-if="isMobile"
          @click="$emit('toggleSidebar')"
          class="rounded-lg menu-card"
          variant="text"
          v-ripple
        >
          <v-icon size="large" style="margin: 0 auto"> mdi:mdi-menu-open </v-icon>
        </v-card>

        
        <v-card
          class="rounded d-flex align-center pa-2"
          :variant="isThisActive('profile')?'tonal':'text'"
          v-ripple
        >
          <v-icon> mdi:mdi-account </v-icon>
          プロフィール
        </v-card>

        
        <v-card
          class="rounded-lg menu-card"
          :color="isThisActive('sessions') ? 'primary' : 'secondary'"
          v-ripple
        >
          <v-icon size="large" style="margin: 0 auto"> mdi:mdi-folder-key </v-icon>
          <br />
          セッション管理
        </v-card>

        
        <v-card
          class="rounded-lg menu-card"
          :color="isThisActive('/settings') ? 'primary' : 'secondary'"
          v-ripple
        >
          <v-icon size="large" style="margin: 0 auto"> mdi:mdi-cog </v-icon>
          <br />
          設定
        </v-card>
      
      
        <v-card
          class="rounded-lg menu-card"
          :color="isThisActive('modlog') ? 'primary' : 'secondary'"
          v-ripple
        >
          <v-icon size="large" style="margin: 0 auto">
            mdi:mdi-security
          </v-icon>
          <br />
          監査ログ
        </v-card>
      
        <v-card
          class="rounded-lg menu-card"
          :color="isThisActive('members') ? 'primary' : 'secondary'"
          v-ripple
        >
          <v-icon size="large" style="margin: 0 auto">
            mdi:mdi-account-group
          </v-icon>
          <br />
          メンバー
        </v-card>
      
        <v-card
          v-if="myUserinfo.role === 'Admin'"
          class="rounded-lg menu-card"
          :color="isThisActive('serversettings') ? 'primary' : 'secondary'"
          v-ripple
        >
          <v-icon size="large" style="margin: 0 auto"> mdi:mdi-server </v-icon>
          <br />
          サーバー管理
        </v-card>
      
        <v-card
          class="rounded-lg menu-card"
          :color="isThisActive('aboutgirack') ? 'primary' : 'secondary'"
          v-ripple
        >
          <v-icon size="large" style="margin: 0 auto">
            mdi:mdi-information
          </v-icon>
          <br />
          Girackとは
        </v-card>
        
      </div>

      <!-- メインウィンドウ -->
      <div
        class="flex-grow-1"
        style="overflow-y:auto; height:75vh;"
      >
        ここがMenuメイン
        <Profile v-if="displayMenuPage==='Profile'" />
      </div>

    </v-card>
  </v-dialog>
</template>

<style scoped>
.card-default {
  padding: 3%;
  text-align: center;
}

</style>
