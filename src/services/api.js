import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_LAMBDA_URL || 'http://localhost:9000'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const invokeLambda = async (flights) => {
  try {
    const response = await api.post('/invoke', { flights })
    return response.data
  } catch (error) {
    console.error('Error invoking Lambda:', error)
    throw error
  }
}

export default api

