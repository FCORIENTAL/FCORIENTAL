# FC Oriental Football Team Management System

## Overview

This is a full-stack football team management application built for FC Oriental. The system allows for comprehensive management of players, match recording, goal tracking, and statistics visualization. It features a modern React frontend with shadcn/ui components and an Express.js backend with PostgreSQL database integration using Drizzle ORM.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript in a single-page application (SPA) architecture
- **UI Library**: shadcn/ui components built on Radix UI primitives for accessibility and consistency
- **Styling**: Tailwind CSS with custom CSS variables for theming and responsive design
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod schema validation for type-safe form handling
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Framework**: Express.js with TypeScript for RESTful API development
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Storage Layer**: Abstracted storage interface with in-memory implementation for development and database implementation for production
- **API Design**: RESTful endpoints organized by resource (players, matches, participants, goals)
- **Validation**: Zod schemas shared between frontend and backend for consistent data validation

### Data Architecture
- **Database Schema**: Four main entities - players, matches, match_participants, and goals
- **Relationships**: Many-to-many relationship between players and matches through participants table
- **Data Validation**: Shared TypeScript types and Zod schemas ensure type safety across the stack
- **Migration System**: Drizzle Kit for database schema management and migrations

### Project Structure
- **Monorepo Layout**: Single repository with separate client, server, and shared directories
- **Shared Code**: Common types, schemas, and utilities in the shared directory
- **Asset Management**: Static assets stored in attached_assets directory
- **Configuration**: Centralized configuration files for TypeScript, Tailwind, and build tools

### Development Features
- **Hot Module Replacement**: Vite HMR for fast development cycles
- **Type Safety**: End-to-end TypeScript with strict configuration
- **Path Mapping**: Absolute imports using @ aliases for clean import statements
- **Development Tools**: Replit integration with runtime error overlay and cartographer plugin

### Authentication & Authorization
Currently implements a session-based approach with connect-pg-simple for PostgreSQL session storage, though specific authentication logic is not fully implemented in the current codebase.

## External Dependencies

### Database
- **PostgreSQL**: Primary database using Neon serverless PostgreSQL
- **Drizzle ORM**: Type-safe ORM with PostgreSQL dialect
- **connect-pg-simple**: PostgreSQL session store for Express sessions

### UI & Styling
- **Radix UI**: Comprehensive set of accessible React components
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library for consistent iconography
- **shadcn/ui**: Pre-built component library based on Radix UI

### Development & Build
- **Vite**: Frontend build tool and development server
- **TypeScript**: Static type checking across the entire stack
- **ESBuild**: Fast JavaScript bundler for production builds
- **tsx**: TypeScript execution engine for development

### State Management & Data Fetching
- **TanStack Query**: Server state management and caching
- **React Hook Form**: Form state management and validation
- **Zod**: Runtime type validation and schema definition

### Utility Libraries
- **date-fns**: Date manipulation and formatting
- **clsx & class-variance-authority**: Conditional CSS class utilities
- **nanoid**: Unique ID generation
- **wouter**: Lightweight React router