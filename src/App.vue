<template>
  <v-app>
    <v-app-bar color="primary" prominent>
      <v-app-bar-title>
        <v-icon icon="mdi-airplane" class="mr-2"></v-icon>
        Flight Builder
      </v-app-bar-title>
      
      <template v-slot:append>
        <v-btn
          :icon="theme.global.name.value === 'dark' ? 'mdi-weather-night' : 'mdi-weather-sunny'"
          @click="toggleTheme"
          variant="text"
        ></v-btn>
      </template>
    </v-app-bar>

    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>

<script setup>
import { useTheme } from 'vuetify'

const theme = useTheme()

const toggleTheme = () => {
  theme.global.name.value = theme.global.current.value.dark ? 'light' : 'dark'
}
</script>

<style scoped>
</style>

