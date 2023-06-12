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

        //ファイルサイズの値を読める形の単位に変換(https://stackoverflow.com/questions/10420352/converting-file-size-in-bytes-to-human-readable-string)
        humanFileSize(bytes, si=false, dp=1) {
            const thresh = si ? 1000 : 1024;

            //略式サイズなら数字に変換
            if ( bytes.includes("e") ) {
                let NumOfZeros = bytes.slice(bytes.length-1); //使う0の数
                let ZerosInString = ""; //0を入れる変数
                for ( let i=0; i<NumOfZeros; i++ ) { ZerosInString+="0"; } //追加

                //文字列を統合して数字にする
                bytes = parseInt(bytes.split("e")[0] + ZerosInString);

            }

            if (Math.abs(bytes) < thresh) {
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
        <div style="width:90%; height:97.5vh;" class="d-flex flex-column">
            <!-- ページタイトル -->
            <div style="width:90%; padding-top:3%; margin-bottom:16px;" class="d-flex align-center">
                <p class="text-left me-auto" style="font-size:min(4vh,36px)">
                    サーバー設定
                </p>
            </div>

            <v-card class="card mx-auto rounded-lg d-flex align-center">
                <p class="text-h5 text-center ma-1">
                    サーバー名 : {{ displaySettings.servername }}
                </p>
            </v-card>

            <br>
            <!-- 設定を適用・キャンセルボタン -->
            <div class="mx-auto ma-2" style="width:fit-content">
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
                
                <!-- 登録設定 -->
                <p class="text-h6 ma-2">登録</p>
                <v-card color="cardInner" class="rounded-lg cardInner pa-2">
                    <v-switch v-model="displaySettings.registration.available" color="primary" label="登録を受け付ける"></v-switch>
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

                <!-- メッセージ設定 -->
                <p class="text-h6 ma-2">メッセージ</p>
                <v-card color="cardInner" class="rounded-lg cardInner pa-2">
                    <p class="ma-2">メッセージの最大文字数</p>
                    <v-text-field
                        variant="outlined"
                        class="mx-auto"
                        style="width:90%"
                        v-model="displaySettings.config.MESSAGE.MESSAGE_TXT_MAXLENGTH"
                    >
                    </v-text-field>

                    <p class="ma-2">添付ファイルの最高サイズ (1e3=1kB)</p>
                    <v-text-field
                        variant="outlined"
                        class="mx-auto"
                        style="width:90%"
                        :hint="humanFileSize(displaySettings.config.MESSAGE.MESSAGE_FILE_MAXSIZE,true)"
                        persistent-hint="true"
                        v-model="displaySettings.config.MESSAGE.MESSAGE_FILE_MAXSIZE"
                    >
                    </v-text-field>
                </v-card>

                <br>

                <!-- チャンネル関連 -->
                <p class="text-h6 ma-2">チャンネル関連</p>
                <v-card color="cardInner" class="rounded-lg cardInner pa-2">
                    <v-switch
                        v-model="displaySettings.config.CHANNEL.CHANNEL_CREATE_AVAILABLE"
                        label="チャンネル作成を可能にする(Adminはいつでも可能)"
                    >
                    </v-switch>
                    <v-switch
                        v-model="displaySettings.config.CHANNEL.CHANNEL_DELETE_AVAILABLEFORMEMBER"
                        label="Memberロールのユーザーでもチャンネル削除をできるようにする"
                    >
                    </v-switch>
                </v-card>

                <!-- プロフィール -->
                <p class="text-h6 ma-2">チャンネル関連</p>
                <v-card color="cardInner" class="rounded-lg cardInner pa-2">
                    <p class="ma-2">プロフィールアイコンの最大サイズ</p>
                    <v-text-field
                        v-model="displaySettings.config.PROFILE.PROFILE_ICON_MAXSIZE"
                        class="mx-auto"
                        style="width:90%"
                        :hint="humanFileSize(displaySettings.config.PROFILE.PROFILE_ICON_MAXSIZE,true)"
                        persistent-hint="true"
                    >
                    </v-text-field>

                    <p class="ma-2">ユーザー名の最大文字数</p>
                    <v-text-field
                        v-model="displaySettings.config.PROFILE.PROFILE_USERNAME_MAXLENGTH"
                        class="mx-auto"
                        style="width:90%"
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
    margin-top: 8px;

    padding: 16px;
    width: 95%;
}

.cardInner
{
    margin-top: 16px;
    padding: 4px;
}

</style>