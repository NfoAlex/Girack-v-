//socket.js
//通信とかそこらへん

import { io } from 'socket.io-client'; //ウェブソケット通信用

//FOR DEVELOPMENT
export const backendURI = "http://" + location.hostname + ":33333";
const socket = io(backendURI);

//ユーザー情報
export var userinfo = {
    username: "Guest", //名前
    role: "",
    userid: "", //ユーザーID
    loggedin: false, //ログイン状態
    sessionid: 0, //セッションID
    channelJoined: [], //参加しているチャンネル
};

//サーバー(インスタンス)情報
export var serverinfo = {
    servername: "...",
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
    // "001": [
    //     {
    //         id: 0,
    //         username: "",
    //         userid: "xx0",
    //         channelid: "001",
    //         time: "20200217165240643",
    //         content: ["Ayo", "abc", "そしてこれが３つ目"]
    //     },
    //     {
    //         id: 1,
    //         username: "",
    //         userid: "xx1",
    //         channelid: "001",
    //         time: "20200227165240646",
    //         content: ["は", "誰お前"]
    //     }
    // ]
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

//メッセージ履歴の取得をする
export function getMessage(channelid, readLength) {
    socket.emit("getMessage", {
        //送信者の情報
        reqSender: {
            userid: userinfo.userid, //ユーザーID
            sessionid: userinfo.sessionid //セッションID
        },
        channelid: channelid, //ほしい履歴のチャンネルID
        readLength: readLength //ほしい長さ
    });

}

//ユーザー情報返す
export function getUserinfo() {
    return userinfo;

}

//メッセージ履歴を保存しておくだけ（マウント外れた時用）
export function backupMsg(dat) {
    msgDBbackup = dat;

}

//ユーザー情報を保存しておくだけ（マウント外れた時用）
export function backupUser(dat) {
    userIndexBackup = dat;

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

//情報受け取り
socket.on("infoResult", (dat) => {
    console.log("socket :: infoResult : 情報受け取り!");
    console.log(dat);

    //データがチャンネル用なら
    if ( dat.type === "channel" ) {
        console.log("channelIndexを更新します");
        //チャンネル用情報JSONへ追加
        channelIndex[dat.channelid] = {
            channelname: dat.channelname, //チャンネル名
            description: dat.description, //チャンネル概要
            scope: dat.scope //チャンネルの公開範囲
        };

    }

    //データがサーバー用なら
    if ( dat.type === "server" ) {
        //サーバーの基本情報の更新
        serverinfo = {
            servername: dat.servername, //サーバーの名前
            registerAvailable: dat.registerAvailable, //登録できるかどうか
            inviteOnly: dat.inviteOnly //招待オンリーかどうか
        };

    }

    //データが自分の情報なら
    if ( dat.type === "user" ) {
        //もし自分の情報だったら更新
        if ( dat.userid === userinfo.userid ) {
            // console.log("*******************");
            // console.log("自分のや!");
            // console.log(dat.channelJoined.length + " と " + userinfo.channelJoined.length);
            // console.log(( dat.channelJoined.length > userinfo.channelJoined.length ));
            // console.log("*******************");

            if ( dat.channelJoined.length !== userinfo.channelJoined.length ) {
                //チャンネル数が増えているなら
                if ( dat.channelJoined.length > userinfo.channelJoined.length ) {
                    let channelNew = (dat.channelJoined).filter( cid => !(userinfo.channelJoined).includes(cid) );
                    
                    console.log("socket :: チャンネル差 : ");
                    console.log(channelNew);

                    //チャンネル情報の取得
                    for ( let c in channelNew ) {
                        socket.emit("getInfo", { //リクエスト送信
                            target: "channel",
                            targetid: channelNew[c],
                            reqSender: {
                                userid: userinfo.userid, //ユーザーID
                                sessionid: userinfo.sessionid //セッションID
                            }
                        });

                    }

                }

                //チャンネル数が減っている（チャンネルを抜けた）なら
                if ( dat.channelJoined.length < userinfo.channelJoined.length ) {
                    console.log("socket :: infoResult : チャンネル差が少ないから減らす");
                    dat.channelid = userinfo.channelJoined.filter(cid => !dat.channelJoined.includes(cid));

                    console.log("socket :: infoResult : 今参加しているチャンネル -> " + dat.channelJoined);
                    //自分が抜けたチャンネル分channelIndexを削る
                    for (let c=0; c<Object.keys(channelIndex).length; c++ ) {
                        let channelid = Object.keys(channelIndex)[c];
                        console.log("socket :: infoResult : 使うチャンネルID -> " + channelid);
                        
                        //チャンネルIDがユーザーが参加しているチャンネルIDリストに入っているかどうか調べる
                        if ( !dat.channelJoined.includes(channelid) ) {
                            delete channelIndex[channelid]; //そのチャンネルIDのJSONを削除
                            console.log("socket :: infoResult : 削除された!");
                            break;

                        }

                    }

                }

            }

            userinfo = {
                username: dat.username,
                userid: userinfo.userid, //ユーザーID
                role: dat.role, //ロール
                loggedin: true, //ログイン状態はそのまま
                sessionid: userinfo.sessionid, //セッションIDはそのまま
                channelJoined: dat.channelJoined, //参加しているチャンネル
            }

        }

    }

});

//メッセージの履歴受け取り
socket.on("messageResult", (history) => {
    if ( history === 0 ) {
        console.log("このチャンネル履歴空だわ");
        return;
    
    }

    let channelid = ""; //履歴を入れるチャンネルID

    try {
        channelid = history[0].channelid; //受け取ったデータの中身使っちゃうんだよね
    }
    catch(e) {
        console.log("???");
        console.log(history);
        return;
    }

    let index = 0; //チャンネル参照インデックス変数

    //履歴の長さ分DBへ追加
    for ( index in history ) {
        //配列が存在してなかったら新しく作って配置する
        try {
            //msgDBbackup[channelid].push(history[index]); //履歴DBの配列へプッシュ
            msgDBbackup[channelid] = history; //履歴DBを更新
        }
        catch(e) {
            msgDBbackup[channelid] = [history[index]]; //新しい配列として保存

        }

    }

});

//認証結果
socket.on("authResult", (dat) => {
    //ユーザーデータの更新
    if ( dat.result ) { //もしログイン成功なら
        //ユーザー情報を更新
        userinfo = {
            username: dat.username,
            userid: dat.userid, //ユーザーID
            role: dat.role,
            loggedin: true, //ログイン状態
            sessionid: dat.sessionid, //セッションID
            channelJoined: dat.channelJoined, //参加しているチャンネル
        }

        setCookie("sessionid", dat.sessionid, 15);
        console.log("session id in cookie -> " + getCookie("sessionid"));

        console.log("socket :: authResult : userinfo ↓");
        console.log(userinfo);

        //チャンネル情報の取得
        for ( let c in userinfo.channelJoined ) {
            socket.emit("getInfo", { //リクエスト送信
                target: "channel",
                targetid: userinfo.channelJoined[c],
                reqSender: {
                    userid: userinfo.userid, //ユーザーID
                    sessionid: userinfo.sessionid //セッションID
                }
            });

        }

        //メッセージ履歴の取得
        for ( let cid in userinfo.channelJoined ) {
            getMessage(userinfo.channelJoined[cid], 10); //リクエスト送信する

        }

    }

});

//クッキー設定するやつ
export function setCookie(cname, cvalue, exdays) {
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