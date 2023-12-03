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
    <div>
        <v-dialog>
            <v-card>
                asdf
                {{ pins }}
            </v-card>
        </v-dialog>
    </div>
</template>