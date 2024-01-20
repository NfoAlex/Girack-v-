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
      showVideoLink: "", //動画のURL保存用

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

    checkImageAvailable(link) {
      try {
        if (link.img.length !== 0) {
          return true;
        } else {
          return false;
        }
      }
      catch(e) {
        return false;
      }
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
        //return video[0].url;
        if (typeof video === "object") {
          return video[0].url; //表示するものを設定
        } else {
          return video.url; //画像一つでも配列へ追加
        }
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
    <div style="overflow-y:auto; height:95vh;">
      <div class="mx-auto">
        <v-card
          v-for="img in imageDialogUrls"
          style="margin:64px 0; z-index:5; height:fit-content; width:fit-content;"
          color="rgba(0,0,0,0.55)"
          class="rounded-b-lg rounded-t-0 mx-auto text-center pa-0"
          :key="img"
        >
          <!-- 画像そのもの -->
          <img :src="img" style="max-width:100%; max-height:75vh;" />
          <!-- 画像URL -->
          <p class="ma-2 text-subtitle-2">{{ img }}</p>
        </v-card>
      </div>
    </div>
  </v-dialog>

  <!-- 動画拡大ダイアログ -->
  <v-dialog
    v-model="showVideo"
    style="max-width:90vw"
    @dblclick="showVideo = false"
  >
    <div style="height:100vh;">
      <div class="mx-auto">
        <span
          style="z-index:5; height:fit-content; width:fit-content;"
          color="rgba(0,0,0,0.75)"
          class="rounded-b-lg rounded-t-0 mx-auto text-center pa-0"
        >
          <v-btn
            @click="showVideo = false;"
            class="rounded my-1"
            block
          >
            閉じまくり
          </v-btn>
          <!-- 動画本体 -->
          <video
            v-if="showVideo"
            class="rounded"
            :src="showVideoLink"
            style="width:100%; cursor: pointer"
            controls
          >
          </video>
        </span>
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

    <!-- 画像単体用 -->
    <div
        v-if="link.mediaType === 'image'"
        class="rounded-lg"
      >
      <img
        @click="toggleImageDialog(index)"
        class="rounded-lg"
        style="max-width:90%; max-height:250px;"
        :src="link.img"
        v-on:load="imageAloneLoaded()"
      />
      <img
        style="max-width:90%; height:250px;"
        v-if="!imageAloneLoadState"
        src="/loading.svg"
      />
    </div>

    <!-- 動画単体用 -->
    <div
      v-if="link.mediaType === 'video'"
      class="rounded-lg d-flex flex-column justify-start"
      style="max-width: 500px"
    >
      <v-btn
        v-if="!showVideo"
        @click="showVideo = true"
        size="large"
        class="rounded-lg"
      >
        <v-icon>mdi:mdi-play-box-outline</v-icon>動画を表示
      </v-btn>

      <video
        v-if="showVideo"
        :src="link.url"
        style="max-width: 90%; max-height: 90%; cursor: pointer"
        controls
      >
      </video>

      <!-- 動画を隠すボタン -->
      <v-btn
        v-if="showVideo"
        @click="showVideo = false"
        class="rounded-lg mt-1"
        variant="text"
        style="width:fit-content;"
      >
        <v-icon>mdi:mdi-unfold-less-horizontal</v-icon>動画を非表示にします
      </v-btn>

    </div>

    <!-- URLプレビュー -->
    <v-card
      v-if="link.mediaType !== 'image' && link.mediaType !== 'video'"
      style="max-width:45%;"
    >

      <!-- 埋め込み用画像 -->
      <v-img
        v-if="link.img !== undefined && checkImageAvailable(link)"
        @click="toggleImageDialog(index)"
        style="cursor:pointer"
        max-height="250"
        :src="getImage(link.img)"
        cover
      >
        <!-- 画像をロード中の時のホルダー -->
        <template v-slot:placeholder>
          <span style="height:100%; width:auto"> Loading... </span>
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

      <v-divider></v-divider>

      <!-- タイトル表示 -->
      <div
        style="white-space:initial; font-size:14px;"
        class="pa-4 d-flex align-center"
      >
        <!-- ウェブサイトのファビコン -->
        <v-avatar
          :image="link.favicon"
          size="24"
          class="mr-3"
        >
        </v-avatar>

        <!-- 記事のタイトルテキスト -->
        <p
          v-if="link.title !== undefined"
        >
          <a :href="link.url" target="_blank">
            {{
              link.title.length > 45
                ? link.title.substring(0, 45) + "..."
                : link.title
            }}

            <!-- タイトルが60文字以上ならホバーで表示 -->
            <v-tooltip
              v-if="link.title.length > 45"
              activator="parent"
              location="top"
            >
              {{ link.title }}
            </v-tooltip>
            
          </a>
        </p>

      </div>

      <v-divider></v-divider>

      <v-card-text>
        <!-- 記事の概要 -->
        <p
          v-if="link.description"
          class="text-body-2 font-weight-light text-medium-emphasis"
          style="overflow-y:scroll; max-height:100px;"
        >
          {{ link.description }}
        </p>
      </v-card-text>
    </v-card>

  </div>
</template>

<style scoped>
.previewContainer::-webkit-scrollbar {
  display: none;
}

</style>
