<script>

import { getSocket } from "../../../data/socket.js";
import { dataUser } from "../../../data/dataUserinfo";

const socket = getSocket();

export default {

  setup() {
    const { UserIndex } = dataUser();

    return { UserIndex };
  },

  props: ["messageid", "channelid"],

}

</script>

<template>

</template>