<script>

import { CLIENT_VERSION } from "../../data/socket.js";

export default {

  data() {
    return {
      clientVersion: CLIENT_VERSION //バージョン名
    }
  }

}

</script>

<template>
  <div class="text-center pa-5" style="width:100%">
    <span>
      <p class="text-h3">ItsJune</p>
    </span>
    
    <br>
    <p class="text-h5"></p>
    <p>ビルド : {{ clientVersion }}</p>
    <br>
    <p>それ以外書くことな</p>
  </div>
</template>
