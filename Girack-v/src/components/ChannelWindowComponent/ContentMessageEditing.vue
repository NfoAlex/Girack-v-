<script>
import { getSocket } from '../../data/socket.js';
import { dataUser } from '../../data/dataUserinfo.js';

const socket = getSocket();

export default {
  setup() {
    const { myUserinfo } = dataUser();

    return { myUserinfo };
  },

  props: ["content", "messageid"],

  data() {
    return {
      editTxt: ""
    }
  },

  mounted() {
    //propsからメッセージ分を取得、格納
    this.editTxt = this.content;
  }
}

</script>

<template>
  <v-text-field
    v-model="txtEditing"
  >
    <template v-slot:append-inner>
      <v-btn
        @click="$emit('updateEditingMessage',messageid)"
        class="rounded-lg ma-1"
        size="x-small"
        icon="mdi:mdi-check-bold"
        color="secondary"
      >
      </v-btn>
      <v-btn
        @click="$emit('updateEditingMessage','waaaa')"
        class="rounded-lg ma-1"
        size="x-small"
        icon="mdi:mdi-window-close"
        color="secondary"
      >
      </v-btn>
    </template>
  </v-text-field>
</template>