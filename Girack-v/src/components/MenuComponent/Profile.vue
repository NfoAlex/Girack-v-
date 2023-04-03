<script setup>
import { setCookie, getSocket, dataUser, backendURI } from '../../socket.js';
</script>

<script>
const socket = getSocket();
const { Userinfo } = dataUser();

export default {
    
    data() {
        return {
            snackbar: false, //ログアウトアラート出力用
            cd: ["card-default","rounded-lg"], //CSS用クラス名
            okayIcon: '',

            nameDisplaying: "...",
            nameEditing: false, //名前編集しているかどうか

            iconUploadDialog: false, //アイコンアップロード用ダイアログの表示
            iconUploadRule: [ //アイコンをアップロードするためのルール
                value => {
                    return !value || !value.length || value[0].size < 1024000 || '画像は1MB以下にしてください!'
                }
            ],
            iconUploadFile: null, //アイコン用画像のデータ
            iconUploadDone: false, //アイコンがアップロードされた状態
        }
    },

    watch: {
        //ユーザー情報の監視
        Userinfo: {
            //変更を検知したら表示名を変更
            handler(U) {
                this.nameDisplaying = U.username; //表示名を更新
            },
            deep: true //階層ごと監視するため
        }
    },
    
    methods: {
        //ログアウト処理
        logout() {
            setCookie("sessionid", "", 0); //クッキー削除
            location.reload(); //ページリロード
        },

        //名前更新
        updateName() {
            let nameUpdating = this.nameDisplaying; //更新する名前
            //名前更新
            socket.emit("changeProfile", {
                name: nameUpdating, //更新する名前
                reqSender: { //セッション認証に必要な情報送信
                    userid: Userinfo.value.userid,
                    sessionid: Userinfo.value.sessionid
                }
            });
            this.nameEditing = false; //編集モードを閉じる
            console.log("名前更新します -> " + this.nameDisplaying);
        },

        //編集しているかどうかを切り替えする
        toggleEditing() {
            this.nameDisplaying = Userinfo.value.username;
            this.nameEditing = !this.nameEditing; //編集モード
        },

        //アイコンの画像アップロード
        uploadIcon() {
            console.log("Profile :: uploadIcon : iconData ->", this.iconUploadFile);
            //return;

            //アイコンデータを送信
            socket.emit("changeProfileIcon", {
                fileData: {
                    name: this.iconUploadFile[0].name,
                    size: this.iconUploadFile[0].size,
                    type: this.iconUploadFile[0].type,
                    buffer: this.iconUploadFile[0],
                },
                reqSender: {
                    userid: Userinfo.value.userid,
                    sessionid: Userinfo.value.sessionid
                }
            },
            (status) => {
                console.log("Profile :: uploadIcon : 結果->", status);
                console.log(this.iconUploadFile[0]);

            });

            //アイコンをアップロードできた状態にする
            this.iconUploadDone = true;

        },

        //ページをリロードするだけ
        reloadPage() {
            window.location.reload();

        }

    },
    
    mounted() {
        this.nameDisplaying = Userinfo.value.username; //名前更新

    },
}
</script>

