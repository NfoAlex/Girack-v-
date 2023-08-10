<script>
import Tweet from "vue-tweet";

export default {
  props: ["urlData"],
  components: { Tweet },

  data() {
    return {
      //画像拡大ダイアログ用
      imageDialogShow: false, //表示するかどうか
      imageDialogUrls: [], //表示する画像用

      imageAloneLoadState: false, //画像単体の時のロード状態

      showVideo: false, //動画を表示するかどうか

      embedTwitter: false, //Twitter埋め込みを表示するかどうか
    };
  },

  methods: {
    //画像拡大ダイアログ操作用
    toggleImageDialog(index) {
      this.imageDialogUrls = []; //表示する画像配列を初期化

      //if ( this.urlData.data[index].img )
      if (typeof this.urlData.data[index].img === "string") {
        this.imageDialogUrls.push(this.urlData.data[index].img); //画像一つでも配列へ追加
      } else {
        this.imageDialogUrls = this.urlData.data[index].img; //表示するものを設定
      }

      this.imageDialogShow = true; //ダイアログ表示
    },

    //URLデータから画像を取得する
    getImage(img) {
      if (typeof img === "object") {
        return img[0]; //表示するものを設定
      } else {
        return img; //画像一つでも配列へ追加
      }
    },

    checkVideoAvailable(link) {
      try {
        if (link.video.length !== 0) {
          return true;
        } else {
          return false;
        }
      } catch(e) {
        return false;
      }
    },

    //URLデータから最初の動画部分を抽出
    getVideo(video) {
      try {
        return video[0].url;
      } catch(e) {
        return "";
      }
    },

    //ツイートのURLを抽出
    getTweetURL(url) {
      //IDを取り出すための正規表現条件
      const regexes = [
        /https?:\/\/twitter\.com\/(\w+)\/status(es)?\/(\d+)/,
        /https?:\/\/twitter\.com\/(?:#!\/)?(\w+)\/status(es)?\/(\d+)/,
        /https?:\/\/mobile\.twitter\.com\/(\w+)\/status(es)?\/(\d+)/,
      ];

      //条件からそれぞれ調べてIDを返す
      for (let regex of regexes) {
        //探しまくり
        let match = url.match(regex);
        //もし見つかってたら返す
        if (match) return match[match.length - 1];
      }
    },

    //画像単体時での画像ロードが検知されたときのロードされたと設定
    imageAloneLoaded() {
      this.imageAloneLoadState = true; //ロードできた
    },

    //ツイートの読み込みができなかったとき
    tweetErrorHandler() {
      this.embedTwitterError = true;
    },
  },
};
</script>

<template>
  <!-- 画像拡大ダイアログ -->
  <v-dialog
    v-model="imageDialogShow"
    style="max-width:90vw"
    @dblclick="imageDialogShow = false"
  >
    <div style="overflow-y: auto">
      <div class="mx-auto">
        <span
          style="width: 99%; position:sticky; top: 0px; z-index: 10;"
          class="d-flex flex-row-reverse"
        >
          <v-btn
            @click="imageDialogShow = false"
            class="rounded-pill"
            color="rgba(0,0,0,0.75)"
          >
            <v-icon>mdi:mdi-close</v-icon>ダイアログを閉じる
            <v-tooltip activator="parent" location="bottom">
              画像のダブルクリックでも閉じます
            </v-tooltip>
          </v-btn>
        </span>
        <v-card
          v-for="img in imageDialogUrls"
          style="margin:64px 0; z-index:5; height:fit-content; width:fit-content;"
          color="rgba(0,0,0,0.75)"
          class="rounded-b-lg rounded-t-0 mx-auto text-center pa-0"
          :key="img"
        >
          <!-- 画像そのもの -->
          <!-- <v-img style="max-height:90vh;" :src="img"> </v-img> -->
          <img :src="img" style="max-width:100%; max-height:100%;" />
          <!-- 画像URL -->
          <p class="ma-2 text-subtitle-2">{{ img }}</p>
        </v-card>
      </div>
    </div>
  </v-dialog>

  <div v-for="(link, index) in urlData.data" :key="link">
    <!-- Twitterリンク用 -->
    <div
      class="pa-3"
      v-if="
        link.url.includes('https://twitter.com/') &&
        link.url.includes('/status/')
      "
    >
      <v-btn
        class="rounded-lg"
        @click="embedTwitter = !embedTwitter"
        color="blue"
        size="small"
      >
        <v-icon>mdi:mdi-twitter</v-icon>
        <span v-if="!embedTwitter">埋め込みリンクを表示</span>
        <span v-else>埋め込みを隠す<v-icon>mdi:mdi-window-close</v-icon></span>
      </v-btn>
    </div>

    <!-- ツイートじゃないTwitterのリンクの場合 -->
    <div
      class="pa-3"
      v-if="
        link.url.includes('https://twitter.com/') &&
        !link.url.includes('/status/')
      "
    >
      <a :href="link.url" target="_blank">
        <v-btn class="rounded-lg" color="blue" size="small">
          <v-icon>mdi:mdi-open-in-new</v-icon>
          Twitterのページへ飛ぶ
        </v-btn>
      </a>
    </div>

    <!-- Twitter埋め込み表示 -->
    <div v-if="embedTwitter">
      <Tweet
        style="max-width: 350px; width: 30%; background: black"
        :tweet-id="getTweetURL(link.url)"
        theme="dark"
        lang="ja"
        :dnt="true"
      >
        <!-- 読み込み中 -->
        <template v-slot:loading>
          <v-chip>Loading...</v-chip>
        </template>
        <!-- エラー -->
        <template v-slot:error>
          <span>読み込みエラー</span>
        </template>
      </Tweet>
    </div>

    <!-- それ以外のプレビュー -->
    <div
      style="height: fit-content; max-width: 800px; width: 95%; margin: 8px 0"
      color="#222"
      class="overflow-y-hidden d-flex flex-row"
      v-if="!link.url.includes('https://twitter.com/')"
    >
      <!-- ウェブ記事とかそこらへん用 -->
      <v-card
        v-if="link.mediaType !== 'image'"
        color="#222"
        class="pa-3 rounded-lg d-flex flex-row"
        style="min-width: 45%; width: 85%"
        :style="
          link.img !== undefined && link.img.length !== 0
            ? 'height:150px'
            : 'height:fit-content;'
        "
      >
        <!-- 埋め込み用画像 -->
        <v-img
          v-if="link.img !== undefined && link.img.length !== 0"
          class="flex-shrink-1 rounded-lg"
          @click="toggleImageDialog(index)"
          style="min-width: 30%; width: fit-content; cursor: pointer"
          :src="getImage(link.img)"
        >
          <!-- 画像をロード中の時のホルダー -->
          <template v-slot:placeholder>
            <span style="height: 100%; width: 150px"> Loading... </span>
          </template>

          <!-- 画像が２枚以上あるならホバーで表示 -->
          <v-tooltip
            v-if="typeof link.img === 'object' && link.img.length >= 2"
            activator="parent"
            location="top center"
            origin="overlap"
          >
            {{ link.img.length }}枚の画像を表示
          </v-tooltip>
          <!-- 画像が2枚以上あった時の枚数表示 -->
          <v-badge
            v-if="typeof link.img === 'object' && link.img.length >= 2"
            :content="link.img.length"
            inline
          >
          </v-badge>
        </v-img>

        <!-- 埋め込み用動画 -->
        <span
          v-if="link.img.length === 0 && checkVideoAvailable(link)"
          style="max-width: 30%; max-height: 50%; cursor: pointer"
          class="d-flex flex-column align-center justify-center mr-2"
        >
          <v-btn
            v-if="!showVideo"
            @click="showVideo = true"
            class="rounded-lg"
            icon="mdi:mdi-play-box-outline"
          >
          </v-btn>
          <video
            v-if="showVideo"
            :src="getVideo(link.video)"
            style="max-width: 90%; max-height: 90%; cursor: pointer"
            controls
          >
          </video>
          <v-btn
            v-if="showVideo"
            @click="showVideo = false"
            class="rounded-lg mx-auto mt-1"
            icon="mdi:mdi-unfold-less-horizontal"
          >
          </v-btn>
        </span>

        <!-- タイトル、概要 -->
        <div class="d-flex flex-column flex-grow-1">
          <!-- ファビコンとタイトル用 -->
          <div style="margin-left: 16px" class="d-flex flex-row align-center">
            <!-- ウェブサイトのファビコン -->
            <v-avatar
              class="rounded-lg"
              style="margin: 4px 4px"
              :image="link.favicon"
              size="24"
            >
            </v-avatar>

            <!-- 記事のタイトル -->
            <p class="text-subtitle-2" v-if="link.title !== undefined">
              <a :href="link.url" target="_blank">
                {{
                  link.title.length > 60
                    ? link.title.substring(0, 60) + "..."
                    : link.title
                }}
                <!-- タイトルが60文字以上ならホバーで表示 -->
                <v-tooltip
                  v-if="link.title.length > 60"
                  activator="parent"
                  location="top"
                >
                  {{ link.title }}
                </v-tooltip>
              </a>
            </p>
          </div>

          <!-- 記事の概要 -->
          <p
            v-if="link.description"
            class="text-body-2 ma-3 font-weight-light text-medium-emphasis"
          >
            {{
              link.description.length > 135
                ? link.description.substring(0, 135) + "..."
                : link.description
            }}
          </p>
        </div>
      </v-card>

      <!-- 画像単体用 -->
      <div
        v-if="link.mediaType === 'image'"
        class="rounded-lg"
        style="width: 500px"
      >
        <img
          @click="toggleImageDialog(index)"
          class="rounded-lg previewSingleImage"
          :src="link.img"
          v-on:load="imageAloneLoaded()"
        />
        <img
          style="height: 150px"
          v-if="!imageAloneLoadState"
          src="/loading.svg"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.previewContainer::-webkit-scrollbar {
  display: none;
}

.previewSingleImage {
  margin: 4px 8px;

  max-height: 150px;
  min-height: 30px;
  height: fit-content;

  min-width: 30%;
  max-width: 150px;
  width: fit-content;

  cursor: pointer;
}
</style>
