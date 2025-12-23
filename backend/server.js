const express = require('express');
const cors = require('cors');
const { statements } = require('./database');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Helper function to generate IDs
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// BATCH ROUTES

// Get next available batch number
app.get('/api/batches/next-number', (req, res) => {
  try {
    const result = statements.getMaxBatchNumber.get();
    const maxBatchNumber = result.max || 99;

    // If we've reached 999, wrap back to 100
    let nextNumber = maxBatchNumber >= 999 ? 100 : maxBatchNumber + 1;

    res.json({ nextBatchNumber: nextNumber });
  } catch (error) {
    console.error('Error getting next batch number:', error);
    res.status(500).json({ error: 'Failed to get next batch number' });
  }
});

// Get all batches with flight counts
app.get('/api/batches', (req, res) => {
  try {
    const batches = statements.getAllBatches.all();
    const batchesWithFlights = {};

    for (const batch of batches) {
      const flights = statements.getFlightsByBatchId.all(batch.id);

      batchesWithFlights[batch.id] = {
        ...batch,
        flights: flights
      };
    }

    res.json(batchesWithFlights);
  } catch (error) {
    console.error('Error getting batches:', error);
    res.status(500).json({ error: 'Failed to get batches' });
  }
});

// Get single batch
app.get('/api/batches/:id', (req, res) => {
  try {
    const batch = statements.getBatchById.get(req.params.id);
    if (!batch) {
      return res.status(404).json({ error: 'Batch not found' });
    }

    const flights = statements.getFlightsByBatchId.all(batch.id);

    res.json({ ...batch, flights: flights });
  } catch (error) {
    console.error('Error getting batch:', error);
    res.status(500).json({ error: 'Failed to get batch' });
  }
});

// Create batch
app.post('/api/batches', (req, res) => {
  try {
    const { title, batchNumber } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }
    if (!batchNumber) {
      return res.status(400).json({ error: 'Batch number is required' });
    }

    const id = generateId();
    statements.insertBatch.run(id, batchNumber, title);

    const batch = statements.getBatchById.get(id);
    res.status(201).json({ ...batch, flights: [] });
  } catch (error) {
    console.error('Error creating batch:', error);
    // Check for unique constraint violation
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'Batch number already exists' });
    }
    res.status(500).json({ error: 'Failed to create batch' });
  }
});

// Update batch
app.put('/api/batches/:id', (req, res) => {
  try {
    const { title } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }
    
    const result = statements.updateBatch.run(title, req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Batch not found' });
    }
    
    const batch = statements.getBatchById.get(req.params.id);
    const flights = statements.getFlightsByBatchId.all(req.params.id);
    res.json({ ...batch, flights });
  } catch (error) {
    console.error('Error updating batch:', error);
    res.status(500).json({ error: 'Failed to update batch' });
  }
});

// Delete batch
app.delete('/api/batches/:id', (req, res) => {
  try {
    // Delete flights first (though CASCADE should handle this)
    statements.deleteFlightsByBatchId.run(req.params.id);
    
    const result = statements.deleteBatch.run(req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Batch not found' });
    }
    
    res.json({ message: 'Batch deleted successfully' });
  } catch (error) {
    console.error('Error deleting batch:', error);
    res.status(500).json({ error: 'Failed to delete batch' });
  }
});

// FLIGHT ROUTES

// Add flight to batch
app.post('/api/batches/:batchId/flights', (req, res) => {
  try {
    const { flightNumber, origin, destination, departureTime, arrivalTime, aircraftType } = req.body;

    if (!flightNumber) {
      return res.status(400).json({ error: 'Flight number is required' });
    }
    if (!origin || !destination) {
      return res.status(400).json({ error: 'Origin and destination are required' });
    }

    // Check if batch exists
    const batch = statements.getBatchById.get(req.params.batchId);
    if (!batch) {
      return res.status(404).json({ error: 'Batch not found' });
    }

    const flightId = generateId();

    statements.insertFlight.run(
      flightId,
      req.params.batchId,
      flightNumber,
      origin,
      destination,
      departureTime || null,
      arrivalTime || null,
      aircraftType || null
    );

    const flights = statements.getFlightsByBatchId.all(req.params.batchId);
    const newFlight = flights.find(f => f.id === flightId);

    res.status(201).json(newFlight);
  } catch (error) {
    console.error('Error adding flight:', error);
    res.status(500).json({ error: 'Failed to add flight' });
  }
});

// Update flight
app.put('/api/flights/:id', (req, res) => {
  try {
    const { flightNumber, origin, destination, departureTime, arrivalTime, aircraftType } = req.body;

    if (!flightNumber) {
      return res.status(400).json({ error: 'Flight number is required' });
    }
    if (!origin || !destination) {
      return res.status(400).json({ error: 'Origin and destination are required' });
    }

    const result = statements.updateFlight.run(
      flightNumber,
      origin,
      destination,
      departureTime || null,
      arrivalTime || null,
      aircraftType || null,
      req.params.id
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Flight not found' });
    }

    res.json({ message: 'Flight updated successfully' });
  } catch (error) {
    console.error('Error updating flight:', error);
    res.status(500).json({ error: 'Failed to update flight' });
  }
});

// Delete flight
app.delete('/api/flights/:id', (req, res) => {
  try {
    const result = statements.deleteFlight.run(req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Flight not found' });
    }
    
    res.json({ message: 'Flight deleted successfully' });
  } catch (error) {
    console.error('Error deleting flight:', error);
    res.status(500).json({ error: 'Failed to delete flight' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Database file: data/flights.db`);
});