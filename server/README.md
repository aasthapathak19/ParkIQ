# ParkIQ AI - Backend API

Enterprise-grade backend API for a Smart Vehicle Parking & Mobility Platform.

## Features

- **Clean Architecture & Domain-Driven Design (DDD)**
- **Express & Mongoose** with strictly typed TypeScript
- **Event-Driven Architecture** using `EventBus`
- **Real-Time Updates** with `Socket.io`
- **Background Jobs & Message Queues** with `BullMQ` + `Redis`
- **Distributed Locking** via Redis to prevent race conditions in slot booking
- **Payment Processing** via Stripe (with webhooks)
- **Security**: Redis-backed rate limiting, Helmet, JWT access & refresh tokens
- **Logging & Tracing**: `pino` logger with request IDs
- **Swagger Documentation**: Accessible at `/api/v1/docs`

## Requirements

- Node.js >= 18
- MongoDB (Atlas or local)
- Redis Server (local or managed)
- Stripe Account (for payments)

## Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   Copy `.env.example` to `.env` and fill in your details:
   ```bash
   cp .env.example .env
   ```
   Ensure Redis and MongoDB URIs are correct.

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **View API Docs**
   Navigate to `http://localhost:5000/api/v1/docs` (or your configured PORT/APP_URL).

## Project Structure

```
src/
├── config/             # Config files (env, db, logger, swagger)
├── domain/             # Core domain logic, errors, and events
├── infrastructure/     # Third-party integrations (Redis, Socket.io, Stripe, Jobs)
├── middlewares/        # Express middlewares (auth, errors, tracing, validation)
├── modules/            # Feature modules (users, parking, bookings, analytics)
├── types/              # Global TypeScript declarations
└── utils/              # Helper utilities
```
