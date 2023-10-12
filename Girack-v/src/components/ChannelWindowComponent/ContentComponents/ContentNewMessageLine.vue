<script>
import { dataMsg } from "../../../data/dataMsg.js";

export default {
  setup() {
    const { MsgReadTime } = dataMsg();
    return { MsgReadTime };
  },

  props: ["m", "index", "MsgDBActive", "msgDisplayNum"],

  computed: {
    //現在いるパス(チャンネルID)を返すだけ
    getPath() {
      return this.$route.params.id;
    },
  },

  methods: {
    //新着メッセージ線を表示するかどうか
    checkShowNewMessageLine(m, index) {
      try {
        if (
          //表示部分が最新のでなく、比較時間がメッセージと同じならtrue
          m.time === this.MsgReadTime[this.getPath].timeBefore &&
          this.MsgDBActive.length - 1 !== index &&
          index !== 0
        ) {
          return true;
        } else {
          return false;
        }
      } catch (e) {
        console.log("Content :: checkShowNewMessageLine : エラー", e);
        return false;
      }
    },
  },
};
</script>

<template>
  <span v-if="checkShowNewMessageLine(m, index)" class="d-flex align-center">
    <v-divider color="white" thickness="2px" class="flex-shrink-1"></v-divider>
    <v-chip
      style="margin: -1em"
      variant="flat"
      elevation="6"
      class="pa-2 flex-grow-1 flex-shrink-0"
      size="x-small"
    >
      <span v-if="index === msgDisplayNum"> 過去に更に新着があります... </span>
      <span v-if="index !== 0"> ここから新着 </span>
    </v-chip>
    <v-divider color="white" thickness="2px" class="flex-shrink-1"></v-divider>
  </span>
</template>
