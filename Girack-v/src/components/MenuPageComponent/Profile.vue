<script>
import { setCookie, getSocket, dataUser, backendURI } from '../../socket.js';

const socket = getSocket();

export default {

    setup() {
        const { Userinfo } = dataUser();
        return { Userinfo, backendURI };
    },
    
    data() {
        return {
            snackbar: false, //ログアウトアラート出力用
            cd: ["card-default","rounded-lg"], //CSS用クラス名
            okayIcon: '',

            //ユーザー名
            nameDisplaying: "...",
            nameEditing: false, //名前編集しているかどうか

            //パスワード変更用
            changePasswordDialog: false,
            changePasswordResult: 0, //パスワードの変更結果=> 1=成功, -1=失敗
            currentPassword: "",
            newPassword: "",
            newPasswordCheck: "",

            iconUploadDialog: false, //アイコンアップロード用ダイアログの表示
            iconUploadRule: [ //アイコンをアップロードするためのルール
                value => {
                    return !value || !value.length || value[0].size < 1024000 || '画像は1MB以下にしてください!'
                }
            ],
            iconUploadFile: null, //アイコン用画像のデータ
            iconUploadable: false, //アイコンをアップロードできる状態かどうか
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
        },

        //ファイルのアップロード状態を監視してアップロードできるかどうかを設定
        iconUploadFile: {
            handler() {
                try {
                //ファイルサイズが1MB以上なら無効化
                if ( this.iconUploadFile[0].size > 1024000 ) {
                    this.iconUploadable = false;

                } else {
                    this.iconUploadable = true;

                }
                }
                catch(e) {
                    this.iconUploadable = false;
                }
            }
        }
    },
    
    methods: {
        //ログアウト処理
        logout() {
            setCookie("sessionid", "", 0); //クッキー削除
            location.reload(); //ページリロード
        },

        //パスワードを変更
        changePassword(pw) {
            //パスワードを変更申請
            socket.emit("changePassword", {
                currentPassword: this.currentPassword,
                newPassword: this.newPassword,
                reqSender: {
                    userid: this.Userinfo.userid,
                    sessionid: this.Userinfo.sessionid
                }
            });

        },

        //名前更新
        updateName() {
            let nameUpdating = this.nameDisplaying; //更新する名前
            //名前更新
            socket.emit("changeProfile", {
                name: nameUpdating, //更新する名前
                reqSender: { //セッション認証に必要な情報送信
                    userid: this.Userinfo.userid,
                    sessionid: this.Userinfo.sessionid
                }
            });
            this.nameEditing = false; //編集モードを閉じる
            console.log("名前更新します -> " + this.nameDisplaying);
        },

        //編集しているかどうかを切り替えする
        toggleEditing() {
            this.nameDisplaying = this.Userinfo.username;
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
                    userid: this.Userinfo.userid,
                    sessionid: this.Userinfo.sessionid
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
        this.nameDisplaying = this.Userinfo.username; //名前更新

        //結果の受け取り
        socket.on("changePasswordResult", (result) => {
            this.changePasswordResult = result;

        });

    },

    unmounted() {
        //通信重複防止
        socket.off("changePasswordResult");
    }

}
</script>

<template>
    <div>
        <!-- 画像アップロード用ダイアログ -->
        <v-dialog
            v-model="iconUploadDialog"
            style="min-width:650px; width:50vh;"
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

                <v-btn :disabled="!iconUploadable" @click="uploadIcon" class="rounded-lg" color="primary">
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

        <!-- パスワードを変えるためのダイアログ -->
        <v-dialog
            v-model="changePasswordDialog"
            class="rounded-lg"
            style="min-width:650px; width:50vh;"
        >
            <!-- 変更画面 -->
            <v-card v-if="changePasswordResult!==1" class="rounded-lg pa-6">

                <v-card-title>
                    パスワードを変更
                </v-card-title>

                <p>今のパスワード</p>
                <v-text-field
                    v-model="currentPassword"
                    class="rounded-lg"
                    variant="outlined"
                    type="password"
                >
                </v-text-field>

                <p>新しいパスワード</p>
                <v-text-field
                    v-model="newPassword"
                    class="rounded-lg"
                    variant="outlined"
                    type="password"
                    maxlength="128"
                    hint="16文字以上"
                    counter
                >
                </v-text-field>

                <p>確認</p>
                <v-text-field
                    v-model="newPasswordCheck"
                    class="rounded-lg"
                    variant="outlined"
                    type="password"
                    maxlength="128"
                >
                </v-text-field>

                <v-btn
                    @click="changePassword"
                    color="secondary"
                    class="rounded-lg"
                    :disabled="newPasswordCheck!==newPassword||newPassword.length<16||currentPassword.length===0"
                    block
                >
                    パスワード変更
                </v-btn>

                <v-alert
                    v-if="newPasswordCheck.length>=1&&newPasswordCheck!==newPassword"
                    type="error"
                    style="margin-top:2.5%"
                >
                    確認用のパスワードが一致しません
                </v-alert>

                <v-alert
                    v-if="changePasswordResult===-1"
                    type="error"
                    style="margin-top:2.5%"
                >
                    現在のパスワードで認証ができませんでした
                </v-alert>

            </v-card>

            <!-- 変更に成功した画面 -->
            <v-card v-if="changePasswordResult===1" class="rounded-lg pa-6">

                <v-card-title>
                    パスワードを変更
                </v-card-title>
                <span class="d-flex flex-column align-center pa-1 ma-2">
                    <p class="text-h4 pa-2">😏</p>
                    <p>パスワードの変更ができました!</p>
                </span>

                <v-btn
                    @click="changePasswordDialog=false;"
                    class="rounded-lg ma-2"
                    color="secondary"
                    block
                >
                    あざ
                </v-btn>

            </v-card>
        </v-dialog>

        <div style="margin-top:5%; height:90%;">
                <v-container class="bg-surface-variant">
                    <v-row no-gutters>

                        <!-- アバター -->
                        <v-col cols="2">
                            <v-card @click="" variant="tonal" :class="cd" style="padding:0">
                                <v-img @click="iconUploadDialog=true;" class="rounded-lg" :alt="Userinfo.userid" :src="backendURI + '/img/' + Userinfo.userid">
                                    <v-tooltip
                                        activator="parent"
                                        location="top center"
                                        origin="overlap"
                                    >
                                        アイコンを変更
                                    </v-tooltip>
                                </v-img>
                            </v-card>
                        </v-col>

                        <!-- ユーザー名の部分 -->
                        <v-col cols="10">
                            <div variant="tonal" :class="cd" style="padding:1% 10% ">
                                <span class="d-flex flex-column" style="width:100%">

                                    <!-- ユーザーID -->
                                    <p class="text-left text-h6">
                                        # {{ Userinfo.userid }}
                                    </p>

                                    <!-- ユーザー名 -->
                                    <p
                                        v-if="!nameEditing"
                                        @dblclick="toggleEditing"
                                        class="text-h4 text-left text-truncate"
                                    >
                                        {{ Userinfo.username }}
                                        <v-btn v-if="!nameEditing" color="primary" icon="mdi:mdi-pencil" @click="toggleEditing" class="rounded-lg ma-5"></v-btn>
                                    </p>

                                    <span class="auto" style="width:100%">
                                        <!-- ユーザー名編集時 -->
                                        <v-text-field
                                            v-if="nameEditing"
                                            style="width:100%"
                                            class="me-auto"
                                            v-model="nameDisplaying"
                                            counter
                                            maxlength="32"
                                            variant="solo"
                                        >
                                            <template v-slot:append-inner>
                                                <v-btn
                                                    @click="updateName"
                                                    :disabled="nameDisplaying.length>=32"
                                                    color="secondary"
                                                    size="x-small"
                                                    icon="mdi:mdi-check-bold"
                                                    class="rounded-lg"
                                                    style="margin:0 4px 0 8px; float:right"
                                                >
                                                </v-btn>
                                                <v-btn @click="toggleEditing" color="secondary" size="x-small" icon="mdi:mdi-window-close" class="rounded-lg" style="margin:0 8px 0 4px; float:right">
                                                </v-btn>
                                            </template>
                                        </v-text-field>
                                    </span>
                                
                                </span>
                                
                            </div>

                        </v-col>

                    </v-row>
                </v-container>

                <v-container class="bg-surface-variant">
                    <p class="text-h6">パスワード変更</p>
                    <!-- パスワード変更 -->
                    <v-row no-gutters>

                        <v-card variant="tonal" :class="cd" style="width:100%; ">
                            <v-btn
                                @click="changePasswordDialog=true;"
                                class="rounded-lg"
                                color="secondary"
                                block
                            >
                                クソデカパスワード変更ボタン
                            </v-btn>
                        </v-card>

                    </v-row>
                </v-container>

                <v-container class="bg-surface-variant">
                    <!-- ログアウトボタン -->
                    <v-row no-gutters>
                        <p class="text-h6">ログアウト</p>
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