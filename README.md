# Real-time Crypto Dashboard

This project consists of a NestJS backend and a React frontend to display real-time cryptocurrency data from Finnhub.

## Prerequisites

- Node.js (v16+)
- npm or pnpm
- Finnhub API Key (Get one for free at [finnhub.io](https://finnhub.io/))

## Setup

### Backend

1.  Navigate to the `backend` directory:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file based on `.env.example` and add your Finnhub API Key:
    ```bash
    cp .env.example .env
    # Edit .env and set FINNHUB_API_KEY
    ```
4.  Start the backend server:
    ```bash
    npm run start:dev
    ```
    The backend will run on `http://localhost:3000`.

### Frontend

1.  Navigate to the `frontend` directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```
    The frontend will run on `http://localhost:5173`.

## Features

- **Real-time Data**: Connects to Finnhub WebSocket API to get live prices for ETH/USDC, ETH/USDT, and ETH/BTC.
- **Hourly Average**: Calculates and displays the hourly average price.
- **Live Charts**: Visualizes price history and average trends.
- **Resilient Connection**: Handles connection drops and automatically reconnects.

## Architecture

- **Backend**: NestJS with `@nestjs/websockets` for streaming and `ws` for Finnhub connection.
- **Frontend**: React with `socket.io-client` for real-time updates and `recharts` for visualization.
