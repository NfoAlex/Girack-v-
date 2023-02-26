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
                        id: 1,
                        username: "Admin",
                        userid: "xxx",
                        channelid: "001",
                        msg: ["は", "誰お前"]
                    }
                ],
                "002": [
                    {
                        id: 0,
                        username: "Psyonix",
                        userid: "xxx",
                        channelid: "001",
                        msg: ["いや","お前のランクよ","草"]
                    },
                ]
            }

        }
    },

    computed: {
        getPath() {
            return this.$route.params.id;
        }
    },

    mounted() {
        //メッセージ受け取り、出力
        socket.on("msgReceive", (msg) => {
            let activeDB = this.msgDB[this.getPath];
            //名前が一つ前のメッセージと同じなら連続して表示
            if ( activeDB[activeDB.length-1].userid === msg.userid ) { //一つ前のメッセージと名前が同じなら
                this.msgDB[this.getPath][activeDB.length-1].msg.push(msg.content); //メッセージ配列に追加

            } else { //違う人のメッセージなら普通に表示
                this.msgDB[this.getPath].push({
                    username: msg.username,
                    userid: msg.userid,
                    channelid: msg.channelid,
                    msg: [msg.content]
                });
            }

        });

    }

}

</script>

<template>
    <div ref="channelWindow">
        <div style="display:flex; margin-top:2%; flex-direction:row; justify-content:space-evenly;" v-for="m in msgDB[$route.params.id]">
            <v-avatar style="" size="x-large">
                <v-img :alt="m.username" :src="'http://localhost:33333/img/' + m.userid + '.jpeg'"></v-img>
            </v-avatar>
            <v-card class="rounded-lg" variant="tonal" elevation="4" style="; width:87.5%; padding:3% 1%;">
                <div :class="'text-h6'">{{ m.username }}</div>
                <p style="font-size:16px" v-for="conte in m.msg">
                    {{ conte }}
                </p>
            </v-card>
        </div>
    </div>
</template>