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
};

//サーバー(インスタンス)情報
export var serverinfo = {
    servername: null,
    registerAvailable: null,
    inviteOnly: null
};

//チャンネル情報
export var channelIndex = {
    /*
    "001": {
        channelname: "random",
        description: "Hello, Girack",
        scope: open
    }
     */
};

export var msgDBbackup = {
    "001": [
        {
            id: 0,
            username: "",
            userid: "xx0",
            channelid: "001",
            time: "20200217165240643",
            msg: ["Ayo", "abc", "そしてこれが３つ目"]
        },
        {
            id: 1,
            username: "",
            userid: "xx1",
            channelid: "001",
            time: "20200227165240646",
            msg: ["は", "誰お前"]
        }
    ],
    "002": [
        {
            id: 0,
            username: "",
            userid: "xx2",
            channelid: "001",
            time: "20190327165240646",
            msg: ["いや","お前のランクよ","草"]
        },
    ]
};

export var userIndexBackup = {
    "xx0": {username:"Test", role:"Member"},
    "xx1": {username:"Admin", role:"Member"},
    "xx2": {username:"Psyonix", role:"Member"}
};

//ソケットの接続状態をもつオブジェクトを返すだけ
export function getSocket() {
    return socket;

}

//メッセージ履歴を保存しておくだけ（マウント外れた時用）
export function backupMsg(dat) {
    msgDBbackup = dat;

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

//チャンネル情報受け取り
socket.on("infoResult", (dat) => {
    if ( dat.type !== "channel" ) { return; } //channel用じゃなければ
    channelIndex[dat.channelid] = {
        channelname: dat.channelname,
        description: dat.description,
        scope: dat.scope
    };

});

//認証結果
socket.on("authResult", (dat) => {
    //ユーザーデータの更新
    if ( dat.result ) { //もしログイン成功なら
        //ユーザー情報を更新
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

        //チャンネル情報の取得
        for ( let c in userinfo.channelJoined ) {
            socket.emit("getInfo", { //リクエスト送信
                target: "channel",
                targetid: userinfo.channelJoined[c],
                userid: userinfo.userid,
                sessionid: userinfo.sessionid
            });

        }

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