<script>
import { getSocket, Serverinfo } from '../../data/socket';
import { dataUser } from '../../data/dataUserinfo';
const socket = getSocket();
const { myUserinfo } = dataUser();

export default {

    data() {
        return {
            currentSettings: {
                servername: "...",
                registerAvailable: false,
                inviteOnly: false,
                config: {}
            },

            displayServername: "...",
            displaySettings: {
                registerAvailable: false,
                inviteOnly: false,
                inviteCode: "",
                config: Serverinfo.value.config
            },

            changed: false
        }
    },

    watch: {
        //設定の変更を検知
        displaySettings: {
            handler() {
                //検知して元と同じなら"変更無し"と登録、違うならアリと登録
                if (
                    this.displaySettings.registerAvailable === this.currentSettings.registration.available &&
                    this.displaySettings.inviteOnly === this.currentSettings.registration.invite.inviteOnly &&
                    this.displaySettings.inviteCode === this.currentSettings.registration.invite.inviteCode &&
                    this.displaySettings.config === this.currentSettings.config
                ) {
                    this.changed = false;

                } else {
                    this.changed = true;

                }

            },
            deep: true
        },
        
    },

    methods: {
        //設定の値を初期設定に戻す
        restoreDefault() {
            this.displayServername = this.currentSettings.servername;
            this.displaySettings.registerAvailable = this.currentSettings.registration.available;
            this.displaySettings.inviteOnly = this.currentSettings.registration.invite.inviteOnly;
            this.displaySettings.inviteCode = this.currentSettings.registration.invite.inviteCode;

            this.changed = false; //変更状況をリセット

        },

        //サーバーの設定を更新させる
        updateServerSettings() {
            console.log("ServerSettings :: updateServerSettings : 設定を更新するぜ");

            //新しく設定を更新させる
            socket.emit("changeServerSettings", {
                registration: {
                    available: this.displaySettings.registerAvailable,
                    invite: {
                        inviteOnly: this.displaySettings.inviteOnly,
                        inviteCode: this.displaySettings.inviteCode
                    }
                },
                reqSender: {
                    userid: myUserinfo.value.userid,
                    sessionid: myUserinfo.value.sessionid
                }
            });
        },

        SOCKETinfoServer(dat) {
            console.log("ServerSettings :: 設定北");
            console.log(dat);

            //現在の設定を保存
            this.currentSettings = dat;

            //表示する設定を取り出す
            this.displaySettings.registerAvailable = dat.registration.available;
            this.displaySettings.inviteOnly = dat.registration.invite.inviteOnly;
            this.displaySettings.inviteCode = dat.registration.invite.inviteCode;

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
        socket.emit("getServerSettings");

        console.log("ServerSettings :: mounted : displaySettings->", this.displaySettings);

    },

    unmounted() {
        //通信重複防止
        socket.off("infoServerSettings", this.SOCKETinfoServer);
        
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
                    サーバー名 : {{ currentSettings.servername }}
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
                    <v-checkbox v-model="displaySettings.registerAvailable" color="primary" label="登録を受け付ける"></v-checkbox>
                    <v-checkbox
                        :disabled="!displaySettings.registerAvailable"
                        v-model="displaySettings.inviteOnly"
                        label="招待制"
                    >
                    </v-checkbox>
                    <v-text-field
                        :disabled="!displaySettings.inviteOnly||!displaySettings.registerAvailable"
                        variant="outlined"
                        label="招待コード"
                        class="mx-auto"
                        style="width:90%"
                        v-model="displaySettings.inviteCode"
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