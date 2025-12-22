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

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS batches (
    id TEXT PRIMARY KEY,
    batch_number INTEGER UNIQUE NOT NULL,
    title TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS flights (
    id TEXT PRIMARY KEY,
    batch_id TEXT NOT NULL,
    origin TEXT NOT NULL,
    destination TEXT NOT NULL,
    departure_time TEXT,
    arrival_time TEXT,
    aircraft_type TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (batch_id) REFERENCES batches (id) ON DELETE CASCADE
  )
`);

// Prepared statements for better performance
const statements = {
  // Batches
  getAllBatches: db.prepare('SELECT * FROM batches ORDER BY created_at DESC'),
  getBatchById: db.prepare('SELECT * FROM batches WHERE id = ?'),
  getMaxBatchNumber: db.prepare('SELECT MAX(batch_number) as max FROM batches'),
  insertBatch: db.prepare('INSERT INTO batches (id, batch_number, title) VALUES (?, ?, ?)'),
  updateBatch: db.prepare('UPDATE batches SET title = ? WHERE id = ?'),
  deleteBatch: db.prepare('DELETE FROM batches WHERE id = ?'),
  
  // Flights
  getFlightsByBatchId: db.prepare('SELECT * FROM flights WHERE batch_id = ? ORDER BY created_at DESC'),
  insertFlight: db.prepare(`
    INSERT INTO flights (id, batch_id, origin, destination, departure_time, arrival_time, aircraft_type)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `),
  updateFlight: db.prepare(`
    UPDATE flights SET origin = ?, destination = ?, departure_time = ?, arrival_time = ?, aircraft_type = ?
    WHERE id = ?
  `),
  deleteFlight: db.prepare('DELETE FROM flights WHERE id = ?'),
  deleteFlightsByBatchId: db.prepare('DELETE FROM flights WHERE batch_id = ?')
};

module.exports = { db, statements };