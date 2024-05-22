import { createRouter, createWebHistory } from 'vue-router'
//import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [ //ルーティング
    {
      path: '/',
      name: 'home',
      component: () => import('../components/ChannelBrowser.vue')
    },
    {
      path: '/auth',
      name: 'Auth',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../components/Auth.vue')
    },
    { //チャンネルブラウザ
      path: '/browser',
      name: 'Browser',
      component: () => import('../components/ChannelBrowser.vue')
    },
    { //チャンネル画面
      path: '/c/:id',
      name: 'Channel',
      component: () => import('../components/ChannelWindow.vue')
    },
    { //JSON見るためだけのページ(デバッグ用)
      path: '/jsonviewer/',
      name: 'JSONviewer',
      component: () => import('../components/JSONviewer.vue')
    },
    { //オンラインのユーザーリスト
      path: '/onlineuser/',
      name: 'OnlineUser',
      component: () => import('../components/OnlineUsers.vue')
    },

    /**
     * アイコン
     */
    { //オンラインのユーザーリスト
      path: '/img/:userId',
      name: 'icon',
      component: null
    },
  ],
  scrollBehavior(to, from, savedPosition) { //スクロール位置の処理
    if (savedPosition) {
      return savedPosition
    } else {
      return { x: 0, y: 0 }
    }
  }  
})

export default router
