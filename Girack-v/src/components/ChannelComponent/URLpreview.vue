<script>

export default {

    props: ["urlData"],

    data() {
        return {
            //画像拡大ダイアログ用
            imageDialogShow: false,
            imageDialogUrls: []
        }
    },

    methods: {
        toggleImageDialog(index) {
            this.imageDialogUrls = []; //表示する画像配列を初期化

            //if ( this.urlData.data[index].img )
            if ( typeof(this.urlData.data[index].img) === "string" ) {
                this.imageDialogUrls.push(this.urlData.data[index].img); //画像一つでも配列へ追加
                
            } else {
                this.imageDialogUrls = this.urlData.data[index].img; //表示するものを設定

            }

            this.imageDialogShow = true; //ダイアログ表示

        },

        getImage(img) {
            if ( typeof(img) === "object" ) {
                return img[0]; //表示するものを設定

            } else {
                return img; //画像一つでも配列へ追加

            }

        }
    },

    mounted() {
        console.log("URLpreview :: mounted : img -> ");
        console.log(this.urlData.data.img);

    }

}

</script>

<template>
    <v-dialog
        v-model="imageDialogShow"
        style="max-width:90vw; "
    >
        <div style="overflow-y:auto;">
            <div @click="imageDialogShow=false" class="mx-auto" style="width:95%;">
                <v-card
                    v-for="img in imageDialogUrls"
                    style="width:fit-content"
                    color="rgba(0,0,0,0.75)"
                    class="rounded-lg mx-auto"
                >
                    <v-img style="margin:8px 0; max-height:90vh;" :src="img"> <!-- 画像そのもの -->
                    </v-img>
                    <p class="ma-2 text-subtitle-2">{{ img }}</p> <!-- 画像URL -->
                </v-card>
            </div>
        </div>
    </v-dialog>

    <div v-for="(link, index) in urlData.data">
        <div
            style="height:fit-content; max-width:800px; width:95%; margin:8px 0;"
            color="#222"
            class="overflow-y-hidden d-flex flex-row"
            v-if="link.title!==''"
        >

            <!-- ウェブ記事とかそこらへん用 -->
            <v-card
                v-if="link.mediaType!=='image' && (link.title!=='')"
                color="#222"
                class="pa-3 rounded-lg d-flex flex-row"
                style="height:150px; min-width:45%; width:85%;"
            >
                <v-img
                    v-if="link.img!==undefined"
                    @click="toggleImageDialog(index)"
                    style="min-width:30%;"
                    :src="getImage(link.img)"
                >
                </v-img>

                <div class="d-flex flex-column">
                    <div style="margin-left:16px;" class="d-flex flex-row align-center">

                        <v-avatar
                            class="rounded-lg"
                            style="margin:4px 4px;" 
                            :image="link.favicon"
                            size="24"
                        >
                        </v-avatar>
                        
                        <!-- 記事のタイトル -->
                        <p class="text-subtitle-2">
                            <a :href="link.url" target="_blank">
                                {{ link.title.length>100 ? link.title.substring(0,100)+"..." : link.title }}
                            </a>
                        </p>

                    </div>

                    <!-- 記事の概要 -->
                    <p class="text-body-2 ma-3 font-weight-light text-medium-emphasis">
                        {{ link.description.length>135 ? link.description.substring(0,135)+"..." : link.description }}
                    </p>

                </div>

            </v-card>

            <!-- 画像単体用 -->
            <v-card
                v-if="link.mediaType==='image'"
                class="rounded-lg pa-2"
                color="#222"
                style="width:fit-content;"
            >
                <div class="mx-auto">
                    <v-img
                        @click="toggleImageDialog(index)"
                        style="margin:8px 4px; width:auto; min-width:150px; max-height:300px;"
                        :src="getImage(link.url)"
                    >
                    </v-img>
                </div>
            </v-card>

        </div>
    </div>
</template>

<style scoped>

.previewContainer::-webkit-scrollbar {
    display: none;
}

</style>