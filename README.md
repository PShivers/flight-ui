# Flight Builder UI

A full-stack flight management application with a Vue.js + Vuetify frontend and Node.js/Express backend for building, managing, and submitting flight batches.

## Features

### Batch Management
- **Auto-incrementing batch numbers** (100-999 with automatic wrapping)
- Create, rename, and delete batches
- View all batches with flight counts
- Switch between batches seamlessly

### Flight Management
- **Auto-generated flight numbers** (`{batchNumber}-{sequentialNumber}`)
- Sequential numbering with automatic gap-filling when flights are deleted
- Inline editing - click any flight to load it into the form
- Rich form validation with dropdown selects for airports and aircraft
- Support for destination alternate airports
- Automated flag for each flight

### User Experience
- **Optimistic updates** - immediate UI feedback with automatic rollback on errors
- **Loading animations** - skeleton loaders and spinners throughout
- **Real-time validation** - form validation with helpful error messages
- **Batch submission** - send all flights in a batch to Lambda endpoint
- **Beautiful Material Design** UI with Vuetify 3

### Data Persistence
- SQLite database with proper relations
- Automatic database creation on first run
- camelCase column naming for consistency

## Architecture

### Frontend (`/`)
- **Framework**: Vue 3 with Composition API
- **UI Library**: Vuetify 3 (Material Design)
- **Build Tool**: Vite
- **State Management**: Reactive refs and computed properties
- **HTTP Client**: Fetch API

### Backend (`/backend/`)
- **Runtime**: Node.js with Express
- **Database**: better-sqlite3 (SQLite)
- **API**: RESTful JSON API
- **CORS**: Enabled for frontend communication

## Setup

### Prerequisites
- Node.js 16+ installed
- npm or yarn package manager

### Installation

1. **Install frontend dependencies**:
```bash
npm install
```

2. **Install backend dependencies**:
```bash
cd backend
npm install
```

3. **Configure Lambda endpoint** (optional):
   - Create a `.env` file in the root directory
   - Set `VITE_LAMBDA_URL` to your Lambda endpoint
   - Default: `http://localhost:9000`

### Running the Application

1. **Start the backend server**:
```bash
cd backend
npm run dev
```
Backend will run on `http://localhost:3001`

2. **Start the frontend** (in a new terminal):
```bash
npm run dev
```
Frontend will run on `http://localhost:3000`

3. Open your browser to `http://localhost:3000`

## Database Schema

### Batches Table
```sql
CREATE TABLE batches (
  id TEXT PRIMARY KEY,
  batchNumber INTEGER UNIQUE NOT NULL,
  title TEXT NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

### Flights Table
```sql
CREATE TABLE flights (
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
```

## API Endpoints

### Batch Endpoints
- `GET /api/batches` - Get all batches with flights
- `GET /api/batches/:id` - Get single batch with flights
- `GET /api/batches/next-number` - Get next available batch number
- `POST /api/batches` - Create new batch
- `PUT /api/batches/:id` - Update batch title
- `DELETE /api/batches/:id` - Delete batch

### Flight Endpoints
- `POST /api/batches/:batchId/flights` - Add flight to batch
- `PUT /api/flights/:id` - Update flight
- `DELETE /api/flights/:id` - Delete flight

### Health Check
- `GET /api/health` - Server health check

## Flight Data Format

Flights are submitted to the Lambda endpoint in the following format:

```json
[
  {
    "flightNumber": "100-1",
    "origin": "KATL",
    "destination": "KJFK",
    "departureTime": "2024-01-15T10:00",
    "aircraftId": "321NEO",
    "destAltApts": [
      { "apt": "KLGA" },
      { "apt": "KEWR" }
    ],
    "automated": true
  }
]
```

## Development

### Frontend Development
```bash
npm run dev          # Start dev server with hot reload
npm run build        # Build for production
npm run preview      # Preview production build
```

### Backend Development
```bash
cd backend
npm run dev          # Start with nodemon (auto-reload)
npm start            # Start production server
```

### Database Management

The database file is located at `backend/data/flights.db` and is automatically created on first run.

To reset the database:
```bash
cd backend
rm data/flights.db
npm start  # Will recreate with fresh schema
```

## Project Structure

```
flight-ui/
├── src/
│   ├── components/          # Vue components
│   │   ├── FlightForm.vue   # Main flight form
│   │   ├── BatchSelector.vue
│   │   ├── BatchSidebar.vue
│   │   └── ...
│   ├── views/
│   │   └── FlightBuilder.vue # Main view
│   ├── services/
│   │   ├── api.js           # Lambda API calls
│   │   └── batchApi.js      # Backend API calls
│   └── router/
│       └── index.js
├── backend/
│   ├── server.js            # Express server
│   ├── database.js          # Database setup
│   └── data/                # SQLite database files
├── package.json
└── vite.config.js
```

## Building for Production

### Frontend
```bash
npm run build
```
Built files will be in the `dist` directory.

### Backend
The backend runs as-is in production:
```bash
cd backend
npm start
```

## Airport Codes

The application includes the following US airport codes:
- KJFK - New York JFK
- KATL - Atlanta
- KLAX - Los Angeles
- KORD - Chicago O'Hare
- KDFW - Dallas/Fort Worth
- KDEN - Denver
- KSEA - Seattle
- And more...

## Aircraft Types

Supported aircraft types:
- 321NEO
- A320
- A321
- A350
- A380

## Features in Detail

### Batch Numbering
- Batches are numbered from 100-999
- Numbers auto-increment
- When reaching 999, wraps back to 100
- Unique constraint prevents duplicates

### Flight Numbering
- Format: `{batchNumber}-{sequentialNumber}`
- Example: `100-1`, `100-2`, `100-3`
- Automatically renumbers when flights are deleted
- No gaps in sequence

### Optimistic Updates
- Flights appear immediately in the UI
- API calls happen in the background
- Automatic rollback if API call fails
- Loading indicators during operations

### Error Handling
- Form validation with user-friendly messages
- API error handling with snackbar notifications
- Automatic state rollback on failures
- Console error logging for debugging

## Troubleshooting

### Database Issues
If you encounter database errors:
1. Stop the backend server
2. Delete `backend/data/flights.db`
3. Restart the server - database will be recreated

### Port Conflicts
- Frontend default: `http://localhost:3000`
- Backend default: `http://localhost:3001`

Change ports in:
- Frontend: `vite.config.js`
- Backend: `backend/server.js` or set `PORT` environment variable

### CORS Issues
If you encounter CORS errors, ensure:
- Backend CORS is enabled (already configured)
- Frontend is making requests to correct backend URL
- Both servers are running

## License

MIT
