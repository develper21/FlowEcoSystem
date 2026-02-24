# ECOFlow Backend API

> **Enterprise-grade Engineering Change Order & Version Master Data System Backend**

Built with Node.js, TypeScript, Express, Prisma, and PostgreSQL.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 14+
- Git

### Installation

```bash
# Clone repository
git clone <repository-url>
cd backend

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your database credentials

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Seed database with test data
npm run prisma:seed

# Start development server
npm run dev
```

Server will start on `http://localhost:5000`

---

## 🛠️ Tech Stack

| Technology | Purpose | Version |
|-----------|---------|---------|
| **Node.js** | Runtime | 18+ |
| **TypeScript** | Language | 5.3+ |
| **Express.js** | Web Framework | 4.18+ |
| **Prisma** | ORM | 5.8+ |
| **PostgreSQL** | Database | 14+ |
| **JWT** | Authentication | 9.0+ |
| **bcrypt** | Password Hashing | 5.1+ |
| **Morgan** | HTTP Logger | 1.10+ |

---

## 📁 Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Seed data
├── src/
│   ├── config/
│   │   └── database.ts        # Prisma client
│   ├── controllers/
│   │   └── auth.controller.ts # Business logic
│   ├── middlewares/
│   │   └── auth.middleware.ts # Auth & RBAC
│   ├── routes/
│   │   └── auth.routes.ts     # API routes
│   ├── types/
│   │   └── api.types.ts       # TypeScript types
│   ├── utils/
│   │   ├── jwt.utils.ts       # JWT helpers
│   │   └── password.utils.ts  # Password utils
│   └── server.ts              # App entry point
├── .env                        # Environment vars
├── package.json               # Dependencies
└── tsconfig.json              # TS configuration
```

---

## 🗄️ Database Schema

### Core Entities

1. **User** - User accounts with role-based access
2. **Product** - Product master data
3. **ProductVersion** - Versioned product data
4. **BOM** - Bill of Materials
5. **BOMComponent** - BoM components
6. **BOMOperation** - Manufacturing operations
7. **ECO** - Engineering Change Orders
8. **ECOApproval** - Approval workflow
9. **ApprovalStage** - Configurable stages
10. **AuditLog** - Complete audit trail

### Entity Relationships

```
Product 1---* ProductVersion
ProductVersion 1---* BOM
BOM 1---* BOMComponent
BOM 1---* BOMOperation
ECO *---1 Product
ECO *---1 BOM (optional)
ECO 1---* ECOApproval
User 1---* ECO (created by)
User 1---* ECOApproval (approved by)
User 1---* AuditLog
```

---

## 🔐 Authentication & Authorization

### User Roles

| Role | Permissions |
|------|-------------|
| **ADMIN** | Full system access, configuration |
| **ENGINEERING** | Create ECOs, manage drafts |
| **APPROVER** | Review and approve ECOs |
| **OPERATIONS** | View active data only |

### JWT Token Flow

1. User logs in with email/password
2. Server validates credentials
3. Server generates:
   - Access token (15 min expiry)
   - Refresh token (7 days expiry)
4. Client stores tokens
5. Client sends access token in `Authorization: Bearer <token>` header
6. Access token expires → Client requests new token using refresh token
7. User logs out → Refresh token is revoked

---

## 📡 API Endpoints

### Health Check
```
GET /health
```

### Authentication
```
POST   /api/auth/signup         # Register new user
POST   /api/auth/login          # Login
POST   /api/auth/refresh        # Refresh access token
POST   /api/auth/logout         # Logout
GET    /api/auth/me             # Get current user (protected)
```

### Coming Soon
- User Management
- Products & Versions
- BoM Management
- ECO Management
- Approval Workflow
- Audit Logs
- Reports

For detailed API documentation, see [API_TESTING.md](./API_TESTING.md)

---

## 🧪 Testing

### Default Test Users

After running `npm run prisma:seed`:

| Email | Password | Role |
|-------|----------|------|
| admin@ecoflow.com | password123 | ADMIN |
| engineer@ecoflow.com | password123 | ENGINEERING |
| approver@ecoflow.com | password123 | APPROVER |
| operations@ecoflow.com | password123 | OPERATIONS |

### Test Authentication

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"engineer@ecoflow.com","password":"password123"}'

# Get current user
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer <YOUR_ACCESS_TOKEN>"
```

