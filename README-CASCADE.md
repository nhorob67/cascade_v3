# Cascade - Multi-tenant Collaborative Platform

A multi-tenant SaaS platform built on top of Univer for collaborative document editing with complete tenant isolation.

## Architecture

- **Frontend**: Next.js 14 with TypeScript (`apps/saas-platform`)
- **WebSocket Server**: Node.js with Express (`apps/websocket-server`)
- **Collaboration Plugin**: Custom Univer plugin (`packages/multitenant-collaboration`)
- **Database**: Supabase (PostgreSQL with RLS)
- **Cache/Sessions**: Redis
- **Deployment**: Railway

## Features

- 🏢 **Multi-tenant architecture** with complete data isolation
- 🤝 **Real-time collaboration** with WebSocket-powered synchronization
- 📊 **Rich document editing** using Univer (spreadsheets, documents)
- 🔒 **Row Level Security** for tenant data isolation
- 🎯 **Role-based permissions** (owner, edit, view)
- ⚡ **Rate limiting** per tenant
- 🔄 **Auto-reconnection** and message queuing
- 🚀 **Scalable deployment** on Railway

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 10+
- Supabase account
- Redis instance (local or hosted)

### 1. Clone and Install

```bash
git clone <repository-url>
cd cascade_v3
pnpm install
```

### 2. Database Setup

1. Create a new Supabase project
2. Run the SQL schema from `database/schema.sql` in your Supabase SQL editor
3. Note your Supabase URL and keys

### 3. Environment Setup

Copy environment files and fill in your values:

```bash
# Frontend
cp apps/saas-platform/.env.example apps/saas-platform/.env.local

# WebSocket Server  
cp apps/websocket-server/.env.example apps/websocket-server/.env
```

#### Required Environment Variables

**Frontend (`.env.local`)**:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
JWT_SECRET=your_jwt_secret_key
NEXT_PUBLIC_WEBSOCKET_URL=ws://localhost:3001
```

**WebSocket Server (`.env`)**:
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
JWT_SECRET=your_jwt_secret_key
REDIS_URL=redis://localhost:6379
FRONTEND_URL=http://localhost:3000
PORT=3001
```

### 4. Development

Start the development servers:

```bash
# Terminal 1: WebSocket Server
pnpm --filter @cascade/websocket-server dev

# Terminal 2: Frontend
pnpm --filter @cascade/saas-platform dev
```

Access the application at `http://localhost:3000`

## Project Structure

```
cascade_v3/
├── apps/
│   ├── saas-platform/          # Next.js frontend application
│   │   ├── src/
│   │   │   ├── app/            # Next.js 14 app directory
│   │   │   ├── components/     # React components
│   │   │   ├── lib/            # Utility functions
│   │   │   └── types/          # TypeScript type definitions
│   │   └── package.json
│   └── websocket-server/       # Node.js WebSocket server
│       ├── src/
│       │   └── server.ts       # Main server file
│       └── package.json
├── packages/
│   └── multitenant-collaboration/  # Custom Univer plugin
│       ├── src/
│       │   ├── collaboration.service.ts
│       │   ├── plugin.ts
│       │   └── index.ts
│       └── package.json
├── database/
│   └── schema.sql              # Supabase database schema
└── railway.json               # Railway deployment config
```

## Database Schema

The database uses PostgreSQL with Row Level Security (RLS) for tenant isolation:

- **tenants**: Organization data with plans (free/pro/enterprise)
- **tenant_users**: User-tenant relationships with roles
- **documents**: Document metadata and content
- **document_mutations**: Real-time collaboration history
- **document_permissions**: Fine-grained access control

## Collaboration System

### WebSocket Protocol

The WebSocket server handles real-time collaboration with these message types:

- `mutation`: Document changes (synchronized via Univer commands)
- `cursor`: User cursor positions
- `presence`: User presence indicators
- `ack`: Mutation acknowledgments

### Security

- JWT authentication with tenant claims
- Document access validation
- Rate limiting per tenant (100 req/min/user)
- Tenant isolation at WebSocket room level (`tenantId:documentId`)

### Conflict Resolution

- Operational Transform via Univer's command system
- Sequence numbers for mutation ordering
- Automatic reconnection with message queuing

## Deployment

### Railway

1. Connect your GitHub repository to Railway
2. Set environment variables in Railway dashboard
3. Deploy automatically on git push

The `railway.json` file configures:
- Build settings
- Auto-scaling
- Health checks

### Environment Variables for Production

```env
# Add these to your Railway project
SUPABASE_URL=your_production_supabase_url
SUPABASE_SERVICE_KEY=your_production_service_key
JWT_SECRET=your_production_jwt_secret
REDIS_URL=your_railway_redis_url
FRONTEND_URL=your_production_frontend_url
```

## Development Commands

```bash
# Install dependencies
pnpm install

# Type checking
pnpm typecheck

# Build all packages
pnpm build

# Run tests
pnpm test

# Lint code
pnpm lint
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Run linting and type checking
6. Submit a pull request

## License

This project is licensed under the Apache-2.0 License - see the LICENSE file for details.

## Support

For questions or issues:
- Create an issue in the GitHub repository
- Check the documentation in the `docs/` directory
- Review the Univer documentation for core functionality