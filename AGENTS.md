# AGENTS.md

## Project Overview

This is a university of maryland 4-year planning application.

Frontend:

- Next.js 15
- TypeScript
- Tailwind
- Clerk authentication

Backend:

- Spring Boot
- PostgreSQL (Neon in prod)
- Docker Compose locally

## Architecture

- frontend/ contains Next.js app
- backend/ contains Spring Boot API
- course data comes from umd.io API
- planner logic is implemented in backend/services

## Development Rules

- Always use npm
- Do not add new dependencies unless necessary
- Use DTOs for API responses
- Never expose entity models directly
- Never run frontend server locally, linting and building to check if the changes pass is ok but do not run a live server

## Database

- Production uses Neon PostgreSQL
- Local development uses Docker Compose
- Never generate destructive migrations automatically

## Coding Style

- Prefer small focused React components
- Avoid giant service classes
- Use TypeScript strict typing
- Prefer composition over inheritance
- Use tailwind always
- Prefer the use of existing frontend components and functions
