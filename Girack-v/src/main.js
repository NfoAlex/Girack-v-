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
            thelight: {
                dark: false,
                colors: {
                    background: "#212121",
                    surface: "#CFD8DC",
                    primary: "#607D8B", // #E53935
                    secondary: "#B0BEC5", // #FFCDD2
                }
            },
            thedark: {
                dark: true,
                colors: {
                        primary: "#381E72",
                        secondary: "#332D41",
                        surface: "#19181b",
                        accent: "#9c27b0",
                        error: "#601410",
                        warning: "#4caf50",
                        success: "#8bc34a",
                }
            },
        },
        defaultTheme: "thedark"
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

const app = createApp(App)

app.use(vuetify)
export default vuetify;

app.use(router)

app.mount('#app')
