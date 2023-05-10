<script>

import { backendURI } from '../../socket';

export default {
    props: ["fileData", "channelid"],

    data() {
        return {
            filesrc: backendURI,
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
        },

        //添付ファイルのアイコン表記
        attatchmentDisplayIcon(type) {
            console.log("ContentAttatchmentRender :: attachmentDisplayIcon : type", type);

            //動画ファイルなら動画アイコンを返す
            if ( type.includes("video/") ) return "file-video";

            //音ファイルなら音楽アイコンを返す
            if ( type.includes("audio/") ) return "file-music";

            //テキスト系のファイルならテキストアイコンを返す
            if ( type.includes("text/") ) return "text-box-edit";

            //拡張子にあわせてアイコンの名前を返す
            switch(type) {
                case "application/pdf":
                    return "file-pdf-box";

                case "text/x-python":
                    return "language-python";

                case "application/x-zip-compressed":
                    return "zip-box";

                case "application/x-msdownload": //exeファイル
                    return "application-brackets-outline";

                case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
                    return "microsoft-excel";

                case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
                    return "microsoft-word";

                default:
                    return "file";

            }
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
            style="width:fit-content; max-width:800px;"
            v-for="file in fileData.attatchmentData"
        >
            <!-- 画像ファイルだった時のプレビュー表示 -->
            <v-img
                v-if="file.type.includes('image/')"
                @click="imageDialogShow=true;imageDialogSrc=filesrc+ '/file/' + this.$route.params.id + '/' + file.fileid;"
                class="flex-shrink-1"
                style="max-height:150px; min-height:30px; height:100%; min-width:30%; max-width:150px; cursor:pointer;"
                :src="filesrc+ '/file/' + this.$route.params.id + '/' + file.fileid"
            >
                <template v-slot:error>
                    <div class="mx-auto" style="width:fit-content; min-height:150px;">
                        <v-icon size="large">
                            mdi:mdi-file-image-remove
                        </v-icon>
                    </div>
                </template>

                <template v-slot:placeholder>
                    <p style="height:150px !important; width:100%;">
                        Loading...
                    </p>
                </template>

            </v-img>

            <!-- 添付ファイルのアイコン表記 -->
            <span>
                <a target="_blank" :href="filesrc+file.fileid">
                    <v-icon
                        v-if="!file.type.includes('image/')"
                        style="margin:0 16px;"
                        size="x-large"
                    >
                        mdi:mdi-{{ attatchmentDisplayIcon(file.type) }}
                    </v-icon>
                </a>
            </span>

            <!-- ファイル情報の表示 -->
            <span class="flex-grow-1" style="margin-left:16px;">
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