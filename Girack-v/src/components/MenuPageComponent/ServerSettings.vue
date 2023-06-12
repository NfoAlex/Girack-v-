<script>
import { getSocket } from '../../data/socket';
import { dataUser } from '../../data/dataUserinfo';
const socket = getSocket();
const { myUserinfo } = dataUser();

export default {

    data() {
        return {
            configReady: false,
            currentSettings: null,

            displayServername: "...",
            displaySettings: null,

            changed: false
        }
    },

    watch: {
        //設定の変更を検知
        displaySettings: {
            handler() {
                //検知して元と同じなら"変更無し"と登録、違うならアリと登録
                if ( JSON.stringify(this.displaySettings) === JSON.stringify(this.currentSettings) ) {
                    this.changed = false;

                } else {
                    this.changed = true;
                    console.log("違うね", this.displaySettings, this.currentSettings);

                }

            },
            deep: true
        }
        
    },

    methods: {
        //設定の値を初期設定に戻す
        restoreDefault() {
            //サーバーの設定情報を取得
            socket.emit("getInfoServer");

        },

        //サーバーの設定を更新させる
        updateServerSettings() {
            console.log("ServerSettings :: updateServerSettings : 設定を更新するぜ");

            //新しく設定を更新させる
            socket.emit("changeServerSettings", {
                servername: this.displaySettings.servername,
                registration: {
                    available: this.displaySettings.registration.available,
                    invite: {
                        inviteOnly: this.displaySettings.registration.invite.inviteOnly,
                        inviteCode: this.displaySettings.registration.invite.inviteCode
                    }
                },
                config: this.displaySettings.config,
                reqSender: {
                    userid: myUserinfo.value.userid,
                    sessionid: myUserinfo.value.sessionid
                }
            });
        },

        SOCKETinfoServer(dat) {
            console.log("ServerSettings :: SOCKETinfoServer : 設定北");
            console.log(dat);

            //現在の設定を保存
            this.currentSettings = structuredClone(dat);

            //表示する設定を取り出す
            this.displaySettings = structuredClone(dat);

            //設定の変更があったフラグを初期化
            this.changed = false;

            //ロードできたと設定
            this.configReady = true;

            console.log("ServerSettings :: mounted : maxLengthCompare->", this.displaySettings);

        }
    },

    mounted() {
        this.changed = false;

        //サーバーの設定情報受け取り
        socket.on("infoServer",this.SOCKETinfoServer);

        //サーバーの設定情報を取得
        socket.emit("getInfoServer");

    },

    unmounted() {
        //通信重複防止
        socket.off("infoServer", this.SOCKETinfoServer);
        
    }

}

</script>

<template>
    <div v-if="configReady">
        <div style="width:90%; height:100vh;" class="d-flex flex-column">
            <!-- ページタイトル -->
            <div style="width:90%; padding-top:3%; margin-bottom:16px;" class="d-flex align-center">
                <p class="text-left me-auto" style="font-size:min(4vh,36px)">
                    サーバー設定
                </p>
            </div>

            <v-card class="card mx-auto rounded-lg">
                <p class="text-h5">
                    サーバー名 : {{ displaySettings.servername }}
                </p>
            </v-card>

            <br>
            <!-- 設定を適用・キャンセルボタン -->
            <div class="mx-auto" style="width:fit-content">
                <v-btn
                    :disabled="!changed"
                    @click="updateServerSettings"
                    class="rounded-lg ma-1"
                    color="success"
                >
                    設定を保存
                </v-btn>
                <v-btn
                    :disabled="!changed"
                    @click="restoreDefault"
                    class="rounded-lg ma-1"
                    color="grey"
                >
                    元に戻す
                </v-btn>
            </div>
            
            <!-- 設定メイン -->
            <v-card class="card mx-auto rounded-lg" style="overflow-y:auto;">
                
                <p class="text-h6 ma-2">登録</p>
                <v-card color="cardInner" class="rounded-lg cardInner">
                    <v-checkbox v-model="displaySettings.registration.available" color="primary" label="登録を受け付ける"></v-checkbox>
                    <v-checkbox
                        :disabled="!displaySettings.registration.available"
                        v-model="displaySettings.registration.invite.inviteOnly"
                        label="招待制"
                    >
                    </v-checkbox>
                    <v-text-field
                        :disabled="!displaySettings.registration.invite.inviteOnly||!displaySettings.registration.available"
                        variant="outlined"
                        label="招待コード"
                        class="mx-auto"
                        style="width:90%"
                        v-model="displaySettings.registration.invite.inviteCode"
                    >
                    </v-text-field>
                </v-card>

                <br>

                <p class="text-h6 ma-2">メッセージ</p>
                <v-card color="cardInner" class="rounded-lg cardInner">
                    <p class="ma-2">メッセージの最大文字数</p>
                    <v-text-field
                        variant="outlined"
                        class="mx-auto"
                        style="width:90%"
                        v-model="displaySettings.config.MESSAGE.MESSAGE_TXT_MAXLENGTH"
                    >
                    </v-text-field>
                </v-card>

            </v-card>

        </div>
    </div>
</template>

<style scoped>

.card
{
    margin-top: 16px;

    padding: 16px;
    width: 95%;
}

.cardInner
{
    margin-top: 16px;
    padding: 4px;
}

</style>