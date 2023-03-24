<script>

export default {

    props: ["urlData"],

    mounted() {

    }

}

</script>

<template>
    <div
        style="height:fit-content; max-height:400px; max-width:800px; width:95%; margin-top:8px; overflow-y:scroll"
        color="#222"
        class="overflow-y-hidden d-flex flex-row"
        v-for="link in urlData.data"
    >

        <!-- ウェブサイト用 -->
        <v-card
            v-if="link.mediaType==='website' && (link.title!=='')"
            style="width:80%; overflow-y:scroll;"
            color="#222"
            class="pa-3 rounded-lg"
        >
            <div class="d-flex flex-row align-center">
                <v-avatar class="rounded-lg" style="margin:16px 4px; float:left;" :image="link.favicon" size="32">
                </v-avatar>
                
                <!-- 記事のタイトル -->
                <p class="text-subtitle-1">
                    <a :href="link.url" target="_blank">
                        {{ link.title }}
                    </a>
                </p>
            </div>

            <!-- 記事の概要 -->
            <p v-if="link.description" class="text-subtitle-2 ma-3 text-medium-emphasis">
                {{ link.description }}
            </p>
        </v-card>

        <!-- 記事あるいは画像メインの何か用 -->
        <v-card
            v-if="link.mediaType==='article' && (link.title!=='')"
            style="width:100%; overflow-y:scroll;"
            color="#222"
            class="pa-3 rounded-lg d-flex flex-row"
        >
            <v-img
                style="max-height:300px; min-width:30%;"
                v-if="link.img"
                :src="link.img"
            >
            </v-img>

            <div class="d-flex flex-column">
                <div style="margin-left: 16px;" class="d-flex flex-row align-center">

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
                            {{ link.title }}
                        </a>
                    </p>

                </div>

                <!-- 記事の概要 -->
                <p class="text-body-2 ma-3 font-weight-light text-medium-emphasis">
                    {{ link.description.length>135 ? link.description.substring(0,135)+"..." : link.description.length }}
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
                <v-img style="margin:8px 4px; width:auto; min-width:150px; max-height:300px;" :src="link.url">
                </v-img>
            </div>
        </v-card>

    </div>
</template>