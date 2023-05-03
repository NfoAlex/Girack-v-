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
    },

    methods: {
        //ファイルサイズの値を読める形の単位に変換(https://stackoverflow.com/questions/10420352/converting-file-size-in-bytes-to-human-readable-string)
        humanFileSize(bytes, si=false, dp=1) {
            const thresh = si ? 1000 : 1024;

            if (Math.abs(bytes) < thresh) {
                return bytes + ' B';
            }

            const units = si 
                ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'] 
                : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
            let u = -1;
            const r = 10**dp;

            do {
                bytes /= thresh;
                ++u;
            } while (Math.round(Math.abs(bytes) * r) / r >= thresh && u < units.length - 1);


            return bytes.toFixed(dp) + ' ' + units[u];
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

                <v-card
                    style="width:fit-content; margin:32px 0; padding:0;"
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
    </v-dialog>

    <div>
        <v-card
            class="rounded-lg pa-3 ma-2 d-flex align-center justify-space-between"
            style="max-width:65%;"
            v-for="file in fileData.attatchmentData"
        >
            <!-- <span v-if="file.type.includes('image/')"> -->
                <v-img
                    @click="imageDialogShow=true;imageDialogSrc=filesrc+file.fileid;"
                    style="max-height:150px; height:100%; min-width:30%; cursor:pointer;"
                    :src="filesrc+file.fileid"
                >
                    <template style="min-height:150px;" v-slot:error>
                        <v-icon>
                            mdi:mdi-file-image-remove
                        </v-icon>
                    </template>

                    <template style="height:150px;" v-slot:placeholder>
                        Loading...
                    </template>
                    
                </v-img>

            <span class="flex-shrink-1" style="margin-left:16px;">
                <p class="text-subtitle-1">
                    <a target="_blank" :href="filesrc+file.fileid">{{ file.name }}</a>
                </p>
                <p class="text-medium-emphasis">サイズ: <v-chip size="small">{{ humanFileSize(file.size) }}</v-chip> | 種類: <v-chip size="small">{{ file.type }}</v-chip></p>
            </span>

        </v-card>
    </div>
</template>

<style scoped>
</style>