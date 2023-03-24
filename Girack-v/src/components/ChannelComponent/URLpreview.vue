<script>

export default {

    props: ["urlData"],

    mounted() {

    }

}

</script>

<template>
    <div
        style="height:fit-content; max-height:400px; max-width:800px; width:65%; margin-top:8px; overflow-y:scroll"
        color="#222"
        class="overflow-y-hidden d-flex flex-row"
        v-for="link in urlData.data"
    >

        <!-- ウェブサイト用 -->
        <v-card
            v-if="(link.mediaType==='website' || link.mediaType==='article') && (link.title!=='')"
            style="width:100%; overflow-y:scroll;"
            color="#222"
            class="pa-3 rounded-lg"
        >
            <v-img v-if="link.img" :src="link.img">
            </v-img>

            <v-avatar style="margin:16px 4px;" :image="link.favicon" size="32"></v-avatar>

            <!-- 記事のタイトル -->
            <p class="text-subtitle-1">
                <a :href="link.url" target="_blank">
                    {{ link.title }}
                </a>
            </p>

            <!-- 記事の概要 -->
            <p class="text-subtitle-2 ma-3 text-medium-emphasis">
                {{ link.description }}
            </p>
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