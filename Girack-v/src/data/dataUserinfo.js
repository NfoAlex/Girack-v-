import { ref } from "vue";

const myUserinfo = ref({
    username: "User", //名前
    role: "Admin",
    userid: "001", //ユーザーID
    loggedin: false, //ログイン状態
    sessionid: 0, //セッションID
    channelJoined: [], //参加しているチャンネル
});

export function dataUser() {
    return { myUserinfo };

}