---

## ⚙️ Configuration

### Environment Variables

```env
# Server
NODE_ENV=development
PORT=5000

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/ecoflow?schema=public"

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=your-refresh-secret
REFRESH_TOKEN_EXPIRES_IN=7d

# CORS
FRONTEND_URL=http://localhost:3000

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads
```

---

## 📜 Available Scripts

```bash
# Development
npm run dev              # Start with hot reload

# Build
npm run build            # Compile TypeScript
npm start                # Run production build

# Database
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run migrations
npm run prisma:studio    # Open DB GUI
npm run prisma:seed      # Seed test data

# Testing
npm test                 # Run tests
npm run test:watch       # Watch mode
```

---

## 🏗️ Development Workflow

### Adding New Feature

1. **Define Schema** (if needed)
   ```bash
   # Edit prisma/schema.prisma
   npx prisma migrate dev --name feature_name
   ```

2. **Create Controller**
   ```typescript
   // src/controllers/feature.controller.ts
   export const createFeature = async (req, res) => {
     // Business logic
   };
   ```

3. **Create Routes**
   ```typescript
   // src/routes/feature.routes.ts
   router.post('/', authenticate, authorize('ADMIN'), createFeature);
   ```

4. **Register Routes**
   ```typescript
   // src/server.ts
   import featureRoutes from './routes/feature.routes';
   app.use('/api/features', featureRoutes);
   ```

5. **Test**
   ```bash
   # Add tests to API_TESTING.md
   # Test manually with API client
   ```

---

## 🔒 Security Best Practices

✅ **Implemented:**
- Password hashing with bcrypt (salt rounds: 10)
- JWT-based authentication
- Refresh token rotation
- CORS protection
- Input validation
- Error handling middleware
- Role-based access control (RBAC)

🔜 **Coming:**
- Rate limiting
- Request sanitization
- SQL injection prevention (via Prisma)
- XSS protection
- CSRF tokens

---

## 🚀 Deployment

### Environment Setup

1. Set `NODE_ENV=production`
2. Use strong `JWT_SECRET` and `REFRESH_TOKEN_SECRET`
3. Configure production database URL
4. Enable SSL for database connection
5. Set up reverse proxy (Nginx)
6. Configure firewall rules

### Recommended Platforms

- **Backend:** Render, Railway, Heroku
- **Database:** Supabase, Railway, AWS RDS
- **Monitoring:** Sentry, Datadog, New Relic

---

## 📊 Development Status

✅ **Completed (Phase 1)**
- Project setup
- Database schema
- Prisma integration
- Authentication (signup, login, logout, refresh)
- JWT utilities
- Password hashing
- RBAC middleware
- Seed data
- API documentation

🔜 **Next (Phase 2)**
- User management APIs
- Product master APIs
- Product version management
- BoM APIs
- ECO core APIs

📅 **Upcoming (Phase 3+)**
- ECO approval workflow
- Change comparison (diff engine)
- Audit logging APIs
- Reporting & exports
- File upload
- Advanced features

For detailed progress, see [DEVELOPMENT_PROGRESS.md](./DEVELOPMENT_PROGRESS.md)

---

## 🐛 Troubleshooting

### Common Issues

**Server won't start:**
```bash
# Check if port 5000 is in use
netstat -ano | findstr :5000

# Check environment variables
cat .env
```

**Database connection error:**
```bash
# Verify PostgreSQL is running
# Check DATABASE_URL in .env
# Run migrations
npx prisma migrate dev
```

**TypeScript errors:**
```bash
# Regenerate Prisma client
npx prisma generate

# Clear build cache
rm -rf dist node_modules
npm install
```

**Token errors:**
```bash
# Ensure JWT_SECRET is set in .env
# Check token expiry times
# Verify Authorization header format: "Bearer <token>"
```

---

## 📚 Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [JWT.io](https://jwt.io/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

## 👥 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 📄 License

MIT License - see LICENSE file for details

---

## 📞 Support

For issues, questions, or contributions:
- Create an issue in the repository
- Contact: [Your Email]

---

**Built with 💙 for ECOFlow**
