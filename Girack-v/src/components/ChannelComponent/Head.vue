<script setup>
import { getSocket, channelIndex, userinfo } from '../../socket';
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
                if ( channelIndex[this.getPath] !== undefined ) {
                    return channelIndex[this.getPath];

                } else {
                    location.pathname = "/home";

                }
            }
            catch(e) {
                location.pathname = "/";
                return null;
            }

        }
    },

    mounted() {
        if ( userinfo.channelJoined.includes(this.getPath) === -1 ) {
            location.pathname = "/";

        }

    }

}

</script>

<template>
    <div style="padding: 1% 32px">
        <div :class="'text-h4'">{{ getChannelInfo().channelname }}</div>
        <p>{{ getChannelInfo().description }}</p>
    </div>
</template>

<style scoped>



</style>