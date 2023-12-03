<script>

import { getSocket, Serverinfo } from "../../../data/socket";
import { dataUser } from "../../../data/dataUserinfo";

const socket = getSocket();

export default {

    setup() {
        const { myUserinfo } = dataUser();
        return { myUserinfo };
    },

    props: ["pins"]

}

</script>

<template>
    <v-dialog width="65vw" height="75vh">
        <v-card class="rounded-lg mx-0 pa-4" width="100%" height="100%">
            <v-card-title class="d-flex align-center">
                <span class="me-auto">ピン留め</span>
                <v-btn @click="$emit('closePin')" class="rounded-lg" variant="tonal" icon="mdi:mdi-close"></v-btn>
            </v-card-title>
            <v-card-text>
                <v-card
                    v-for="messageid in pins"
                    class="my-2 pa-2 rounded-lg"
                    variant="tonal"
                >
                    メッセid : {{ messageid }}
                </v-card>
                {{ pins }}
            </v-card-text>
        </v-card>
    </v-dialog>
</template>