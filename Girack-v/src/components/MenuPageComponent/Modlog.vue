<script>
import { getSocket } from '../../data/socket';
const socket = getSocket();

export default {
    data() {
        return {
            modlog: []
        }
    },

    methods: {
        SOCKETinfoModlog() {

        }
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