<script>
import { getSocket, dataMsg, dataUser, backendURI, getMessage, dataChannel } from "../../socket.js";
const socket = getSocket();
// const { Userinfo } = dataUser(); //ユーザー情報
// const { MsgDB, UserIndex, StateScrolled, DoScroll } = dataMsg(); //履歴用DB

export default {
    setup() {
        const { Userinfo } = dataUser(); //ユーザー情報
        const { MsgDB, UserIndex, StateScrolled, DoScroll, MsgReadTime } = dataMsg(); //履歴用DB
        const { ChannelIndex } = dataChannel();

        return { Userinfo, MsgDB, MsgReadTime, UserIndex, StateScrolled, DoScroll, ChannelIndex };

    },

    data() {
        return {
            uri: backendURI, //バックエンドのURI

            //ホバー処理用
            msgHovered: false, //ホバーされたかどうか
            msgIdHovering: 0, //ホバーされたメッセージのID

            goBottom: "goBottom" //下に行くボタン用CSSクラス
        }
    },

    watch: {
        //メッセージの更新監視
        MsgDB: {
            //変更を検知したらレンダーを待ってから状況に合わせてスクロールする
            handler() {
                //もしスクロールしきった状態、あるいは自分が送ったメッセージなら
                if ( this.StateScrolled ) {
                    //新着のメッセージ数を0に
                    this.MsgReadTime[this.getPath].new = 0;

                    //レンダーを待ってからスクロール
                    this.$nextTick(() => {
                        this.scrollIt(); //スクロールする
                        this.setScrollState(true); //スクロール状態を"スクロールしきった"と保存

                    });

                }

            },
            deep: true //階層ごと監視するため
        },

        //チャンネルの移動を監視
        $route: { //URLパスの変更監視
            handler() {
                //レンダーを待ってからスクロール
                this.$nextTick(() => {
                    this.scrollIt(); //スクロールする
                    this.MsgReadTime[this.getPath] = {
                        new: 0 //新着メッセージ数を0に
                    };

                });

            }
        }
    },

    computed: {
        //現在いるパスを返すだけ
        getPath() {
            return this.$route.params.id;

        },

    },

    mounted() {
        let ref = this; //methodsの関数使う用（直接参照はできないため）

        //レンダー完了したらスクロール監視、スクロール状態の初期化
        this.$nextTick(() => {
            document.querySelector("#channelWindow").addEventListener("scroll", function (event) {
                ref.setScrollState(); //確認開始

            });
            this.scrollIt(); //スクロールする(ToDo:チャンネルごとに記憶したい)

        });

    },

    methods: {
        //ロールを取得するだけ
        getRole(userid) {
            try {
                return this.UserIndex[userid].role;

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

                case "cold_sweat":
                    return "😰";

                default:
                    return reaction;

            }

        },

        //さらに過去の履歴(10件)を取得する
        getHistory() {
            console.log("履歴ほしいね :  path -> " + this.getPath + ", hrcount -> " + this.ChannelIndex[this.getPath].historyReadCount);
            getMessage(this.getPath, 10, this.ChannelIndex[this.getPath].historyReadCount);

        },

        //指定された履歴の日付を取得
        getHistoryDate(index){
            let time = this.MsgDB[this.getPath][index].time;
            let timestamp = "";

            timestamp += time.slice(0,4) + "/";
            timestamp += time.slice(4,6) + "/";
            timestamp += time.slice(6,8);

            return timestamp;

        },

        //もし人のやつほしくなったら
        needUserIndex(userid) {
            socket.emit("getInfo", {
                target: "user",
                targetid: userid,
                reqSender: {
                    userid: this.Userinfo.userid, //ユーザーID
                    sessionid: this.Userinfo.sessionid //セッションID
                }
            });

            return userid;

        },

        //アバターを表示するかどうか
        checkShowAvatar(userid, index) {
            try {
                //分(min)差計算
                let msgTimeMinBefore = parseInt(this.MsgDB[this.getPath][index-1].time.slice(10,12));
                let msgTimeMinThis = parseInt(this.MsgDB[this.getPath][index].time.slice(10,12));
                    //分差計算
                let timeMinDifference = msgTimeMinThis - msgTimeMinBefore;

                //時(h)差計算
                let msgTimeHourBefore = parseInt(this.MsgDB[this.getPath][index-1].time.slice(8,10));
                let msgTimeHourThis = parseInt(this.MsgDB[this.getPath][index].time.slice(8,10));
                    //時差計算
                let timeHourDifference = msgTimeHourThis - msgTimeHourBefore;

                //メッセージ履歴のインデックス番号より一つ前と同じユーザーIDなら表示しない(false)と返す
                if ( this.MsgDB[this.getPath][index-1].userid === userid ) { //このメッセージの一つ前のメッセージのユーザーID?
                    //条件でアバターを見せるか見せないか決める
                    if ( timeMinDifference < -55 || timeMinDifference > 4 || timeHourDifference !== 0 ) {
                        return true;

                    } else {
                        return false;

                    }

                } else {
                    return true; //違うから表示する

                }

            }
            catch(e) {
                return true; //最初だったりするときはとにかく表示する

            }

        },

        //一つ前の履歴から１日が空いてるなら日付の線みたいなのを出す
        checkDateDifference(index) {
            try {
                //日を取得
                let msgDateBefore = parseInt(this.MsgDB[this.getPath][index-1].time.slice(6,8));
                let msgDateThis = parseInt(this.MsgDB[this.getPath][index].time.slice(6,8));
                //日付の差を計算
                let dateDifference = msgDateBefore - msgDateThis;

                //条件で日付線出すか決める
                if ( dateDifference !== 0 ) {
                    return true; //表示する

                } else {
                    return false; //表示しない

                }
            }
            catch(e) {}

        },

        //新着メッセージ数を返す
        checkReadTime(channelid) {
            try {
                return this.MsgReadTime[channelid].new; //データ返す
            }
            catch(e) {
                return 0;
            }
        },

        //スクロールさせるだけの関数
        scrollIt() {
            const channelWindow = document.querySelector("#channelWindow"); //スクロール制御用
            channelWindow.scrollTo(0, channelWindow.scrollHeight); //スクロール

        },

        //ホバー時アクション
        mouseOverMsg(msgId, bool) {
            if ( bool === "on" ) {
                this.msgHovered = true;
                this.msgIdHovering = msgId;

            }

            if ( bool === "off" ) {
                //console.log("mouseOverMsg :: OFF msgId -> " + msgId);
                this.msgHovered = false;
                this.msgIdHovering = null;

            }
    
            //console.log("mouseOverMsg :: hovered on -> " + this.msgIdHovering);

        },

        //削除したりリアクションしたり編集(ToDo)したり
        messageAction(msgId, act, reaction) {
            //削除する
            if ( act === "delete" ) {
                console.log("messageAction :: 削除します");
                //削除要請を送信
                socket.emit("actMessage", {
                    action: "delete",
                    channelid: this.getPath,
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
                    channelid: this.getPath,
                    messageid: msgId,
                    reaction: reaction, //送るリアクション
                    reqSender: {
                        userid: this.Userinfo.userid,
                        sessionid: this.Userinfo.sessionid
                    }
                });
            }

        },

        //スクロール位置によって一番下に行くボタンの表示切り替えをする
        setScrollState(s) { //s => bool
            const channelWindow = document.querySelector("#channelWindow"); //スクロール制御用
            //一番下？
            if ( s || channelWindow.scrollTop + channelWindow.clientHeight + 32 >= channelWindow.scrollHeight ) {
                this.StateScrolled = true; //スクロールしきったと保存
                this.MsgReadTime[this.getPath] = {
                    new: 0 //新着メッセージ数を0に
                };

            } else {
                this.StateScrolled = false; //スクロールしきってないと保存

            }

        },

        //メッセージの時間を出力する関数
        printDate(time) {
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
            
        }
    }

}

