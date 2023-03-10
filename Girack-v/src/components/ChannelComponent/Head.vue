<script setup>
import { getSocket, channelIndex, dataUser } from '../../socket';
const socket = getSocket();
</script>

<script>

export default {

    computed: {
        getPath() {
            return this.$route.params.id;

        }
    },

    methods: {
        getChannelInfo() {
            console.log("getChannelInfo :: ");
            console.log(channelIndex[this.getPath]);
            try {
                //チャンネルインデックスから情報を返す、データなければホームに返す
                if ( channelIndex[this.getPath] !== undefined ) {
                    return channelIndex[this.getPath];

                } else {
                    setTimeout(() => {this.$forceUpdate()}, 1000); //レンダーまた更新させる
                    return { //とりあえず仮データ返す
                        channelname: "ロード中...",
                        description: "",
                        scope: "open"
                    }
                    //location.pathname = "/home";

                }
            }
            catch(e) {
                //setTimeout(this.$forceUpdate(), 1000);
                return { //とりあえず仮データ返す
                    channelname: "ロード中...",
                    description: "",
                    scope: "open"
                }
                //location.pathname = "/";
                //return null;
            }

        }
    },

    mounted() {
        //読み込みエラー対策
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
    <div style="width:40%; float:right; padding: 0" class="d-flex flex-row-reverse">
        <v-btn class="rounded-lg" variant="text" icon="" style="height:70px; width:70px;">履歴↑</v-btn>
    </div>
    
</template>

<style scoped>



</style>