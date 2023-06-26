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
            MessageTemplate: {
                "INVITED": ["が","をこのチャンネルに招待しました"],
                "KICKED": ["が","をこのチャンネルからキックしました"],
                "DESCRIPTION_UPDATED": ["がチャンネル概要を変更しました"],
                "CHANNELNAME_UPDATED": ["がチャンネル名を変更しました"]
            }
        }
    },

    methods: {
        //メッセージ本文のメンションやURLの着色などをする
        formatSystemMessage() {
            //表示するメッセージ
            let ContentRedering = "";

            //メッセージを追加
            ContentRedering = this.content.triggeredUser;
            ContentRedering += this.MessageTemplate[this.content.term][0];

            //もし標的ユーザーが空じゃないなら文章とユーザーを続けて追加
            if ( this.content.targetUser !== "" ) {
                ContentRedering += this.content.targetUser;
                ContentRedering += this.MessageTemplate[this.content.term][1];
                
            }

            return ContentRedering;
            
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
            style="width:90%; word-wrap:break-word"
        >
        {{ formatSystemMessage }}
        </span>
    </span>
</template>