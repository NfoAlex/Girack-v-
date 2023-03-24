<script>

export default {

    props: ["urlData"],

}

</script>

<template>
    <div
        style="height:fit-content; max-height:500px; max-width:500px; width:80%; margin-top:8px;"
        color="#222"
        elevation="6"
        v-for="link in urlData.data"
    >

        <v-card v-if="link.mediaType==='website'" style="width:100%" class="pa-3 rounded-lg">
            <p class="text-h6">{{ link.title }}</p>
            <p class="text-subtitle-2">{{ link.description }}</p>
        </v-card>


        <v-card
            v-if="link.mediaType==='image'"
            class="rounded-lg pa-2"
            style="width:fit-content;"
        >
            <div class="mx-auto">
                <v-img style="margin:8px 4px; width:auto; min-width:150px; max-height:300px;" :src="link.url">
                </v-img>
            </div>
        </v-card>

    </div>
</template>