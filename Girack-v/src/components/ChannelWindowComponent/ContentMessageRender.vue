<script>

import { getSocket } from "../../data/socket.js";
import { dataUser } from "../../data/dataUserinfo";

const socket = getSocket();

export default {

    props: ["content"],

    setup() {
        const { myUserinfo, UserIndex } = dataUser();

        return { UserIndex, myUserinfo };

    },

    data() {
        return {
            //メッセージ文のコンパイル用
            URLRegex: /((https|http)?:\/\/[^\s]+)/g,
            mentionRegex: /@\/([0-9]*)\//g,
            XSSRegex: /<(|\/|[^>\/bi]|\/[^>bi]|[^\/>][^>]+|\/[^>][^>]+)>/g,
            URLstyle: "color:#607D8B",

            //インスタンス内のURLかどうかの判別用にここのURL取得
            locationOrigin: location.origin,

            //インスタンス内に対するURLがあるかどうか
            hasInstanceURL: false,
            InstanceURLArray: []
        }
    },

    methods: {
        //メッセージ本文のメンションやURLの着色などをする
        formatMessage(msg) {
            let msgCleaned = "";
            let REF = this;

            //インスタンス内URL用配列を初期化
            this.InstanceURLArray = [];

            try {

                //XSS対策用
                msgCleaned = String(msg).replaceAll(this.XSSRegex, function(c){
                    return '&#'+c.charCodeAt(0)+';';

                });

                //自分に対するメンションなら着色
                msgCleaned = msgCleaned.replaceAll(("@/"+this.myUserinfo.userid + "/"), function(c){
                    return "<span style='color:orange'>@" + REF.myUserinfo.username + "</span>";

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
                    //インスタンス内に対するURLかどうかを判別してからアンカーをつける
                    if ( url.startsWith(location.origin) ) {
                        this.InstanceURLArray.push(url); //配列追加
                        return "<span style='background-color:gray; padding:6px; border-radius:8px;'>" +
                                    "<a>" +
                                        url +
                                    "</a>" +
                                "</span>";

                    } else {
                        return "<a style='" + this.URLstyle + "' target='_blank' href='" + url + "'>" + url + "</a>";

                    }

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
                    userid: this.myUserinfo.userid, //ユーザーID
                    sessionid: this.myUserinfo.sessionid //セッションID
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
        <br>
        <!-- インスタンス内URL -->
        <v-chip
            v-for="(url, index) in InstanceURLArray"
            class="ma-2"
            @click="$router.push({ path: url.slice(locationOrigin.length)})"
        >
            <v-icon v-if="url.includes('/browser')">
                mdi:mdi-list-box
            </v-icon>
            {{ url.includes("/browser")?"チャンネルブラウザ":url.slice(locationOrigin.length) }}
        </v-chip>
    </span>
</template>