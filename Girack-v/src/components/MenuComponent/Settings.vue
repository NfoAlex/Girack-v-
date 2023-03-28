<script>
import { getCONFIG } from "../../config.js";

export default {

    setup() {
        const { CONFIG_NOTIFICATION } = getCONFIG();
        return { CONFIG_NOTIFICATION };
        
    },

    data() {
        return {
            txt: "---",
            gameStarted: false,
            gameEnd: false,
            targetNum: 0,
            guessNum: 0,
            input: "",
            record: 0,

            //復元用
            CurrentConfig: {},

            dataConsent: true
        }
    },

    methods: {
        start() {
            this.gameEnd = false;
            this.targetNum = parseInt(Math.random()*100);
            this.gameStarted = true;
            this.input = "";
            this.guessNum = 0;
            this.txt = "";
            this.record = 0;

        },

        guess() {
            this.record++;
            this.guessNum = parseInt(this.input);

            if ( this.guessNum === this.targetNum ) {
                this.txt = "正解!"
                this.gameStarted = false;
                this.gameEnd = true;
                return;

            }

            if ( this.guessNum > this.targetNum ) {
                this.txt = "Lower..."

            }

            if ( this.guessNum < this.targetNum ) {
                this.txt = "Higher!"

            }

        },

        //設定を適用
        // saveSettings(configTerm) { //configTerm => 設定を更新するやつ
        //     switch(configTerm) {
        //         case "Notification":
        //             break;

        //         default:
        //             break;

        //     }

        // },

        //ブラウザの通知設定を確認
        checkNotificationPermission() {
            //もし通知が許可されていたらtrueを返す
            if ( Notification.permission === "granted" ) {
                return true;

            } else {
                return false;

            }

        },

        //通知テスト
        doNotificationDemo() {
            new Notification("通知だな", {
                body: "これは通知テストです。",
                icon: "http://" + location.host + "/icon_crop.png"
            });

        }
    }
}

</script>

<template>
    <div>
        <div style="height:100vh; width:90%;" class="d-flex align-center flex-column">
            <div style="height:10vh; width:90%; padding-top:3%" class="text-left align-center">
                <p class="text-h4 text-left">
                    設定
                </p>
            </div>

            <div style="height:80vh; overflow-y:auto">
                <div class="mx-auto" style="width:100%; margin: 5% 0;">
                    <v-card class="mx-auto rounded-lg card">
                        <p class="text-h6 ma-2">通知</p>

                        <p>許可状況</p>
                        <v-card class="cardInner pa-3 rounded-lg">
                            <p v-if="checkNotificationPermission()">
                                <v-icon color="success">mdi:mdi-check-bold</v-icon>
                                通知いけるな
                            </p>
                            <p v-else>
                                <v-icon color="yellow">mdi:mdi-help</v-icon>
                                現在の設定だと通知が利用できません。
                                ブラウザ設定からこのインスタンスURLによる通知を許可してください。
                            </p>
                            <v-btn class="ma-2" size="small" color="grey" @click="doNotificationDemo">
                                通知テスト
                            </v-btn>
                        </v-card>

                        <br>

                        <p>通知する内容</p>
                        <v-card class="cardInner pa-3 rounded-lg">
                            <v-checkbox
                                v-model="CONFIG_NOTIFICATION.ENABLE"
                                label="通知を有効化"
                                density="compact"
                            >
                            </v-checkbox>
                            <v-checkbox
                                :disabled="!CONFIG_NOTIFICATION.ENABLE"
                                v-model="CONFIG_NOTIFICATION.NOTIFY_ALL"
                                label="すべてのメッセージを通知する"
                                density="compact"
                            >
                            </v-checkbox>
                            <v-checkbox
                                :disabled="!CONFIG_NOTIFICATION.ENABLE"
                                v-model="CONFIG_NOTIFICATION.NOTIFY_MENTION"
                                label="メンションで通知する"
                                density="compact"
                                messages="@<あなたの名前>で通知"
                            >
                            </v-checkbox>
                        </v-card>

                        <br>

                        <p>JSON</p>
                        <v-card class="cardInner pa-3 rounded-lg">
                            {{ CONFIG_NOTIFICATION }}
                        </v-card>

                    </v-card>

                    <br>

                    <v-card class="mx-auto rounded-lg card">
                        <p class="text-h6 ma-2">表示</p>
                        ここからToDo
                        <p>チャンネル</p>
                        <v-card class="cardInner pa-3 rounded-lg">
                            <v-checkbox
                                label="ユーザー名の横にロールを表示"
                                density="compact"
                            >
                            </v-checkbox>
                        </v-card>

                        <br>

                        <p>JSON</p>
                        <v-card class="cardInner pa-3 rounded-lg">
                            ToDo
                        </v-card>

                    </v-card>

                    <br>

                    <v-card class="mx-auto rounded-lg card">
                        <p class="text-h6 ma-2">プライバシー</p>
                        <p>データ</p>
                        <v-card class="cardInner pa-3 rounded-lg">
                            <v-checkbox
                                v-model="dataConsent"
                                readonly
                                label="ブラウザ上のすべての動きのトラッキングを許可する"
                                density="compact"
                            >
                            </v-checkbox>
                        </v-card>

                    </v-card>
                    
                    <br>

                    <v-card class="mx-auto text-center pa-5 rounded-lg" style="width:50%">
                        <p class="text-h5">{{ txt }}</p>
                        <p v-if="gameStarted" class="text-h3">{{ guessNum }}</p>
                        <v-btn @click="start" v-if="!gameStarted" color="primary">
                            ゲーム開始
                        </v-btn>
                        <br>
                        <v-text-field
                            v-if="gameStarted"
                            v-model="input"
                            class="mx-auto"
                            label="予想!"
                            style="width:50%"
                            variant="solo"
                        ></v-text-field>
                        <v-btn @click="guess" class="ma-2" color="green" v-if="gameStarted">
                            GUESS...
                        </v-btn>
                        <v-btn @click="start" class="ma-2" color="blue" v-if="gameEnd">
                            もう１回やる
                        </v-btn>

                        <p>{{ record }}回目のトライ</p>
                    </v-card>
                </div>
            </div>

            <!-- のちに使う -->
            <div v-if="false" class="rounded-lg mx-auto" style="width:90%; height:10vh;">
                <v-card class="pa-3 d-flex justify-center">
                    <v-btn style="width:35%" class="rounded-lg ma-2" color="success">適用</v-btn>
                    <v-btn style="width:35%" class="rounded-lg ma-2" color="grey">復元</v-btn>
                </v-card>
            </div>
        </div>
    </div>
    

</template>

<style scoped>

.cardInner
{
    background-color: #222;
    margin: 8px 0;
}

.card
{
    width:95%;
    margin-top: 16px;

    padding: 16px;
}

</style>