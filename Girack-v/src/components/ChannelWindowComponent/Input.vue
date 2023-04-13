<script>

import { dataUser, dataMsg, dataChannel, getSocket, getMessage, backendURI } from '../../socket.js';
import { ref } from "vue";

const socket = getSocket();

//返信モード
const ReplyState = ref({
    isReplying: false,
    messageid: "0"
});

export function getReplyState() {
    return { ReplyState };

}

export default {

    setup() {
        const { ReplyState } = getReplyState();
        const { Userinfo } = dataUser();
        const { ChannelIndex } = dataChannel();
        const { MsgDB, UserIndex } = dataMsg();

        return { ReplyState, Userinfo, ChannelIndex, MsgDB, UserIndex };

    },
    
    data() {
        return {
            uri: backendURI,
            txt: "",
            channelid: "",

            dialogChannelMove: false, //チャンネル移動確認ダイアログ
            confirmingChannelMove: false, //チャンネル移動中に待つ時用
            channelidBefore: "", //一つ前のチャンネルID

            //返信情報として表示する部分
            contentDisplay: {
                username: "",
                content: ""
            },

            searchMode: {
                enabled: false, //検索モードに入っているかどうか
                searchingTerm: "", //ToDo::(!現在未使用!)検索するもの("user" | "channel")
            },

            searchDisplayArray: [], //検索するときに表示する配列
            userHereArray: [], //このチャンネルに参加しているユーザー配列
            searchDemoArray : [
                {
                    username: "Alex",
                    role: "Admin"
                }, 
                {
                    username: 'guest',
                    role: "Admin"
                },
                {
                    username: "guy",
                    role: "Member"
                }
            ] //ToDo::検索機能用デモ配列
        }
    },

    watch: {
        //返信状態が変わったらメッセージの取得を開始
        ReplyState: {
            handler() {
                console.log("Input :: watch(ReplyState) : うおお", ReplyState.value);
                this.getMessage();

            },
            deep: true
        },

        //ページの変更を監視
        $route: {
            handler(newPage, oldPage) {
                console.log("Input :: watch($route) : チャンネル変えてそう", newPage.params.id, oldPage.params.id);

                //返信中であり、移動中ではないのなら移動の確認ダイアログを出す
                if ( ReplyState.value.isReplying && newPage.params.id !== this.channelidBefore ) {
                    this.channelidBefore = oldPage.params.id; //ひとつ前のチャンネルを設定
                    this.dialogChannelMove = true; //確認ダイアログを表示

                }

            }
        },

        //入力したテキストを監視してユーザー名を検索しようとしているか調べる
        txt() {
            //@が入力されたら検索モードに入る
            if ( this.txt[this.txt.length-1] === "@" ) {
                this.searchMode.enabled = true;
                this.searchMode.indexStarting = this.txt.length-1;

            }

            //スペースが入力された、あるいは文字が空になったら検索モードを終了
            if ( this.txt[this.txt.length-1] === " " || this.txt[this.txt.length-1] === "　" || this.txt.length === 0 ) {
                this.searchMode.enabled = false;

            }

            //検索モードに入っているなら検索する
            if ( this.searchMode.enabled ) {
                //検索文字列を取得
                let searchQuery = this.txt.substring(this.searchMode.indexStarting+1);

                console.log("Input :: watch(txt) : 検索する文字列 -> ", searchQuery);

                //検索語で配列をフィルターして標示用の配列へ設定
                this.searchDisplayArray = this.channelJoinedUserArray.filter((u)=> {
                    //ユーザー名に検索語が含まれていたら出力
                    if ( (u.username).includes(searchQuery) ) {
                        return u.username;

                    }

                });

                console.log("Input :: watch(txt) : 検索結果 -> ", this.searchDisplayArray);

            }

        }
    },

    computed: {
        //現在のパスからチャンネルのID返すだけ
        getPath() {
            return this.$route.params.id; //パス
        },
    },

    methods: {
        //メッセージを送信する
        msgSend( event, btn ) {
            //送信の初期判定
            if ( btn !== "byBtn" ) { //ボタンからの送信？
                //変換中のEnter検知を外す
                if ( event.keyCode !== 13 ) return; //変換中のEnterなら処理させない

            }

            //送信ｨﾝ!
            socket.emit("msgSend", {
                userid: this.Userinfo.userid, //名前
                channelid: this.getPath, //チャンネルID
                sessionid: this.Userinfo.sessionid, //セッションID);
                replyData: { //返信データ
                    isReplying: ReplyState.value.isReplying, //これは返信かどうか
                    messageid: (ReplyState.value.isReplying)?ReplyState.value.messageid:null, //返信先のメッセージID
                },
                content: this.txt, //メッセージの本文
                reqSender: {
                    userid: this.Userinfo.userid,
                    sessionid: this.Userinfo.sessionid
                }
            });
            
            this.txt = ""; //入力欄を空に
            console.log("--- msg sent ---");

            this.resetReply(); //返信状態を初期化

        },
        
        //チャンネル名を取得するだけ
        getChannelname() {
            try {
                return ChannelIndex.value[this.$route.params.id].channelname; //チャンネル名取得、返す
            }
            catch (e) { //読み込めなかったらとりあえず返す
                return "テキストチャンネル";
            }

        },

        //返信状態を初期化して閉じる
        resetReply() {
            ReplyState.value.isReplying = false;
            ReplyState.value.messageid = "0";

        },

        //一つ前のチャンネルに戻る
        goBackToPreviousChannel() {
            this.$router.push({ path: "/c/" + this.channelidBefore }); //一つ前のチャンネルへ移動
            this.dialogChannelMove = false; //ダイアログを閉じた状態にする

        },
        
        //履歴からメッセージを取得
        getMessage() {
            //今いるチャンネルの履歴を取得
            let MsgDBHere = this.MsgDB[this.getPath];

            console.log("Input getMessage : using ", MsgDBHere);

            //履歴から一致するメッセージIDのものを探す
            for ( let index in MsgDBHere ) {
                //一致していたら表示用変数へ取り込む
                if ( MsgDBHere[index].messageid === ReplyState.value.messageid ) {
                    this.contentDisplay = {
                        username: this.UserIndex[MsgDBHere[index].userid].username, //名前
                        content: MsgDBHere[index].content //メッセージ本文
                    };
                    break;

                }

            }

        }
    },

    mounted() {
        socket.on("infoChannelJoinedUserList", (channelJoinedUserList) => {
            this.channelJoinedUserArray = channelJoinedUserList;

        });

        //ここに参加している人リストを取得
        socket.emit("getInfoChannelJoinedUserList", {
            targetid: this.getPath,
            reqSender: {
                userid: this.Userinfo.userid,
                sessionid: this.Userinfo.sessionid
            }
        });

    },

    unmounted() {
        //メニューページなどにいったら返信状態をリセット
        this.resetReply();

    }

}
</script>