<template>

    <!-- 画像アップロード用ダイアログ -->
    <v-dialog
        v-model="iconUploadDialog"
        width="50vh"
    >
        <v-card v-if="!iconUploadDone" class="rounded-lg pa-6">

            <v-card-title>
                アイコンアップロード
            </v-card-title>

            <v-alert
                title="注意"
                type="info"
                class="ma-1 rounded-lg"
            >
                <p class="text-subtitle-2">
                    現在アイコンのクロップ機能が実装できていないため縦横比率が違う画像の場合
                    表示がおかしくります。だから予め自分でクロップしてね
                </p>
            </v-alert>

            <div style="margin-top:32px;">
                <v-file-input
                    accept="image/jpeg, image/gif"
                    :rules="iconUploadRule"
                    v-model="iconUploadFile"
                    class="ma-3"
                    label="アイコン用画像(1MB以下)"
                    show-size
                ></v-file-input>
            </div>

            <v-btn @click="uploadIcon" class="rounded-lg" color="primary">
                更新
            </v-btn>

        </v-card>

        <v-card v-if="iconUploadDone" class="rounded-lg">

            <v-card-title>
                アイコンアップロード
            </v-card-title>

            <div style="margin-top:32px;">
                <p class="text-h4 text-center">🖼️</p>
                <p class="text-center ma-4">
                    アイコンを更新しました!<br>
                    更新を確認するにはリロードしてみてね
                </p>
                <div class="mx-auto pa-1" style="width:fit-content">
                    <v-btn class="ma-2 rounded-lg" @click="reloadPage" color="secondary">
                        <v-icon>
                            mdi:mdi-reload
                        </v-icon>
                        リロード
                    </v-btn>
                    <v-btn class="ma-2 rounded-lg" @click="iconUploadDialog=false;" color="grey">
                        <v-icon>
                            mdi:mdi-close-box
                        </v-icon>
                        閉じる
                    </v-btn>
                </div>
            </div>

        </v-card>
    </v-dialog>

    <div style="width:80%; margin-top:5%; height:90%;">
            <v-container class="bg-surface-variant">
                <v-row no-gutters>

                    <v-col cols="2">
                        <!-- アバター -->
                        <v-card variant="tonal" :class="cd" style="padding:0">
                            <v-img @click="iconUploadDialog=true;" class="rounded-lg" :alt="Userinfo.userid" :src="backendURI + '/img/' + Userinfo.userid"></v-img>
                        </v-card>
                    </v-col>

                    <v-col>
                        <!-- ユーザー名の部分 -->
                        <div variant="tonal" :class="cd" style="padding:1% 10% ">
                            <!-- ユーザーID -->
                            <p class="text-left text-h6">
                                # {{ Userinfo.userid }}
                            </p>
                            <!-- ユーザー名 -->
                            <p v-if="!nameEditing" @dblclick="toggleEditing" class="text-h4 text-left" >
                                {{ Userinfo.username }}
                                <v-btn color="primary" icon="mdi:mdi-pencil" @click="toggleEditing" class="rounded-lg"></v-btn>
                            </p>
                            <!-- ユーザー名編集時 -->
                            <v-text-field
                                v-if="nameEditing"
                                v-model="nameDisplaying"
                                variant="solo"
                            >
                                <template v-slot:append-inner>
                                    <v-btn @click="updateName" color="secondary" size="x-small" icon="mdi:mdi-check-bold" class="rounded-lg" style="margin:0 4px 0 8px; float:right">
                                    </v-btn>
                                    <v-btn @click="toggleEditing" color="secondary" size="x-small" icon="mdi:mdi-window-close" class="rounded-lg" style="margin:0 8px 0 4px; float:right">
                                    </v-btn>
                                </template>
                            </v-text-field>
                        </div>

                    </v-col>

                </v-row>
            </v-container>

            <v-container class="bg-surface-variant">
                <!-- ログアウトボタン -->
                <v-row no-gutters>
                    
                    <v-card variant="tonal" :class="cd" style="width:100%; ">
                        <v-btn prepend-icon="mdi:mdi-logout" color="error" block @click="snackbar=true">Logout</v-btn>
                        <v-snackbar
                            v-model="snackbar"
                        >
                        ログアウトしていいの？

                        <template v-slot:actions>
                            <v-btn
                            color="pink"
                            variant="text"
                            @click="logout"
                            >
                            うん！
                            </v-btn>
                        </template>
                        </v-snackbar>
                    </v-card>

                </v-row>
            </v-container>

        </div>
</template>

<style scoped>

.card-default
{
    padding: 3%;
    text-align:center;
}

.menu-card
{
    margin: 16px 12.5%;
    padding: 7.5% 0;
    text-align: center;
}

</style>