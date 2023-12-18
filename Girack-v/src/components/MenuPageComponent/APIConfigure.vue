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

      myApi: [], //自分のAPIデータ

      registerApiData: { //登録するAPIデータ
        type: "user",
        apiName: "",
        apiActionOnServer: {
          USER_GETINFO: false,
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

    //APIを新規登録する
    registerApi() {
      socket.emit("registerApi", {
        reqSender: {
          userid: this.myUserinfo.userid,
          sessionid: this.myUserinfo.sessionid,
        },
        registerApiData: this.registerApiData
      });
    },

    //APIリストの受け取りハンドラ
    SOCKETInfoApiList(dat) {
      console.log("APIConfigure :: SOCKETInfoApiList : dat->", dat);
      //データ格納
      this.myApi = dat;
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
    <v-dialog
      v-model="displayDialogRegister"
      style="max-width:650px; width:55vw; height:80vh;"
    >
      <v-card class="rounded-lg pa-4 mx-0" height="100%" width="100%">
        
        <v-card-title>
          APIの登録申請 {{ registerApiData.apiName.length!==0?" - "+registerApiData.apiName:"" }}
        </v-card-title>

        <v-card-text class="my-5" style="overflow-y:auto">
          <h4>登録名</h4>
          <v-card class="pa-0 mt-2 mb-5 rounded-lg" variant="tonal">
            <v-text-field
              v-model="registerApiData.apiName"
              class="ma-0 pa-0"
              variant="solo"
              hide-details
            />
          </v-card>
          

          <h4>APIタイプ</h4>
          <v-select
              v-model="registerApiData.type"
              class="mt-2 mb-5 rounded-lg"
              :items="['user', 'bot']"
            />

          <h4>アクセス権限の設定</h4>
          <v-card class="pa-3 mt-2 mb-5 rounded-lg" variant="tonal">
            <p>サーバーデータへのアクション</p>
            <v-checkbox
              v-model="registerApiData.apiActionOnServer.USER_GETINFO"
              label="ユーザー単体の情報"
            />
            <v-checkbox
              v-model="registerApiData.apiActionOnServer.CHANNEL_GETINFO"
              class="my-n5"
              label="チャンネル単体の情報"
            />
            <v-checkbox
              v-model="registerApiData.apiActionOnServer.CHANNEL_GETLIST"
              label="チャンネルリストの情報"
            />

            <v-divider class="my-3" />

            <p>チャンネルへのアクション</p>
            <i class="text-disabled">Coming soon...</i>
          </v-card>
        </v-card-text>

        <v-card-action class="d-flex flex-row-reverse">
          <v-btn
            @click="() => { displayDialogRegister=false; }"
            variant="text"
            size="large"
            class="rounded-lg ml-2"
          >
            キャンセル
          </v-btn>
          <v-btn
            @click="registerApi"
            class="rounded-lg"
            size="large"
            color="primary"
          >
            登録する
          </v-btn>
        </v-card-action>

      </v-card>
    </v-dialog>

    <div class="mx-auto d-flex flex-column" style="width:90%;height:100vh;">
      <!-- ページヘッダ -->
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
        <v-expansion-panels style="width: 100%">
          <v-expansion-panel
            v-for="(api,index) in myApi"
            :key="index"
            class="rounded-lg"
          >

            <v-expansion-panel-title class="d-flex align-center">
              
              <span class="flex-grow-1">
                {{ api.apiName }}
              </span>

              状態 :  
              <v-chip :color="api.status==='active'?'primary':null" size="small" class="ml-2">
                <i>{{ api.status }}</i>
              </v-chip>
              <v-divider class="mx-2" vertical />
              <v-chip size="small" class="mr-5">
                {{ api.type }}
              </v-chip>

            </v-expansion-panel-title>

            <v-expansion-panel-text>
              {{ api }}
            </v-expansion-panel-text>

          </v-expansion-panel>
        </v-expansion-panels>
      </div>

    </div>

  </div>
</template>