import { createRouter, createWebHistory } from 'vue-router'
import FlightBuilder from '../views/FlightBuilder.vue'

const routes = [
  {
    path: '/',
    name: 'FlightBuilder',
    component: FlightBuilder
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router

