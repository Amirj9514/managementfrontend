---
name: User admin API curls
overview: Reference curls and example JSON for staff user create, assignment update, paginated list, plus how to populate the role dropdown (no dedicated roles endpoint exists today).
todos: []
isProject: false
---

# User admin: curl examples and responses

Base path: `**/api/v1**` (see `[src/routes/index.ts](D:\backend\managementBackend\src\routes\index.ts)` and `[src/app.ts](D:\backend\managementBackend\src\app.ts)`). Default server port: **3000** (`[src/config/env.ts](D:\backend\managementBackend\src\config\env.ts)`).

All user routes after login require `**Authorization: Bearer <token>`** (`[src/middleware/authenticate.ts](D:\backend\managementBackend\src\middleware\authenticate.ts)`). Only `**super_admin`** and `**admin**` may call create, list, and patch (`[userAdminController.ts](D:\backend\managementBackend\src\controllers\userAdminController.ts)`).

---

## 0. Obtain a token (prerequisite)

```bash
curl -s -X POST "http://localhost:3000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@example.com\",\"password\":\"your-password\"}"
```

**Expected (200):**

```json
{
  "data": {
    "user": {
      "id": "674a1b2c3d4e5f6789012345",
      "email": "admin@example.com",
      "name": "Admin",
      "role": "super_admin"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "OK",
  "success": true,
  "statusCode": 200
}
```

Use `data.token` as `Bearer` for the calls below.

---

## 1. Create user

`**POST /api/v1/users**` — body validated by `[userCreateSchema](D:\backend\managementBackend\src\validation\schemas.ts)`: `email`, `password` (min 8), optional `name`, required `role`, optional `assignment` with `branchIds` / `buildingIds` (24-char hex MongoDB ids).

```bash
curl -s -X POST "http://localhost:3000/api/v1/users" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"newuser@example.com\",\"password\":\"secret123\",\"name\":\"New User\",\"role\":\"front_desk\",\"assignment\":{\"branchIds\":[],\"buildingIds\":[]}}"
```

**Expected (201):** shape from `[postUser](D:\backend\managementBackend\src\controllers\userAdminController.ts)` — note `id` serializes as string in JSON.

```json
{
  "data": {
    "id": "674a1b2c3d4e5f6789012346",
    "email": "newuser@example.com",
    "name": "New User",
    "role": "front_desk"
  },
  "message": "Created",
  "success": true,
  "statusCode": 201
}
```

---

## 2. Update user (role / branch-building assignment)

There is **no** general “patch user profile” route. Updates go through:

`**PATCH /api/v1/users/:userId/assignment`** — optional `role`, optional `branchIds`, optional `buildingIds` (`[userAssignmentPatchSchema](D:\backend\managementBackend\src\validation\schemas.ts)`). If either `branchIds` or `buildingIds` is present in the body, previous active assignments are revoked and a new `[RoleAssignment](D:\backend\managementBackend\src\models\RoleAssignment.js)` is created (`[patchUserRoleAssignment](D:\backend\managementBackend\src\controllers\userAdminController.ts)`).

```bash
curl -s -X PATCH "http://localhost:3000/api/v1/users/674a1b2c3d4e5f6789012346/assignment" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"role\":\"branch_admin\",\"branchIds\":[\"507f1f77bcf86cd799439011\"],\"buildingIds\":[]}"
```

**Expected (200):**

```json
{
  "data": null,
  "message": "OK",
  "success": true,
  "statusCode": 200
}
```

---

## 3. List users with pagination

`**GET /api/v1/users**` — query parsed by `[parseListPagination](D:\backend\managementBackend\src\utils\listPagination.ts)`: `page` (default **1**), `limit` (default **20**, max **100**).

```bash
curl -s -G "http://localhost:3000/api/v1/users" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --data-urlencode "page=1" \
  --data-urlencode "limit=10"
```

**Expected (200):** `[sendPaginatedSuccess](D:\backend\managementBackend\src\utils\apiResponse.js)` — `data` is the array; each row includes fields selected in `[listUsers](D:\backend\managementBackend\src\controllers\userAdminController.ts)`: `email`, `name`, `role`, `status`, `createdAt`, plus Mongoose `_id`.

```json
{
  "data": [
    {
      "_id": "674a1b2c3d4e5f6789012346",
      "email": "newuser@example.com",
      "name": "New User",
      "role": "branch_admin",
      "status": "active",
      "createdAt": "2025-01-15T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 42,
    "totalPages": 5
  },
  "message": "OK",
  "success": true,
  "statusCode": 200
}
```

---

## 4. Role list for frontend dropdown

**There is currently no `GET` endpoint** that returns staff roles. The allowed values are the `**STAFF_ROLES`** constant in `[src/constants/roles.ts](D:\backend\managementBackend\src\constants\roles.ts)`:

- `super_admin`, `admin`, `branch_admin`, `building_admin`, `booking_admin`, `employee_admin`, `front_desk`, `housekeeping`, `staff`

**Practical options for the UI:**

1. **Hardcode or share the same list** in the frontend (must stay in sync with backend).
2. **Optional future improvement:** add something like `GET /api/v1/meta/staff-roles` that returns `{ data: { roles: string[] }, ... }` for a single source of truth — not implemented today.

**If you only need “expected shape” for a dropdown**, treat it as a static array of `{ value: string, label: string }` derived from those slugs (labels are a UI concern).

---

## Error envelope (reference)

Failures use `[sendError](D:\backend\managementBackend\src\utils\apiResponse.ts)`: `success: false`, `data: null`, `message`, `statusCode`, optional `code` / `details`.

```json
{
  "data": null,
  "message": "Insufficient role",
  "success": false,
  "statusCode": 403
}
```

---

## Summary


| Action                   | Method | Path                                                 |
| ------------------------ | ------ | ---------------------------------------------------- |
| Create                   | POST   | `/api/v1/users`                                      |
| Update assignment / role | PATCH  | `/api/v1/users/:userId/assignment`                   |
| List (paginated)         | GET    | `/api/v1/users?page=&limit=`                         |
| Role dropdown            | —      | Use `STAFF_ROLES` from backend constants; no API yet |


