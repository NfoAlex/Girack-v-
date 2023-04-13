<script>

import { CLIENT_VERSION } from "../../socket.js";

export default {

    data() {
        return {
            clientVersion: CLIENT_VERSION
        }
    }

}

</script>

<template>
    <div class="text-center pa-5" style="width:80%">
        <p class="text-h3">Girack</p>
        <br>
        <p class="text-h5">Reply</p>
        <p>ビルド : {{ clientVersion }}</p>
        <br>
        <p>それ以外書くことな</p>
    </div>
</template>