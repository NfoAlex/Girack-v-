<script>

import { backendURI } from '../../socket';

export default {
    props: ["fileData", "channelid"],

    data() {
        return {
            filesrc: backendURI + "/file/" + this.channelid + "/"
        }
    }

}

</script>

<template>
    <div>
        <v-card
            class="rounded-lg pa-3 ma-2 d-flex justify-space-between"
            style="max-width:50%; width:fit-content"
            v-for="file in fileData.attatchmentData"
        >
            <span v-if="file.type.includes('image/')">
                <img style="max-height: 150px;" :src="filesrc+file.fileid">
            </span>
            <span style="margin-left:16px;">
                <p><a target="_blank" :href="filesrc+file.fileid">{{ file.name }}</a></p>
                <p>サイズ: <v-chip size="small">{{ file.size }}</v-chip> | 種類: <v-chip size="small">{{ file.type }}</v-chip></p>
            </span>
        </v-card>
    </div>
</template>

<style scoped>
</style>