import { createApp } from 'vue'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import App from './App.vue'
import router from './router'

const vuetify = createVuetify({
  components,
  directives,
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: {
      mdi,
    },
  },
  theme: {
    defaultTheme: 'dark',
    themes: {
      light: {
        colors: {
          primary: '#1976D2',
        },
      },
      dark: {
        colors: {
          primary: '#2196F3',
        },
      },
    },
  },
})

createApp(App)
  .use(vuetify)
  .use(router)
  .mount('#app')

