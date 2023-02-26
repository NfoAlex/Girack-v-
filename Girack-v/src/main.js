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
                    primary: "#607D8B", // #E53935
                    secondary: "#ECEFF1", // #FFCDD2
                }
            },
            dark: { //name swapped!!!!!
                dark: true,
                colors: {
                    background: "gray",
                    primary: "#263238", // #E53935
                    secondary: "#546E7A", // #FFCDD2
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
