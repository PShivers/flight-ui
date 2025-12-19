const API_BASE_URL = 'http://localhost:3001/api';

class BatchApiService {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Batch operations
  async getBatches() {
    return this.request('/batches');
  }

  async getBatch(id) {
    return this.request(`/batches/${id}`);
  }

  async createBatch(title) {
    return this.request('/batches', {
      method: 'POST',
      body: JSON.stringify({ title }),
    });
  }

  async updateBatch(id, title) {
    return this.request(`/batches/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ title }),
    });
  }

  async deleteBatch(id) {
    return this.request(`/batches/${id}`, {
      method: 'DELETE',
    });
  }

  // Flight operations
  async addFlight(batchId, flight) {
    return this.request(`/batches/${batchId}/flights`, {
      method: 'POST',
      body: JSON.stringify({
        origin: flight.origin,
        destination: flight.destination,
        departureTime: flight.departureTime,
        arrivalTime: flight.arrivalTime,
        aircraftType: flight.aircraftType,
      }),
    });
  }

  async updateFlight(flightId, flight) {
    return this.request(`/flights/${flightId}`, {
      method: 'PUT',
      body: JSON.stringify({
        origin: flight.origin,
        destination: flight.destination,
        departureTime: flight.departureTime,
        arrivalTime: flight.arrivalTime,
        aircraftType: flight.aircraftType,
      }),
    });
  }

  async deleteFlight(flightId) {
    return this.request(`/flights/${flightId}`, {
      method: 'DELETE',
    });
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }
}

export default new BatchApiService();