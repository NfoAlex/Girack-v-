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
            modLogDisplay: [],
            
            //変更情報のタイトルインデックス
            actionameIndex: {
                messageDelete: "メッセージの削除",

                userBan: "ユーザーをBAN",
                userDelete: "ユーザーを削除",
                userPardon: "ユーザーのBANを解除",
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

        SOCKETinfoModlog(modLog) {
            console.log("Modlog :: SOCKETinfoModlog : dat->", modLog);
            this.modLogDisplay = modLog.data;

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
        <div style="width:90%; padding-top:3%; margin-bottom:16px;" class="text-left align-center">
            <p class="text-left" style="font-size:min(4vh,36px)">
                監査ログ
            </p>
        </div>

        <div style="overflow-y:auto; width:100%;">
            
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
                        <span class="text-truncate">
                            {{ getActionname(item.actionInfo.actionname) }}
                        </span>
                    </v-expansion-panel-title>

                    <!-- やったことの内容 -->
                    <v-expansion-panel-text class="pa-2">
                        <!-- 関係にあるユーザーデータを表示 -->
                        <div class="d-flex flex-clumn align-center">
                            <!-- やった人のアイコン -->
                            <v-avatar size="small" style="margin-right:8px;">
                                <v-img alt="icon" :src="backendURI+'/img/'+item.actionBy">
                                </v-img>
                                
                            </v-avatar>
                            <!-- やった人の名前 -->
                            <span style="margin-right:8px;">
                                {{ getUsername(item.actionBy) }}
                            </span>

                            <!-- 矢印 -->
                            <v-icon v-if="item.actionTo.type!=='channel'" style="margin-right:8px;">
                                mdi:mdi-arrow-right
                            </v-icon>

                            <!-- 受けた人のアイコン -->
                            <v-avatar v-if="item.actionTo.type!=='channel'" size="small" style="margin-right:8px;">
                                <v-img alt="icon" :src="backendURI+'/img/'+item.actionTo.userid">
                                </v-img>
                            </v-avatar>
                            <!-- 受けた人の名前 -->
                            <span v-if="item.actionTo.type!=='channel'">
                                {{ getUsername(item.actionTo.userid) }}
                            </span>
                        </div>

                        <!-- もし変更情報に出力できる名前が無かったらそのままactionnameを出力 -->
                        <p
                            v-if="actionameIndex[item.actionInfo.actionname]===undefined"
                        >
                            変更内容 : <code>{{ item.actionInfo.actionname }}</code>
                        </p>

                        <!-- 変更後のデータが空なら削除されたと表示 -->
                        <p v-if="item.actionInfo.valueBefore!==''&&item.actionInfo.valueAfter==''">
                            削除された
                        </p>

                        <p
                            v-of="item.actionTo.channelid===''"
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
                            class="pa-2"
                        >
                            <p>
                                <code>{{ item.actionInfo.valueBefore }}</code>
                            </p>
                            <v-icon>
                                mdi:mdi-arrow-down
                            </v-icon>
                            <p>
                                <code>{{ item.actionInfo.valueAfter }}</code>
                            </p>
                        </span>
                    </v-expansion-panel-text>

                </v-expansion-panel>

            </v-expansion-panels>
        </div>
    </div>
</template>