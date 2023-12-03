<script>

import { getSocket } from "../../../data/socket.js";
import { dataUser } from "../../../data/dataUserinfo";

export default {

  setup() {
    const { UserIndex } = dataUser();

    return { UserIndex };
  }

}

</script>

<template>

</template>