<script>
import { getSocket } from '../../data/socket';
import { dataUser } from '../../data/dataUserinfo';
const socket = getSocket();

export default {
    setup() {
        const { myUserinfo } = dataUser();
        return { myUserinfo };
    
    },

    data() {
        return {
            modlog: []
        }
    },

    methods: {
        SOCKETinfoModlog(dat) {
            console.log("Modlog :: SOCKETinfoModlog : dat->", dat);

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
        <div style="width:90%; padding-top:3%" class="text-left align-center">
            <p class="text-left" style="font-size:min(4vh,36px)">
                監査ログ
            </p>
        </div>

        <div>

        </div>
    </div>
</template>