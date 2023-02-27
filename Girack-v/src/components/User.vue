<script setup>
import { userinfo, getSocket, channelIndex } from '../socket.js';

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
        <v-container class="bg-surface-variant">
            <v-row no-gutters>
            <v-card variant="tonal" :class="cd" style="width:100%; ">
                <p class="text--primary text-left" >
                    参加しているチャンネル
                </p>
                <v-card
                    v-for="c in channelIndex"
                    class="mx-auto text-left"
                    :class="cd"
                    max-width="95%"
                    style="margin-top:15px"
                    :elevation="6"
                >
                    <span class="text-h6" style="border-right:0.1px">{{ c.channelname }}</span>
                    <span style="height:100%; border-right:1px solid grey; margin:0 1%"></span>
                    <v-chip>公開</v-chip>
                    <span style="height:100%; border-right:1px solid grey; margin:0 1%"></span>
                    <span>{{ c.description }}</span>
                </v-card>
            </v-card>
        </v-row>
        </v-container>
    </div>
</template>

<style scoped>

.card-default
{
    padding: 3%;

    text-align:center;
}

</style>