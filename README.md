# StaySync – Property Flow Web

<div align="center">

**Modern Availability & Pricing Management Interface for Short-Term Rental Properties**

Built with **Angular 17**, **Tailwind CSS**, and **Angular Signals**

</div>

---

## Overview

**StaySync Property Flow Web** is a modern web application designed for short-term rental property managers to efficiently manage property availability, reservations, nightly pricing, owner blocks, and OTA (Online Travel Agency) channel synchronization.

The application communicates directly with the NestJS backend through a RESTful API, providing real-time calendar updates, booking validation, pricing management, and channel feed reconciliation.

---

## Technology Stack

| Category         | Technology                          |
| ---------------- | ----------------------------------- |
| Framework        | Angular 17+ (Standalone Components) |
| Language         | TypeScript                          |
| Styling          | Tailwind CSS                        |
| State Management | Angular Signals                     |
| HTTP Client      | Angular HttpClient                  |
| Backend API      | NestJS REST API                     |
| Package Manager  | npm                                 |

---

# Features

### Interactive Availability Calendar

* Monthly property availability view
* Nightly base rate display
* Custom rate overrides
* Booking visualization
* Owner blocked dates
* Guest information display
* Booking status indicators

---

### Booking Management

Create reservations directly from the calendar with:

* Guest information
* Check-in / Check-out selection
* Real-time overlap validation
* Instant conflict feedback
* Automatic calendar refresh

---

### Dynamic Pricing

Manage pricing effortlessly by:

* Setting custom nightly rates
* Applying prices across date ranges
* Viewing overridden prices
* Restoring default rates

---

### Owner Block Management

Reserve dates for:

* Property maintenance
* Personal use
* Cleaning schedules
* Temporary availability restrictions

---

### Exclusive Checkout Support

The calendar follows the exclusive checkout model.

A guest checking out on a particular date frees that afternoon for a new guest to check in on the same day, maximizing occupancy while preventing booking conflicts.

---

### OTA Channel Synchronization

Synchronize reservations from external booking channels with a single click.

The synchronization process provides feedback on:

* Imported reservations
* Duplicate entries
* Conflicting bookings
* Synchronization summary

---

### Error Handling

A centralized HTTP interceptor provides consistent application-wide error handling.

Examples include:

* Booking conflicts
* Validation failures
* Network errors
* Server errors

User-friendly toast notifications are displayed instead of raw API responses.

---

# Getting Started

## Prerequisites

* Node.js **18.x** or **20.x**
* npm **9.x** or later

---

## Installation

Clone the repository.

```bash
git clone <repository-url>
```

Navigate to the project.

```bash
cd propertyflow-web
```

Install dependencies.

```bash
npm install
```

---

## Environment Configuration

Update the backend API URL in:

```text
src/environments/environment.ts
```

```typescript
export const environment = {
  production: false,
  apiUrl: "http://localhost:3000/api",
};
```

---

## Running the Application

Start the development server.

```bash
npm start
```

Open your browser.

```
http://localhost:4200
```

Angular will automatically rebuild and reload the application whenever source files are modified.

---

# Project Structure

```text
propertyflow-web/
│
├── src/
│   ├── app/
│   │
│   ├── core/
│   │   ├── interceptors/
│   │   ├── models/
│   │   └── services/
│   │
│   ├── features/
│   │   ├── calendar/
│   │   ├── action-drawer/
│   │   └── channel-sync/
│   │
│   ├── app.component.ts
│   │
│   └── environments/
│
├── angular.json
├── package.json
└── README.md
```

---

# Architecture

## Frontend Architecture

The application follows a feature-oriented architecture with clear separation of responsibilities.

### Core Layer

Responsible for application-wide functionality including:

* HTTP services
* Shared models
* Interceptors
* Toast notifications
* Common utilities

---

### Feature Modules

Each business feature is isolated into its own standalone implementation.

Examples include:

* Calendar
* Booking actions
* Rate overrides
* Owner blocks
* Channel synchronization

This structure keeps the codebase modular and scalable.

---

### State Management

Angular Signals are used for reactive state management.

Benefits include:

* Fine-grained reactivity
* Minimal boilerplate
* Better rendering performance
* Simplified component communication

---

### API Layer

A dedicated **CalendarApiService** provides a strongly typed interface between the frontend and the NestJS backend.

Responsibilities include:

* Fetching availability
* Creating bookings
* Updating rates
* Blocking dates
* Synchronizing OTA feeds

---

# Design Decisions

## Custom Calendar Implementation

**Decision**

Implemented a lightweight calendar using native CSS Grid instead of integrating a third-party solution.

**Benefits**

* Smaller bundle size
* Complete UI customization
* Better control over booking spans
* Easier maintenance

**Trade-off**

Advanced interactions such as drag-and-drop scheduling are not currently supported.

---

## Server-First Synchronization

**Decision**

After every mutation, the frontend retrieves the latest calendar state directly from the backend.

**Benefits**

* Eliminates client/server inconsistencies
* Ensures reconciliation logic remains authoritative
* Simplifies client-side state management

**Trade-off**

Introduces a small network round-trip after updates, but guarantees consistent data across users.

---

# Future Improvements

With additional development time, the following enhancements are planned.

### Drag-to-Select Date Ranges

Support intuitive mouse gestures for selecting booking ranges directly from the calendar.

---

### Multi-Property Management

Allow property managers to switch between multiple listings from a sidebar while maintaining independent availability and pricing.

---

### End-to-End Testing

Implement a comprehensive Playwright test suite covering:

* Booking workflows
* Pricing updates
* Blocking operations
* Calendar synchronization
* Conflict detection
* OTA reconciliation

---

# Development

Useful development commands.

Install dependencies.

```bash
npm install
```

Run the application.

```bash
npm start
```

Build for production.

```bash
npm run build
```

Run tests.

```bash
npm test
```

---

# Backend Integration

This frontend is designed to work with the StaySync NestJS backend.

Primary backend responsibilities include:

* Booking validation
* Conflict detection
* Rate management
* Owner block processing
* OTA feed reconciliation
* Calendar availability
* Business rule enforcement

The frontend remains intentionally lightweight, delegating business logic to the backend to ensure consistency and maintainability.

---

# License

This project is intended as a technical assessment and demonstration of frontend engineering practices using Angular, TypeScript, and modern web development patterns.
