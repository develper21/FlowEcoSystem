# ECOFlow Backend API Documentation

**Version:** 1.0.0  
**Base URL:** `http://localhost:5000/api`  
**Date:** January 24, 2026

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Complete API Endpoints Reference](#complete-api-endpoints-reference)
3. [Backend Rules & Guarantees](#backend-rules--guarantees)
4. [Data Models](#data-models)
5. [Security & Authentication](#security--authentication)
6. [Frontend Integration Guide](#frontend-integration-guide)

---

## System Overview

ECOFlow is an **Engineering Change Order (ECO) Management System** with version control for Product Master Data and Bill of Materials (BoM). It ensures **no direct edits** to active data, **full traceability**, and **approval-driven workflows**.

### Core Technologies
- **Runtime:** Node.js + Express + TypeScript
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** JWT (Access + Refresh tokens)
- **Real-time:** Server-Sent Events (SSE) for notifications

### Key Architecture Principles
- **Separation of Concerns:** Draft changes stored separately from active master data
- **Version Control:** All changes create new versions (no overwrites)
- **Role-Based Access Control (RBAC):** 4 roles with distinct permissions
- **Audit Trail:** Every action logged with old/new values

---

## Complete API Endpoints Reference

### 🔐 **1. Authentication & Authorization**

**Base Path:** `/api/auth`

| Method | Endpoint | Access | Description | Request Body | Response |
|--------|----------|--------|-------------|--------------|----------|
| `POST` | `/signup` | Public | Register new user | `{ email, password, name, roles }` | User object + tokens |
| `POST` | `/login` | Public | User login | `{ email, password }` | User object + role + access/refresh tokens |
| `POST` | `/refresh` | Public | Refresh access token | `{ refreshToken }` | New access token |
| `POST` | `/logout` | Public | Logout user | `{ refreshToken }` | Success message |
| `GET` | `/me` | Private | Get current user info | - | User object with roles |

**Frontend Usage:**
- Use `/login` to authenticate and store tokens
- JWT contains `userId` and `roles` for UI adaptation
- Call `/me` on app load to verify session
- Implement auto-refresh logic for expired tokens

---

### 👤 **2. User Management**

**Base Path:** `/api/users`  
**Access:** ADMIN only (all endpoints)

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| `GET` | `/` | Get all users (with pagination/search) | Query: `?page=1&limit=10&search=text` | Array of users + pagination |
| `GET` | `/:id` | Get user by ID | - | User object with roles |
| `PUT` | `/:id` | Update user details | `{ name, email, roles }` | Updated user |
| `PATCH` | `/:id/status` | Activate/disable user | `{ status: 'ACTIVE' \| 'DISABLED' }` | Updated user |
| `PATCH` | `/:id/password` | Reset user password (admin) | `{ newPassword }` | Success message |
| `DELETE` | `/:id` | Delete user | - | Success message |

**Frontend Usage:**
- Admin panel for user management
- Disable users instead of deleting (soft delete)
- Password reset by admin (not self-service)

---

### 🛠️ **3. Role Management**

**Base Path:** `/api/roles`  
**Access:** ADMIN only (all endpoints)

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| `PUT` | `/users/:id/roles` | Assign multiple roles to user | `{ roles: ['ENGINEERING', 'APPROVER'] }` | Updated user with roles |
| `POST` | `/users/:id/roles` | Add single role to user | `{ role: 'ENGINEERING' }` | Updated user with roles |
| `DELETE` | `/users/:id/roles` | Remove single role from user | `{ role: 'ENGINEERING' }` | Updated user with roles |
| `GET` | `/users/:id/roles` | Get user's roles | - | Array of roles |

**Available Roles:**
- `ENGINEERING` - Create and modify ECOs
- `APPROVER` - Review and approve ECOs
- `OPERATIONS` - View active data only
- `ADMIN` - Full system access

**Frontend Usage:**
- User can have multiple roles simultaneously
- Frontend should check roles array: `user.roles.includes('ADMIN')`

---

### 📦 **4. Product Master**

**Base Path:** `/api/products`  
**Access:** Mixed (see individual endpoints)

| Method | Endpoint | Access | Description | Request Body | Response |
|--------|----------|--------|-------------|--------------|----------|
| `POST` | `/` | ENGINEERING, ADMIN | Create new product | `{ name }` | Product with v1.0 (DRAFT) |
| `GET` | `/` | All authenticated | Get all products | Query: `?page=1&limit=10&search=text&archived=false` | Products array + pagination |
| `GET` | `/:id` | All authenticated | Get product by ID | - | Product with all versions |
| `PUT` | `/:id` | ENGINEERING, ADMIN | Update product name | `{ name }` | Updated product |
| `DELETE` | `/:id` | ADMIN | Delete product | - | Success message |
| `PATCH` | `/:id/archive` | ADMIN | Archive product + cascade | Query: `?cascadeArchive=true` | Success message |
| `POST` | `/:id/versions` | ENGINEERING, ADMIN | Create new version | `{ version, salePrice, costPrice, attachments }` | New ProductVersion |
| `PUT` | `/versions/:id` | ENGINEERING, ADMIN | Update version | `{ salePrice, costPrice, attachments }` | Updated ProductVersion |

**Product Status Flow:** `DRAFT → ACTIVE → ARCHIVED`

**CRITICAL RULES:**
- ❌ **Cannot edit ACTIVE products directly** (must use ECO)
- ❌ **Cannot edit ARCHIVED products** (read-only)
- ✅ **Only DRAFT products can be edited directly**
- ⚠️ **Archiving cascades to all versions and BOMs** (if `cascadeArchive=true`)

**Frontend Usage:**
```javascript
// Creating product
POST /api/products { name: "Gear Assembly" }
// Response: { product: { id, name, status: "DRAFT", currentVersion: { version: "v1.0" } } }

// Making product active (via ECO only)
// Archived products cannot be:
// - Edited
// - Selected in new BOMs
// - Selected in new ECOs
```

---

### 🔧 **5. Bill of Materials (BoM)**

**Base Path:** `/api/boms`  
**Access:** Mixed (see individual endpoints)

| Method | Endpoint | Access | Description | Request Body | Response |
|--------|----------|--------|-------------|--------------|----------|
| `POST` | `/` | ENGINEERING, ADMIN | Create BoM | `{ productVersionId, version, components, operations }` | BoM object |
| `GET` | `/` | All authenticated | Get all BoMs | Query: `?productId=xxx&page=1&limit=10` | BoMs array + pagination |
| `GET` | `/:id` | All authenticated | Get BoM by ID | - | BoM with components & operations |
| `PUT` | `/:id` | ENGINEERING, ADMIN | Update BoM metadata | `{ version, status }` | Updated BoM |
| `POST` | `/:id/components` | ENGINEERING, ADMIN | Add component | `{ productId, quantity }` | New component |
| `DELETE` | `/:id/components/:componentId` | ENGINEERING, ADMIN | Remove component | - | Success message |
| `POST` | `/:id/operations` | ENGINEERING, ADMIN | Add operation | `{ name, time, workCenter, sequence }` | New operation |
| `DELETE` | `/:id/operations/:operationId` | ENGINEERING, ADMIN | Remove operation | - | Success message |

**BoM Structure:**
```json
{
  "id": "bom-123",
  "productVersionId": "pv-456",
  "version": "v1.0",
  "status": "ACTIVE",
  "components": [
    { "productId": "prod-789", "quantity": 5 }
  ],
  "operations": [
    { "name": "Welding", "time": 30, "workCenter": "WC-01", "sequence": 1 }
  ]
}
```

**CRITICAL RULES:**
- ❌ **Cannot use ARCHIVED products as components**
- ❌ **Cannot modify ARCHIVED BOMs** (read-only)
- ✅ **Each BoM linked to specific ProductVersion**
- ✅ **Old BoMs preserved after version update** (no overwrite)

**Frontend Usage:**
- Filter components to exclude archived products
- Validate component product status before adding
- Use version dropdown to show BoM history

---

### 📋 **6. Engineering Change Orders (ECO)**

**Base Path:** `/api/ecos`  
**Access:** Role-based (see individual endpoints)

| Method | Endpoint | Access | Description | Request Body | Response |
|--------|----------|--------|-------------|--------------|----------|
| `POST` | `/` | ENGINEERING, ADMIN | Create new ECO | `{ title, type, productId, bomId?, versionUpdate, effectiveDate }` | ECO object |
| `GET` | `/` | All authenticated | Get all ECOs | Query: `?page=1&limit=10&status=DRAFT&type=PRODUCT` | ECOs array + pagination |
| `GET` | `/:id` | All authenticated | Get ECO by ID | - | ECO with full details |
| `PUT` | `/:id` | ENGINEERING, ADMIN | Update ECO draft | `{ title, draftData, effectiveDate, versionUpdate }` | Updated ECO |
| `POST` | `/:id/submit` | ENGINEERING, ADMIN | Submit ECO for approval | - | ECO moved to first approval stage |
| `POST` | `/:id/review` | APPROVER, ADMIN | Approve/reject ECO | `{ action: 'APPROVE'\|'REJECT', comments }` | ECO with updated stage |
| `POST` | `/:id/apply` | ADMIN | Apply ECO (final stage) | - | New version created + ECO marked APPLIED |

**ECO Types:**
- `PRODUCT` - Changes to product pricing/attachments
- `BOM` - Changes to components/operations

**ECO Status Flow:**
```
DRAFT → (submit) → IN_PROGRESS → (approve) → IN_PROGRESS → (approve) → APPROVED → (apply) → APPLIED
                                ↓ (reject)
                              REJECTED
```

**ECO Draft Data Structure:**
```json
{
  "draftData": {
    "product": {
      "salePrice": 150.00,
      "costPrice": 100.00,
      "attachments": ["url1", "url2"]
    },
    "bom": {
      "components": [
        { "productId": "prod-123", "quantity": 10 }
      ],
      "operations": [
        { "name": "Assembly", "time": 45, "workCenter": "WC-02", "sequence": 1 }
      ]
    }
  }
}
```

**Version Update Behavior:**
- `versionUpdate: true` → Creates NEW version (e.g., v1.0 → v2.0)
- `versionUpdate: false` → Modifies SAME version (if supported)

**CRITICAL RULES:**
- ❌ **Draft changes DO NOT affect master data** until applied
- ✅ **Must validate mandatory fields before submission**
- ✅ **Stage-based approval flow** (configurable via Settings)
- ✅ **Final stage marks ECO as APPLIED**
- ⚠️ **When applied:** Old version → ARCHIVED, New version → ACTIVE

**Frontend Usage:**
```javascript
// Create ECO
POST /api/ecos {
  title: "Update Gear Sale Price",
  type: "PRODUCT",
  productId: "prod-123",
  versionUpdate: true,
  effectiveDate: "2026-02-01",
  draftData: {
    product: { salePrice: 200 }
  }
}

// Submit for approval
POST /api/ecos/:id/submit

// Approver reviews
POST /api/ecos/:id/review {
  action: "APPROVE",
  comments: "Price increase justified"
}

// Admin applies (final)
POST /api/ecos/:id/apply
```

---

### 🔍 **7. Comparison & Diff**

**Base Path:** `/api/comparison`  
**Access:** All authenticated users

| Method | Endpoint | Description | Query Params | Response |
|--------|----------|-------------|--------------|----------|
| `GET` | `/ecos/:id/comparison` | Get ECO changes diff | - | Old vs New comparison |
| `GET` | `/products/:productId/versions` | Get product version history | - | Array of versions with changes |
| `GET` | `/boms/:bomId/comparison/:oldVersion/:newVersion` | Compare 2 BoM versions | - | Component & operation diffs |

**Comparison Response Example:**
```json
{
  "type": "PRODUCT",
  "changes": {
    "salePrice": { "old": 100, "new": 150, "change": "+50" },
    "costPrice": { "old": 70, "new": 70, "change": "0" },
    "attachments": { "added": ["file3.pdf"], "removed": [] }
  }
}
```

**For BoM:**
```json
{
  "components": {
    "added": [{ "productId": "prod-789", "quantity": 5 }],
    "removed": [{ "productId": "prod-456", "quantity": 3 }],
    "modified": [
      { "productId": "prod-123", "oldQuantity": 10, "newQuantity": 15 }
    ]
  },
  "operations": {
    "added": [{ "name": "Polishing", "time": 20 }],
    "removed": [],
    "modified": [
      { "name": "Welding", "oldTime": 30, "newTime": 45 }
    ]
  }
}
```

**Frontend Usage:**
- Show before/after comparison in ECO review screen
- Highlight changed fields in red/green
- Use for audit reports

---

### 📊 **8. Reports & Analytics**

**Base Path:** `/api/reports`  
**Access:** Mixed (see individual endpoints)

| Method | Endpoint | Access | Description | Query Params | Response |
|--------|----------|--------|-------------|--------------|----------|
| `GET` | `/audit-logs` | ADMIN | Get audit trail | `?page=1&limit=50&entityType=ECO&startDate=2026-01-01` | Audit logs array |
| `GET` | `/eco-stats` | All authenticated | Get ECO statistics | - | Stats object (counts by status/type) |
| `GET` | `/products/:id/version-history` | All authenticated | Product version changelog | - | Version history with changes |
| `GET` | `/product-versions/:id/bom-history` | All authenticated | BoM change history | - | BoM changelog |
| `GET` | `/archived-products` | All authenticated | List archived products | `?page=1&limit=10` | Archived products array |
| `GET` | `/active-matrix` | All authenticated | Active Product-Version-BoM matrix | - | Matrix of active entities |

**Audit Log Structure:**
```json
{
  "action": "VERSION_CREATE",
  "entityType": "PRODUCT_VERSION",
  "entityId": "pv-456",
  "oldValue": { "version": "v1.0", "salePrice": 100 },
  "newValue": { "version": "v2.0", "salePrice": 150 },
  "userId": "user-123",
  "ecoId": "eco-789",
  "stage": "Applied",
  "ipAddress": "192.168.1.1",
  "createdAt": "2026-01-24T10:30:00Z"
}
```

**Tracked Events:**
- `CREATE`, `UPDATE`, `DELETE`
- `APPROVE`, `REJECT`
- `ARCHIVE`, `STAGE_TRANSITION`
- `VERSION_CREATE`

**Frontend Usage:**
- Display audit trail in ECO details
- Generate compliance reports
- Track who changed what and when

---

### ⚙️ **9. Settings & Configuration**

**Base Path:** `/api/settings`  
**Access:** Mixed (read: all, write: ADMIN)

| Method | Endpoint | Access | Description | Request Body | Response |
|--------|----------|--------|-------------|--------------|----------|
| `GET` | `/stages` | All authenticated | Get all approval stages | - | Array of stages |
| `GET` | `/stages/:id` | All authenticated | Get stage by ID | - | Stage object |
| `POST` | `/stages` | ADMIN | Create approval stage | `{ name, order, requiresApproval, isFinal }` | New stage |
| `PUT` | `/stages/:id` | ADMIN | Update stage | `{ name, order, requiresApproval, isFinal }` | Updated stage |
| `DELETE` | `/stages/:id` | ADMIN | Delete stage | - | Success message |
| `GET` | `/stages/next/:currentSequence` | All authenticated | Get next stage in workflow | - | Next stage object |

**Approval Stage Structure:**
```json
{
  "id": "stage-123",
  "name": "Engineering Review",
  "order": 1,
  "requiresApproval": true,
  "isFinal": false
}
```

**Example Workflow:**
1. **New** (order: 0) - Draft creation
2. **Engineering Review** (order: 1, requiresApproval: true)
3. **Management Approval** (order: 2, requiresApproval: true)
4. **Applied** (order: 3, isFinal: true)

**Frontend Usage:**
- Display workflow progress bar
- Show current stage in ECO list
- Configure stages in admin panel

---

### 🏭 **10. Operations View**

**Base Path:** `/api/operations`  
**Access:** OPERATIONS, ADMIN only

| Method | Endpoint | Description | Query Params | Response |
|--------|----------|-------------|--------------|----------|
| `GET` | `/products` | Get ACTIVE products only | `?page=1&limit=10` | Active products array |
| `GET` | `/products/:id` | Get specific active product | - | Active product details |
| `GET` | `/boms` | Get ACTIVE BOMs only | `?page=1&limit=10` | Active BOMs array |
| `GET` | `/boms/:id` | Get specific active BoM | - | Active BoM with components/operations |
| `GET` | `/active-matrix` | Active Product-Version-BoM matrix | - | Matrix of usable data |

**CRITICAL:** These endpoints **NEVER return DRAFT or ARCHIVED data**

**Frontend Usage:**
- Operations role sees ONLY production-ready data
- Use for manufacturing planning
- No visibility into pending ECOs or drafts

---

### 🔔 **11. Notifications**

**Base Path:** `/api/notifications`  
**Access:** All authenticated users

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| `GET` | `/stream` | SSE stream for real-time notifications | - | EventSource stream |
| `POST` | `/broadcast` | Send notification to all users | `{ type, title, message, data }` | Success message |
| `POST` | `/users/:userId` | Send notification to specific user | `{ type, title, message, data }` | Success message |
| `GET` | `/` | Get user's notifications | `?read=false&page=1` | Notifications array |
| `PATCH` | `/:id/read` | Mark notification as read | - | Updated notification |
| `PATCH` | `/read-all` | Mark all as read | - | Success message |
| `DELETE` | `/:id` | Delete notification | - | Success message |

**Notification Types:**
- `ECO_CREATED`, `ECO_SUBMITTED`
- `ECO_APPROVED`, `ECO_REJECTED`, `ECO_APPLIED`
- `STAGE_CHANGED`, `APPROVAL_REQUIRED`
- `VERSION_CREATED`

**Frontend Integration:**
```javascript
// Connect to SSE stream
const eventSource = new EventSource('/api/notifications/stream', {
  headers: { Authorization: `Bearer ${accessToken}` }
});

eventSource.onmessage = (event) => {
  const notification = JSON.parse(event.data);
  // Show toast/banner
  showNotification(notification);
};
```

---

## Backend Rules & Guarantees

This section maps to the requirements specification and ensures **complete traceability** for frontend developers.

---

### **A) CORE PURPOSE / SYSTEM GUARANTEES**

| Rule ID | Status | Implementation | Evidence |
|---------|--------|---------------|----------|
| **A1** | ✅ PASS | Direct edits blocked on ACTIVE products via status check | `product.controller.ts:115-124` |
| **A2** | ✅ PASS | Draft data stored in `ECO.draftData` JSON field | `schema.prisma:183`, `eco.controller.ts:220` |
| **A3** | ✅ PASS | Old versions marked ARCHIVED (never deleted) | `eco.controller.ts:47-54` |
| **A4** | ✅ PASS | Stage-driven approval with ApprovalStage model | `schema.prisma:211-231`, `eco.controller.ts:450` |

**Enforcement Details:**

**A1 - Prevent Direct Edits:**
```typescript
// In product.controller.ts
if (existingProduct.status === 'ACTIVE') {
  res.status(400).json({ 
    message: 'Cannot directly edit active products. Use ECO workflow.' 
  });
  return;
}
```

**A2 - Separation of Draft/Applied:**
- `ECO.draftData` stores proposed changes as JSON
- Master data remains unchanged until `applyECO()` is called
- Comparison endpoint compares `draftData` vs `currentVersion`

**A3 - History Preservation:**
- When ECO applied: `status: 'ARCHIVED'` (not `DELETE`)
- Archived products queryable: `GET /api/reports/archived-products`
- Foreign keys use `onDelete: Restrict` to prevent cascading deletes

**A4 - Consistent Approval:**
- `ApprovalStage` defines workflow (order, requiresApproval, isFinal)
- `ECOApproval` tracks approvals per stage
- Cannot skip stages (enforced in `reviewECO()`)

---

### **B) AUTHENTICATION + ROLE ACCESS CONTROL**

| Rule ID | Status | Implementation | Evidence |
|---------|--------|---------------|----------|
| **B1** | ✅ PASS | `/api/auth/signup` and `/api/auth/login` exist | `auth.routes.ts:11-20` |
| **B2** | ✅ PASS | JWT payload includes `userId` and `roles` | `jwt.utils.ts`, `auth.controller.ts:87` |
| **B3** | ✅ PASS | 4 roles defined in UserRole enum | `schema.prisma:17-22` |
| **B4** | ✅ PASS | `authenticate()` and `authorize()` middleware enforced | `auth.middleware.ts`, all routes |
| **B5** | ✅ PASS | ENGINEERING can create/modify ECOs | `eco.routes.ts:15-17` |
| **B6** | ✅ PASS | APPROVER can review/approve ECOs | `eco.routes.ts:19` |
| **B7** | ✅ PASS | OPERATIONS sees ACTIVE data only | `operations.routes.ts`, `operations.controller.ts:20-50` |
| **B8** | ✅ PASS | ADMIN has full access + stage configuration | All routes + `settings.routes.ts` |

**Middleware Stack:**
```typescript
// All protected routes use:
router.use(authenticate);  // Verify JWT
router.use(authorize('ADMIN', 'ENGINEERING'));  // Check roles
```

**Role Enforcement Examples:**

**ENGINEERING Permissions:**
```typescript
router.post('/', authorize('ENGINEERING', 'ADMIN'), createECO);
router.put('/:id', authorize('ENGINEERING', 'ADMIN'), updateECO);
router.post('/:id/submit', authorize('ENGINEERING', 'ADMIN'), submitECO);
```

**APPROVER Permissions:**
```typescript
router.post('/:id/review', authorize('APPROVER', 'ADMIN'), reviewECO);
```

**OPERATIONS Permissions:**
```typescript
// In operations.controller.ts
where: { status: 'ACTIVE' }  // ONLY active data
```

**Frontend Integration:**
```javascript
// After login, check roles:
const user = jwtDecode(accessToken);
if (user.roles.includes('APPROVER')) {
  showApprovalQueue();
}
```

---

### **C) PRODUCT MASTER RULES**

| Rule ID | Status | Implementation | Evidence |
|---------|--------|---------------|----------|
| **C1** | ✅ PASS | ProductVersion model has all required fields | `schema.prisma:86-101` |
| **C2** | ✅ PASS | Direct update blocked for ACTIVE products | `product.controller.ts:115-124` |
| **C3** | ✅ PASS | Archived products read-only + validation checks | `product.controller.ts:130-137`, `bom.controller.ts:16-30` |

**Product Schema:**
```prisma
model ProductVersion {
  salePrice   Float
  costPrice   Float
  attachments Json?  // Array of file URLs
  status      ProductStatus  // DRAFT, ACTIVE, ARCHIVED
}
```

**Archived Product Restrictions:**

**Cannot Edit:**
```typescript
if (existingProduct.status === 'ARCHIVED') {
  res.status(400).json({ 
    message: 'Cannot edit archived products. Read-only for traceability.' 
  });
}
```

**Cannot Use in BoMs:**
```typescript
// In createBOM()
const archivedProducts = await prisma.product.findMany({
  where: { id: { in: componentProductIds }, status: 'ARCHIVED' }
});
if (archivedProducts.length > 0) {
  res.status(400).json({ 
    message: `Cannot use archived products: ${names}` 
  });
}
```

**Cannot Use in ECOs:**
```typescript
// Similar validation in createECO()
```

**Frontend Usage:**
- Filter product dropdown: `status !== 'ARCHIVED'`
- Show archived flag in product list
- Display "Read-Only" banner for archived products

---

### **D) BOM (BILL OF MATERIALS) RULES**

| Rule ID | Status | Implementation | Evidence |
|---------|--------|---------------|----------|
| **D1** | ✅ PASS | BoM linked to ProductVersion via `productVersionId` | `schema.prisma:115-133` |
| **D2** | ✅ PASS | Operations controller filters `status: 'ACTIVE'` | `operations.controller.ts:30` |
| **D3** | ✅ PASS | Old BoMs marked ARCHIVED (not deleted) | `eco.controller.ts:116-125` |
| **D4** | ✅ PASS | BOMComponent and BOMOperation models exist | `schema.prisma:135-170` |
| **D5** | ✅ PASS | Archived BoM edit blocked | `bom.controller.ts:120-129` |

**BoM-Version Linking:**
```prisma
model BOM {
  productVersionId String
  version          String  // v1.0, v2.0
  status           BOMStatus  // DRAFT, ACTIVE, ARCHIVED
  
  productVersion ProductVersion @relation(...)
  
  @@unique([productVersionId, version])  // One BoM per version
}
```

**Active BoM Enforcement:**
```typescript
// In operations.controller.ts
const boms = await prisma.bOM.findMany({
  where: { status: 'ACTIVE' }  // Only active BOMs
});
```

**BoM Preservation:**
When ECO creates new BoM version:
```typescript
// Old BoM
await tx.bOM.update({ where: { id: oldBomId }, data: { status: 'ARCHIVED' } });

// New BoM
const newBom = await tx.bOM.create({ data: { ... , status: 'ACTIVE' } });
```

**Frontend Usage:**
- Show BoM version dropdown
- Filter archived BoMs in selects
- Display "Archived" badge for historical BoMs

---

### **E) ECO (ENGINEERING CHANGE ORDER) RULES**

| Rule ID | Status | Implementation | Evidence |
|---------|--------|---------------|----------|
| **E1** | ✅ PASS | ECO model has all required fields | `schema.prisma:175-197` |
| **E2** | ✅ PASS | Default stage is "New" | `schema.prisma:188` |
| **E3** | ✅ PASS | Validation before submission | `eco.controller.ts:300-330` |
| **E4** | ✅ PASS | `draftData` JSON field stores changes | `schema.prisma:190` |
| **E5** | ✅ PASS | `versionUpdate` boolean controls behavior | `schema.prisma:189`, `eco.controller.ts:35-40` |
| **E6** | ✅ PASS | Stage-based approval logic | `eco.controller.ts:450-520` |
| **E7** | ✅ PASS | `reviewECO()` moves to next stage | `eco.controller.ts:487` |
| **E8** | ✅ PASS | Final stage marks `status: 'APPLIED'` | `eco.controller.ts:540` |
| **E9** | ✅ PASS | `applyECO()` archives old, activates new | `eco.controller.ts:47-80` |
| **E10** | ✅ PASS | Operations endpoints exclude non-active | `operations.controller.ts:20-50` |

**ECO Lifecycle:**

**1. Create (DRAFT):**
```typescript
POST /api/ecos {
  title: "Update Sale Price",
  type: "PRODUCT",
  productId: "prod-123",
  versionUpdate: true,
  draftData: { product: { salePrice: 200 } }
}
// status: DRAFT, currentStage: "New"
```

**2. Submit (IN_PROGRESS):**
```typescript
POST /api/ecos/:id/submit
// Validates mandatory fields
// status: IN_PROGRESS, currentStage: "Engineering Review"
```

**3. Review (approval):**
```typescript
POST /api/ecos/:id/review { action: "APPROVE", comments: "..." }
// Moves to next stage OR marks APPROVED if final approval stage
```

**4. Apply (APPLIED):**
```typescript
POST /api/ecos/:id/apply
// Creates new version (if versionUpdate: true)
// Archives old version
// status: APPLIED
```

**Version Update Behavior:**

**versionUpdate: true (New Version):**
```typescript
// Old: v1.0 → ARCHIVED
// New: v2.0 → ACTIVE
```

**versionUpdate: false (Same Version):**
```typescript
// Modifies existing version
// No archive (use carefully!)
```

**Draft Data Isolation:**
- `ECO.draftData` does NOT touch `ProductVersion` or `BOM` tables
- Comparison endpoint reads from `draftData`
- Only `applyECO()` writes to master tables

**Frontend Usage:**
```javascript
// Create ECO with draft changes
const draftData = {
  product: {
    salePrice: newPrice,
    costPrice: newCost
  }
};

POST /api/ecos { title, type, productId, versionUpdate: true, draftData };

// Display draft changes in preview
GET /api/comparison/ecos/:id/comparison

// Submit for approval
POST /api/ecos/:id/submit

// Approvers review
POST /api/ecos/:id/review { action: "APPROVE" }

// Admin applies
POST /api/ecos/:id/apply
```

---

### **F) DIFF / COMPARISON RULES (BACKEND SUPPORT)**

| Rule ID | Status | Implementation | Evidence |
|---------|--------|---------------|----------|
| **F1** | ✅ PASS | BoM comparison endpoint exists | `comparison.routes.ts:12`, `comparison.controller.ts` |
| **F2** | ✅ PASS | Product comparison in ECO endpoint | `comparison.controller.ts:getECOComparison()` |
| **F3** | ✅ PASS | Compares currentVersion vs draftData | `comparison.controller.ts:45-80` |

**Comparison Logic:**

**Product Changes:**
```typescript
const old = productVersion;  // Current active version
const new = eco.draftData.product;  // Draft changes

const comparison = {
  salePrice: { old: old.salePrice, new: new.salePrice, change: diff },
  costPrice: { old: old.costPrice, new: new.costPrice, change: diff },
  attachments: { added: [...], removed: [...] }
};
```

**BoM Changes:**
```typescript
GET /api/comparison/boms/:bomId/comparison/:oldVersion/:newVersion

const comparison = {
  components: {
    added: [{ productId, quantity }],
    removed: [{ productId, quantity }],
    modified: [{ productId, oldQuantity, newQuantity }]
  },
  operations: {
    added: [{ name, time }],
    removed: [{ name, time }],
    modified: [{ name, oldTime, newTime }]
  }
};
```

**Frontend Usage:**
```javascript
// Show ECO changes before approval
GET /api/comparison/ecos/:id/comparison

// Render diff UI
{comparison.changes.salePrice && (
  <div>
    <span className="old">${comparison.changes.salePrice.old}</span>
    <span className="arrow">→</span>
    <span className="new">${comparison.changes.salePrice.new}</span>
  </div>
)}

// BoM version comparison
GET /api/comparison/boms/:bomId/comparison/v1.0/v2.0
```

---

### **G) AUDIT & TRACEABILITY RULES**

| Rule ID | Status | Implementation | Evidence |
|---------|--------|---------------|----------|
| **G1** | ✅ PASS | All events logged via AuditLog model | `schema.prisma:261-289` |
| **G2** | ✅ PASS | Captures action, old/new values, user, timestamp | `audit.controller.ts`, multiple controllers |

**Audit Log Schema:**
```prisma
model AuditLog {
  action     AuditAction  // CREATE, UPDATE, DELETE, APPROVE, etc.
  entityType EntityType   // PRODUCT, ECO, BOM, etc.
  entityId   String
  oldValue   Json?        // Before state
  newValue   Json?        // After state
  userId     String?
  ecoId      String?
  stage      String?
  comments   String?
  ipAddress  String?
  createdAt  DateTime
}
```

**Tracked Events:**
```typescript
enum AuditAction {
  CREATE, UPDATE, DELETE,
  APPROVE, REJECT,
  ARCHIVE,
  STAGE_TRANSITION,
  VERSION_CREATE
}
```

**Example Audit Entry:**
```typescript
await tx.auditLog.create({
  data: {
    userId: req.user.id,
    action: 'VERSION_CREATE',
    entityType: 'PRODUCT_VERSION',
    entityId: newVersion.id,
    ecoId: eco.id,
    oldValue: { versionId: oldVersion.id, version: 'v1.0' },
    newValue: { versionId: newVersion.id, version: 'v2.0' },
    comments: `Version created via ECO: ${eco.title}`,
  }
});
```

**Frontend Usage:**
```javascript
// Display audit trail
GET /api/reports/audit-logs?entityType=ECO&entityId=eco-123

// Show timeline
{auditLogs.map(log => (
  <div>
    <strong>{log.action}</strong> by {log.user.name}
    <span>{log.createdAt}</span>
    <div>
      Old: {JSON.stringify(log.oldValue)}
      New: {JSON.stringify(log.newValue)}
    </div>
  </div>
))}
```

---

### **H) REPORTING SUPPORT (BACKEND)**

| Rule ID | Status | Implementation | Evidence |
|---------|--------|---------------|----------|
| **H1** | ✅ PASS | ECO report endpoints exist | `report.routes.ts:12`, `report.controller.ts` |
| **H2** | ✅ PASS | Version history, BoM history, archived products endpoints exist | `report.routes.ts:15-18` |

**Available Reports:**

**1. ECO Report:**
```javascript
GET /api/reports/eco-stats
// Response: { total, draft, inProgress, approved, applied, rejected }
```

**2. Product Version History:**
```javascript
GET /api/reports/products/:id/version-history
// Response: [
//   { version: "v2.0", createdAt, changes: { salePrice: 150 } },
//   { version: "v1.0", createdAt, changes: { salePrice: 100 } }
// ]
```

**3. BoM Change History:**
```javascript
GET /api/reports/product-versions/:id/bom-history
// Response: [
//   { version: "v2.0", components: [...], operations: [...] },
//   { version: "v1.0", components: [...], operations: [...] }
// ]
```

**4. Archived Products:**
```javascript
GET /api/reports/archived-products
// Response: [
//   { id, name, status: "ARCHIVED", archivedAt, lastVersion }
// ]
```

**5. Active Matrix:**
```javascript
GET /api/reports/active-matrix
// Response: [
//   { 
//     product: "Gear Assembly", 
//     version: "v2.0", 
//     bom: "BOM-v2.0", 
//     status: "ACTIVE" 
//   }
// ]
```

**Frontend Usage:**
- Admin dashboard with charts
- Export to CSV/PDF
- Historical trend analysis

---

## Data Models

### Core Entities Relationships

```
User (roles: ENGINEERING, APPROVER, OPERATIONS, ADMIN)
  ├─ createdECOs → ECO[]
  ├─ approvals → ECOApproval[]
  └─ auditLogs → AuditLog[]

Product (status: DRAFT, ACTIVE, ARCHIVED)
  ├─ versions → ProductVersion[]
  ├─ currentVersion → ProductVersion
  ├─ ecos → ECO[]
  └─ bomComponents → BOMComponent[]

ProductVersion (version: v1.0, v2.0, ...)
  ├─ product → Product
  ├─ boms → BOM[]
  └─ currentForProduct → Product

BOM (status: DRAFT, ACTIVE, ARCHIVED)
  ├─ productVersion → ProductVersion
  ├─ components → BOMComponent[]
  ├─ operations → BOMOperation[]
  └─ ecos → ECO[]

ECO (type: PRODUCT | BOM, status: DRAFT, IN_PROGRESS, APPROVED, REJECTED, APPLIED)
  ├─ product → Product
  ├─ bom → BOM (optional)
  ├─ creator → User
  ├─ approvals → ECOApproval[]
  ├─ auditLogs → AuditLog[]
  └─ draftData (JSON)

ApprovalStage (order: 0, 1, 2, ...)
  └─ approvals → ECOApproval[]

ECOApproval (status: PENDING, APPROVED, REJECTED)
  ├─ eco → ECO
  ├─ stage → ApprovalStage
  └─ approver → User
```

---

## Security & Authentication

### JWT Structure

**Access Token (expires: 15 minutes):**
```json
{
  "userId": "user-123",
  "email": "john@example.com",
  "roles": ["ENGINEERING", "APPROVER"],
  "iat": 1706088000,
  "exp": 1706088900
}
```

**Refresh Token (expires: 7 days):**
- Stored in `refresh_tokens` table
- Used to generate new access tokens
- Revoked on logout

### Middleware Chain

```typescript
// 1. Authenticate - Verify JWT
authenticate(req, res, next)
  ├─ Extract Bearer token
  ├─ Verify signature
  ├─ Attach req.user = { id, email, roles }
  └─ Next()

// 2. Authorize - Check roles
authorize('ENGINEERING', 'ADMIN')(req, res, next)
  ├─ Check req.user.roles
  ├─ If match → Next()
  └─ Else → 403 Forbidden
```

### Request Headers

**All authenticated endpoints require:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

### Error Responses

**Standard Error Format:**
```json
{
  "status": "error",
  "message": "Detailed error message",
  "code": "ERROR_CODE"  // Optional
}
```

**HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

## Frontend Integration Guide

### 1. Authentication Flow

```javascript
// 1. Login
const { user, accessToken, refreshToken } = await fetch('/api/auth/login', {
  method: 'POST',
  body: JSON.stringify({ email, password })
});

// Store tokens
localStorage.setItem('accessToken', accessToken);
localStorage.setItem('refreshToken', refreshToken);

// 2. Decode token to get roles
const decoded = jwtDecode(accessToken);
// decoded.roles = ['ENGINEERING', 'ADMIN']

// 3. Set axios interceptor
axios.interceptors.request.use(config => {
  config.headers.Authorization = `Bearer ${localStorage.getItem('accessToken')}`;
  return config;
});

// 4. Handle token refresh
axios.interceptors.response.use(
  response => response,
  async error => {
    if (error.response.status === 401) {
      const refreshToken = localStorage.getItem('refreshToken');
      const { accessToken } = await fetch('/api/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken })
      });
      localStorage.setItem('accessToken', accessToken);
      // Retry original request
      return axios(error.config);
    }
  }
);
```

### 2. Role-Based UI Rendering

```jsx
import { jwtDecode } from 'jwt-decode';

const user = jwtDecode(localStorage.getItem('accessToken'));

// Check single role
{user.roles.includes('ENGINEERING') && <CreateECOButton />}

// Check multiple roles
{user.roles.some(r => ['ADMIN', 'APPROVER'].includes(r)) && <ApproveButton />}

// Route protection
<ProtectedRoute allowedRoles={['ADMIN']}>
  <AdminPanel />
</ProtectedRoute>
```

### 3. ECO Workflow Implementation

```javascript
// Step 1: Create ECO
const createECO = async (data) => {
  const response = await fetch('/api/ecos', {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json' 
    },
    body: JSON.stringify({
      title: data.title,
      type: 'PRODUCT',
      productId: data.productId,
      versionUpdate: true,
      effectiveDate: data.effectiveDate,
      draftData: {
        product: {
          salePrice: data.newPrice,
          costPrice: data.newCost
        }
      }
    })
  });
  return response.json();
};

// Step 2: Preview changes
const previewECO = async (ecoId) => {
  const response = await fetch(`/api/comparison/ecos/${ecoId}/comparison`);
  const comparison = await response.json();
  
  // Render diff
  return (
    <div>
      <h3>Proposed Changes</h3>
      {comparison.changes.salePrice && (
        <div>
          Sale Price: 
          <del>${comparison.changes.salePrice.old}</del>
          → 
          <strong>${comparison.changes.salePrice.new}</strong>
        </div>
      )}
    </div>
  );
};

// Step 3: Submit for approval
const submitECO = async (ecoId) => {
  await fetch(`/api/ecos/${ecoId}/submit`, { method: 'POST' });
  // ECO now in approval workflow
};

// Step 4: Approve (APPROVER role)
const approveECO = async (ecoId, comments) => {
  await fetch(`/api/ecos/${ecoId}/review`, {
    method: 'POST',
    body: JSON.stringify({
      action: 'APPROVE',
      comments: comments
    })
  });
};

// Step 5: Apply (ADMIN role)
const applyECO = async (ecoId) => {
  await fetch(`/api/ecos/${ecoId}/apply`, { method: 'POST' });
  // New version created, old version archived
};
```

### 4. Product Selection (Exclude Archived)

```javascript
// WRONG ❌
const products = await fetch('/api/products');

// CORRECT ✅
const products = await fetch('/api/products?archived=false');

// Component filtering
const activeProducts = products.filter(p => p.status !== 'ARCHIVED');

<Select>
  {activeProducts.map(p => (
    <option value={p.id} key={p.id}>
      {p.name} (v{p.currentVersion.version})
    </option>
  ))}
</Select>
```

### 5. Real-Time Notifications

```javascript
import { useEffect, useState } from 'react';

const NotificationProvider = () => {
  const [notifications, setNotifications] = useState([]);
  
  useEffect(() => {
    const eventSource = new EventSource('/api/notifications/stream', {
      headers: { 
        Authorization: `Bearer ${localStorage.getItem('accessToken')}` 
      }
    });
    
    eventSource.onmessage = (event) => {
      const notification = JSON.parse(event.data);
      setNotifications(prev => [notification, ...prev]);
      
      // Show toast
      toast.info(`${notification.title}: ${notification.message}`);
    };
    
    eventSource.onerror = () => {
      eventSource.close();
    };
    
    return () => eventSource.close();
  }, []);
  
  return <NotificationBell count={notifications.filter(n => !n.read).length} />;
};
```

### 6. Operations Role View

```javascript
// Operations users should ONLY call /api/operations endpoints

const OperationsView = () => {
  // CORRECT ✅
  const products = await fetch('/api/operations/products');
  const boms = await fetch('/api/operations/boms');
  const matrix = await fetch('/api/operations/active-matrix');
  
  // WRONG ❌ (Would expose drafts/archived)
  // const products = await fetch('/api/products');
  
  return (
    <div>
      <h2>Active Products (Production Ready)</h2>
      {products.map(p => (
        <ProductCard 
          key={p.id} 
          name={p.name} 
          version={p.currentVersion.version}
          status={p.status} // Always "ACTIVE"
        />
      ))}
    </div>
  );
};
```

### 7. Audit Trail Display

```javascript
const AuditTrail = ({ ecoId }) => {
  const [logs, setLogs] = useState([]);
  
  useEffect(() => {
    const fetchAuditLogs = async () => {
      const response = await fetch(
        `/api/reports/audit-logs?entityType=ECO&entityId=${ecoId}`
      );
      setLogs(await response.json());
    };
    fetchAuditLogs();
  }, [ecoId]);
  
  return (
    <Timeline>
      {logs.map(log => (
        <TimelineItem key={log.id}>
          <strong>{log.action}</strong> by {log.user.name}
          <span>{new Date(log.createdAt).toLocaleString()}</span>
          {log.oldValue && (
            <div>
              <code>Before: {JSON.stringify(log.oldValue, null, 2)}</code>
              <code>After: {JSON.stringify(log.newValue, null, 2)}</code>
            </div>
          )}
        </TimelineItem>
      ))}
    </Timeline>
  );
};
```

---

## **CRITICAL RULES ENFORCEMENT CHECKLIST**

### ✅ **Data Integrity**
- [ ] Never allow direct edits to ACTIVE products/BOMs
- [ ] Always use ECO workflow for changes to active data
- [ ] Validate product status before adding to BoM
- [ ] Prevent archived products from being selected
- [ ] Archived data is read-only (no modifications)

### ✅ **Version Control**
- [ ] Old versions marked ARCHIVED (never deleted)
- [ ] Each ECO creates a new version (if `versionUpdate: true`)
- [ ] Version numbers auto-increment (v1.0 → v2.0)
- [ ] Draft changes stored in `ECO.draftData` (not in master tables)

### ✅ **Approval Workflow**
- [ ] ECO starts in DRAFT status
- [ ] Cannot apply ECO without approvals
- [ ] Stage progression is sequential (no skipping)
- [ ] Final stage marks ECO as APPLIED
- [ ] Audit log captures all stage transitions

### ✅ **Role-Based Access**
- [ ] ENGINEERING: Create/modify ECOs
- [ ] APPROVER: Review/approve ECOs
- [ ] OPERATIONS: View ACTIVE data only
- [ ] ADMIN: Full access + system configuration

### ✅ **Audit & Traceability**
- [ ] All changes logged in `audit_logs` table
- [ ] Capture old/new values, user, timestamp
- [ ] ECO history linked to audit entries
- [ ] IP address tracking (optional but recommended)

### ✅ **Frontend Best Practices**
- [ ] Use `/api/operations/*` for OPERATIONS role
- [ ] Filter archived products in all dropdowns
- [ ] Show version history in product details
- [ ] Display ECO diff before approval
- [ ] Implement real-time notifications via SSE
- [ ] Handle token refresh automatically

---

## **Top 10 Critical Gaps to Avoid in Frontend**

1. **❌ Calling `/api/products` for OPERATIONS role**  
   ✅ Use `/api/operations/products` instead

2. **❌ Not filtering archived products in selects**  
   ✅ Always check `status !== 'ARCHIVED'`

3. **❌ Allowing direct product edits for ACTIVE status**  
   ✅ Disable edit button, show "Use ECO" message

4. **❌ Not showing ECO diff before approval**  
   ✅ Call `/api/comparison/ecos/:id/comparison`

5. **❌ Forgetting to check `versionUpdate` flag**  
   ✅ Explain to user: new version vs same version

6. **❌ Not handling stage-based workflow in UI**  
   ✅ Show progress bar with current stage

7. **❌ Missing role checks in frontend routes**  
   ✅ Implement `<ProtectedRoute allowedRoles={[...]} />`

8. **❌ Not implementing token refresh logic**  
   ✅ Add axios interceptor for 401 responses

9. **❌ Ignoring audit trail in ECO details**  
   ✅ Display timeline of all changes

10. **❌ Not connecting to notification stream**  
    ✅ Implement EventSource for real-time updates

---

## **Security & Data Integrity Risks**

### 🔴 **Direct Update Risk**
- **Risk:** Frontend bypasses ECO workflow and calls `PUT /api/products/:id` on ACTIVE product
- **Mitigation:** Backend returns 400 error, but frontend should disable edit button

### 🔴 **Missing Role Checks**
- **Risk:** Frontend shows features to unauthorized users
- **Mitigation:** Always check `user.roles` before rendering UI elements

### 🔴 **Missing Transaction Usage**
- **Risk:** Partial updates if error occurs mid-operation
- **Mitigation:** Backend uses `prisma.$transaction()` for multi-step operations

### 🔴 **Missing Unique Constraints**
- **Risk:** Duplicate versions or BoMs created
- **Mitigation:** Database has `@@unique([productId, version])` constraints

### 🔴 **Stage Bypass Issues**
- **Risk:** ECO jumps from stage 1 to stage 3
- **Mitigation:** Backend enforces sequential stage progression

### 🔴 **Token Expiry**
- **Risk:** User session expires mid-action
- **Mitigation:** Implement auto-refresh + warn user before expiry

### 🔴 **Archived Data Selection**
- **Risk:** Archived products selected in new BoMs/ECOs
- **Mitigation:** Frontend filters + backend validation

### 🔴 **Concurrent Edits**
- **Risk:** Two users edit same ECO simultaneously
- **Mitigation:** Implement optimistic locking or last-write-wins strategy

---

## **Environment Variables**

```env
# Server
PORT=5000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/ecoflow

# JWT
JWT_ACCESS_SECRET=your-access-secret-key-here
JWT_REFRESH_SECRET=your-refresh-secret-key-here
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Frontend
FRONTEND_URL=http://localhost:3000

# Optional: File uploads
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760  # 10MB
```

---

## **Testing Endpoints**

Use the provided `test-api.ps1` script:

```powershell
# Test authentication
./test-api.ps1 -Endpoint auth/login -Method POST -Body '{"email":"admin@example.com","password":"password"}'

# Test ECO creation
./test-api.ps1 -Endpoint ecos -Method POST -Token $token -Body '{...}'

# Test product listing
./test-api.ps1 -Endpoint products -Method GET -Token $token
```

---

## **Database Migrations**

Apply migrations:
```bash
npx prisma migrate deploy
```

Seed database:
```bash
npx prisma db seed
```

Generate Prisma client:
```bash
npx prisma generate
```

---

## **API Response Standards**

### Success Response
```json
{
  "status": "success",
  "message": "Operation completed successfully",
  "data": {
    // Response data here
  }
}
```

### Error Response
```json
{
  "status": "error",
  "message": "Error description",
  "code": "ERROR_CODE"  // Optional
}
```

### Pagination Response
```json
{
  "status": "success",
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "totalPages": 10
    }
  }
}
```

---

## **Changelog**

**v1.0.0** (January 24, 2026)
- Initial backend implementation
- All core features implemented
- Role-based access control
- ECO workflow with approval stages
- Version control for products and BOMs
- Audit logging
- Real-time notifications
- Comparison/diff endpoints
- Operations view endpoints

---

## **Support & Contact**

For issues or questions about the backend API, please contact the development team or refer to the codebase documentation in `/backend/src`.

---

**© 2026 ECOFlow Engineering Change Order System**
