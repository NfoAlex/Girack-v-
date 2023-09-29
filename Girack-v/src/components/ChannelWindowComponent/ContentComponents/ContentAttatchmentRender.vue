<script>

export default {
  props: ["fileData", "channelid"],

  data() {
    return {
      filesrc: window.location.origin + "/file/",
      imageDialogShow: false, //画像拡大ダイアログ用
      imageDialogSrc: "",
    };
  },

  methods: {
    //ファイルサイズの値を読める形の単位に変換(https://stackoverflow.com/questions/10420352/converting-file-size-in-bytes-to-human-readable-string)
    humanFileSize(bytes, si = false, dp = 1) {
      const thresh = si ? 1000 : 1024;

      if (Math.abs(bytes) < thresh) {
        return bytes + " B";
      }

      const units = si
        ? ["kB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]
        : ["KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB", "YiB"];
      let u = -1;
      const r = 10 ** dp;

      do {
        bytes /= thresh;
        ++u;
      } while (
        Math.round(Math.abs(bytes) * r) / r >= thresh &&
        u < units.length - 1
      );

      return bytes.toFixed(dp) + " " + units[u];
    },

    //添付ファイルのアイコン表記
    attatchmentDisplayIcon(type) {
      console.log(
        "ContentAttatchmentRender :: attachmentDisplayIcon : type",
        type
      );

      //動画ファイルなら動画アイコンを返す
      if (type.includes("video/")) return "file-video";

      //音ファイルなら音楽アイコンを返す
      if (type.includes("audio/")) return "file-music";

      //テキスト系のファイルならテキストアイコンを返す
      if (type.includes("text/")) return "text-box-edit";

      //拡張子にあわせてアイコンの名前を返す
      switch (type) {
        case "application/pdf":
          return "file-pdf-box";

        case "text/x-python":
          return "language-python";

        case "application/x-zip-compressed":
          return "zip-box";

        case "application/x-msdownload": //exeファイル
          return "application-brackets-outline";

        case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
          return "microsoft-excel";

        case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
          return "microsoft-word";

        case "image/gif":
          return "file-gif-box";

        default:
          return "file";
      }
    },

    //ファイルをダウンロードさせる
    downloadFile(file) {
      let objAnchor = document.createElement("a"); //アンカーオブジェクト作成
      objAnchor.href = this.filesrc + this.channelid + '/' + file.fileid; //URL設定
      objAnchor.type = file.type; //ファイルタイプを設定
      objAnchor.download = file.name; //ファイル名追加
      document.body.appendChild(objAnchor); //DOMとして追加
      objAnchor.click(); //クリック処理をしてダウンロード

      //アンカーを削除
      objAnchor.parentNode.removeChild(objAnchor);
    }
  },
};
</script>

<template>
  <!-- 画像拡大ダイアログ -->
  <v-dialog
    v-model="imageDialogShow"
    style="max-width: 90vw; height:100vh;"
    @dblclick="imageDialogShow = false"
  >
    <div style="height:5vh;" class="d-flex align-center justify-end">
      <v-btn
        @click="imageDialogShow = false"
        icon="mdi:mdi-close"
        color="rgba(0,0,0,0.75)"
        style="height:4vh; width:4vh; top:0px; right:0%; z-index:10; float:right;"
      >
        <v-icon>mdi:mdi-close</v-icon>
        <v-tooltip activator="parent" location="bottom">
          画像のダブルクリックでも閉じます
        </v-tooltip>
      </v-btn>
    </div>
    <div style="overflow-y: auto;">
      <!-- 画像本編 -->
      <v-card
        style="margin: 32px 0; width: fit-content; height: fit-content;"
        color="rgba(0,0,0,0.75)"
        class="rounded-b-lg rounded-t-0 mx-auto text-center"
      >
        <!-- 画像そのもの -->
        <!-- <v-img max-height="90vh" :src="imageDialogSrc"> -->
        <img :src="imageDialogSrc" style="max-width:100%; max-height:100%;" />
        <!-- 画像URL -->
        <p class="ma-2 text-subtitle-2">{{ imageDialogSrc }}</p>
      </v-card>
    </div>
  </v-dialog>

  <div>
    <v-card
      class="rounded-lg px-2 py-2 ma-2 d-flex align-center justify-space-between"
      style="max-width:95%;"
      v-for="file in fileData.attatchmentData"
      :key="file"
    >
      <!-- 画像ファイルだった時のプレビュー表示 -->
      <v-img
        v-if="file.type.includes('image/') && file.size < 5e6"
        @click="
          imageDialogShow = true;
          imageDialogSrc = filesrc + channelid + '/' + file.fileid;
        "
        class="pa-2"
        style="height: fit-content; max-height: 150px; width: 100%; max-width: 250px; cursor: pointer"
        :src="filesrc + channelid + '/' + file.fileid"
      >
        <template v-slot:error>
          <div class="mx-auto" style="width: fit-content; min-height: 150px">
            <v-icon size="large"> mdi:mdi-file-image-remove </v-icon>
          </div>
        </template>

        <template v-slot:placeholder>
          <p style="height: 150px !important; width: 100%">Loading...</p>
        </template>
      </v-img>

      <!-- 添付ファイルのアイコン表記 -->
      <span v-if="!file.type.includes('image/') || file.size > 5e6">
          <v-icon
            style="margin: 0 16px"
            size="x-large"
          >
            mdi:mdi-{{ attatchmentDisplayIcon(file.type) }}
          </v-icon>
      </span>

      <!-- ファイル情報の表示 -->
      <span class="flex-grow-1 ml-3" style=" max-width: max-content;">
        <div @click="downloadFile(file)" class="d-flex align-center" style="cursor:pointer;">
          <p class="text-subtitle-1">
            {{
              file.name
            }}
          </p>
          <v-icon size="small">mdi:mdi-download</v-icon>
        </div>
        <span class="text-medium-emphasis d-flex">
          <span class="d-flex">
            サイズ: <v-chip size="small" class="mx-1">{{ humanFileSize(file.size) }}</v-chip> |
          </span>
          <span class="ml-1 d-flex">
            種類: <v-chip size="small" class="mx-1">{{ file.type }}</v-chip>
          </span>
        </span>
      </span>
    </v-card>
  </div>
</template>

<style scoped></style>
