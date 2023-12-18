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

      registerApiName: "",
      registerApiActionOnServer: {
        USER_GETINFO: false,
        SERVER_GETCONFIG: false,
        CHANNEL_GETINFO: false,
        CHANNEL_GETLIST: false
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

    <v-dialog v-model="displayDialogRegister">
      <v-card>
        asdf
      </v-card>
    </v-dialog>

    <div class="mx-auto d-flex flex-column" style="width:90%;height:100vh;">
      <div class="d-flex align-center my-3">
        <p class="text-truncate me-auto" style="font-size: min(4vh, 36px)">
        API管理
        </p>
        <v-btn
          color="primary"
          size="large"
          class="rounded-lg"
          icon="mdi:mdi-plus"
        >
        </v-btn>
      </div>
    </div>

  </div>
</template>