<script>
import { backendURI, getSocket } from '../../data/socket';
import { dataUser } from '../../data/dataUserinfo';
const socket = getSocket();

export default {
    setup() {
        const { myUserinfo, UserIndex } = dataUser();
        return { myUserinfo, backendURI, UserIndex };
    
    },

    data() {
        return {
            modLogDisplay: [], //監査ログデータの格納用
            thereIsMoreData: true, //サーバー上にまだ読み込んでいない監査ログがあるかどうか
            
            //変更情報のタイトルインデックス
            actionameIndex: {
                messageDelete: "メッセージの削除",

                userBan: "ユーザーをBAN",
                userDelete: "ユーザーを削除",
                userPardon: "ユーザーのBANを解除",
                userChangeRole: "ユーザーの権限を変更",
                userKickFromChannel: "ユーザーをチャンネルからキック",

                channelEditName: "チャンネル名を変更",
                channelEditDesc: "チャンネル概要を変更",
                channelChangeScope: "チャンネルのプライベート状態を変更",
                channelCreate: "チャンネルを作成",
                channelDelete: "チャンネルを削除",

                serverEditName: "サーバー名を変更",
                serverEditConfig: "サーバー設定を更新"
            }
        }
    },

    methods: {
        //起こされた変更の表示名出力
        getActionname(actioname) {
            try {
                //変更情報の名前インデックスを参照してその名前を返す
                if ( this.actionameIndex[actioname] !== undefined ) {
                    return this.actionameIndex[actioname];

                } else { //インデックスに無ければfallback
                    return "変更情報";

                }
            } catch(e) {
                return "変更情報";
            }

        },

        //ユーザー名の取得
        getUsername(userid) {
            try {
                return this.UserIndex[userid].username;
            } catch(e) { //ユーザーが無い
                //ユーザー情報の取得
                socket.emit("getInfoUser", {
                    targetid: userid,
                    reqSender: {
                        userid: this.myUserinfo.userid,
                        sessionid: this.myUserinfo.sessionid
                    },
                });
                //今のところはIDだけ返す
                return userid;
            }
        },

        //監査ログの再取得
        refreshModlog() {
            //監査ログの配列初期化
            this.modLogDisplay = [];
            //0から取得
            socket.emit("getModlog", {
                startLength: 0,
                reqSender: {
                    userid: this.myUserinfo.userid,
                    sessionid: this.myUserinfo.sessionid
                }
            });

        },

        //更に監査ログを遡る
        getMoreModlog() {
            //取得
            socket.emit("getModlog", {
                startLength: this.modLogDisplay.length+1,
                reqSender: {
                    userid: this.myUserinfo.userid,
                    sessionid: this.myUserinfo.sessionid
                }
            });
        },

        //監査ログの受け取り部分
        SOCKETinfoModlog(modLog) {
            console.log("Modlog :: SOCKETinfoModlog : dat->", modLog);
            //監査ログデータを格納
            this.modLogDisplay = this.modLogDisplay.concat(modLog.data);
            //もしサーバー上の全データを読み込んだのなら"さらに読み込むボタンを非表示"
            if ( modLog.endOfData ) this.thereIsMoreData = false;

        }
    },

    mounted() {
        socket.on("infoModlog", this.SOCKETinfoModlog);

        socket.emit("getModlog", {
            startLength: 0,
            reqSender: {
                userid: this.myUserinfo.userid,
                sessionid: this.myUserinfo.sessionid
            }
        });

    },

    unmounted() {
        //socket重複防止
        socket.off("infoModlog", this.SOCKETinfoModlog);

    }

}
</script>

