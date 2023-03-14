<script setup>
import { dataChannel, dataUser } from '../../socket';
</script>

<script>
const { ChannelIndex } = dataChannel(); //チャンネル情報

export default {

    computed: {
        getPath() {
            return this.$route.params.id;

        }
    },

    methods: {
        //チャンネル情報を取得するだけ
        getChannelInfo() {
            console.log("getChannelInfo :: ");
            console.log(ChannelIndex.value[this.getPath]);
            try {
                //チャンネルインデックスから情報を返す、データなければホームに返す
                if ( ChannelIndex.value[this.getPath] !== undefined ) {
                    return ChannelIndex.value[this.getPath];

                } else {
                    setTimeout(() => {this.$forceUpdate()}, 1000); //レンダーまた更新させる
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
    <div style="padding: 1% 32px; float:left;">
        <div :class="'text-h4'">
            <span v-if="getChannelInfo().scope==='private'" class="mdi mdi-lock"></span>
            {{ getChannelInfo().channelname }}
        </div>
        <p>{{ getChannelInfo().description }}</p>
    </div>
    <div style="width:40%; float:right;" class="d-flex flex-row-reverse">
        <v-chip>Funky</v-chip>
    </div>
    
</template>

<style scoped>



</style>