# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Structure

This is a full-stack flight management application with a Vue.js frontend and Node.js/Express backend using better-sqlite3 for data persistence.

**Project Structure:**
- **Frontend (`/`)**: Vue 3 + Vuetify 3 + Vite application for building and managing flight batches
- **Backend (`/backend/`)**: Express.js REST API server with SQLite database for flight and batch management

## Architecture Overview

### Frontend (Vue.js Application)
- **Framework**: Vue 3 with Composition API
- **UI Library**: Vuetify 3 (Material Design components)
- **Build Tool**: Vite
- **Routing**: Vue Router 4
- **HTTP Client**: Axios for API calls
- **Styling**: Material Design Icons (MDI), dark/light theme support

### Backend (Node.js/Express)
- **Runtime**: Node.js with Express 5.2.1
- **Database**: better-sqlite3 (SQLite) with prepared statements
- **CORS**: Enabled for frontend communication
- **Database Location**: `backend/data/flights.db` (auto-created)

## Development Commands

### Frontend Development
```bash
# Install dependencies
npm install

# Start development server (http://localhost:3000)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Backend Development
```bash
cd backend/

# Install dependencies
npm install

# Start development server with hot reload (http://localhost:3001)
npm run dev

# Start production server
npm start
```

## Database Structure

### Tables

**batches**
```sql
CREATE TABLE batches (
  id TEXT PRIMARY KEY,           -- Generated UUID-like string
  title TEXT NOT NULL,           -- User-defined batch name
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

**flights**
```sql
CREATE TABLE flights (
  id TEXT PRIMARY KEY,           -- Generated UUID-like string
  batch_id TEXT NOT NULL,        -- Foreign key to batches.id
  origin TEXT NOT NULL,          -- Origin airport code (e.g., "KATL")
  destination TEXT NOT NULL,     -- Destination airport code (e.g., "KJFK")
  departure_time TEXT,           -- ISO datetime string
  arrival_time TEXT,             -- ISO datetime string
  aircraft_type TEXT,            -- Aircraft type (e.g., "321NEO")
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (batch_id) REFERENCES batches (id) ON DELETE CASCADE
)
```

## API Endpoints

### Batch Management
- `GET /api/batches` - Get all batches with flight counts
- `GET /api/batches/:id` - Get single batch with flights
- `POST /api/batches` - Create new batch (requires `title`)
- `PUT /api/batches/:id` - Update batch title
- `DELETE /api/batches/:id` - Delete batch and associated flights

### Flight Management
- `POST /api/batches/:batchId/flights` - Add flight to batch
- `PUT /api/flights/:id` - Update flight details
- `DELETE /api/flights/:id` - Delete specific flight

### Utility
- `GET /api/health` - Health check endpoint

## Component Architecture

### Main Components

**Views:**
- `FlightBuilder.vue` - Main application view containing all flight building functionality

**Core Components:**
- `FlightForm.vue` - Form for creating/editing individual flights
- `BatchSelector.vue` - Dropdown for selecting active batch
- `BatchSidebar.vue` - Sidebar showing current batch details and submission controls
- `FlightList.vue` - Display list of flights in current batch

**Dialog Components:**
- `CreateBatchDialog.vue` - Modal for creating new batches
- `EditFlightDialog.vue` - Modal for editing existing flights
- `AllBatchesDialog.vue` - Modal for viewing/managing all batches

### Data Flow

1. **Batch Management**: Users create batches via `BatchSelector` → API creates batch in database
2. **Flight Creation**: Users fill `FlightForm` → adds flight to current batch via API
3. **Flight Display**: `BatchSidebar` shows current batch flights and submission controls
4. **Lambda Submission**: Batch flights are sent to external Lambda function in configurable batch sizes

### Services

**API Services:**
- `services/batchApi.js` - Handles all backend API communication (CRUD operations)
- `services/api.js` - Handles Lambda function invocation for flight submission

## Configuration

### Frontend Configuration
- **Vite Config**: `vite.config.js` - Vuetify auto-import, dev server on port 3000
- **Theme**: Dark theme default, light/dark toggle in app bar
- **Environment**: Uses `VITE_LAMBDA_URL` environment variable for Lambda endpoint (defaults to `http://localhost:9000`)

### Backend Configuration
- **Port**: 3001 (configurable via `PORT` environment variable)
- **Database**: Auto-creates SQLite file at `backend/data/flights.db`
- **CORS**: Enabled for all origins

## Key Features

### Batch System
- Organize flights into named batches for better management
- Default batch created automatically if none exist
- Batch validation prevents deletion of batches containing flights
- Flight counts displayed throughout UI

### Flight Management
- Rich form with airport dropdowns, aircraft selection, datetime pickers
- Support for destination alternate airports (DestAltApts)
- In-place editing via dialog modals
- Form validation and user feedback

### Submission System
- Configurable batch sizes for Lambda submission
- Progress tracking during multi-batch submissions
- Error handling with detailed user feedback
- Continues processing even if individual batches fail

### Data Persistence
- All data stored in SQLite database with proper relations
- Prepared statements for performance and security
- Automatic database and table creation
- Foreign key constraints with cascade deletion

## Flight Data Schema

Frontend flight objects contain:
```javascript
{
  flightNumber: "001",           // Flight identifier
  departureTime: "2024-01-15T10:00", // ISO datetime
  origin: "KATL",               // Origin airport code
  destination: "KJFK",          // Destination airport code
  aircraftId: "321NEO",         // Aircraft type
  destAltApts: [                // Optional alternate airports
    { apt: "KLGA" },
    { apt: "KEWR" }
  ],
  automated: true               // Boolean flag
}
```

Database stores simplified version focusing on core flight data with batch relationships.

## Development Notes

- **Hot Reload**: Both frontend (Vite) and backend (--watch flag) support hot reload
- **Database Location**: SQLite file created in `backend/data/` directory
- **Error Handling**: Comprehensive error handling throughout with user-friendly messages
- **Validation**: Form validation on frontend, API validation on backend
- **Material Design**: Consistent UI using Vuetify 3 components with proper theming