import { ref } from "vue";

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

//ユーザーが最後に読んだ時間リスト
const MsgReadTime = ref({
  "0001": {
    time: "200101010000000000",
    new: 0,
    mention: 0,
  },
});

//ユーザー情報(名前とかロールとか)
// const UserIndex = ref({

// });

//スクロールしきっているかどうか(別コンポーネントでも使えるように独立させている)
const StateScrolled = ref(false);

//履歴DB返すだけ
export function dataMsg() {
  return { MsgDB, StateScrolled, MsgReadTime };
}
