//socket.js
//通信とかそこらへん

import { io } from 'socket.io-client'; //ウェブソケット通信用

const socket = io("http://localhost:33333");

//ユーザー情報
export var userinfo = {
    username: "Guest", //名前
    userid: "", //ユーザーID
    loggedin: false, //ログイン状態
    sessionid: 0, //セッションID
    channelJoined: [], //参加しているチャンネル
}

//サーバー(インスタンス)情報
export var serverinfo = {
    servername: null,
    registerAvailable: null,
    inviteOnly: null
};

//ソケットの接続状態をもつオブジェクトを返すだけ
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

        setCookie("sessionid", dat.sessionid, 15);
        console.log("session id in cookie -> " + getCookie("sessionid"));

        console.log("userinfo ↓");
        console.log(userinfo);

    }
        

});

//クッキー設定するやつ
function setCookie(cname, cvalue, exdays) {
    const d = new Date();

    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    let expires = "expires="+d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";

}

//クッキーを取得
export function getCookie(cname) {
    let name = cname + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');

    for(let i = 0; i <ca.length; i++) {
        let c = ca[i];

        while (c.charAt(0) == ' ') {
            c = c.substring(1);

        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);

        }

    }

    return "";

}