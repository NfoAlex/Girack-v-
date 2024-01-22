<script>
import { dataUser } from "../../data/dataUserinfo";
import { useDisplay } from "vuetify";

export default {
  setup() {
    const { mobile } = useDisplay();
    const { myUserinfo } = dataUser();
    return { mobile, myUserinfo };
  },
  
  data() {
    return {
      displayMenuDialog: true,
      cd: ["card-default", "rounded-lg"], //CSS用クラス名
    };
  },

  watch: {
    displayMenuDialog() {
      //ダイアログが閉じられていたら一つ前のページに戻る
      if (!this.displayMenuDialog) {
        //this.$router.go(-1);
      }
    }
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
    //ブラウザ上のタブ名を設定
    document.title = "メニュー";
    // this.$router.push("/")
  },
};
</script>

<template>
  <v-dialog
    v-model="displayMenuDialog"
    
    scrollable
  >
    <v-card class="d-flex">
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

        <RouterLink to="/menu/profile">
          <v-card
            class="rounded d-flex align-center pa-2"
            :variant="isThisActive('profile')?'tonal':'text'"
            v-ripple
          >
            <v-icon> mdi:mdi-account </v-icon>
            プロフィール
          </v-card>
        </RouterLink>

        <RouterLink to="/menu/sessions">
          <v-card
            class="rounded-lg menu-card"
            :color="isThisActive('sessions') ? 'primary' : 'secondary'"
            v-ripple
          >
            <v-icon size="large" style="margin: 0 auto"> mdi:mdi-folder-key </v-icon>
            <br />
            セッション管理
          </v-card>
        </RouterLink>
        <RouterLink to="/menu/settings">
          <v-card
            class="rounded-lg menu-card"
            :color="isThisActive('/settings') ? 'primary' : 'secondary'"
            v-ripple
          >
            <v-icon size="large" style="margin: 0 auto"> mdi:mdi-cog </v-icon>
            <br />
            設定
          </v-card>
        </RouterLink>
        <RouterLink to="/menu/modlog">
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
        </RouterLink>
        <RouterLink to="/menu/members">
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
        </RouterLink>
        <RouterLink to="/menu/serversettings">
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
        </RouterLink>
        <RouterLink to="/menu/aboutgirack">
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
        </RouterLink>
      </div>
      <router-view
        style="overflow-y: auto"
      ></router-view>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.card-default {
  padding: 3%;
  text-align: center;
}

</style>
