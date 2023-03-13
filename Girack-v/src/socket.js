//socket.js
//通信とかそこらへん

import { io } from 'socket.io-client'; //ウェブソケット通信用
import { ref } from "vue";

//FOR DEVELOPMENT
export const backendURI = "http://" + location.hostname + ":33333";
const socket = io(backendURI);

/* vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv */
//ユーザー情報

const Userinfo = ref({
    username: "RefTesting", //名前
    role: "Admin",
    userid: "001", //ユーザーID
    loggedin: false, //ログイン状態
    sessionid: 0, //セッションID
    channelJoined: [], //参加しているチャンネル
});

export function dataUser() {
    return { Userinfo };

}

/* ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ */

/* vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv */

//サーバー(インスタンス)情報 (ToDo削除)
export var serverinfo = {
    servername: "...",
    registerAvailable: null,
    inviteOnly: null
};

//チャンネル情報 (ToDo削除)
export var channelIndex = {
    /*
    "001": {
        channelname: "random",
        description: "Hello, Girack",
        scope: "open"
    }
    */
};

//チャンネル情報
const ChannelIndex = ref({
    /*
    "0001": {
        channelname: "random",
        description: "Hello, Girack",
        scope: "open"
    }
    */
});

//チャンネル情報を返すだけ
export function dataChannel() {
    return { ChannelIndex };

}

/* ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ */

/* vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv */
//ref テスト用 メッセージDB（履歴）

//メッセージ履歴DB
const MsgDB = ref({
    // "001": [
    //     {
    //         id: 0,
    //         username: "asdf",
    //         userid: "xx0",
    //         channelid: "001",
    //         time: "20200217165240643",
    //         content: "Ayo"
    //     },
    //     {
    //         id: 1,
    //         username: "fdsa",
    //         userid: "xx1",
    //         channelid: "001",
    //         time: "20200227165240646",
    //         content: "は"
    //     }
    // ]
});

//ユーザー情報(名前とかロールとか)
const UserIndex = ref({

});

const StateScrolled = ref(false); //スクロールしきっているかどうか

//履歴DB返すだけ
export function dataMsg() {
    return { MsgDB, UserIndex, StateScrolled };

}

//メッセージ受け取り、出力
socket.on("messageReceive", (msg) => {
    console.log("socket :: msgReceive : ↓");
    console.log(msg);

    //もしユーザーの名前リストに名前がなかったら
    if ( UserIndex.value[msg.userid] === undefined ) {
        //名前をリクエスト
        socket.emit("getInfoUser", {
            targetid: msg.userid,
            reqSender: {
                userid: Userinfo.value.userid, //ユーザーID
                sessionid: Userinfo.value.sessionid //セッションID
            }
        });

    }

    try{
        //DB配列に追加
        if ( MsgDB.value[msg.channelid] !== undefined ) {
            //ローカルDBに追加
            MsgDB.value[msg.channelid].push({
                messageid: msg.messageid,
                userid: msg.userid,
                channelid: msg.channelid,
                time: msg.time,
                content: msg.content,
                reaction: msg.reaction
            });

        } else { //配列が空なら新しく作成、配置
            MsgDB.value[msg.channelid] = [{
                messageid: msg.messageid,
                userid: msg.userid,
                channelid: msg.channelid,
                time: msg.time,
                content: msg.content,
                reaction: msg.reaction
            }];

        }

    }
    catch(e) {
        console.log("Content :: msgDB書き込みエラー");
        console.log(e);

    }

});

//他人の名前の受け取り
socket.on("infoResult", (dat) => {
    if ( dat.type !== "user" ) { return; } //ユーザー情報じゃなければ取りやめ
    console.log("Content :: infoResult : 名前情報受け取り \\/")
    console.log(dat);

    let username = dat.username;
    let userid = dat.userid;
    let role = dat.role;

    UserIndex.value[userid] = {};

    //ユーザーインデックス更新
    UserIndex.value[userid].username = username; //名前
    UserIndex.value[userid].role = role; //ロール

});

//メッセージの更新
socket.on("messageUpdate", (dat) => {
    //メッセージ消したりリアクションされたり
    /*
    {
        action: "delete"|"reaction",
        channelid: dat.channelid,
        messageid: dat.messageid,
        ["reaction"だったら]
        reaction: dat.reaction
    }
    */

    switch( dat.action ) {
        //削除する
        case "delete":
            //ループでIDが一致するメッセージを探す
            for ( let index in MsgDB.value[dat.channelid] ) {
                if ( MsgDB.value[dat.channelid][index].messageid === dat.messageid ) {
                    MsgDB.value[dat.channelid].splice(index,1); //削除

                }

            }
            break;

        //リアクションをつける
        case "reaction":
            console.log("Content :: これからリアクション");
            console.log(dat);
            for ( let index in MsgDB.value[dat.channelid] ) {
                if ( MsgDB.value[dat.channelid][index].messageid === dat.messageid ) {
                    MsgDB.value[dat.channelid][index].reaction = dat.reaction; //リアクション更新

                }

            }

        default:
            break;

    }

    //backupMsg(MsgDB.value); //メッセージDBの出力、保存

});

/* ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ */

//ソケットの接続状態をもつオブジェクトを返すだけ
export function getSocket() {
    return socket;

}

//メッセージ履歴の取得をする
export function getMessage(channelid, readLength) {
    socket.emit("getMessage", {
        //送信者の情報
        reqSender: {
            userid: Userinfo.value.userid, //ユーザーID
            sessionid: Userinfo.value.sessionid //セッションID
        },
        channelid: channelid, //ほしい履歴のチャンネルID
        readLength: readLength //ほしい長さ
    });

}

//ユーザー情報返すだけ
export function getUserinfo() {
    return { userinfo };

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

//ToDo:削除
//情報受け取り
socket.on("infoResult", (dat) => {
    console.log("socket :: infoResult : 情報受け取り!");
    console.log(dat);

    //データがチャンネル用なら
    // if ( dat.type === "channel" ) {
    //     console.log("channelIndexを更新します");
    //     //チャンネル用情報JSONへ追加
    //     channelIndex[dat.channelid] = {
    //         channelname: dat.channelname, //チャンネル名
    //         description: dat.description, //チャンネル概要
    //         scope: dat.scope //チャンネルの公開範囲
    //     };

    //     updateState.channelinfo = true;

    // }

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
    // if ( dat.type === "user" ) {
    //     //もし自分の情報だったら更新
    //     if ( dat.userid === userinfo.userid ) {
    //         // console.log("*******************");
    //         // console.log("自分のや!");
    //         // console.log(dat.channelJoined.length + " と " + userinfo.channelJoined.length);
    //         // console.log(( dat.channelJoined.length > userinfo.channelJoined.length ));
    //         // console.log("*******************");

    //         if ( dat.channelJoined.length !== userinfo.channelJoined.length ) {
    //             //チャンネル数が増えているなら
    //             if ( dat.channelJoined.length > userinfo.channelJoined.length ) {
    //                 let channelNew = (dat.channelJoined).filter( cid => !(userinfo.channelJoined).includes(cid) );
                    
    //                 console.log("socket :: チャンネル差 : ");
    //                 console.log(channelNew);

    //                 //チャンネル情報の取得
    //                 for ( let c in channelNew ) {
    //                     socket.emit("getInfo", { //リクエスト送信
    //                         target: "channel",
    //                         targetid: channelNew[c],
    //                         reqSender: {
    //                             userid: userinfo.userid, //ユーザーID
    //                             sessionid: userinfo.sessionid //セッションID
    //                         }
    //                     });

    //                 }

    //             }

    //             //チャンネル数が減っている（チャンネルを抜けた）なら
    //             if ( dat.channelJoined.length < userinfo.channelJoined.length ) {
    //                 console.log("socket :: infoResult : チャンネル差が少ないから減らす");
    //                 dat.channelid = userinfo.channelJoined.filter(cid => !dat.channelJoined.includes(cid));

    //                 console.log("socket :: infoResult : 今参加しているチャンネル -> " + dat.channelJoined);
    //                 //自分が抜けたチャンネル分channelIndexを削る
    //                 for (let c=0; c<Object.keys(channelIndex).length; c++ ) {
    //                     let channelid = Object.keys(channelIndex)[c];
    //                     console.log("socket :: infoResult : 使うチャンネルID -> " + channelid);
                        
    //                     //チャンネルIDがユーザーが参加しているチャンネルIDリストに入っているかどうか調べる
    //                     if ( !dat.channelJoined.includes(channelid) ) {
    //                         delete channelIndex[channelid]; //そのチャンネルIDのJSONを削除
    //                         console.log("socket :: infoResult : 削除された!");
    //                         break;

    //                     }

    //                 }

    //             }

    //             //=== REF版 ===
    //             //チャンネル数が減っている（チャンネルを抜けた）なら
    //             if ( dat.channelJoined.length < userinfo.channelJoined.length ) {
    //                 console.log("socket :: infoResult : チャンネル差が少ないから減らす");
    //                 dat.channelid = userinfo.channelJoined.filter(cid => !dat.channelJoined.includes(cid));

    //                 console.log("socket :: infoResult : 今参加しているチャンネル -> " + dat.channelJoined);
    //                 //自分が抜けたチャンネル分channelIndexを削る
    //                 for (let c=0; c<Object.keys(ChannelIndex.value).length; c++ ) {
    //                     let channelid = Object.keys(ChannelIndex)[c];
    //                     console.log("socket :: infoResult : 使うチャンネルID -> " + channelid);
                        
    //                     //チャンネルIDがユーザーが参加しているチャンネルIDリストに入っているかどうか調べる
    //                     if ( !dat.channelJoined.includes(channelid) ) {
    //                         delete ChannelIndex.value[channelid]; //そのチャンネルIDのJSONを削除
    //                         console.log("socket :: infoResult : 削除された!");
    //                         break;

    //                     }

    //                 }

    //             }

    //         }

    //         userinfo = {
    //             username: dat.username,
    //             userid: userinfo.userid, //ユーザーID
    //             role: dat.role, //ロール
    //             loggedin: true, //ログイン状態はそのまま
    //             sessionid: userinfo.sessionid, //セッションIDはそのまま
    //             channelJoined: dat.channelJoined, //参加しているチャンネル
    //         }

    //     }

    // }

});

//チャンネル情報の更新
socket.on("infoChannel", (dat) => {
    console.log("socket :: infoChannel : チャンネル情報更新");

    channelIndex[dat.channelid] = {
        channelname: dat.channelname, //チャンネル名
        description: dat.description, //チャンネル概要
        scope: dat.scope //チャンネルの公開範囲
    };

    ChannelIndex.value[dat.channelid] = {
        channelname: dat.channelname, //チャンネル名
        description: dat.description, //チャンネル概要
        scope: dat.scope //チャンネルの公開範囲
    };


});

//プロフィール情報の受け取り
socket.on("infoUser", (dat) => {
    let username = dat.username;
    let userid = dat.userid;
    let role = dat.role;

    UserIndex.value[userid] = {};

    //ユーザーインデックス更新
    UserIndex.value[userid].username = username; //名前
    UserIndex.value[userid].role = role; //ロール

    //自分の情報の更新にだけ使うから
    if ( dat.userid !== Userinfo.value.userid ) { return; }

    console.log("socket :: infoUser : プロフィール更新");

    //参加しているチャンネルリストの長さを比較をして減ったり増えたりしたチャンネルのデータを処理
    if ( dat.channelJoined.length !== Userinfo.value.channelJoined.length ) {
        //チャンネル数が増えているなら
        if ( dat.channelJoined.length > Userinfo.value.channelJoined.length ) {
            let channelNew = (dat.channelJoined).filter( cid => !(Userinfo.value.channelJoined).includes(cid) );
            
            console.log("socket :: チャンネル差 : ");
            console.log(channelNew);

            //新しく参加したチャンネル情報の取得
            for ( let c in channelNew ) {
                //リクエスト送信
                socket.emit("getInfoChannel", {
                    targetid: channelNew[c],
                    reqSender: {
                        userid: Userinfo.value.userid, //ユーザーID
                        sessionid: Userinfo.value.sessionid //セッションID
                    }
                });

            }

            //新しく参加したチャンネルの履歴を取得
            for ( let c in channelNew ) {
                getMessage(channelNew[c], 20); //リクエスト送信する
    
            }

        }

        //チャンネル数が減っている（チャンネルを抜けた）なら
        if ( dat.channelJoined.length < Userinfo.value.channelJoined.length ) {
            console.log("socket :: infoResult : チャンネル差が少ないから減らす");
            dat.channelid = Userinfo.value.channelJoined.filter(cid => !dat.channelJoined.includes(cid));

            console.log("socket :: infoResult : 今参加しているチャンネル -> " + dat.channelJoined);
            //自分が抜けたチャンネル分channelIndexを削る
            for (let c=0; c<Object.keys(ChannelIndex.value).length; c++ ) {
                //チャンネルIDをチャンネル情報リストからとる
                let channelid = Object.keys(ChannelIndex.value)[c];
                
                //チャンネルIDがユーザーが参加しているチャンネルIDリストに入っているかどうか調べる
                if ( !dat.channelJoined.includes(channelid) ) { //チャンネルがリストに入っていなければ
                    delete ChannelIndex.value[channelid]; //そのチャンネルIDのJSONを削除
                    delete MsgDB.value[channelid]; //そのチャンネルの履歴を削除

                    break;

                }

            }

        }

    }

    //個人情報更新
    // userinfo = {
    //     username: dat.username,
    //     userid: userinfo.userid, //ユーザーID
    //     role: dat.role, //ロール
    //     loggedin: true, //ログイン状態はそのまま
    //     sessionid: userinfo.sessionid, //セッションIDはそのまま
    //     channelJoined: dat.channelJoined, //参加しているチャンネル
    // }

    // userinfo = {
    //     username: dat.username,
    //     userid: Userinfo.value.userid, //ユーザーID
    //     role: dat.role, //ロール
    //     loggedin: true, //ログイン状態はそのまま
    //     sessionid: userinfo.sessionid, //セッションIDはそのまま
    //     channelJoined: dat.channelJoined, //参加しているチャンネル
    // }

    Userinfo.value = {
        username: dat.username,
        userid: Userinfo.value.userid, //ユーザーID
        role: dat.role, //ロール
        loggedin: true, //ログイン状態はそのまま
        sessionid: Userinfo.value.sessionid, //セッションIDはそのまま
        channelJoined: dat.channelJoined, //参加しているチャンネル
    }

});

//メッセージの履歴受け取り
socket.on("messageHistory", (history) => {
    console.log("messageResult :: history ↓");
    console.log(history);

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
            //msgDBbackup[channelid] = history; //履歴DBを更新
            MsgDB.value[channelid] = history;
            // console.log("socket :: messageHistory : MsgDB");
            // console.log(MsgDB.value[channelid][0].messageid);
        }
        catch(e) {
            //msgDBbackup[channelid] = [history[index]]; //新しい配列として保存
            MsgDB.value[channelid] = [history[index]];
            console.log("socket :: messageHistory : MsgDB");
            console.log(MsgDB.value);

        }

    }

});