<template>
    <div style="height:100vh; width:90%;" class="d-flex align-center flex-column">
        <!-- ページタイトル -->
        <div style="width:90%; padding-top:3%; margin-bottom:16px;" class="d-flex align-center">
            <p class="text-left me-auto" style="font-size:min(4vh,36px)">
                監査ログ
            </p>
            <!-- 再取得ボタン -->
            <v-btn
                @click="refreshModlog"
                icon="mdi:mdi-refresh"
                size="large"
                class="rounded-lg ma-3"
                color="primary"
            >
            </v-btn>
        </div>

        <div class="d-flex flex-column align-center" style="overflow-y:auto; width:100%; padding-bottom:24px;">
            
            <v-expansion-panels style="width:90%">
                
                <v-expansion-panel
                    v-for="(item,index) in modLogDisplay"
                    :key="item.actionId"
                    class="rounded-lg"
                >

                    <!-- カードタイトル -->
                    <v-expansion-panel-title>
                        <!-- やった人のアイコン -->
                        <v-avatar size="small" style="margin-right:8px;">
                            <v-img alt="icon" :src="backendURI+'/img/'+item.actionBy">
                            </v-img>
                        </v-avatar>

                        <!-- 矢印 -->
                        <v-icon v-if="item.actionTo.userid!==''" style="margin-right:8px;">
                            mdi:mdi-arrow-right
                        </v-icon>

                        <!-- 受けた人のアイコン -->
                        <v-avatar v-if="item.actionTo.userid!==''" size="small" style="margin-right:16px;">
                            <v-img alt="icon" :src="backendURI+'/img/'+item.actionTo.userid">
                            </v-img>
                        </v-avatar>

                        <!-- 変更情報の説明（タイトル） -->
                        <span class="text-truncate flex-grow-1">
                            {{ getActionname(item.actionInfo.actionname) }}
                        </span>

                        <!-- 時間表示 -->
                        <span class="text-disabled" style="margin-right:5%;">
                            {{ item.actionId.slice(0,4) }}-{{ item.actionId.slice(4,6) }}-{{ item.actionId.slice(6,8) }} {{ item.actionId.slice(8,10) }}:{{ item.actionId.slice(10,12) }}:{{ item.actionId.slice(12,14) }}
                        </span>
                    </v-expansion-panel-title>

                    <!-- やったことの内容 -->
                    <v-expansion-panel-text>

                        <!-- 関係にあるユーザーデータを表示 -->
                        <p class="ma-1">ユーザー情報</p>
                        <v-card color="grey" style="width:fit-content" class="rounded-lg pa-5 d-flex flex-clumn align-center">
                            <!-- やった人のアイコン -->
                            <v-avatar size="x-small" style="margin-right:8px;">
                                <v-img alt="icon" :src="backendURI+'/img/'+item.actionBy">
                                </v-img>
                                
                            </v-avatar>
                            <!-- やった人の名前 -->
                            <span style="margin-right:8px;">
                                {{ getUsername(item.actionBy) }}
                            </span>

                            <!-- 影響を受けているのがユーザーならそのユーザーも表示 -->
                            <span v-if="item.actionTo.type!=='channel'&&item.actionTo.type!=='server'">
                                <!-- 矢印 -->
                                <v-icon
                                    style="margin-right:8px;"
                                >
                                    mdi:mdi-arrow-right
                                </v-icon>

                                <!-- 受けた人のアイコン -->
                                <v-avatar
                                    size="x-small"
                                    style="margin-right:8px;"
                                >
                                    <v-img alt="icon" :src="backendURI+'/img/'+item.actionTo.userid">
                                    </v-img>
                                </v-avatar>
                                <!-- 受けた人の名前 -->
                                <span>
                                    {{ getUsername(item.actionTo.userid) }}
                                </span>
                            </span>
                        </v-card>

                        <br>

                        <p class="ma-1">
                            変更内容
                        </p>
                        <v-card
                            color="cardInner"
                            class="pa-3 rounded-lg"
                        >
                            <!-- もし変更情報に出力できる名前が無かったらそのままactionnameを出力 -->
                            <p
                                v-if="actionameIndex[item.actionInfo.actionname]===undefined"
                                class="pa-1"
                            >
                                変更内容 : <code>{{ item.actionInfo.actionname }}</code>
                            </p>

                            <!-- 変更後のデータが空なら削除されたと表示 -->
                            <p v-if="item.actionInfo.valueBefore!==''&&item.actionInfo.valueAfter==''" class="pa-2">
                                削除された
                            </p>

                            <!-- チャンネルが変更に関係があるなら表示 -->
                            <p
                                v-if="item.actionTo.channelid!==''"
                                class="pa-2"
                            >
                                チャンネルID : <code>{{ item.actionTo.channelid }}</code>
                            </p>

                            <!-- 変更されたものがメッセージならIDを表示 -->
                            <span
                                v-if="item.actionTo.type==='message'"
                                class="pa-2"
                            >
                                メッセージID : <code>{{ item.actionTo.messageid }}</code>
                            </span>

                            <!-- 無から作られた時の値表示 -->
                            <span
                                v-if="item.actionInfo.valueBefore===''&&item.actionInfo.valueAfter!==''"
                                class="pa-2"
                            >
                                +  <code>{{ item.actionInfo.valueAfter }}</code>
                            </span>

                            <!-- 変更前と変更後の値表示 -->
                            <span
                                v-if="item.actionInfo.valueBefore!==''&&item.actionInfo.valueAfter!==''"
                            >
                                <p>
                                    <code style="color:green;">{{ item.actionInfo.valueBefore }}</code>
                                </p>
                                <v-icon>
                                    mdi:mdi-arrow-down
                                </v-icon>
                                <p>
                                    <code style="color:green;">{{ item.actionInfo.valueAfter }}</code>
                                </p>
                            </span>
                        </v-card>

                    </v-expansion-panel-text>

                </v-expansion-panel>

                

            </v-expansion-panels>

            <v-btn
                @click="getMoreModlog()"
                v-if="thereIsMoreData"
                color="primary"
                class="rounded-pill ma-3"
            >
                監査ログを更に読み込む
            </v-btn>

        </div>
    </div>
</template>