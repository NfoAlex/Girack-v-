<script>

export default {
    data() {
        return {
            txt: "---",
            gameStarted: false,
            gameEnd: false,
            targetNum: 0,
            guessNum: 0,
            input: "",
            record: 0,
        }
    },

    methods: {
        start() {
            this.gameEnd = false;
            this.targetNum = parseInt(Math.random()*100);
            this.gameStarted = true;
            this.input = "";
            this.guessNum = 0;
            this.txt = "";
            this.record = 0;

        },

        guess() {
            this.record++;
            this.guessNum = parseInt(this.input);

            if ( this.guessNum === this.targetNum ) {
                this.txt = "正解!"
                this.gameStarted = false;
                this.gameEnd = true;
                return;

            }

            if ( this.guessNum > this.targetNum ) {
                this.txt = "Lower..."

            }

            if ( this.guessNum < this.targetNum ) {
                this.txt = "Higher!"

            }

        }
    }
}

</script>

<template>
    <div class="pa-5" style="width:75%">
        <div style="width:75%">
            まあまてや
            <br>
            数当てでもやっとけ
        </div>
        
        <br>

        <v-card class="mx-auto text-center pa-5 rounded-lg" style="width:50%">
            <p class="text-h5">{{ txt }}</p>
            <p v-if="gameStarted" class="text-h3">{{ guessNum }}</p>
            <v-btn @click="start" v-if="!gameStarted" color="primary">
                ゲーム開始
            </v-btn>
            <br>
            <v-text-field
                v-if="gameStarted"
                v-model="input"
                class="mx-auto"
                label="予想!"
                style="width:50%"
                variant="solo"
            ></v-text-field>
            <v-btn @click="guess" class="ma-2" color="green" v-if="gameStarted">
                GUESS...
            </v-btn>
            <v-btn @click="start" class="ma-2" color="blue" v-if="gameEnd">
                もう１回やる
            </v-btn>

            <p>{{ record }}回目のトライ</p>
        </v-card>
    </div>
    

</template>