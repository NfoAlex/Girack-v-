<script>
import Content from "./ChannelWindowComponent/Content.vue";
import Head from "./ChannelWindowComponent/Head.vue";
import Input from "./ChannelWindowComponent/Input.vue";
import { dataMsg, dataChannel } from "../socket.js";

export default {
    components: {
        Content,
        Head,
        Input
    },

    setup() {
        const { MsgDB } = dataMsg();
        const { ChannelIndex } = dataChannel();
        return { MsgDB, ChannelIndex };

    },

    data() {
        return {
            w: "w",
            head: "head",
            content: "content",
            input: "input"
        }
    },

    methods: {
        getMsgDB() {
            if ( this.ChannelIndex[this.$route.params.id] !== undefined ) {
                return this.MsgDB[this.$route.params.id];

            } else {
                this.$router.push({ path: "/browser" });

            }

        }
    }

}

</script>

<template>
    <div style="height:100vh;" class="d-flex mb-2 flex-column">
        <div :class="[w,head]" class="flex-grow-0 flex-shrink-0">
            <Head />
        </div>
        <div :class="[w]" style="overflow-y:auto;" class="me-auto flex-grow-1 flex-shrink-1">
            <Content :MsgDBActive="getMsgDB()" />
        </div>
        <div :class="[w]" class="flex-grow-0 flex-shrink-1">
            <Input />
        </div>
    </div>
</template>

<style scoped>
.w
{
    width: 100%;
    margin: 0 0;
    box-sizing: border-box;
}
.head
{
    height: 10vh;
    border-bottom: solid 0.1px #424242;
}

</style>