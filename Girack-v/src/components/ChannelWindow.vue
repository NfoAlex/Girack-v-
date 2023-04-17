<script>
import Content from "./ChannelWindowComponent/Content.vue";
import Head from "./ChannelWindowComponent/Head.vue";
import Input from "./ChannelWindowComponent/Input.vue";
import { dataMsg, dataChannel, dataUser, getSocket } from "../socket.js";

const socket = getSocket();

export default {
    components: {
        Content,
        Head,
        Input
    },

    setup() {
        const { Userinfo } = dataUser();
        const { MsgDB } = dataMsg();
        const { ChannelIndex, PreviewChannelData } = dataChannel();
        return { Userinfo, MsgDB, ChannelIndex, PreviewChannelData };

    },

    data() {
        return {
            w: "w",
            head: "head",
            content: "content",
            input: "input",
        }
    },

    watch: {
        $route: {
            handler() {
                if ( this.ChannelIndex[this.$route.params.id] !== undefined ) {
                    this.PreviewChannelData.channelid = this.$route.params.id;

                } else {
                    // socket.emit("getInfoChannel", {
                    //     targetid: this.$route.params.id,
                    //     reqSender: {
                    //         userid: this.Userinfo.userid,
                    //         sessionid: this.Userinfo.sessionid
                    //     }
                    // });

                }

            }
        }
    },

    methods: {
        //メッセージ履歴を返す
        getMsgDB() {
            if ( this.ChannelIndex[this.$route.params.id] !== undefined || this.PreviewChannelData.channelid === this.$route.params.id ) {
                return this.MsgDB[this.$route.params.id];

            } else {
                this.$router.push({ path: "/browser" });

            }

        },

        //チャンネル情報を返す
        getChannelInfo() {
            //もしチャンネルリストにあるなら
            if ( this.ChannelIndex[this.$route.params.id] !== undefined ) {
                console.log("ChannelWindow :: getChannelInfo : infos ->", this.ChannelIndex[this.$route.params.id]);
                return {
                    channelname: this.ChannelIndex[this.$route.params.id].channelname,
                    description: this.ChannelIndex[this.$route.params.id].description,
                    scope: this.ChannelIndex[this.$route.params.id].scope,
                    previewmode: false,
                };

            //あるいはプレビュー用としてチャンネルを登録しているなら
            } else if ( this.PreviewChannelData.channelid === this.$route.params.id ) {
                return {
                    channelname: this.PreviewChannelData.channelname,
                    description: this.PreviewChannelData.description,
                    scope: this.PreviewChannelData.scope,
                    previewmode: true,
                };

            } else {
                this.$router.push({ path: "/browser" });
                return {
                    channelname: "...",
                    description: "...",
                    scope: "public",
                    previewmode: true,
                };

            }

        }
    },

}

</script>

<template>
    <div style="height:100vh;" class="d-flex mb-2 flex-column">
        <div :class="[w,head]" class="flex-grow-0 flex-shrink-0">
            <Head :channelInfo="getChannelInfo()" />
        </div>
        <div :class="[w]" style="overflow-y:auto;" class="me-auto flex-grow-1 flex-shrink-1">
            <Content :MsgDBActive="getMsgDB()" :channelInfo="getChannelInfo()" />
        </div>
        <div :class="[w]" class="flex-grow-0 flex-shrink-1">
            <Input :channelInfo="getChannelInfo()" />
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