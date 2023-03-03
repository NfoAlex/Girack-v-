<script setup>
import { getSocket, getUserinfo, backendURI, msgDBbackup, userIndexBackup, backupMsg, backupUser } from "../../socket.js";

</script>
<script>
//import { getSocket, getUserinfo, backendURI, msgDBbackup, userIndexBackup, backupMsg, backupUser } from "../../socket.js";

const socket = getSocket();
//const getUserinfo = getUserinfo();

export default {

    data() {
        return {
            msgDB: {},
            userIndex: {},
            uri: backendURI,

            NotAtBottom: true,

            //ホバー処理用
            msgHovered: false,
            msgContentIdHovering: 0,
            msgIdHovering: 0,

            goBottom: "goBottom" //下に行くボタン用CSSクラス
        }
    },

    computed: {
        //現在いるパスを返すだけ
        getPath() {
            return this.$route.params.id;

        },

    },

    mounted() {
        console.log("content :: ユーザーいんふぉ ↓");
        console.log(getUserinfo());

        let ref = this; //methodsの関数使う用（直接参照はできないため）

        this.msgDB = msgDBbackup; //使うメッセージDB
        this.userIndex = userIndexBackup; //使うユーザーの名前リスト
        
        const channelWindow = document.querySelector("#channelWindow"); //スクロール制御用

        //スクロールした際に"下に行く"ボタンを表示するかどうか計算
        channelWindow.addEventListener("scroll", function (event) {
            ref.setScrollState(); //確認開始

        });

        //メッセージ受け取り、出力
        socket.on("msgReceive", (msg) => {
            console.log("msgReceive :: ↓");
            console.log(msg);
            //スクロールしきっているか確認
            let scrolledState = channelWindow.scrollTop + channelWindow.clientHeight + 32 >= channelWindow.scrollHeight; 
            console.log("scrolledState -> " + scrolledState);

            //使用するDBレコード
            //let activeDB = this.msgDB[this.getPath];

            //もしユーザーの名前リストに名前がなかったら
            if ( this.userIndex[msg.userid] === undefined ) {
                //名前をリクエスト
                socket.emit("getInfo", {
                    target: "user",
                    targetid: msg.userid,
                    reqSender: {
                        userid: getUserinfo().userid, //ユーザーID
                        sessionid: getUserinfo().sessionid //セッションID
                    }
                });

            }

            //名前が一つ前のメッセージと同じなら連続して表示
            try { //メッセージの長さが１個以上あるかどうか
                //一つ前のメッセージと名前が同じなら
                // console.log("Content :: ");
                // console.log(this.msgDB[msg.channelid][4]);
                if ( this.msgDB[msg.channelid][this.msgDB[msg.channelid].length-1].userid === msg.userid ) {
                    this.msgDB[msg.channelid][this.msgDB[msg.channelid].length-1].content.push(msg.content); //メッセージ配列に追加
                    //this.msgDB[msg.channelid][this.msgDB[msg.channelid].length-1].time = msg.time;

                } else { //違う人のメッセージなら普通に表示
                    this.msgDB[msg.channelid].push({
                        messageid: msg.messageid,
                        userid: msg.userid,
                        channelid: msg.channelid,
                        content: [
                            {
                                textid: msg.content.textid,
                                text: msg.content.text,
                                time: msg.content.time,
                                reaction: []
                            }
                        ]
                    });

                }
            }
            catch(e) { //DBが空なら
                this.msgDB[msg.channelid] = [];
                this.msgDB[msg.channelid].push({
                    messageid: msg.messageid,
                    userid: msg.userid,
                    channelid: msg.channelid,
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

        //絵文字を取得するだけ(ToDo:別コンポーネントとして独立)
        getReaction(reaction) {
            switch(reaction) {
                case "smile":
                    return "😀";

                case "thinking_face":
                    return "🤔";

                case "smirk":
                    return "😏";

                default:
                    return reaction;

            }

        },

        //もし人のやつほしくなったら
        needUserIndex(userid) {
            socket.emit("getInfo", {
                target: "user",
                targetid: userid,
                reqSender: {
                    userid: getUserinfo().userid, //ユーザーID
                    sessionid: getUserinfo().sessionid //セッションID
                }
            });

            return userid;

        },

        //スクロールさせるだけの関数
        scrollIt() {
            channelWindow.scrollTo(0, channelWindow.scrollHeight); //スクロール

        },

        //ホバー時アクション
        mouseOverMsg(contentId, msgId, bool) {
            if ( bool === "on" ) {
                this.msgHovered = true;
                this.msgContentIdHovering = contentId;
                this.msgIdHovering = msgId;

            }

            if ( bool === "off" ) {
                //console.log("mouseOverMsg :: OFF msgId -> " + msgId);
                this.msgHovered = false;
                this.msgContentIdHovering = null;
                this.msgIdHovering = null;

            }
    
            //console.log("mouseOverMsg :: hovered on -> " + this.msgIdHovering);

        },

        messageAction(contentId, msgId, act) {
            if ( act === "delete" ) {
                console.log("messageAction :: 削除します");
                //削除要請を送信
                socket.emit("actMessage", {
                    action: "delete",
                    channelid: this.getPath,
                    messageid: msgId,
                    textid: contentId,
                    reqSender: {
                        userid: getUserinfo().userid,
                        sessionid: getUserinfo().sessionid
                    }
                });

            }

        },

        //スクロール位置によって一番下に行くボタンの表示切り替えをする
        setScrollState() {
            //一番下？
            if ( channelWindow.scrollTop + channelWindow.clientHeight + 32 >= channelWindow.scrollHeight ) {
                this.NotAtBottom = false; //スクロールしきってないと保存

            } else {
                this.NotAtBottom = true; //スクロールしきったと保存

            }

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
    <div id="channelWindow" style="height:100%; width:100%; overflow-y:auto;">
        <div style="display:flex; margin-top:12px; margin-bottom:12px; flex-direction:row; justify-content:space-evenly;" v-for="m in msgDB[$route.params.id]">
            
            <v-avatar size="x-large">
                <v-img :alt="m.userid" :src="uri + '/img/' + m.userid + '.jpeg'"></v-img>
            </v-avatar>

            <!-- メッセージ本体 -->
            <v-card class="rounded-lg" variant="tonal" elevation="4" style="; width:85.5%; padding:1% 1%;">
                
                <div :class="'text-h6'">
                    {{ userIndex[m.userid]!==undefined ? userIndex[m.userid].username : needUserIndex(m.userid) }}
                    <v-chip
                        v-if="getRole(m.userid)!=='Member'"
                        :color="getRole(m.userid)==='Admin'?'purple':'gray'"
                        size="x-small"
                        :elevation="6"
                    >
                    {{ getRole(m.userid) }}
                    </v-chip>
                    
                </div>
                
                <!-- ToDo:ここのフォントサイズの調整 -->
                <p
                    @mouseover="mouseOverMsg(conte.textid, m.messageid, 'on')"
                    @mouseleave="mouseOverMsg(conte.textid, m.messageid, 'off')"
                    style="font-size:16px"
                    v-for="conte in m.content"
                >

                    {{ conte.text }}

                    <!-- コンポーネント化予定 -->
                    <span v-if="msgHovered && ( msgContentIdHovering === conte.textid ) && ( msgIdHovering === m.messageid )" style="float:right">
                        <span style="margin-right:12px" class="text-body-2 font-italic" v-if="msgHovered && ( msgIdHovering === conte.textid )">
                            {{ printDate(conte.time) }}
                        </span>
                        <v-btn style="margin-right:3px" variant="tonal" rounded="pill" size="x-small">
                            😀
                        </v-btn>
                        <v-btn style="margin-right:3px" variant="tonal" rounded="pill" size="x-small">
                            🤔
                        </v-btn>
                        <!-- 削除ボタン -->
                        <v-btn v-if="getUserinfo().role==='Admin'||m.userid===getUserinfo().userid" @click="messageAction(conte.textid, m.messageid, 'delete')" style="margin-right:3px" variant="tonal" rounded="pill" size="x-small">
                            <span style="font-size:0.8vmax" class="mdi mdi-delete-forever">
                            </span>
                            削除
                        </v-btn>
                    </span>

                    <br v-if="conte.reaction">
                    <v-chip size="small" color="white" v-for="r in conte.reaction">
                        {{ getReaction(Object.keys(r)[0]) }} {{ r[Object.keys(r)[0]] }}
                    </v-chip>

                </p>

            </v-card>

        </div>
    </div>
    <!-- 一番下にスクロールするボタン -->
    <v-btn v-if="NotAtBottom" style="padding:0" icon="" :elevation="6" :class="[goBottom,'rounded-lg']" @click="scrollIt">
        <span width="100%" style="font-size:2vmax;" class="mdi mdi-arrow-down-bold"></span>
    </v-btn>
</template>

<style scoped>

.goBottom
{
    position: absolute;
    right: 1vw;
    bottom: 3vh;

    width: 4vmax;
    max-width: 5vh;

    height: 4vmax;
    max-height: 5vh;

    background-color: grey;
}

</style>