<script>

import { getSocket, dataMsg, dataUser } from "../../socket.js";

const socket = getSocket();

export default {

    props: ["content"],

    setup() {
        const { UserIndex } = dataMsg();
        const { Userinfo } = dataUser();

        return { UserIndex, Userinfo };

    },

    data() {
        return {
            //メッセージ文のコンパイル用
            URLRegex: /((https|http)?:\/\/[^\s]+)/g,
            mentionRegex: /@\/([0-9]*)\//g,
            XSSRegex: /<(|\/|[^>\/bi]|\/[^>bi]|[^\/>][^>]+|\/[^>][^>]+)>/g,
            URLstyle: "color:#607D8B",
        }
    },

    methods: {
        //メッセージ本文のメンションやURLの着色などをする
        formatMessage(msg) {
            let msgCleaned = "";
            let REF = this;

            try {

                //XSS対策用
                msgCleaned = String(msg).replaceAll(this.XSSRegex, function(c){
                    return '&#'+c.charCodeAt(0)+';';

                });

                //自分に対するメンションなら着色
                msgCleaned = msgCleaned.replaceAll(("@/"+this.Userinfo.userid + "/"), function(c){
                    return "<span style='color:orange'>@" + REF.Userinfo.username + "</span>";

                });

                //改行部分を置き換え
                msgCleaned = msgCleaned.replaceAll(("\n"), function(c){
                    return " <br>";

                });

                //人のメンションならセカンダリーの色に着色
                msgCleaned = msgCleaned.replaceAll(this.mentionRegex, function(c){
                    let userid = "";

                    //ユーザーIDを抽出
                    userid = c.substring(2);
                    userid = userid.substring(userid.length-1,0);

                    //IDをユーザー名に置き換えて出力
                    return "<span style='color:#7C96AB'>@" + ( REF.UserIndex[userid]!==undefined ? REF.UserIndex[userid].username : REF.needUserIndex(userid) ) + "</span>";

                });

                //リンクをクリックできる形にする
                return msgCleaned.replaceAll(this.URLRegex, (url) => {
                    return "<a style='" + this.URLstyle + "' target='_blank' href='" + url + "'>" + url + "</a>";

                });

            } catch(e) {
                console.log("ContentMessageRender :: formatMessage : エラー -> ", e);
                return "<span color='red'>レンダー中にエラー発生...</span>"

            }
            

        },

        //もし人のやつほしくなったら
        needUserIndex(userid) {
            socket.emit("getInfoUser", {
                targetid: userid,
                reqSender: {
                    userid: this.Userinfo.userid, //ユーザーID
                    sessionid: this.Userinfo.sessionid //セッションID
                }
            });

            return userid;

        },
    }

}

</script>

<template>
    <span>
        <span
            style="width:100%; word-wrap:break-word"
            v-html="formatMessage(content)"
        >
        </span>
    </span>
</template>