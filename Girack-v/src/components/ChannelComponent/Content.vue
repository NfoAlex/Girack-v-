<script>
import { getSocket, userinfo, backendURI, msgDBbackup, userIndexBackup, backupMsg, backupUser } from "../../socket.js";
const socket = getSocket();

export default {

    data() {
        return {
            msgDB: {},
            userIndex: {},
            uri: backendURI,
            scrolled: false
        }
    },

    computed: {
        //現在いるパスを返すだけ
        getPath() {
            return this.$route.params.id;

        }
    },

    mounted() {
        this.msgDB = msgDBbackup;
        this.userIndex = userIndexBackup;

        const channelWindow = document.querySelector("#channelWindow");

        //メッセージ受け取り、出力
        socket.on("msgReceive", (msg) => {
            console.log("msgReceive :: ↓");
            console.log(msg);
            //スクロールしきっているか確認
            let scrolledState = channelWindow.scrollTop + channelWindow.clientHeight + 32 >= channelWindow.scrollHeight; 
            console.log("scrolledState -> " + scrolledState);

            //使用するDBレコード
            let activeDB = this.msgDB[this.getPath];

            //もしユーザーの名前リストに名前がなかったら
            if ( this.userIndex[msg.userid] === undefined ) {
                //名前をリクエスト
                socket.emit("getInfo", {
                    target: "user",
                    targetid: msg.userid,
                    reqSender: {
                        userid: userinfo.userid, //ユーザーID
                        sessionid: userinfo.sessionid //セッションID
                    }
                });

            }

            //名前が一つ前のメッセージと同じなら連続して表示
            try { //メッセージの長さが１個以上あるかどうか
                //一つ前のメッセージと名前が同じなら
                if ( activeDB[activeDB.length-1].userid === msg.userid ) {
                    this.msgDB[this.getPath][activeDB.length-1].content.push(msg.content); //メッセージ配列に追加
                    this.msgDB[this.getPath][activeDB.length-1].time = msg.time;

                } else { //違う人のメッセージなら普通に表示
                    this.msgDB[this.getPath].push({
                        id: this.msgDB[this.getPath].length+1,
                        userid: msg.userid,
                        channelid: msg.channelid,
                        time: msg.time,
                        content: [msg.content]
                    });

                }
            }
            catch(e) { //DBが空なら
                this.msgDB[this.getPath] = [];
                this.msgDB[this.getPath].push({
                    id: this.msgDB[this.getPath].length+1,
                    userid: msg.userid,
                    channelid: msg.channelid,
                    time: msg.time,
                    content: [msg.content]
                });

            }

            //スクロールされきっていたら最後へ自動スクロールする
            if ( scrolledState ) { //この関数用の変数で確認
                channelWindow.scrollTo(0, channelWindow.scrollHeight); //スクロール

            }

            backupMsg(this.msgDB); //メッセージDBの出力、保存

        });

        //他人の名前の受け取り
        socket.on("infoResult", (dat) => {
            if ( dat.type !== "user" ) { return; } //ユーザー情報じゃなければ取りやめ
            console.log("Content :: infoResult : 名前情報受け取り \\/")
            console.log(dat);

            let username = dat.username;
            let userid = dat.userid;
            let role = dat.role;

            this.userIndex[userid] = {};

            //ユーザーインデックス更新
            this.userIndex[userid].username = username; //名前
            this.userIndex[userid].role = role; //ロール

            backupUser(this.userIndex); //ユーザー情報をバックアップ

        });

    },

    //アンロード時の処理
    unmounted() {
        socket.off("msgReceive"); //メッセージの受け取り中止

    },

    methods: {
        //ロールを取得するだけ
        getRole(userid) {
            try {
                return this.userIndex[userid].role;

            }
            catch(e) {
                return "Member";

            }

        },

        //もし人のやつほしくなったら
        needUserIndex(userid) {
            socket.emit("getInfo", {
                target: "user",
                targetid: userid,
                reqSender: {
                    userid: userinfo.userid, //ユーザーID
                    sessionid: userinfo.sessionid //セッションID
                }
            });

            return userid;

        },

        //メッセージの時間を出力する関数
        printDate(time) {
            let t = new Date();
            let y = t.getFullYear().toString(); //今年 (４桁)
            let m = "0" + (t.getMonth()+1); //月 (0も含めて２桁に)

            let timestamp = ""; //出力予定の文字列

            //もし去年以上からのメッセージだったら
            if ( time.slice(0,4) !== y ) { 
                timestamp += time.slice(0,4) + "/";
                timestamp += time.slice(4,6) + "/";
                timestamp += time.slice(6,8) ;

                return timestamp + " " +  time.slice(8,10) + ":" +  time.slice(10,12) + ":" +  time.slice(12,14);

            }

            //もし昨日以上前のメッセージだったら
            if ( time.slice(4,6) !== m ) {
                timestamp += time.slice(4,6) + "/";
                timestamp += time.slice(6,8);

                return timestamp + " " +  time.slice(8,10) + ":" +  time.slice(10,12) + ":" +  time.slice(12,14);
            
            }

            //普通に今日だったら
            return " " +  time.slice(8,10) + ":" +  time.slice(10,12) + ":" +  time.slice(12,14);
            
        }
    }

}

</script>

<template>
    <div id="channelWindow" style="height:100%; overflow-y:auto;">
        <div style="display:flex; margin-top:12px; margin-bottom:12px; flex-direction:row; justify-content:space-evenly;" v-for="m in msgDB[$route.params.id]">
            
            <v-avatar size="x-large">
                <v-img :alt="m.userid" :src="uri + '/img/' + m.userid + '.jpeg'"></v-img>
            </v-avatar>

            <v-card class="rounded-lg" variant="tonal" elevation="4" style="; width:85.5%; padding:1% 1%;">
                
                <div :class="'text-h6'">
                    {{ userIndex[m.userid]!==undefined ? userIndex[m.userid].username : needUserIndex(m.userid) }}
                    <v-chip
                        v-if="getRole(m.userid)!=='Member'"
                        color="purple"
                        size="small"
                        :elevation="6"
                    >
                    {{ getRole(m.userid) }}
                    </v-chip>
                    <span class="text-body-2 font-italic">
                        {{ printDate(m.time) }}
                    </span>
                </div>
                
                <p style="font-size:16px" v-for="conte in m.content">
                    {{ conte }}
                </p>

            </v-card>

        </div>
    </div>
</template>