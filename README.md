# Allo Inventory — Reservation System

**Live Demo:** https://allo-inventory-delta-brown.vercel.app

**GitHub Repository:** https://github.com/Raju-coder123/allo-inventory

## Overview

Allo Inventory is a full-stack inventory reservation system built with **Next.js**, **Prisma**, **PostgreSQL (Supabase)**, and **Upstash Redis**. It prevents overselling by reserving inventory for a limited time and automatically releasing expired reservations.

---

## Features

* Product listing
* Inventory reservation
* Reservation countdown timer
* Purchase confirmation
* Automatic reservation expiry
* Concurrency-safe inventory updates
* Redis-backed reservation management
* Vercel deployment

---

## Tech Stack

* Next.js (App Router)
* TypeScript
* Prisma ORM
* PostgreSQL (Supabase)
* Upstash Redis
* Tailwind CSS
* Vercel

---

## How to Run Locally

1. Clone the repository

```bash
git clone https://github.com/Raju-coder123/allo-inventory.git
```

2. Install dependencies

```bash
npm install
```

3. Create a `.env` file and add:

```env
DATABASE_URL=
DIRECT_URL=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

4. Run database migrations

```bash
npx prisma migrate dev
```

5. Seed the database

```bash
npx tsx prisma/seed.ts
```

6. Start the development server

```bash
npm run dev
```

---

## Reservation Expiry

A Vercel Cron Job calls:

```
GET /api/cron/expire
```

every minute.

Expired reservations are automatically marked as expired and the reserved inventory is released inside a database transaction, making the units available again.

---

## Concurrency Safety

The reservation endpoint uses a PostgreSQL transaction with row-level locking (`SELECT FOR UPDATE`).

If two users try to reserve the last available item simultaneously:

* One request acquires the lock and succeeds.
* The other waits until the transaction completes.
* If inventory is no longer available, it receives a **409 Conflict** response.

This prevents double booking and overselling.

---

## Future Improvements

* Idempotency keys for reserve and confirm endpoints
* Quantity selector
* User authentication
* Payment gateway integration
* Unit and integration tests
* Admin dashboard
