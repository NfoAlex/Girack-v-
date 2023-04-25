<script>

import { backendURI } from '../../socket';

export default {
    props: ["fileData", "channelid"],

    data() {
        return {
            filesrc: backendURI + "/file/" + this.channelid + "/",
            imageDialogShow: false, //画像拡大ダイアログ用
            imageDialogSrc: ""
        }
    }

}

</script>

<template>

    <!-- 画像拡大ダイアログ -->
    <v-dialog
        v-model="imageDialogShow"
        style="max-width:90vw;"
        @click="imageDialogShow=false"
    >
        <div style="overflow-y:auto;">
            <div class="mx-auto">

                <v-card
                    style="width:fit-content; margin:64px 0;"
                    color="rgba(0,0,0,0.75)"
                    class="rounded-b-lg rounded-t-0 mx-auto"
                >
                    <!-- 画像そのもの -->
                    <v-img style="width:100%; max-height:90vh;" :src="imageDialogSrc">
                    </v-img>
                    <!-- 画像URL -->
                    <p class="ma-2 text-subtitle-2">{{ imageDialogSrc }}</p>
                </v-card>

            </div>
        </div>
    </v-dialog>

    <div>
        <v-card
            class="rounded-lg pa-3 ma-2 d-flex justify-space-between"
            style="max-width:50%; width:fit-content"
            v-for="file in fileData.attatchmentData"
        >

            <span v-if="file.type.includes('image/')">
                <img @click="imageDialogShow=true;imageDialogSrc=filesrc+file.fileid;" style="max-height: 150px; cursor:pointer;" :src="filesrc+file.fileid">
            </span>

            <span style="margin-left:16px;">
                <p class="text-subtitle-1">
                    <a target="_blank" :href="filesrc+file.fileid">{{ file.name }}</a>
                </p>
                <p class="text-medium-emphasis">サイズ: <v-chip size="small">{{ file.size }}</v-chip> | 種類: <v-chip size="small">{{ file.type }}</v-chip></p>
            </span>

        </v-card>
    </div>
</template>

<style scoped>
</style>