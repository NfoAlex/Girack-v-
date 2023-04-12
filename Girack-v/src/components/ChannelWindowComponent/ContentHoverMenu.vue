<script>

import { getSocket, dataUser } from '../../socket';
import { getReplyState } from "./Input.vue";

const socket = getSocket();

export default {
    setup() {
        const { Userinfo } = dataUser();
        const { ReplyState } = getReplyState();

        return { Userinfo, ReplyState };

    },

    props: ["m", "userrole", "channelid"],

    methods: {
        //メッセージの時間を出力する関数
        printDate() {
            let time = this.m.time;

            let t = new Date(); //時間取得用
            let y = t.getFullYear().toString(); //今年 (４桁)
            let m = (t.getMonth()+1).toString().padStart(2,0); //月 (0も含めて２桁に)
            let d = t.getDate().toString().padStart(2,0); //日 (0も含めて２桁に)

            let timestamp = ""; //出力予定の文字列

            //もし去年以上からのメッセージだったら
            if ( time.slice(0,4) !== y ) { //今年とデータのタイムスタンプが違っていたら
                timestamp += time.slice(0,4) + "/";
                timestamp += time.slice(4,6) + "/";
                timestamp += time.slice(6,8) ;

                //表記を返す(時間を足して)
                return timestamp + " " +  time.slice(8,10) + ":" +  time.slice(10,12) + ":" +  time.slice(12,14);

            }

            //↓これいる？
            //もし先月以上前のメッセージだったら
            if ( time.slice(4,6) !== m ) { //今月とデータのタイムスタンプが違っていたら
                timestamp += time.slice(4,6) + "/";
                timestamp += time.slice(6,8);

                //表記を返す(時間を足して)
                return timestamp + " " +  time.slice(8,10) + ":" +  time.slice(10,12) + ":" +  time.slice(12,14);
            
            }

            //もし昨日以上前のメッセージだったら
            if ( time.slice(6,8) !== d ) { //今日とデータのタイムスタンプが違っていたら
                timestamp += time.slice(4,6) + "/";
                timestamp += time.slice(6,8);

                //表記を返す(時間を足して)
                return timestamp + " " +  time.slice(8,10) + ":" +  time.slice(10,12) + ":" +  time.slice(12,14);
            
            }

            //普通に今日だったら
            return " 今日 " +  time.slice(8,10) + ":" +  time.slice(10,12) + ":" +  time.slice(12,14);
            
        },

        //削除したりリアクションしたり編集(ToDo)したり
        messageAction(msgId, act, reaction) {
            //削除する
            if ( act === "delete" ) {
                console.log("messageAction :: 削除します");
                //削除要請を送信
                socket.emit("actMessage", {
                    action: "delete",
                    channelid: this.channelid,
                    messageid: msgId,
                    reqSender: {
                        userid: this.Userinfo.userid,
                        sessionid: this.Userinfo.sessionid
                    }
                });

            }

            //リアクションする
            if ( act === "reaction" ) {
                //リアクションしたことを送信
                socket.emit("actMessage", {
                    action: "reaction",
                    channelid: this.channelid,
                    messageid: msgId,
                    reaction: reaction, //送るリアクション
                    reqSender: {
                        userid: this.Userinfo.userid,
                        sessionid: this.Userinfo.sessionid
                    }
                });
            }

        },

        //返信する関数
        reply() {
            this.ReplyState.isReplying = true; //返信状態をつける
            this.ReplyState.messageid = this.m.messageid; //返信するメッセージのID

        }

    }
}

</script>

<template>

    <v-card class="pa-2 rounded-lg" color="#222" style="width:fit-content; margin-top:-16px; max-width:500px;">
        <!-- ここからホバーメニュー -->
        <span style="position:relative; float:right;">
            <!-- 時間表示 -->
            <span style="margin-right:12px;" class="text-body-2 font-italic">
                {{ printDate() }}
            </span>
            <v-btn @click="messageAction(m.messageid, 'reaction', 'smile')" style="margin-right:3px" variant="tonal" rounded="pill" size="x-small">
                😀
            </v-btn>
            <v-btn @click="messageAction(m.messageid, 'reaction', 'thinking_face')" style="margin-right:3px" variant="tonal" rounded="pill" size="x-small">
                🤔
            </v-btn>
            <v-btn @click="messageAction(m.messageid, 'reaction', 'cold_sweat')" style="margin-right:3px" variant="tonal" rounded="pill" size="x-small">
                😰
            </v-btn>
            
            <!-- 返信 -->
            <v-btn
                @click="reply"
                style="margin-right:3px"
                variant="tonal"
                rounded="pill"
                size="x-small"
            >
                <v-icon>
                    mdi:mdi-reply
                </v-icon>
            </v-btn>

            <!-- 削除ボタン -->
            <v-btn
                prepend-icon="mdi:mdi-delete-forever"
                v-if="Userinfo.role==='Admin'||(userrole!=='Admin'&&Userinfo.role==='Moderator')||m.userid===Userinfo.userid"
                @click="messageAction(m.messageid, 'delete')"
                style="margin-right:3px"
                variant="tonal"
                rounded="pill"
                size="x-small"
            >
                削除
            </v-btn>
        </span>

    </v-card>

</template>

<style scoped>
</style>