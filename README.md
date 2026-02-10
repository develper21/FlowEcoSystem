<div align="center">

# 🔄 ECOFlow

### Engineering Change Order Version Master Data System

**Streamline your product engineering workflows with intelligent ECO management, multi-stage approvals, and real-time collaboration.**

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-installation">Installation</a> •
  <a href="#-api-documentation">API</a> •
  <a href="#-deployment">Deployment</a> •
  <a href="#-roadmap">Roadmap</a> •
  <a href="https://www.youtube.com/watch?v=YL-VPMYPDG4">Demo Video</a>
</p>

![Status](https://img.shields.io/badge/status-active-success.svg)
![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue.svg)
![Build](https://img.shields.io/badge/build-passing-brightgreen.svg)

</div>

---

<details>
<summary>📑 Table of Contents</summary>

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Data Flow](#-data-flow)
- [ECO Lifecycle](#-eco-lifecycle)
- [Installation](#-installation)
- [Environment Variables](#-environment-variables)
- [API Documentation](#-api-documentation)
- [Project Structure](#-project-structure)
- [Key Achievements](#-key-achievements)
- [Deployment](#-deployment)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)

</details>

---

## 🎯 Overview

**ECOFlow** is a comprehensive **Engineering Change Order (ECO) Management System** designed for manufacturing and product engineering teams. It provides a structured workflow for managing product changes, BOM modifications, and multi-stage approval processes—all in one platform.

### Why ECOFlow?

- ⚡ **Eliminate Manual Workflows**: Automate ECO creation, submission, and approval tracking
- 🔒 **Role-Based Access Control**: Granular permissions for Engineering, Approvers, Operations, and Admins
- 📊 **Complete Audit Trail**: Track every change with comprehensive audit logs
- 🔄 **Version Control**: Manage product and BOM versions with automatic archiving
- ⚡ **Real-Time Collaboration**: Live notifications and updates via Server-Sent Events

### Who Is This For?

- **Manufacturing Teams** managing product changes and BOMs
- **Engineering Departments** coordinating design modifications
- **Quality Assurance Teams** reviewing and approving changes
- **Operations Teams** tracking production-ready versions

---

## ✨ Features

<table>
<thead>
<tr>
<th width="30%">Feature</th>
<th>Description</th>
<th width="20%">Status</th>
</tr>
</thead>
<tbody>
<tr>
<td>🔐 <strong>Authentication & Authorization</strong></td>
<td>JWT-based authentication with role-based access control (RBAC) for ADMIN, ENGINEERING, APPROVER, and OPERATIONS roles</td>
<td>✅ Active</td>
</tr>
<tr>
<td>📦 <strong>Product & BOM Management</strong></td>
<td>Create and manage products with multi-version support, BOM components, and operation sequences</td>
<td>✅ Active</td>
</tr>
<tr>
<td>📝 <strong>ECO Draft System</strong></td>
<td>Isolated draft storage for component and operation changes with ADDED/MODIFIED/REMOVED tracking</td>
<td>✅ Active</td>
</tr>
<tr>
<td>🔄 <strong>Multi-Stage Approval Workflow</strong></td>
<td>Configurable approval stages (Engineering Review → Manager → Operations → QA → Final) with auto-progression</td>
<td>✅ Active</td>
</tr>
<tr>
<td>📋 <strong>BOM Publish & Archive</strong></td>
<td>Transition BOMs from DRAFT → ACTIVE → ARCHIVED with validation checks</td>
<td>✅ Active</td>
</tr>
<tr>
<td>🔔 <strong>Real-Time Notifications</strong></td>
<td>Server-Sent Events (SSE) for instant updates on ECO status changes and approval requests</td>
<td>✅ Active</td>
</tr>
<tr>
<td>📎 <strong>File Attachments</strong></td>
<td>Cloudinary integration for uploading and managing technical drawings, specifications, and documents</td>
<td>✅ Active</td>
</tr>
<tr>
<td>📊 <strong>Comparison Views</strong></td>
<td>Side-by-side comparison of BOM versions showing component and operation differences</td>
<td>✅ Active</td>
</tr>
<tr>
<td>📜 <strong>Comprehensive Audit Logs</strong></td>
<td>Track all CREATE, UPDATE, DELETE, APPROVE, REJECT actions with timestamps and user attribution</td>
<td>✅ Active</td>
</tr>
<tr>
<td>📈 <strong>Dashboard & Analytics</strong></td>
<td>Visual overview of ECO status distribution, approval metrics, and recent activities</td>
<td>✅ Active</td>
</tr>
<tr>
<td>⚙️ <strong>User & Role Management</strong></td>
<td>Admin panel for managing users, assigning roles, and handling role requests</td>
<td>✅ Active</td>
</tr>
<tr>
<td>🔍 <strong>Advanced Search & Filtering</strong></td>
<td>Filter ECOs, products, and BOMs by status, type, date range, and custom criteria</td>
<td>✅ Active</td>
</tr>
</tbody>
</table>

---

## 🛠️ Tech Stack

<table>
<thead>
<tr>
<th width="25%">Layer</th>
<th width="35%">Technology</th>
<th>Purpose</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Frontend</strong></td>
<td>React 18 + TypeScript</td>
<td>Type-safe component-based UI</td>
</tr>
<tr>
<td></td>
<td>Vite</td>
<td>Lightning-fast build tool and dev server</td>
</tr>
<tr>
<td></td>
<td>Tailwind CSS</td>
<td>Utility-first styling with custom design system</td>
</tr>
<tr>
<td></td>
<td>Framer Motion</td>
<td>Smooth animations and transitions</td>
</tr>
<tr>
<td></td>
<td>Recharts</td>
<td>Data visualization for analytics dashboard</td>
</tr>
<tr>
<td><strong>Backend</strong></td>
<td>Node.js + Express</td>
<td>RESTful API server</td>
</tr>
<tr>
<td></td>
<td>TypeScript</td>
<td>Type safety across the entire backend</td>
</tr>
<tr>
<td></td>
<td>Prisma ORM</td>
<td>Type-safe database client with migrations</td>
</tr>
<tr>
<td><strong>Database</strong></td>
<td>PostgreSQL</td>
<td>Relational database for structured data</td>
</tr>
<tr>
<td><strong>Authentication</strong></td>
<td>JWT + bcrypt</td>
<td>Secure token-based authentication</td>
</tr>
<tr>
<td><strong>File Storage</strong></td>
<td>Cloudinary</td>
<td>Cloud-based media management</td>
</tr>
<tr>
<td><strong>Real-Time</strong></td>
<td>Server-Sent Events (SSE)</td>
<td>Push notifications from server to client</td>
</tr>
<tr>
<td><strong>Dev Tools</strong></td>
<td>Nodemon + ts-node</td>
<td>Hot-reloading development environment</td>
</tr>
<tr>
<td></td>
<td>ESLint + Prettier</td>
<td>Code quality and formatting</td>
</tr>
</tbody>
</table>

---

## 🏗️ Architecture

ECOFlow follows a **three-tier architecture** with clear separation of concerns:

1. **Presentation Layer (Frontend)**: React SPA with role-based UI components
2. **Application Layer (Backend)**: Express API with business logic and middleware
3. **Data Layer (Database)**: PostgreSQL with Prisma schema definitions

### System Overview

```mermaid
graph TB
    User[👤 User] --> Frontend[React Frontend]
    Frontend --> API[Express API Server]
    API --> Auth[JWT Auth Middleware]
    Auth --> Controllers[Controllers Layer]
    Controllers --> Prisma[Prisma ORM]
    Prisma --> DB[(PostgreSQL Database)]
    Controllers --> Cloudinary[☁️ Cloudinary CDN]
    API --> SSE[Server-Sent Events]
    SSE --> Frontend
    
    style Frontend fill:#3b82f6
    style API fill:#8b5cf6
    style DB fill:#10b981
    style Cloudinary fill:#f59e0b
```

### High-Level Architecture

```mermaid
graph LR
    subgraph Client
        UI[React UI]
        Store[Context API State]
    end
    
    subgraph API Gateway
        Routes[Route Handlers]
        AuthMW[Auth Middleware]
        Upload[Upload Middleware]
    end
    
    subgraph Business Logic
        Controllers[Controllers]
        Utils[Utilities]
    end
    
    subgraph Data Access
        Prisma[Prisma Client]
        Schema[Database Schema]
    end
    
    subgraph External Services
        Cloud[Cloudinary]
        Notify[SSE Notifications]
    end
    
    UI --> Routes
    Store --> Routes
    Routes --> AuthMW
    AuthMW --> Controllers
    Controllers --> Prisma
    Controllers --> Cloud
    Controllers --> Notify
    Prisma --> Schema
    Notify --> UI
    
    style Client fill:#dbeafe
    style API Gateway fill:#fef3c7
    style Business Logic fill:#e9d5ff
    style Data Access fill:#d1fae5
    style External Services fill:#ffe4e6
```

---

## 🔄 Data Flow

### ECO Approval Flow

```mermaid
sequenceDiagram
    participant E as Engineer
    participant API as Backend API
    participant DB as Database
    participant A as Approver
    participant N as Notification System
    
    E->>API: Create ECO (DRAFT)
    API->>DB: Save ECO with status=DRAFT
    DB-->>API: ECO Created
    API-->>E: ECO ID & Details
    
    E->>API: Add Component Drafts
    API->>DB: Insert into eco_bom_component_drafts
    DB-->>API: Drafts Saved
    
    E->>API: Submit ECO for Approval
    API->>DB: Update status=IN_PROGRESS, currentStage="Engineering Review"
    API->>N: Trigger Notification
    N-->>A: 🔔 ECO Ready for Review
    
    A->>API: Review ECO (Approve)
    API->>DB: Create ECOApproval Record
    API->>DB: Progress to Next Stage
    API->>N: Notify Engineer
    N-->>E: 🔔 ECO Approved
    
    Note over API,DB: If Final Stage Approved
    API->>DB: Apply ECO Changes to BOM
    API->>DB: Archive Old BOM Version
    API->>DB: Create New BOM Version
    API->>DB: Update ECO status=APPLIED
    API->>N: Notify All Stakeholders
```

---

## 📋 ECO Lifecycle

### State Machine Flow

```mermaid
stateDiagram-v2
    [*] --> DRAFT: Engineer Creates ECO
    DRAFT --> DRAFT: Add/Edit Drafts
    DRAFT --> IN_PROGRESS: Submit for Approval
    
    IN_PROGRESS --> APPROVED: All Stages Approved
    IN_PROGRESS --> REJECTED: Any Stage Rejected
    
    APPROVED --> APPLIED: Auto-Apply Changes
    
    REJECTED --> DRAFT: Revise & Resubmit
    
    APPLIED --> [*]: BOM Updated & Archived
    
    note right of IN_PROGRESS
        Stages:
        1. Engineering Review
        2. Manager Approval
        3. Operations Review
        4. QA
        5. Final Approval
    end note
    
    note right of APPLIED
        - New BOM version created
        - Old BOM archived
        - Components/Operations updated
        - Audit log generated
    end note
```

---

## 🚀 Installation

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **PostgreSQL** (v14 or higher)
- **Git**

### Backend Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/ecoflow.git
cd ecoflow

# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Setup PostgreSQL database
# Create a new database named 'ecoflow' or use your preferred name

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# (Optional) Seed database with sample data
npx ts-node prisma/seed.ts

# Start development server
npm run dev
```

The backend server will start on `http://localhost:5000`

### Frontend Setup

```bash
# Navigate to frontend directory (from project root)
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will start on `http://localhost:3000` (or next available port)

### Quick Start with Docker (Optional)

```bash
# Build and run with Docker Compose
docker-compose up --build

# Backend: http://localhost:5000
# Frontend: http://localhost:3000
```

---

## 🔐 Environment Variables

### Backend `.env`

Create a `.env` file in the `backend/` directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
DATABASE_URL="postgresql://username:password@localhost:5432/ecoflow?schema=public"

# JWT Authentication
JWT_SECRET=your-super-secure-jwt-secret-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Cloudinary (File Upload)
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:3002

# Optional: Logging
LOG_LEVEL=info
```

### Frontend `.env`

Create a `.env` file in the `frontend/` directory:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:5000/api

# Optional: Feature Flags
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_DEBUG=true
```

### Getting Cloudinary Credentials

1. Sign up at [cloudinary.com](https://cloudinary.com)
2. Navigate to Dashboard
3. Copy **Cloud Name**, **API Key**, and **API Secret**
4. Add to backend `.env` file

---

## 📡 API Documentation

### Base URL

```
http://localhost:5000/api
```

### Authentication

All protected routes require a JWT token in the `Authorization` header:

```
Authorization: Bearer <your-jwt-token>
```

### API Endpoints

<table>
<thead>
<tr>
<th width="15%">Method</th>
<th width="35%">Endpoint</th>
<th>Description</th>
<th width="20%">Auth Required</th>
</tr>
</thead>
<tbody>
<tr><td colspan="4"><strong>🔐 Authentication</strong></td></tr>
<tr>
<td><code>POST</code></td>
<td><code>/auth/register</code></td>
<td>Register new user</td>
<td>No</td>
</tr>
<tr>
<td><code>POST</code></td>
<td><code>/auth/login</code></td>
<td>Login user and get JWT token</td>
<td>No</td>
</tr>
<tr>
<td><code>GET</code></td>
<td><code>/auth/me</code></td>
<td>Get current user profile</td>
<td>Yes</td>
</tr>

<tr><td colspan="4"><strong>📦 Products</strong></td></tr>
<tr>
<td><code>GET</code></td>
<td><code>/products</code></td>
<td>List all products</td>
<td>Yes</td>
</tr>
<tr>
<td><code>GET</code></td>
<td><code>/products/:id</code></td>
<td>Get product details</td>
<td>Yes</td>
</tr>
<tr>
<td><code>POST</code></td>
<td><code>/products</code></td>
<td>Create new product (ADMIN/ENGINEERING)</td>
<td>Yes</td>
</tr>
<tr>
<td><code>PUT</code></td>
<td><code>/products/:id</code></td>
<td>Update product (ADMIN/ENGINEERING)</td>
<td>Yes</td>
</tr>
<tr>
<td><code>DELETE</code></td>
<td><code>/products/:id</code></td>
<td>Delete product (ADMIN only)</td>
<td>Yes</td>
</tr>

<tr><td colspan="4"><strong>🔧 BOMs (Bill of Materials)</strong></td></tr>
<tr>
<td><code>GET</code></td>
<td><code>/boms</code></td>
<td>List all BOMs</td>
<td>Yes</td>
</tr>
<tr>
<td><code>GET</code></td>
<td><code>/boms/:id</code></td>
<td>Get BOM details with components and operations</td>
<td>Yes</td>
</tr>
<tr>
<td><code>POST</code></td>
<td><code>/boms</code></td>
<td>Create new BOM (ADMIN/ENGINEERING)</td>
<td>Yes</td>
</tr>
<tr>
<td><code>POST</code></td>
<td><code>/boms/:id/publish</code></td>
<td>Publish BOM from DRAFT to ACTIVE (ADMIN/ENGINEERING)</td>
<td>Yes</td>
</tr>
<tr>
<td><code>PUT</code></td>
<td><code>/boms/:id</code></td>
<td>Update BOM (ADMIN/ENGINEERING)</td>
<td>Yes</td>
</tr>

<tr><td colspan="4"><strong>📝 ECOs (Engineering Change Orders)</strong></td></tr>
<tr>
<td><code>GET</code></td>
<td><code>/ecos</code></td>
<td>List all ECOs (with filters)</td>
<td>Yes</td>
</tr>
<tr>
<td><code>GET</code></td>
<td><code>/ecos/:id</code></td>
<td>Get ECO details with drafts</td>
<td>Yes</td>
</tr>
<tr>
<td><code>POST</code></td>
<td><code>/ecos</code></td>
<td>Create new ECO (ENGINEERING/ADMIN)</td>
<td>Yes</td>
</tr>
<tr>
<td><code>POST</code></td>
<td><code>/ecos/:id/submit</code></td>
<td>Submit ECO for approval</td>
<td>Yes</td>
</tr>
<tr>
<td><code>POST</code></td>
<td><code>/ecos/:id/review</code></td>
<td>Approve/Reject ECO (APPROVER/ADMIN)</td>
<td>Yes</td>
</tr>
<tr>
<td><code>POST</code></td>
<td><code>/ecos/:id/draft/components</code></td>
<td>Add component draft to ECO</td>
<td>Yes</td>
</tr>
<tr>
<td><code>PUT</code></td>
<td><code>/ecos/:id/draft/components/:draftId</code></td>
<td>Update component draft</td>
<td>Yes</td>
</tr>
<tr>
<td><code>DELETE</code></td>
<td><code>/ecos/:id/draft/components/:draftId</code></td>
<td>Remove component draft</td>
<td>Yes</td>
</tr>
<tr>
<td><code>POST</code></td>
<td><code>/ecos/:id/draft/operations</code></td>
<td>Add operation draft to ECO</td>
<td>Yes</td>
</tr>
<tr>
<td><code>PUT</code></td>
<td><code>/ecos/:id/draft/operations/:draftId</code></td>
<td>Update operation draft</td>
<td>Yes</td>
</tr>
<tr>
<td><code>DELETE</code></td>
<td><code>/ecos/:id/draft/operations/:draftId</code></td>
<td>Remove operation draft</td>
<td>Yes</td>
</tr>

<tr><td colspan="4"><strong>👥 Users & Roles</strong></td></tr>
<tr>
<td><code>GET</code></td>
<td><code>/users</code></td>
<td>List all users (ADMIN only)</td>
<td>Yes</td>
</tr>
<tr>
<td><code>POST</code></td>
<td><code>/roles/:id/assign</code></td>
<td>Assign roles to user (ADMIN only)</td>
<td>Yes</td>
</tr>

<tr><td colspan="4"><strong>🔔 Notifications</strong></td></tr>
<tr>
<td><code>GET</code></td>
<td><code>/notifications</code></td>
<td>Get user's notifications</td>
<td>Yes</td>
</tr>
<tr>
<td><code>GET</code></td>
<td><code>/notifications/stream</code></td>
<td>SSE stream for real-time notifications</td>
<td>Yes</td>
</tr>
<tr>
<td><code>PUT</code></td>
<td><code>/notifications/:id/read</code></td>
<td>Mark notification as read</td>
<td>Yes</td>
</tr>

<tr><td colspan="4"><strong>📊 Reports & Comparison</strong></td></tr>
<tr>
<td><code>GET</code></td>
<td><code>/reports/summary</code></td>
<td>Get dashboard summary statistics</td>
<td>Yes</td>
</tr>
<tr>
<td><code>POST</code></td>
<td><code>/comparison/bom</code></td>
<td>Compare two BOM versions</td>
<td>Yes</td>
</tr>
</tbody>
</table>

### Example Request

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ecoflow.com","password":"password123"}'

# Get all ECOs (with token)
curl -X GET http://localhost:5000/api/ecos \
  -H "Authorization: Bearer <your-jwt-token>"
```

---

## 📂 Project Structure

```
ECOFlow/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── cloudinary.ts       # Cloudinary configuration
│   │   │   └── database.ts         # Prisma client setup
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts
│   │   │   ├── bom.controller.ts
│   │   │   ├── comparison.controller.ts
│   │   │   ├── eco.controller.ts
│   │   │   ├── notification.controller.ts
│   │   │   ├── operations.controller.ts
│   │   │   ├── product.controller.ts
│   │   │   ├── report.controller.ts
│   │   │   ├── role.controller.ts
│   │   │   ├── settings.controller.ts
│   │   │   └── user.controller.ts
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.ts   # JWT verification & RBAC
│   │   │   └── upload.middleware.ts # Multer + Cloudinary
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   ├── bom.routes.ts
│   │   │   ├── comparison.routes.ts
│   │   │   ├── eco.routes.ts
│   │   │   ├── notification.routes.ts
│   │   │   ├── operations.routes.ts
│   │   │   ├── product.routes.ts
│   │   │   ├── report.routes.ts
│   │   │   ├── role.routes.ts
│   │   │   ├── settings.routes.ts
│   │   │   └── user.routes.ts
│   │   ├── types/
│   │   │   └── api.types.ts
│   │   ├── utils/
│   │   │   ├── jwt.utils.ts
│   │   │   └── password.utils.ts
│   │   └── server.ts               # Express app entry point
│   ├── prisma/
│   │   ├── schema.prisma           # Database schema
│   │   ├── seed.ts                 # Database seeding
│   │   └── migrations/             # Migration history
│   ├── package.json
│   ├── tsconfig.json
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── auth.api.ts
│   │   │   ├── boms.api.ts
│   │   │   ├── client.ts           # Axios instance
│   │   │   ├── ecos.api.ts
│   │   │   ├── operations.api.ts
│   │   │   ├── products.api.ts
│   │   │   ├── reports.api.ts
│   │   │   └── users.api.ts
│   │   ├── components/
│   │   │   ├── forms/
│   │   │   │   ├── CreateBOMModal.tsx
│   │   │   │   ├── CreateECOModal.tsx
│   │   │   │   └── CreateProductModal.tsx
│   │   │   ├── layout/
│   │   │   │   └── AppLayout.tsx
│   │   │   └── ui/
│   │   │       ├── Button.tsx
│   │   │       ├── Input.tsx
│   │   │       └── Modal.tsx
│   │   ├── context/
│   │   │   ├── AuthContext.tsx     # Auth state management
│   │   │   └── NotificationContext.tsx # SSE notifications
│   │   ├── pages/
│   │   │   ├── BOMDetail.tsx
│   │   │   ├── BOMs.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── ECODetail.tsx
│   │   │   ├── ECOs.tsx
│   │   │   ├── Features.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── ProductDetail.tsx
│   │   │   ├── Products.tsx
│   │   │   ├── Reports.tsx
│   │   │   ├── Settings.tsx
│   │   │   ├── Signup.tsx
│   │   │   └── Users.tsx
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── App.css
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── .env
│
├── docker-compose.yml              # (Optional) Docker setup
├── .gitignore
├── LICENSE
└── README.md
```

---

## 🎯 Key Achievements

<table>
<thead>
<tr>
<th width="40%">Metric</th>
<th width="30%">Value</th>
<th>Impact</th>
</tr>
</thead>
<tbody>
<tr>
<td>📊 <strong>Database Tables</strong></td>
<td>20+</td>
<td>Comprehensive data model covering all ECO workflows</td>
</tr>
<tr>
<td>🔐 <strong>Role-Based Permissions</strong></td>
<td>4 Roles</td>
<td>Granular access control for different user types</td>
</tr>
<tr>
<td>🔄 <strong>Approval Stages</strong></td>
<td>5 Stages</td>
<td>Configurable multi-stage approval workflow</td>
</tr>
<tr>
<td>📡 <strong>API Endpoints</strong></td>
<td>50+</td>
<td>RESTful API covering all features</td>
</tr>
<tr>
<td>⚡ <strong>Real-Time Updates</strong></td>
<td>SSE</td>
<td>Instant notifications without polling</td>
</tr>
<tr>
<td>📦 <strong>Type Safety</strong></td>
<td>100% TypeScript</td>
<td>Reduced runtime errors, better DX</td>
</tr>
<tr>
<td>🎨 <strong>UI Components</strong></td>
<td>30+</td>
<td>Reusable, accessible React components</td>
</tr>
<tr>
<td>📝 <strong>Audit Log Entries</strong></td>
<td>Unlimited</td>
<td>Complete traceability of all changes</td>
</tr>
<tr>
<td>🚀 <strong>Performance</strong></td>
<td>&lt;100ms API</td>
<td>Optimized database queries with Prisma</td>
</tr>
<tr>
<td>🔒 <strong>Security</strong></td>
<td>JWT + bcrypt</td>
<td>Industry-standard authentication</td>
</tr>
</tbody>
</table>

---

## 🌐 Deployment

### Frontend Deployment (Vercel / Netlify)

#### Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Navigate to frontend directory
cd frontend

# Deploy
vercel --prod
```

**Environment Variables to Set:**
- `VITE_API_BASE_URL`: Your backend production URL

#### Netlify

```bash
# Build command
npm run build

# Publish directory
dist

# Environment Variables
VITE_API_BASE_URL=https://your-backend-url.com/api
```

---

### Backend Deployment (Render / Railway / Fly.io)

#### Render (Recommended)

1. Create a new **Web Service** on [Render](https://render.com)
2. Connect your GitHub repository
3. Configure:
   - **Build Command**: `cd backend && npm install && npx prisma generate && npm run build`
   - **Start Command**: `cd backend && npm start`
   - **Environment**: Node
4. Add environment variables from `.env` template
5. Create a **PostgreSQL** database (Render provides free tier)
6. Update `DATABASE_URL` with provided connection string
7. Deploy!

#### Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Navigate to backend
cd backend

# Initialize
railway init

# Deploy
railway up

# Add PostgreSQL
railway add postgresql

# Link environment variables
railway variables
```

---

### Database Deployment

#### Option 1: Render PostgreSQL (Included with backend)
- Automatic backup
- Free tier available

#### Option 2: Supabase
1. Create project at [supabase.com](https://supabase.com)
2. Copy connection string
3. Update `DATABASE_URL` in environment variables
4. Run migrations: `npx prisma migrate deploy`

#### Option 3: Neon
1. Create database at [neon.tech](https://neon.tech)
2. Copy serverless connection string
3. Update `DATABASE_URL`
4. Deploy migrations

---

### Post-Deployment Steps

1. **Run Database Migrations**
   ```bash
   npx prisma migrate deploy
   ```

2. **Seed Database (Optional)**
   ```bash
   npx ts-node prisma/seed.ts
   ```

3. **Update CORS Origins**
   - Add production frontend URL to `ALLOWED_ORIGINS` in backend `.env`

4. **Test Authentication**
   - Verify JWT token generation
   - Test protected routes

5. **Setup Cloudinary**
   - Configure production upload presets
   - Update allowed domains

---

## 🔮 Roadmap

### Phase 1: Core Enhancements ✨
- [ ] **Advanced Search**: Elasticsearch integration for full-text search across ECOs, products, and BOMs
- [ ] **Batch Operations**: Bulk approve/reject multiple ECOs simultaneously
- [ ] **Export to PDF**: Generate comprehensive ECO reports with change summaries

### Phase 2: Collaboration 🤝
- [ ] **Comments System**: Thread-based discussions on ECO details
- [ ] **@Mentions**: Tag team members for review or input
- [ ] **Activity Feed**: Real-time feed of all system activities

### Phase 3: Intelligence 🧠
- [ ] **Smart Recommendations**: Suggest similar ECOs based on product/BOM patterns
- [ ] **Impact Analysis**: Predict downstream effects of proposed changes
- [ ] **Auto-Classification**: Categorize ECOs by complexity and risk level

### Phase 4: Integrations 🔗
- [ ] **ERP Integration**: Sync with SAP, Oracle, or custom ERP systems
- [ ] **Slack/Teams Notifications**: Push notifications to team channels
- [ ] **GitHub/GitLab Integration**: Link code changes to ECO records
- [ ] **Email Notifications**: Configurable email alerts for approvals

### Phase 5: Mobile & PWA 📱
- [ ] **Mobile App**: Native iOS/Android apps for on-the-go approvals
- [ ] **Offline Mode**: Work on ECOs without internet connectivity
- [ ] **Push Notifications**: Mobile notifications for urgent approvals

### Phase 6: Analytics 📊
- [ ] **Advanced Dashboards**: Power BI / Tableau integration
- [ ] **Cycle Time Analysis**: Track average time from ECO creation to approval
- [ ] **Approval Rate Metrics**: Measure approval/rejection rates by stage
- [ ] **Trend Analysis**: Identify patterns in ECO types and frequencies

---

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

### How to Contribute

1. **Fork the Repository**
   ```bash
   git clone https://github.com/yourusername/ecoflow.git
   ```

2. **Create a Feature Branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Make Your Changes**
   - Follow existing code style (TypeScript + ESLint)
   - Add tests if applicable
   - Update documentation

4. **Commit Your Changes**
   ```bash
   git commit -m "feat: add amazing feature"
   ```

5. **Push to Branch**
   ```bash
   git push origin feature/amazing-feature
   ```

6. **Open a Pull Request**

### Development Guidelines

- **Code Style**: Follow TypeScript best practices
- **Commit Messages**: Use conventional commits (`feat:`, `fix:`, `docs:`, etc.)
- **Testing**: Ensure all tests pass before submitting PR
- **Documentation**: Update README if adding new features

### Bug Reports

Found a bug? Please open an issue with:
- Clear description
- Steps to reproduce
- Expected vs actual behavior
- Screenshots (if applicable)

---

## 📄 License

This project is licensed under the **MIT License**.

```
MIT License

Copyright (c) 2026 ECOFlow Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

<div align="center">

## 🌟 Support ECOFlow

If you find this project useful, please consider:

<table>
<tr>
<td align="center" width="33%">
<h3>⭐ Star this Repo</h3>
<p>Show your support by starring the repository!</p>
<a href="https://github.com/yourusername/ecoflow">
<img src="https://img.shields.io/github/stars/yourusername/ecoflow?style=social" alt="Stars">
</a>
</td>
<td align="center" width="33%">
<h3>🐛 Report Bugs</h3>
<p>Found an issue? Let us know!</p>
<a href="https://github.com/yourusername/ecoflow/issues">
<img src="https://img.shields.io/badge/Report-Bug-red" alt="Report Bug">
</a>
</td>
<td align="center" width="33%">
<h3>✨ Request Features</h3>
<p>Have an idea? Share it with us!</p>
<a href="https://github.com/yourusername/ecoflow/issues">
<img src="https://img.shields.io/badge/Request-Feature-blue" alt="Request Feature">
</a>
</td>
</tr>
</table>

---

### 🔗 Quick Links

[Documentation](#) • [Demo Video](#) • [API Reference](#-api-documentation) • [Contributing](#-contributing)

---

**Built with ❤️ by the ECOFlow Team**

*Transforming manufacturing workflows, one ECO at a time.*

</div>
