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
      path: '/login',
      name: 'Login',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../components/Login.vue')
    },
    {
      path: '/user',
      name: 'User Page',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../components/User.vue')
    },
    { //チャンネルブラウザ
      path: '/c/browser',
      name: 'Channel Browser',
      component: () => import('../components/ChannelBrowser.vue')
    },
    { //チャンネル画面
      path: '/c/:id',
      name: 'Channel',
      component: () => import('../components/ChannelWindow.vue')
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
