import { createVuetify } from 'vuetify'

import colors from 'vuetify/lib/util/colors'

export default createVuetify({
  theme: {
    themes: {
      light: {
        dark: true,
        colors: {
          primary: colors.red.darken1, // #E53935
          secondary: colors.red.lighten4, // #FFCDD2
        }
      },
    },
  },
})
