<script setup>
import { getCONFIG } from "../../config.js";
import { dataChannel, dataUser, setCookie } from '../../socket';
import ChannelConfig from "./ChannelConfig.vue";
</script>

<script>
const { ChannelIndex } = dataChannel(); //チャンネル情報
const { LIST_NOTIFICATION_MUTE_CHANNEL } = getCONFIG();

export default {

    components: { ChannelConfig },
    props: ["channelInfo"],

    data() {
        return {
            //チャンネルメニューダイアログ用
            channelDialogShow: false,
            channelDialogId: "0001",

            ChannelDisplayname: "...",
            ChannelDisplayDescription: "...",
            ChannelScope: "public",
        }
    },

    computed: {
        //今いるパス(チャンネルID)を取得するだけ
        getPath() {
            this.channelDialogId = this.$route.params.id;
            return this.$route.params.id;

        },
    },

    methods: {
        //チャンネルのミュート状態を切り替える
        toggleMuteChannel() {
            //チャンネルIDを予め取得しておく
            let channelidHere = this.$route.params.id;

            //チャンネルミュートリスト入っていたら削除、なかったら追加
            if ( (LIST_NOTIFICATION_MUTE_CHANNEL.value).includes(channelidHere) ) {
                //ミュートリストからチャンネルを削除
                LIST_NOTIFICATION_MUTE_CHANNEL.value.splice( LIST_NOTIFICATION_MUTE_CHANNEL.value.indexOf(channelidHere),1 );

            } else {
                //ミュートリストへ追加
                LIST_NOTIFICATION_MUTE_CHANNEL.value.push(this.$route.params.id);

            }

            setCookie("configListMute", (LIST_NOTIFICATION_MUTE_CHANNEL.value.join("::")), 7);

        }
    },

    mounted() {
        //読み込みエラー対策(参加しているチャンネルリストに今のチャンネルがあるかどうか)
        if ( dataUser().Userinfo.value.channelJoined.includes(this.getPath) === -1 ) {
            location.pathname = "/";

        }

    }

}

</script>

<template>

    <v-dialog
        v-model="channelDialogShow"
        style="width:50vw; max-width:650px;"
    >
        <ChannelConfig :channelid="channelDialogId" :channelInfo="channelInfo" />
    </v-dialog>

    <div class="overflow-x-hidden" style="padding: 0 32px; white-space:nowrap; float:left; max-width:60%">
        <div class="overflow-x-hidden text-truncate" style="font-size:3vh;" >
            <span v-if="channelInfo.scope==='private'" class="mdi mdi-lock"></span>
            <v-chip v-if="channelInfo.previewmode" class="ma-1">プレビュー</v-chip>
            {{ channelInfo.channelname }}
        </div>
        <p style="font-size:2vh">{{ channelInfo.description }}</p>
    </div>

    <!-- ボタン群 -->
    <div style="width:20%; float:right; padding-top:1%; margin-right: 16px;" class="d-flex flex-row justify-end align-center">
        <v-btn
            v-if="!channelInfo.previewmode"
            @click="toggleMuteChannel"
            size="large"
            icon=""
            class="rounded-lg ma-1"
            color="secondary"
        >
            <v-icon v-if="!LIST_NOTIFICATION_MUTE_CHANNEL.includes($route.params.id)">mdi:mdi-bell</v-icon>
            <v-icon v-else>mdi:mdi-bell-off</v-icon>
        </v-btn>

        <v-btn
            v-if="channelInfo.previewmode"
            @click="$router.push({ path: '/browser'})"
            size="large"
            class="rounded-lg ma-1"
            color="secondary"
        >
            ブラウザへ戻る
        </v-btn>
        
        <v-btn
            @click="()=>channelDialogShow=!channelDialogShow"
            size="large"
            icon=""
            class="rounded-lg ma-1"
            color="secondary"
        >
            <v-icon>mdi:mdi-menu</v-icon>
        </v-btn>
    </div>
    
</template>

<style scoped>



</style>