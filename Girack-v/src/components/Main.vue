<script>
import { getSocket } from "../socket.js";
import Content from "./Content.vue";
const socket = getSocket();

export default {
    components: {
        Content
    },
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
    <Content />
</template>