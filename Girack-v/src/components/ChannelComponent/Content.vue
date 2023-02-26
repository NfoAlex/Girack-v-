<script>
import { getSocket } from "../../socket.js";
const socket = getSocket();

export default {
    data() {
        return {
            msgDB: {
                "001": [
                    {
                        id: 0,
                        username: "Test",
                        userid: "xxx",
                        channelid: "001",
                        msg: ["Ayo", "abc", "そしてこれが３つ目"]
                    },
                    {
                        id: 0,
                        username: "Admin",
                        userid: "xxx",
                        channelid: "001",
                        msg: ["は", "誰お前"]
                    }
                ]
            }

        }
    },

    mounted() {
        //メッセージ受け取り
        socket.on("msgReceive", (msg) => {
            this.msgDB += this.msgDB.push({
                username: msg.username,
                userid: msg.userid,
                channelid: msg.channelid,
                msg: msg.content
            });

        });

    }

}

</script>

<template>
    <div v-for="m in msgDB[$route.params.id]">
        <v-card class="rounded-lg" variant="tonal" elevation="4" style="margin:3% auto; width:95%; padding:3% 1%;">
            <div :class="'text-h6'">{{ m.username }}</div>
            <p style="margin:1% 1% 0 1%" v-for="conte in m.msg">
                {{ conte }}
            </p>
        </v-card>
    </div>
</template>