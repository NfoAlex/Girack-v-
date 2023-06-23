<script>

import { getSocket, Serverinfo, backendURI } from '../../data/socket.js';
import { dataMsg } from '../../data/dataMsg';
import { dataChannel } from '../../data/dataChannel';
import { dataUser } from '../../data/dataUserinfo';
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
        const { myUserinfo, UserIndex } = dataUser();
        const { ChannelIndex } = dataChannel();
        const { MsgDB } = dataMsg();

        return { ReplyState, myUserinfo, ChannelIndex, MsgDB, UserIndex, Serverinfo };

    },

    props: ["channelInfo"],
    
    data() {
        return {
            uri: backendURI,
            txt: "", //入力した文字
            fileInputData: [], //アップロードするファイル

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
                selectedIndex: 0, //選択しているもの
                searchStartingAt: 0, //検索モードに入った文字位置
                searchEndingAt: 100, //検索文字列の範囲終わり(文字列全体の長さ - searchStartingAt)
                txtLengthWhenStartSearching: 0, //検索をし始めたときの文字列全体の長さ
                searchingTerm: "", //ToDo::(!現在未使用!)検索するもの("user" | "channel")
                searchingQuery: "" //検索してる文字列
            },

            searchDisplayArray: [], //検索するときに表示する配列
            userHereArray: [], //このチャンネルに参加しているユーザー配列
        }
    },

    watch: {
        //返信状態が変わったらメッセージの取得を開始
        ReplyState: {
            handler() {
                console.log("Input :: watch(ReplyState) : うおお", ReplyState.value);
                this.getMessage(); //返信先のメッセージ取得
                this.$el.querySelector("#inp").focus(); //入力欄へフォーカス

            },
            deep: true
        },

        //ページの変更を監視
        $route: {
            handler(newPage, oldPage) {
                console.log("Input :: watch($route) : チャンネル変えてそう", newPage.params.id, oldPage.params.id);
                //プレビュー中なら何もしない
                if ( this.channelInfo.previewmode ) return -1;

                //返信中であり、移動中ではないのなら移動の確認ダイアログを出す
                if ( ReplyState.value.isReplying && newPage.params.id !== this.channelidBefore ) {
                    this.channelidBefore = oldPage.params.id; //ひとつ前のチャンネルを設定
                    this.dialogChannelMove = true; //確認ダイアログを表示

                }

                //チャンネル以外の場合、以降の処理をスキップする
                if (!(newPage.path.startsWith('/c/'))) {
                    return 0;
                }

                //ここに参加している人リストを取得
                socket.emit("getInfoChannelJoinedUserList", {
                    targetid: this.getPath,
                    reqSender: {
                        userid: this.myUserinfo.userid,
                        sessionid: this.myUserinfo.sessionid
                    }
                });

                //入力欄に表示するためのチャンネル名を取得
                this.channelname = this.channelInfo.channelname;
                
                //チャンネルを移動するごとに入力欄へフォーカス
                this.$el.querySelector("#inp").focus();

            }
        },

        //(メンション用)入力したテキストを監視してユーザー名を検索しようとしているか調べる
        txt() {
            //@が入力されたら検索モードに入る
            if ( this.txt[this.txt.length-1] === "@" ) {
                this.searchMode.enabled = true; //検索モードを有効化
                this.searchMode.searchStartingAt = this.txt.length-1; //検索し始めた文字位置を記憶
                this.searchMode.selectedIndex = 0; //ユーザー選択番号を0(初期化)
                console.log("Input :: watch(txt) : 検索モードに入った", this.searchMode.enabled);

                //最新のチャンネルに参加している人リストを取得
                socket.emit("getInfoChannelJoinedUserList", {
                    targetid: this.getPath,
                    reqSender: {
                        userid: this.myUserinfo.userid,
                        sessionid: this.myUserinfo.sessionid
                    }
                });

            }

            //スペースが入力された、あるいは文字が空になったら検索モードを終了
            if ( this.txt[this.txt.length-1] === " " || this.txt[this.txt.length-1] === "　" || this.txt.length === 0 ) {
                this.searchMode.enabled = false;
                console.log("Input :: watch(txt) : 検索モードから抜けた", this.searchMode.enabled);

            }

            //検索モードに入っているなら検索する
            if ( this.searchMode.enabled ) {
                //検索文字列の範囲終わりを取得
                this.searchMode.searchEndingAt = this.txt.length - this.searchMode.txtLengthWhenStartSearching + this.searchMode.searchStartingAt;
                //もし開始文字位置と検索範囲終わり位置がかたよったら検索モードを無効化して関数を止める
                if ( this.searchMode.searchStartingAt+1 > this.searchMode.searchEndingAt ) {
                    this.searchMode.enabled = false;
                    return;

                }

                //検索文字列を取得
                this.searchMode.searchingQuery = this.txt.substring(this.searchMode.searchStartingAt+1, this.searchMode.searchEndingAt);

                console.log("Input :: watch(txt) : 検索する範囲 -> ", this.searchMode.searchStartingAt, this.searchMode.searchEndingAt);
                console.log("Input :: watch(txt) : 検索する文字列 -> ", this.searchMode.searchingQuery);

                //検索語で配列をフィルターして標示用の配列へ設定
                this.searchDisplayArray = this.channelJoinedUserArray.filter((u)=> {
                    //ユーザー名に検索語が含まれていたら表示する配列へ追加
                    if ( (u.username).includes(this.searchMode.searchingQuery) ) {
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
        //Enterキーのトリガー処理
        EnterTrigger(event) {
            //変換中のEnterなら処理させない
            if ( event.keyCode !== 13 ) return;

            //Shiftが同時に押されていたら改行するだけ
            if ( event.shiftKey ) {
                //現在の入力欄上のカーソル位置
                let currentTxtCursor = this.$el.querySelector("#inp").selectionStart;

                //テキストを現在のカーソル位置をもとに分裂させる
                let txtBefore = this.txt.slice(0,currentTxtCursor);
                let txtAfter = this.txt.slice(currentTxtCursor);

                //改行を挿入
                this.txt = txtBefore + "\n" + txtAfter;

                //カーソル位置を改行のすぐ次へ移動
                this.$nextTick(() => {
                    this.$el.querySelector("#inp").setSelectionRange(currentTxtCursor+1, currentTxtCursor+1);
                    
                });
                
                //ここでトリガー処理を停止
                return;

            }

            //もしメンションのゆーざー検索が有効ならメンション文を打ち込む、違うならメッセージ送信
            if ( this.searchMode.enabled ) {
                //メンション文打ち込み開始
                this.replaceQueryWithName(this.searchDisplayArray[this.searchMode.selectedIndex].userid);
                //検索モードを終了
                this.searchMode.enabled = false;

            //もし250文字以内ならメッセージ送信
            } else if ( this.txt.length <= 250 ) {
                //メッセージ送信開始
                this.msgSend(event);

            }

        },

        //テキスト入力中の@押された時のトリガー処理
        AtsignTrigger() {
            this.searchMode.enabled = true; //検索モードに入る
            this.searchMode.txtLengthWhenStartSearching = this.txt.length; //検索に入った時の文字の長さ取得
            this.searchMode.selectedIndex = 0; //選択を初期化
            this.searchMode.searchStartingAt = document.querySelector("#inp").selectionStart;

        },

        //メッセージを送信する
        msgSend( ) {
            //送信ｨﾝ!
            socket.emit("msgSend", {
                userid: this.myUserinfo.userid, //名前
                channelid: this.getPath, //チャンネルID
                sessionid: this.myUserinfo.sessionid, //セッションID);
                replyData: { //返信データ
                    isReplying: ReplyState.value.isReplying, //これは返信かどうか
                    messageid: (ReplyState.value.isReplying)?ReplyState.value.messageid:null, //返信先のメッセージID
                },
                fileData: { //ファイル添付データ
                    isAttatched: (this.fileInputData.length!==0)?true:false, //添付しているかどうか
                    attatchmentData: this.fileInputData //ファイルデータそのもの
                },
                content: this.txt, //メッセージの本文
                reqSender: {
                    userid: this.myUserinfo.userid,
                    sessionid: this.myUserinfo.sessionid
                }
            });
            
            this.txt = ""; //入力欄を空に
            this.fileInputData = []; //ファイルを空に

            this.resetReply(); //返信状態を初期化
            document.querySelector("#inp").focus(); //入力欄へフォーカス

        },

        //返信状態を初期化して閉じる
        resetReply() {
            ReplyState.value.isReplying = false;
            ReplyState.value.messageid = "0";

        },

        //アップロードしたいファイルを入力
        fileInputRef() {
            console.log("Input :: fileInputRef : ファイルを入力");
            console.log(this.$refs.fileInput);
            this.$refs.fileInput.click(); //ファイルアップロードボタンを仮想的にクリック
            
        },

        //ファイル入力の受け取り
        fileInput() {
            //inputに入力されたファイルの数ぶん処理する
            for ( let index in this.$refs.fileInput.files ) {
                //100MBよりもでかいならパス
                if (
                    this.$refs.fileInput.files[index].size >= 100000000 ||
                    this.$refs.fileInput.files[index].size < 1 ||
                    this.$refs.fileInput.files[index].size === undefined
                ) {
                    console.log("アップロードエラー");
                
                } else {
                    //ファイルデータ用配列へファイルデータを追加
                    this.fileInputData.push({
                        name: this.$refs.fileInput.files[index].name,
                        size: this.$refs.fileInput.files[index].size,
                        type: this.$refs.fileInput.files[index].type,
                        buffer: this.$refs.fileInput.files[index]
                    });

                }

            }

        },

        //メンション用のユーザー検索時にクリックされたらユーザーIDを自動入力する部分
        replaceQueryWithName(targetUserid) {
            console.log("Input :: replaceQueryWithName : 置き換えるユーザーid->", targetUserid, " 文字位置->", this.searchMode.searchStartingAt);

            //入力テキストの@部分をメンション文で代入
            if ( this.searchMode.searchingQuery === "" ) {
                this.txt = this.txt.substring(0, this.searchMode.searchStartingAt) + ("@/"+targetUserid+"/ ") + this.txt.substring(this.searchMode.searchStartingAt+1);

            } else {
                this.txt = this.txt.replace("@"+this.searchMode.searchingQuery, "@/"+targetUserid+"/ ");

            }

            //入力欄へフォーカスしなおす
            this.$el.querySelector("#inp").focus();

        },

        //メンション用のユーザー検索の十字キーでのユーザー選択変更部分
        changeMentionUserSelect(e) {
            //上下の十字キーの入力からのテキストのカーソル移動を防ぐ(メンション検索中限定)
            if ( this.searchMode.enabled ) {
                e.preventDefault();
                //フォーカスが外れるからフォーカスしなおすように
                this.$nextTick(() => {
                    this.$el.querySelector("#inp").focus();
                    
                });

            }

            //もしキー入力が下矢印で、かつ選択しているインデックス番号が(検索結果配列の長さ-1)未満なら
            if ( e.code === "ArrowDown" && this.searchDisplayArray.length-1 > this.searchMode.selectedIndex ) {
                this.searchMode.selectedIndex += 1; //インデックスを進める

            }

            //もしキー入力が上矢印で、かつ選択しているインデックス番号が0より上だったら
            if ( e.code === "ArrowUp" && this.searchMode.selectedIndex > 0 ) {
                this.searchMode.selectedIndex -= 1; //インデックスを戻す
                
            }

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

        },

        //ファイルサイズの値を読める形の単位に変換(https://stackoverflow.com/questions/10420352/converting-file-size-in-bytes-to-human-readable-string)
        humanFileSize(bytes, si=false, dp=1) {
            const thresh = si ? 1000 : 1024;
            
            //文字列ならeが含まれるか調べる
            if ( typeof(bytes) === "string" ) {
                //略式サイズなら数字に変換
                if ( bytes.includes("e") ) {
                    let NumOfZeros = bytes.slice(bytes.length-1); //使う0の数
                    let ZerosInString = ""; //0を入れる変数
                    for ( let i=0; i<NumOfZeros; i++ ) { ZerosInString+="0"; } //追加

                    //文字列を統合して数字にする
                    bytes = parseInt(bytes.split("e")[0] + ZerosInString);

                }

            }

            if ( Math.abs(bytes) < thresh ) {
                return bytes + ' B';
            }

            const units = si 
                ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'] 
                : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
            let u = -1;
            const r = 10**dp;

            do {
                bytes /= thresh;
                ++u;
            } while (Math.round(Math.abs(bytes) * r) / r >= thresh && u < units.length - 1);


            return bytes.toFixed(dp) + ' ' + units[u];
            
        },

        //チャンネルへ参加している人リストの受信
        SOCKETinfoChannelJoinedUserList(channelJoinedUserList) {
            this.channelJoinedUserArray = channelJoinedUserList;

        }

    },

    mounted() {
        //チャンネルへ参加している人リストの受信
        socket.on("infoChannelJoinedUserList", this.SOCKETinfoChannelJoinedUserList);

    },

    unmounted() {
        //socketの重複防止
        socket.off("infoChannelJoinedUserList", this.SOCKETinfoChannelJoinedUserList);
        //メニューページなどにいったら返信状態をリセット
        this.resetReply();

    }

}
</script>

<template>
    <div v-if="!channelInfo.previewmode">

        <!-- 返信する前にチャンネル移動しようとしたときの警告 -->
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

        <!-- ファイルアップロードデータの表示 -->
        <div class="d-flex align-center" style="margin:0 3%; margin-top:8px;">
            <v-card
                color="secondary"
                style="margin-right:8px;"
                class="pa-2 rounded-lg d-flex justify-space-between align-center"
                v-for="(file,index) in fileInputData"
            >
                <span class="text-truncate">{{ file.name }}</span>
                <v-chip style="margin:0 4px;" size="small"> {{ humanFileSize(file.size, true) }} </v-chip>
                <v-icon @click="fileInputData.splice(index,1)" style="margin-left:4px">
                    mdi:mdi-close-circle
                </v-icon>
            </v-card>
        </div>

        <!-- ファイル受け取り部分(非表示) -->
        <input
            @change="fileInput"
            type="file"
            ref="fileInput"
            style="display:none"
            multiple
        >

        <div style="width:90%; height:fit-content;" class="mx-auto d-flex align-center">

            <v-container fill-height fluid class="d-flex">

                <!-- 入力欄 -->
                <v-menu
                    label="list"
                    location="top"
                    :close-on-content-click="false"
                >
                    <template v-slot:activator="{ props }">
                        <!-- 入力部分 -->
                        <v-textarea
                            id="inp"
                            ref="inp"
                            :placeholder="channelInfo.channelname + 'へ送信'"
                            @keydown.enter.prevent="EnterTrigger"
                            @keydown.@="AtsignTrigger"
                            @keydown.up="changeMentionUserSelect"
                            @keydown.down="changeMentionUserSelect"
                            variant="solo"
                            max-rows="5"
                            clearable
                            no-resize
                            auto-grow
                            v-model="txt"
                            v-bind="props"
                            rows="1"
                        >

                            <!-- ファイルアップロード部分 -->
                            <template v-slot:prepend-inner>
                                <!-- ファイルアップロードボタン -->
                                <v-btn
                                    @click="fileInputRef"
                                    color="white"
                                    variant="text"
                                    size="x-small"
                                    icon="mdi:mdi-plus"
                                    class="rounded-lg"
                                >
                                    <v-icon>
                                        mdi:mdi-plus
                                    </v-icon>
                                    <v-tooltip
                                        activator="parent"
                                        location="top"
                                    >
                                        {{ humanFileSize(Serverinfo.config.MESSAGE.MESSAGE_FILE_MAXSIZE, true) }}まで
                                    </v-tooltip>
                                </v-btn>
                            </template>

                        </v-textarea>

                        
                    </template>

                    <!-- ユーザー検索候補の表示 -->
                    <v-list max-height="30vh" v-if="searchMode.enabled">
                        <v-list-item
                            v-for="(i,index) in searchDisplayArray"
                        >
                            <span @click="replaceQueryWithName(i.userid)" style="cursor:pointer;">
                                
                                <v-avatar size="3%">
                                    <v-img :src="uri + '/img/' + i.userid">
                                    </v-img>
                                </v-avatar>

                                <span
                                    style="margin-left:8px;"
                                >
                                    <span v-if="index===searchMode.selectedIndex">
                                        ⇒
                                    </span>
                                    {{ i.username }}
                                </span>

                            </span>
                        </v-list-item>
                    </v-list>
                </v-menu>
            
                <!-- 送信ボタン -->
                <v-btn @click="msgSend(null,'byBtn')" :disabled="txt.length>Serverinfo.config.MESSAGE.MESSAGE_TXT_MAXLENGTH" icon="" size="large" class="rounded-lg" style="margin:0 1vw;" elevation="0" color="primary">
                    <v-icon v-if="txt.length<=Serverinfo.config.MESSAGE.MESSAGE_TXT_MAXLENGTH" icon="mdi:mdi-send-outline"></v-icon>
                    <span v-if="txt.length>Serverinfo.config.MESSAGE.MESSAGE_TXT_MAXLENGTH">{{ Serverinfo.config.MESSAGE.MESSAGE_TXT_MAXLENGTH - txt.length }}</span>
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