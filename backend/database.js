const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Create database file in backend/data directory
const dbPath = path.join(__dirname, 'data', 'flights.db');

// Create data directory if it doesn't exist (must happen BEFORE creating database)
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);

// Create tables - using camelCase for column names
db.exec(`
  CREATE TABLE IF NOT EXISTS batches (
    id TEXT PRIMARY KEY,
    batchNumber INTEGER UNIQUE NOT NULL,
    title TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS flights (
    id TEXT PRIMARY KEY,
    batchId TEXT NOT NULL,
    flightNumber TEXT NOT NULL,
    origin TEXT NOT NULL,
    destination TEXT NOT NULL,
    departureTime TEXT,
    arrivalTime TEXT,
    aircraftId TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (batchId) REFERENCES batches (id) ON DELETE CASCADE
  )
`);

// Prepared statements for better performance
const statements = {
  // Batches
  getAllBatches: db.prepare('SELECT * FROM batches ORDER BY createdAt DESC'),
  getBatchById: db.prepare('SELECT * FROM batches WHERE id = ?'),
  getMaxBatchNumber: db.prepare('SELECT MAX(batchNumber) as max FROM batches'),
  insertBatch: db.prepare('INSERT INTO batches (id, batchNumber, title) VALUES (?, ?, ?)'),
  updateBatch: db.prepare('UPDATE batches SET title = ? WHERE id = ?'),
  deleteBatch: db.prepare('DELETE FROM batches WHERE id = ?'),

  // Flights
  getFlightsByBatchId: db.prepare('SELECT * FROM flights WHERE batchId = ? ORDER BY createdAt DESC'),
  insertFlight: db.prepare(`
    INSERT INTO flights (id, batchId, flightNumber, origin, destination, departureTime, arrivalTime, aircraftId)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `),
  updateFlight: db.prepare(`
    UPDATE flights SET flightNumber = ?, origin = ?, destination = ?, departureTime = ?, arrivalTime = ?, aircraftId = ?
    WHERE id = ?
  `),
  deleteFlight: db.prepare('DELETE FROM flights WHERE id = ?'),
  deleteFlightsByBatchId: db.prepare('DELETE FROM flights WHERE batchId = ?')
};

module.exports = { db, statements };