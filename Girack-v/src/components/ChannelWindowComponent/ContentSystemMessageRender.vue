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
                "JOINED": ["がチャンネルへ参加しました"],
                "LEFT": ["がチャンネルを退出しました"],
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
            ContentRedering = String(this.UserIndex[this.content.triggeredUser].username);
            try {
                ContentRedering += this.MessageTemplate[this.content.term][0];
            } catch(e) {return this.content}

            //もし標的ユーザーが空じゃないなら文章とユーザーを続けて追加
            if ( this.content.targetUser !== "" ) {
                if ( String(this.UserIndex[this.content.targetUser].username) === undefined ) {
                    this.needUserIndex(this.content.targetUser);
                } else {
                    ContentRedering += String(this.UserIndex[this.content.targetUser].username);

                }

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
            style="width:100%; word-wrap:break-word"
            class="d-flex justify-center text-medium-emphasis"
        >
            <span>
                {{ (UserIndex[content.triggeredUser]!==undefined)?UserIndex[content.triggeredUser].username:needUserIndex(content.triggeredUser) }}
            </span>
            <span>
                {{ MessageTemplate[content.term][0] }}
            </span>
            <span v-if="content.targetUser!==''">
                {{ (UserIndex[content.targetUser]!==undefined)?UserIndex[content.targetUser].username:needUserIndex(content.targetUser) }}
                {{ MessageTemplate[content.term][1] }}
            </span>
        </span>
    </span>
</template>