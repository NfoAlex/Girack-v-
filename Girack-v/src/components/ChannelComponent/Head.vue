<script setup>
import { getSocket, channelIndex } from '../../socket';
const socket = getSocket();
</script>

<script>

export default {

    data() {
        channelinfo: {}
    },

    computed: {
        getPath() {
            return this.$route.params.id;
        }
    },

    methods: {
        getChannelInfo() {
            return channelIndex[this.getPath];

        }
    },

    mounted() {
        // this.channelname = channelIndex[this.getPath].channelname;
        console.log("HEAD");
        console.log(this.channelname);
        console.log(channelIndex);
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