import { ref } from "vue";

const myUserinfo = ref({
    username: "User", //名前
    role: "Member",
    userid: "001", //ユーザーID
    loggedin: false, //ログイン状態
    sessionid: 0, //セッションID
    channelJoined: [], //参加しているチャンネル
});

//ユーザー情報(名前とかロールとか)
const UserIndex = ref({

});

export function dataUser() {
    return { myUserinfo, UserIndex };

}