</script>

<template>
    <div id="channelWindow" style="height:100%; width:100%; overflow-y:auto;">
        
        <!-- 履歴が空なら -->
        <div style="padding:10%" v-if="MsgDB[getPath]===undefined||MsgDB[getPath].length===0">
            <p class="text-subtitle-1" style="text-align:center">あなたが最初!</p>
        </div>

        <!-- 履歴読み込みボタン -->
        <div v-if="MsgDB[getPath]!==undefined" style="display:flex; margin:8px 0; flex-direction:row; justify-content:space-around;">
            <v-btn size="small" @click="getHistory" variant="text">↑過去を読み込む</v-btn>
        </div>

        <!-- こっからメッセージ表示 -->
        <div v-for="(m, index) in MsgDB[$route.params.id]">

            <!-- 日付線 -->
            <div v-if="checkDateDifference(index)" style="width:100%">
                <v-divider></v-divider>
                <p class="text-center text-subtitle-2">{{ getHistoryDate(index) }}</p>
            </div>

            <!-- ここからflexで表示するもの-->
            <div style="display:flex; margin:8px 8px; flex-direction:row; justify-content:flex-end;">
            
                <!-- アバター -->
                <v-avatar v-if="checkShowAvatar(m.userid, index)" class="mx-auto" size="48">
                    <v-img :alt="m.userid" :src="uri + '/img/' + m.userid + '.jpeg'"></v-img>
                </v-avatar>

                <!-- メッセージ本体 -->
                <span :class="['rounded-lg', msgHovered&&(msgIdHovering===m.messageid)?'hovered':null]" variant="tonal" style="width:90%; padding:0 1%;">
                    
                    <!-- ユーザー名と時間表記 -->
                    <div :class="'text-h6'" v-if="checkShowAvatar(m.userid, index)">
                        {{ UserIndex[m.userid]!==undefined ? UserIndex[m.userid].username : needUserIndex(m.userid) }}
                        <v-chip
                            v-if="getRole(m.userid)!=='Member'"
                            :color="getRole(m.userid)==='Admin'?'purple':'gray'"
                            size="x-small"
                            :elevation="6"
                        >
                            <!-- ここはロール ⇒⇒⇒ -->{{ getRole(m.userid) }}
                        </v-chip>

                        <!-- タイムスタンプ -->
                        <span style="margin-right:12px" class="text-body-2 font-italic">
                            {{ printDate(m.time) }}
                        </span>
                        
                    </div>
                    
                    <!-- ToDo:ここのフォントサイズの調整 -->
                    <p
                        @mouseover="mouseOverMsg(m.messageid, 'on')"
                        @mouseleave="mouseOverMsg(m.messageid, 'off')"
                        style="font-size:16px"
                    >

                        {{ m.content }}

                        <!-- コンポーネント化予定 -->
                        <span v-if="msgHovered && ( msgIdHovering === m.messageid )" style="float:right">
                            <span style="margin-right:12px" class="text-body-2 font-italic" v-if="msgHovered && ( msgIdHovering === m.messageid )">
                                {{ printDate(m.time) }}
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
                            <!-- 削除ボタン -->
                            <v-btn prepend-icon="mdi:mdi-delete-forever" v-if="Userinfo.role==='Admin'||m.userid===Userinfo.userid" @click="messageAction(m.messageid, 'delete')" style="margin-right:3px" variant="tonal" rounded="pill" size="x-small">
                                削除
                            </v-btn>
                        </span>

                        <br v-if="m.reaction">
                        <!-- リアクション -->
                        <v-chip style="margin-right:8px; margin-bottom:4px;" size="small" color="white" v-for="r in Object.entries(m.reaction)">
                            {{ getReaction(r[0]) }} {{ r[1] }}
                        </v-chip>

                    </p>

                </span>
            </div>

        </div>
    </div>
    <!-- 一番下にスクロールするボタン -->
    <v-btn style="padding:0" v-if="!StateScrolled" icon="" :elevation="6" :class="[goBottom,'rounded-lg']" @click="scrollIt">
        <v-badge
            v-if="checkReadTime(getPath)!==0"
            color=""
            :content="checkReadTime(getPath)"
            inline
        >
        </v-badge>
        <v-icon 
            v-if="!checkReadTime(getPath)"
            icon="mdi:mdi-arrow-down-thick"
        >
        mdi:mdi-arrow-down-thick
        </v-icon>
        
    </v-btn>
</template>

<style scoped>

.goBottom
{
    position: absolute;
    right: 1vw;
    bottom: 10vh;

    width: 4vmax;
    max-width: 5vh;

    height: 4vmax;
    max-height: 5vh;

    background-color: #49454F;
}

.hovered
{
    background-color: #49454F;
}

</style>