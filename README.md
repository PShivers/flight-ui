# Flight Builder UI

A Vue.js + Vuetify frontend application for building flights and invoking a locally deployed Lambda function.

## Features

- Build flights with a user-friendly form interface
- Add multiple flights before submitting
- View and manage a list of built flights
- Send flights to your locally deployed Lambda function
- Beautiful, modern UI built with Vuetify 3

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure Lambda endpoint (optional):
   - Create a `.env` file based on `.env.example`
   - Set `VITE_LAMBDA_URL` to your Lambda endpoint (defaults to `http://localhost:9000`)

3. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Lambda Endpoint

The application expects your Lambda to accept POST requests at the configured endpoint with the following payload:

```json
{
  "flights": [
    {
      "flightNumber": "AA123",
      "airline": "American Airlines",
      "origin": "JFK",
      "destination": "LAX",
      "departureTime": "2024-01-15T10:00:00",
      "arrivalTime": "2024-01-15T13:30:00",
      "price": 299.99,
      "availableSeats": 150,
      "aircraftType": "Boeing 737"
    }
  ]
}
```

## Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

