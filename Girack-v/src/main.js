import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// Vuetify
import 'vuetify/styles'
import colors from 'vuetify/lib/util/colors'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

const vuetify = createVuetify({
    theme: {
        themes: {
            light: { //name swapped!!!!!
                dark: false,
                colors: {
                    background: "whitesmoke",
                    primary: colors.purple.lighten2, // #E53935
                    secondary: colors.purple.lighten4, // #FFCDD2
                }
            },
            dark: { //name swapped!!!!!
                dark: true,
                colors: {
                    background: "#FFFFFF",
                    primary: "#5E35B1", // #E53935
                    secondary: "#EDE7F6", // #FFCDD2
                }
            },
        },
        defaultTheme: "dark"
    },
    components,
    directives,
})

import './assets/main.css'

const app = createApp(App)

app.use(vuetify)
app.use(router)

app.mount('#app')
