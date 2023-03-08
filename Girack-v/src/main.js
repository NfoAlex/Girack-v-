import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// Vuetify
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { aliases, fa } from 'vuetify/iconsets/fa'
import {mdi} from "vuetify/lib/iconsets/mdi"
import '@mdi/font/css/materialdesignicons.css'
import 'material-design-icons-iconfont/dist/material-design-icons.css'
import '@fortawesome/fontawesome-free/css/all.css'

const vuetify = createVuetify({
    theme: {
        themes: {
            light: {
                dark: false,
                colors: {
                    background: "#FAFAFA",
                    primary: "#607D8B", // #E53935
                    secondary: "#ECEFF1", // #FFCDD2
                }
            },
            dark: {
                dark: true,
                colors: {
                    background: "#212121",
                    primary: "#263238", // #E53935
                }
            },
        },
        defaultTheme: "dark"
    },
    icons: {
        defaultSet: "fa",
        iconfont: "mdi",
        aliases,
        sets: {
            mdi, fa
        }
    },
    components,
    directives,
})

import './assets/main.css'

const app = createApp(App)

app.use(vuetify)
app.use(router)

app.mount('#app')
