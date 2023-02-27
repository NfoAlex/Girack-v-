<script setup>
import { userinfo, getSocket } from '../socket.js';

const socket = getSocket();

</script>

<script>

export default {
    data() {
        return {
            cd: ["card-default","rounded-lg"]
        }
    }
}
</script>

<template>
    <p>ToDo</p>
    <div class="mx-auto" style="width:90%; margin-top:5%; height:90%;">
        <v-container class="bg-surface-variant">
            <v-row no-gutters>
                <v-col cols="3">
                    <v-card variant="tonal" :class="cd" style="padding:0">
                        <v-img class="rounded-lg" :alt="userinfo.userid" :src="'http://localhost:33333/img/' + userinfo.userid + '.jpeg'"></v-img>
                    </v-card>
                </v-col>
                <v-col>
                    <div variant="tonal" :class="cd" style="padding:1% 3% ">
                        <p color="secondary" class="text-left text-overline">
                            # {{ userinfo.userid }}
                        </p>
                        <p class="text-h4 text-left" >
                            {{ userinfo.username }}
                        </p>
                    </div>
                </v-col>
            </v-row>
        </v-container>
        <div class="d-flex flex-row">
            <!-- <v-card variant="tonal" :class="cd" style="width:30%; padding:0">
                <v-img class="rounded-lg" :alt="userinfo.userid" :src="'http://localhost:33333/img/' + userinfo.userid + '.jpeg'"></v-img>
            </v-card>
            <v-card variant="tonal" :class="cd" style="width:50%; padding:1% 3% ">
                <p color="secondary" class="text-left text-overline">
                    # {{ userinfo.userid }}
                </p>
                <p class="text-h4 text-left" >
                    {{ userinfo.username }}
                </p>
            </v-card> -->
        </div>
        <div class="d-flex flex-row">
            <v-card variant="tonal" :class="cd" style="width:100%; ">
                <p class="text--primary" >
                    参加しているチャンネル
                </p>
                <v-card
                    v-for="c in userinfo.channelJoined"
                    class="mx-auto"
                    :class="cd"
                    max-width="75%"
                    style="margin-top:15px"
                    :elevation="6"
                >
                    {{ c }}
                </v-card>
            </v-card>
        </div>
    </div>
</template>

<style scoped>

.card-default
{
    margin: 3% 3%;
    padding: 3%;

    text-align:center;
}

</style>