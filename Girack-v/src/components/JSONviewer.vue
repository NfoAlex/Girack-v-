/********************************************************
THIS PAGE IS ONLY FOR
DEBUGGING DELETE OR HIDE ON HOSTING TO PUBLIC
********************************************************/

<script setup>
import { dataChannel } from "../data/dataChannel";
import { dataMsg } from "../data/dataMsg";
import { dataUser } from "../data/dataUserinfo";
</script>

<script>
const { UserIndex } = dataUser();
const { MsgDB, MsgReadTime } = dataMsg();
const { ChannelIndex } = dataChannel();

export default {
  data() {
    return {
      mode: "",
    };
  },

  methods: {
    setMode(m) {
      this.mode = m;
    },
  },
};
</script>

<template>
  <div style="padding: 3%; overflow: auto; height: 100%">
    jsonいろいろ
    <br />
    <v-btn @click="setMode('MsgDB')">MsgDB</v-btn>
    <v-btn @click="setMode('ChannelIndex')">ChannelIndex</v-btn>
    <v-btn @click="setMode('MsgReadTime')">MsgReadTime</v-btn>
    <v-btn @click="setMode('UserIndex')">UserIndex</v-btn>

    <div v-if="mode === 'MsgDB'">
      <v-card
        style="padding: 3%; margin-top: 8px"
        variant="outlined"
        v-for="d in Object.entries(MsgDB)"
        :key="d"
      >
        {{ d[0] }}
        <v-card
          variant="tonal"
          style="padding: 1%; margin-top: 8px"
          v-for="m in d[1]"
          :key="m"
        >
          {{ JSON.stringify(m, null, 4) }}
        </v-card>
      </v-card>
    </div>
    <div v-if="mode === 'ChannelIndex'">
      <v-card
        style="padding: 3%; margin-top: 8px"
        variant="outlined"
        v-for="d in Object.entries(ChannelIndex)"
        :key="d"
      >
        {{ d[0] }}
        <v-card variant="tonal" style="padding: 1%; margin-top: 8px">
          {{ d[1] }}
        </v-card>
      </v-card>
    </div>
    <div v-if="mode === 'MsgReadTime'">
      <v-card
        style="padding: 3%; margin-top: 8px"
        variant="outlined"
        v-for="d in Object.entries(MsgReadTime)"
        :key="d"
      >
        {{ d[0] }}
        <v-card variant="tonal" style="padding: 1%; margin-top: 8px">
          {{ d[1] }}
        </v-card>
      </v-card>
    </div>
    <div v-if="mode === 'UserIndex'">
      <v-card
        style="padding: 3%; margin-top: 8px"
        variant="outlined"
        v-for="d in Object.entries(UserIndex)"
        :key="d"
      >
        {{ d[0] }}
        <v-card variant="tonal" style="padding: 1%; margin-top: 8px">
          {{ d[1] }}
        </v-card>
      </v-card>
    </div>
  </div>
</template>
