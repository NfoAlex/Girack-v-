//socket.js
//通信とかそこらへん

import { io } from 'socket.io-client';

const socket = io("http://localhost:33333");

//ユーザー情報
export var userinfo = {
    username: "Guest", //名前
    userid: "", //ユーザーID
    loggedin: false, //ログイン状態
    sessionid: 0, //セッションID
    channelJoined: [], //参加しているチャンネル
}

export var serverinfo = {
    servername: null,
    registerAvailable: null,
    inviteOnly: null
};

export function getSocket() {
    return socket;

}

//サーバー情報の受け取り
socket.on("serverinfo", (dat) => {
    console.log("serverinfo :: ");
    console.log(dat);

    //サーバーの基本情報の更新
    serverinfo = {
        servername: dat.servername, //サーバーの名前
        registerAvailable: dat.registerAvailable, //登録できるかどうか
        inviteOnly: dat.inviteOnly //招待オンリーかどうか
    };

});

//認証結果
socket.on("authResult", (dat) => {
    //ユーザーデータの更新
    if ( dat.result ) { //もしログイン成功なら
        userinfo = {
            username: dat.username,
            userid: dat.userid, //ユーザーID
            loggedin: true, //ログイン状態
            sessionid: dat.sessionid, //セッションID
            channelJoined: dat.channelJoined, //参加しているチャンネル
        }

        console.log("userinfo ↓");
        console.log(userinfo);

    }
        

});