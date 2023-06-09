<script>
import { useDisplay } from "vuetify";
import { getCONFIG } from "../../config.js";
import { setCookie } from '../../data/socket';
import { dataUser } from "../../data/dataUserinfo";
import ChannelConfig from "./ChannelConfig.vue";

export default {
    setup() {
        const { myUserinfo } = dataUser();
        const { LIST_NOTIFICATION_MUTE_CHANNEL } = getCONFIG();
        return { myUserinfo, LIST_NOTIFICATION_MUTE_CHANNEL };

    },

    components: { ChannelConfig },
    props: ["channelInfo"],

    data() {
        return {
            //チャンネルメニューダイアログ用
            channelDialogShow: false,
            channelDialogId: "0001",
        }
    },

    computed: {
        //今いるパス(チャンネルID)を取得するだけ
        getPath() {
            this.channelDialogId = this.$route.params.id;
            return this.$route.params.id;

        },

        //ディスプレイのサイズから表示するボタンの要素のサイズを取得
        getDisplaySize() {
            console.log("Head :: getDisplaySize : useDisplay().name.value", useDisplay().name.value);
            switch (useDisplay().name.value) {
                case "xs":
                    return "small";

                case "sm":
                    return "default";

                case "md":
                    return "48";

                case "lg":
                    return "64";

                case "xl":
                    return "x-large";

                case "xxl":
                    return "96";

                default:
                    return "";

            }

        }
    },

    methods: {
        //チャンネルのミュート状態を切り替える
        toggleMuteChannel() {
            //チャンネルIDを予め取得しておく
            let channelidHere = this.$route.params.id;

            //チャンネルミュートリスト入っていたら削除、なかったら追加
            if ( (this.LIST_NOTIFICATION_MUTE_CHANNEL).includes(channelidHere) ) {
                //ミュートリストからチャンネルを削除
                this.LIST_NOTIFICATION_MUTE_CHANNEL.splice( this.LIST_NOTIFICATION_MUTE_CHANNEL.indexOf(channelidHere),1 );

            } else {
                //ミュートリストへ追加
                this.LIST_NOTIFICATION_MUTE_CHANNEL.push(this.$route.params.id);

            }

            setCookie("configListMute", (this.LIST_NOTIFICATION_MUTE_CHANNEL.join("::")), 7);

        },
    },

    mounted() {
        //読み込みエラー対策(参加しているチャンネルリストに今のチャンネルがあるかどうか)
        if ( this.myUserinfo.channelJoined.includes(this.getPath) === -1 ) {
            location.pathname = "/";

        }

    }

}

</script>

<template>

    <!-- チャンネル設定ダイアログ -->
    <ChannelConfig v-if="channelDialogShow" v-model="channelDialogShow" :channelid="getPath" :channelInfo="channelInfo" />

    <!-- ヘッダの表示部分(メイン) -->
    <div class="d-flex align-center justify-space-evenly" style="max-width:100%; height:100%;">
        <v-card
            class="d-flex flex-column justify-start rounded-lg"
            color="#222"
            style="margin:0 16px; padding:0 16px; width:100%;"
        >
            <!-- チャンネル情報(チャンネル名、概要) -->
            <div style="white-space:nowrap;">
                <div class="overflow-x-hidden text-truncate" style="font-size:3vh;" >
                    <span v-if="channelInfo.scope==='private'" class="mdi mdi-lock"></span>
                    <v-chip v-if="channelInfo.previewmode" class="ma-1">プレビュー</v-chip>
                    {{ channelInfo.channelname }}
                </div>
            </div>

            <v-divider></v-divider>

            <!-- チャンネル概要 -->
            <div color="grey" class="rounded-lg" style="padding:2px 16px;">
                <p class="text-truncate" style="font-size:2vh">{{ channelInfo.description }}</p>
            </div>

        </v-card>

        <v-divider style="" vertical inset></v-divider>

        <!-- ボタン群 -->
        <div style="margin:0 16px;" class="d-flex align-center">
            <!-- チャンネルの通知オン/オフボタン -->
            <v-btn
                v-if="!channelInfo.previewmode"
                @click="toggleMuteChannel"
                :size="getDisplaySize"
                icon=""
                class="rounded-lg ma-1"
                color="secondary"
            >
                <v-icon v-if="!LIST_NOTIFICATION_MUTE_CHANNEL.includes($route.params.id)">mdi:mdi-bell</v-icon>
                <v-icon v-else>mdi:mdi-bell-off</v-icon>
            </v-btn>

            <!-- プレビュー時用のチャンネルブラウザに戻るボタン -->
            <v-btn
                v-if="channelInfo.previewmode"
                @click="$router.push({ path: '/browser'})"
                :size="getDisplaySize"
                class="rounded-lg ma-1"
                color="secondary"
            >
                ブラウザへ戻る
            </v-btn>
            
            <!-- チャンネルメニューボタン -->
            <v-btn
                @click="()=>channelDialogShow=!channelDialogShow"
                :size="getDisplaySize"
                icon=""
                class="rounded-lg ma-1"
                color="secondary"
            >
                <v-icon>mdi:mdi-menu</v-icon>
            </v-btn>
        </div>

    </div>
    
</template>

<style scoped>



</style>