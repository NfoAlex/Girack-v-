<script>

import { Serverinfo, getSocket } from '../../data/socket.js';
import { dataUser } from '../../data/dataUserinfo.js';

const socket = getSocket();

export default {
  setup() {
    const { myUserinfo } = dataUser();
    return { Serverinfo, myUserinfo };
  },

  data() {
    return {
      displayDialogRegister: false,

      registerApiData: {
        type: "user",
        apiName: "",
        apiActionOnServer: {
          USER_GETINFO: false,
          SERVER_GETCONFIG: false,
          CHANNEL_GETINFO: false,
          CHANNEL_GETLIST: false
        }
      }
    }
  },

  methods: {

    //APIリストの取得
    fetchApiList() {
      socket.emit("getApiList", {
        reqSender: {
          userid: this.myUserinfo.userid,
          sessionid: this.myUserinfo.sessionid
        }
      });
    },

    SOCKETInfoApiList(dat) {
      console.log("APIConfigure :: SOCKETInfoApiList : dat->", dat);
    }
  },

  mounted() {
    //APIリストハンドラ作成
    socket.on("InfoApiList", this.SOCKETInfoApiList);
    //APIリストリクエスト
    this.fetchApiList();
  }

}

</script>

<template>
  <div>

    <!-- API申請用 -->
    <v-dialog v-model="displayDialogRegister" style="max-width:650px; width:55vw; height:80vh;">
      <v-card class="rounded-lg pa-4 mx-0" height="100%" width="100%">
        
        <v-card-title>
          APIの登録申請
        </v-card-title>

        <v-card-text class="my-5" style="overflow-y:auto">
          <h4>登録名</h4>
          <v-card class="pa-3 mt-2 mb-5 rounded-lg" variant="tonal">
            asdf
          </v-card>

          <h4>APIタイプ</h4>
          <v-card class="pa-3 mt-2 mb-5 rounded-lg" variant="tonal">
            Bot or human?
          </v-card>

          <h4>サーバーのアクセス</h4>
          <v-card class="pa-3 mt-2 mb-5 rounded-lg" variant="tonal">
            <p>asdf</p>
            <p>asdf</p>
            <p>asdf</p>
            <p>asdf</p>
            <p>asdf</p>
            <p>asdf</p>
            <p>asdf</p>
            <p>asdf</p>
            <p>asdf</p>
            <p>asdf</p>
            <p>asdf</p>
            <p>asdf</p>
            <p>asdf</p>
            <p>asdf</p>
            <p>asdf</p>
            <p>asdf</p>
            <p>asdf</p>
          </v-card>
        </v-card-text>

        <v-card-action class="d-flex flex-row-reverse">
          <v-btn
            @click="() => { displayDialogRegister=false; }"
            variant="text"
            class="rounded-lg"
          >
            キャンセル
          </v-btn>
          <v-btn
            class="rounded-lg"
            color="primary"
          >
            登録する
          </v-btn>
        </v-card-action>

      </v-card>
    </v-dialog>

    <div class="mx-auto d-flex flex-column" style="width:90%;height:100vh;">
      <div class="d-flex align-center my-3">
        <p class="text-truncate me-auto" style="font-size: min(4vh, 36px)">
        API管理
        </p>
        <!-- APIリスト再取得 -->
        <v-btn
          @click="fetchApiList"
          variant="text"
          size="large"
          class="rounded-lg mr-2"
          icon="mdi:mdi-refresh"
        >
        </v-btn>
        <!-- 申請ボタン -->
        <v-btn
          @click="() => { displayDialogRegister=true; }"
          color="primary"
          size="large"
          class="rounded-lg"
          icon="mdi:mdi-plus"
        >
        </v-btn>
      </div>

      <!-- メインフレーム -->
      <div>
        {{ Serverinfo.config.API }}
      </div>

    </div>

  </div>
</template>