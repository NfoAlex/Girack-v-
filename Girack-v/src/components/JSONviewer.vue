/********************************************************

THIS PAGE IS ONLY FOR DEBUGGING
DELETE OR HIDE ON HOSTING

********************************************************/

<script setup>
import { userinfo, msgDBbackup } from '../socket';
</script>

<script>

export default {
    data() {
        return {
            mDBb: {}
        }
    },

    methods: {
        refreshData() {
            this.mDBb = msgDBbackup;

        }
    },

    mounted() {
        let ref = this;
        ref.mDBb = msgDBbackup;
    }

}

</script>

<template>
    <div style="padding:3%; overflow:scroll !important;">
        <v-btn variant="outlined" block>
            データ更新
        </v-btn>
        <br>
        <v-card style="padding:3%; margin-top:8px;" variant="outlined" v-for="d in Object.entries(mDBb)">
            {{ d[0] }}
            <v-card variant="tonal" style="padding:3%" v-for="m in d[1]">
                {{ JSON.stringify(m, null, 4) }}
            </v-card>
        </v-card>
    </div>
</template>