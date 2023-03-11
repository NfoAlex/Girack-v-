/********************************************************

THIS PAGE IS ONLY FOR DEBUGGING
DELETE OR HIDE ON HOSTING

********************************************************/

<script setup>
import { dataMsg } from '../socket';
</script>

<script>
const { MsgDB } = dataMsg();

export default {

}

</script>

<template>
    <div style="padding:3%; overflow:auto; height:100%">
        メッセージのJSON
        <br>
        <v-card style="padding:3%; margin-top:8px;" variant="outlined" v-for="d in Object.entries(MsgDB)">
                {{ d[0] }}
                <v-card variant="tonal" style="padding:1%; margin-top:8px;" v-for="m in d[1]">
                    {{ JSON.stringify(m, null, 4) }}
                </v-card>
        </v-card>
    </div>
</template>