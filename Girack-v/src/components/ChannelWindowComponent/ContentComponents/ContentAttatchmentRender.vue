<script>
import { getCONFIG } from "../../../config.js";
import { saveAs } from "file-saver";

export default {
  setup() {
    const { CONFIG_DISPLAY } = getCONFIG();
    return { CONFIG_DISPLAY };
  },

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
      /*
      console.log(
        "ContentAttatchmentRender :: attachmentDisplayIcon : type",
        type
      );
      */

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

    downloadFile(file) {
      fetch(this.filesrc + this.channelid + '/' + file.fileid)
      .then(response => response.blob())
      .then(blob => {
        saveAs(blob, file.name); //保存する
      })
      .catch((error) => {
        console.error('ContentAttatchmentRender :: donwloadFile : Error->', error);
      });
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
    <!-- 閉じるボタン -->
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
    <!-- 画像そのもの -->
    <div class="d-flex justify-center align-center" style="height:80vh; width:100%;">
      <img :src="imageDialogSrc" style="max-width:100%; max-height:100%;" />
    </div>
    <!-- 画像URL -->
    <div class="d-flex justify-center my-1" style="height:10vh">
      <v-card
        class="d-flex align-center rounded-lg"
        style="height:fit-content"
      >
        <p class="ma-1 text-subtitle-2">{{ imageDialogSrc }}</p>
      </v-card>
    </div>
  </v-dialog>

  <!-- ファイル添付表示 -->
  <div>

    <v-card
      v-for="file in fileData.attatchmentData"
      :key="file.name"
      style="width:50%; max-width:450px"
    >
      <!-- 画像ならカバーとして表示 -->
      <v-img
        v-if="file.type.includes('image/') && file.size < CONFIG_DISPLAY.CONTENT_DISPLAYIMAGESIZE"
        @click="
          imageDialogShow = true;
          imageDialogSrc = filesrc + channelid + '/' + file.fileid;
        "
        class="imageCover"
        :src="filesrc + channelid + '/' + file.fileid"
        height="200"
        cover
      ></v-img>

      <!-- 添付ファイルのアイコン表記 -->
      <span
        v-if="!file.type.includes('image/') || file.size > CONFIG_DISPLAY.CONTENT_DISPLAYIMAGESIZE"
        class="my-3"
      >
        <v-icon
          size="64"
          class="mx-2 my-4"
        >
          mdi:mdi-{{ attatchmentDisplayIcon(file.type) }}
        </v-icon>
      </span>

      <v-divider></v-divider>
    
      <!-- ファイル名表示 -->
      <v-card-title style="font-size:16px">
        {{ file.name }}
      </v-card-title>

      <v-card-text class="text-medium-emphasis d-flex">
        <span class="d-flex align-center">
          サイズ: <v-chip size="small" class="mx-1">{{ humanFileSize(file.size) }}</v-chip> |
        </span>
        <span class="ml-1 d-flex">
          種類: <v-chip size="small" class="mx-1">{{ file.type }}</v-chip>
        </span>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-action>
        <v-btn
          @click="downloadFile(file)"
          variant="text"
          class="ma-1"
        >
          <v-icon size="small">mdi:mdi-download</v-icon>
          ダウンロード
        </v-btn>
      </v-card-action>

    </v-card>

  </div>
</template>

<style scoped>

/* 画像でカーソルを反応させる用 */
.imageCover {
  cursor: pointer;
}

</style>