<template>
    <div>

        <v-dialog
            v-model="dialogChannelMove"
            width="40vh"
        >
            <v-card class="rounded-lg pa-5">
                <v-card-title>
                    確認
                </v-card-title>
                <p class="ma-2">まだ返信が終えていません。チャンネル移動していいの？</p>
                <div style="margin-top:10%">
                    <v-btn
                        @click="resetReply();dialogChannelMove=false;"
                        class="rounded-lg ma-1"
                        color="secondary"
                        block
                    >
                        いいよ
                    </v-btn>
                    <v-btn
                        @click="goBackToPreviousChannel()"
                        class="rounded-lg ma-1"
                        variant="text"
                        block
                    >
                        だめ
                    </v-btn>
                </div>
            </v-card>
        </v-dialog>

        <!-- 返信部分 -->
        <div class="d-flex align-center" style="margin:0 10%; margin-top:1%; width:90%;" v-if="ReplyState.isReplying">
            <v-icon class="ma-2">
                mdi:mdi-reply
            </v-icon>
            <!-- 返信先 -->
            <p class="text-truncate">
                {{ contentDisplay.username }} :: {{ contentDisplay.content }}
            </p>
            <!-- 返信キャンセルボタン -->
            <v-btn style="margin-left:8px;" class="rounded-lg" icon="" color="grey" size="x-small" @click="resetReply">
                <v-icon>
                    mdi:mdi-close
                </v-icon>
            </v-btn>
        </div>

        <div style="width:90%; height:fit-content;" class="mx-auto d-flex align-center">

            <v-container fill-height fluid class="d-flex">

                <v-menu
                    label="list"
                    location="top"
                >
                    <template v-slot:activator="{ props }">
                        <!-- 入力部分 -->
                        <v-text-field
                            style="height:fit-content"
                            ref="inp"
                            :placeholder="getChannelname() + 'へ送信'"
                            @keydown.enter="msgSend"
                            variant="solo"
                            density="compact"
                            clearable
                            v-model="txt"
                            v-bind="props"
                            :single-line="true"
                        >
                        </v-text-field>
                    </template>

                    <!-- ユーザー検索候補の表示 -->
                    <v-list v-if="searchMode.enabled">
                        <v-list-item
                            v-for="i in searchDisplayArray"
                        >
                            <v-icon :src="uri + '/img/' + i.userid"></v-icon>
                            {{ i.username }}
                        </v-list-item>
                    </v-list>
                </v-menu>
            
                <v-btn @click="msgSend(null,'byBtn')" icon="" size="small" class="rounded-lg" style="margin:0 1vw;" elevation="0" color="primary">
                    <v-icon icon="mdi:mdi-send-outline"></v-icon>
                    <v-tooltip
                        activator="parent"
                        location="top"
                    >
                        送信!
                    </v-tooltip>
                </v-btn>
        
            </v-container>
            
        </div>
    </div>

</template>