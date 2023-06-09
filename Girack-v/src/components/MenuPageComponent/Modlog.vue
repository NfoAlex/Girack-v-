<script>
import { backendURI, getSocket } from '../../data/socket';
import { dataUser } from '../../data/dataUserinfo';
const socket = getSocket();

export default {
    setup() {
        const { myUserinfo } = dataUser();
        return { myUserinfo, backendURI };
    
    },

    data() {
        return {
            modLogDisplay: [],
            actionameIndex: {
                messageDelete: "メッセージの削除"
            }
        }
    },

    methods: {
        //起こされた変更の表示名
        getActionname(actioname) {
            try {
                return this.actionameIndex[actioname];
            } catch(e) {
                return "変更情報";
            }

        },

        SOCKETinfoModlog(modLog) {
            console.log("Modlog :: SOCKETinfoModlog : dat->", modLog);
            this.modLogDisplay = modLog.data;

        }
    },

    mounted() {
        socket.on("infoModlog", this.SOCKETinfoModlog);

        socket.emit("getModlog", {
            startLength: 0,
            reqSender: {
                userid: this.myUserinfo.userid,
                sessionid: this.myUserinfo.sessionid
            }
        });

    },

    unmounted() {
        //socket重複防止
        socket.off("infoModlog", this.SOCKETinfoModlog);

    }

}
</script>

<template>
    <div style="height:100vh; width:90%;" class="d-flex align-center flex-column">
        <!-- ページタイトル -->
        <div style="width:90%; padding-top:3%; margin-bottom:16px;" class="text-left align-center">
            <p class="text-left" style="font-size:min(4vh,36px)">
                監査ログ
            </p>
        </div>

        <div style="overflow-y:auto; width:100%;">
            
            <v-expansion-panels style="width:90%">
                
                <v-expansion-panel
                    v-for="(item,index) in modLogDisplay"
                    :key="item.actionId"
                    class="rounded-lg"
                >

                    <!-- カードタイトル -->
                    <v-expansion-panel-title>
                        <!-- やった人のアイコン -->
                        <v-avatar size="small" style="margin-right:8px;">
                            <v-img alt="icon" :src="backendURI+'/img/'+item.actionBy">
                            </v-img>
                        </v-avatar>

                        <!-- 矢印 -->
                        <v-icon style="margin-right:8px;">
                            mdi:mdi-arrow-right
                        </v-icon>

                        <!-- 受けた人のアイコン -->
                        <v-avatar size="small" style="margin-right:16px;">
                            <v-img alt="icon" :src="backendURI+'/img/'+item.actionTo.targetid">
                            </v-img>
                        </v-avatar>

                        {{ getActionname(item.actionInfo.actionname) }}

                    </v-expansion-panel-title>

                    <!-- やったことの内容 -->
                    <v-expansion-panel-text>
                        asdf
                    </v-expansion-panel-text>

                </v-expansion-panel>

            </v-expansion-panels>
        </div>
    </div>
</template>