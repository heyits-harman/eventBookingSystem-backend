# Event Booking Backend (Seat Locking System)

A backend system for event seat booking with **strong consistency**, **concurrency control**, and **time-bound reservations**.

This project focuses on backend engineering problems such as:
- Seat locking under concurrency
- Transactional guarantees
- Expiring reservations
- Redis + PostgreSQL coordination

## Tech Stack
- Node.js
- Express
- PostgreSQL
- Redis

## Core Concepts Implemented
- PENDING → CONFIRMED → CANCELLED booking state machine
- Redis-based seat locking with TTL
- PostgreSQL transactions (`SELECT ... FOR UPDATE`)
- Automatic booking expiration
- Idempotent booking confirmation
- Failure-safe cleanup

## Booking Flow
1. **Create Booking**
   - Validates seat selection
   - Locks seats in Redis (10 min TTL)
   - Creates PENDING booking in DB

2. **Confirm Booking**
   - Verifies ownership and lock validity
   - Persists seats in DB
   - Marks booking as CONFIRMED
   - Releases Redis locks

3. **Cancel / Expire Booking**
   - Marks booking as CANCELLED
   - Releases any held locks

This service assumes `userId` is provided by an upstream system.
The focus is **backend correctness**, not auth boilerplate.

## Running Locally