import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [ //ルーティング
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/auth',
      name: 'Auth',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../components/Auth.vue')
    },
    {
      path: '/menu/',
      name: 'Menu',
      component: () => import('../components/MenuPageComponent/Menu.vue'),
      children: [
        {
          path: "profile",
          component: () => import('../components/MenuPageComponent/Profile.vue'),
        },
        {
          path: "settings",
          component: () => import('../components/MenuPageComponent/Settings.vue'),
        },
        {
          path: "modlog",
          component: () => import('../components/MenuPageComponent/Modlog.vue'),
        },
        {
          path: "serversettings",
          component: () => import('../components/MenuPageComponent/ServerSettings.vue'),
        },
        {
          path: "members",
          component: () => import('../components/MenuPageComponent/Members.vue'),
        },
        {
          path: "aboutgirack",
          component: () => import('../components/MenuPageComponent/AboutGirack.vue'),
        },
      ]
    },
    { //チャンネルブラウザ
      path: '/browser',
      name: 'Channel Browser',
      component: () => import('../components/ChannelBrowser.vue')
    },
    { //チャンネル画面
      path: '/c/:id',
      name: 'Channel',
      component: () => import('../components/ChannelWindow.vue')
    },
    { //JSON見るためだけのページ(デバッグ用)
      path: '/jsonviewer/',
      name: 'JSON viewer',
      component: () => import('../components/JSONviewer.vue')
    },
    { //オンラインのユーザーリスト
      path: '/onlineuser/',
      name: 'Online User',
      component: () => import('../components/OnlineUsers.vue')
    }
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
