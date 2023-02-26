<script>
import { getSocket } from "../../socket.js";
const socket = getSocket();

export default {
    data() {
        return {
            msg: "fdsa",
            s: socket,
            sStatus: false

        }
    }

}

</script>

<template>
    <p>これがチャンネル :: {{ $route.params.id }}</p>
    {{ s.connected }}
</template>