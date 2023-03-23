<script setup>
import { dataChannel, dataUser } from '../../socket';
import ChannelConfig from "./ChannelConfig.vue";
</script>

<script>
const { ChannelIndex } = dataChannel(); //チャンネル情報

export default {

    components: { ChannelConfig },

    data() {
        return {
            channelDialogShow: false,
            channelDialogId: "0001"
        }
    },

    computed: {
        getPath() {
            this.channelDialogId = this.$route.params.id;
            return this.$route.params.id;

        }
    },

    methods: {
        //チャンネル情報を取得するだけ
        getChannelInfo() {
            try {
                //チャンネルインデックスから情報を返す、データなければ仮データを返す
                if ( ChannelIndex.value[this.getPath] !== undefined ) {
                    return ChannelIndex.value[this.getPath];

                } else {
                    //どのチャンネルにも入ってなかったら
                    if ( Object.entries(ChannelIndex.value).length < 1 ) { 
                        this.$router.push({ path: "/browser" });
                        return;

                    } else {
                        this.$router.push({ path: "/c/" +  Object.entries(ChannelIndex.value)[0][0] });

                    }
                    
                    return { //とりあえず仮データ返す
                        channelname: "ロード中...",
                        description: "",
                        scope: "open"
                    }

                }
            }
            catch(e) {
                return { //とりあえず仮データ返す
                    channelname: "ロード中...",
                    description: "",
                    scope: "open"
                }
            }

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
        <ChannelConfig :channelid="channelDialogId" />
    </v-dialog>

    <div class="overflow-x-hidden" style="padding: 0 32px; white-space:nowrap; float:left; max-width:60%">
        <div class="overflow-x-hidden text-truncate" style="font-size:3vh;" >
            <span v-if="getChannelInfo().scope==='private'" class="mdi mdi-lock"></span>
            {{ getChannelInfo().channelname }}
        </div>
        <p style="font-size:2vh">{{ getChannelInfo().description }}</p>
    </div>
    <div style="width:20%; float:right; padding-top:1%; margin-right: 16px;" class="d-flex flex-row-reverse">
        <v-btn @click="()=>channelDialogShow=!channelDialogShow" size="large" icon="" class="rounded-lg" color="secondary">
            <v-icon>mdi:mdi-menu</v-icon>
        </v-btn>
    </div>
    
</template>

<style scoped>



</style>