//メッセージの更新
// socket.on("messageUpdate", (dat) => {
//     //メッセージ消したりリアクションされたり
//     /*
//     {
//         action: "delete"|"reaction",
//         channelid: dat.channelid,
//         messageid: dat.messageid,
//         ["reaction"だったら]
//         reaction: dat.reaction
//     }
//     */

//     switch( dat.action ) {
//         //削除する
//         case "delete":
//             //ループでIDが一致するメッセージを探す
//             for ( let index in msgDBbackup[dat.channelid] ) {
//                 if ( msgDBbackup[dat.channelid][index].messageid === dat.messageid ) {
//                     msgDBbackup[dat.channelid].splice(index,1); //削除

//                 }

//             }

//         default:
//             break;

//     }

// });

//認証結果
socket.on("authResult", (dat) => {
    //ユーザーデータの更新
    if ( dat.result ) { //もしログイン成功なら
        //ユーザー情報を更新
        Userinfo.value = {
            userid: dat.userid, //ユーザーID
            loggedin: true, //ログイン状態
            sessionid: dat.sessionid, //セッションID
            channelJoined: dat.channelJoined
        };

        //ユーザー情報をさらに取得
        socket.emit("getInfoUser", {
            targetid: dat.userid,
            reqSender: {
                userid: dat.userid,
                sessionid: dat.sessionid
            },
        });

        //クッキーにセッションIDを設定、寿命は15日
        setCookie("sessionid", dat.sessionid, 15);
        console.log("session id in cookie -> " + getCookie("sessionid"));

        //チャンネル情報の取得
        for ( let c in Userinfo.value.channelJoined ) {
            socket.emit("getInfoChannel", { //リクエスト送信
                targetid: Userinfo.value.channelJoined[c],
                reqSender: {
                    userid: Userinfo.value.userid, //ユーザーID
                    sessionid: Userinfo.value.sessionid //セッションID
                }
            });

        }

        //メッセージ履歴の取得
        for ( let cid in Userinfo.value.channelJoined ) {
            getMessage(Userinfo.value.channelJoined[cid], 20); //リクエスト送信する

        }

    }

});

//クッキー設定するやつ(MDNから参考)
export function setCookie(cname, cvalue, exdays) {
    const d = new Date();

    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000)); //寿命のための時間計算
    let expires = "expires="+d.toUTCString(); //寿命設定
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/"; //クッキー追加

}

//クッキーを取得(MDNから参考)
export function getCookie(cname) {
    let name = cname + "="; //検索するクッキーの名前を設定
    let decodedCookie = decodeURIComponent(document.cookie); //クッキー取得
    let ca = decodedCookie.split(';'); //クッキーを探せるようにするために分解

    //該当クッキーの探索開始
    for(let i = 0; i <ca.length; i++) {
        let c = ca[i];

        while ( c.charAt(0) == ' ' ) {
            c = c.substring(1);

        }
        if ( c.indexOf(name) == 0 ) {
            return c.substring(name.length, c.length);

        }

    }

    return "";

}