# Backend API Contract - Battery Pack Manufacturer Console
**Version**: 1.0.0 (Handover Patch P34)
**Base Path**: `/api/v1`

## 1. General Principles
- **Format**: All requests and responses must use `application/json`.
- **Statelessness**: No session cookies. Use Bearer Tokens for authentication.
- **Encoding**: UTF-8.
- **Dates**: ISO 8601 strings (UTC).

## 2. Authentication & Authorization
### Authentication
All requests (except `/auth/login`) require a JWT in the header:
`Authorization: Bearer <token>`

### Roles & RBAC
- `SYSTEM_ADMIN`: Full access to all endpoints, including user management and system config.
- `PRODUCTION`: Access to Batch, Module, and Pack creation/editing.
- `QA`: Access to test results, dispositions, and certification.
- `SUPERVISOR`: Approval rights and operational oversight.
- `VIEW_ONLY`: Read-only access to specific dashboard and trace modules.

## 3. Standard Response Envelopes

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "totalCount": 150,
    "page": 1,
    "pageSize": 20
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ENTITY_LOCKED",
    "message": "Cannot modify a sealed module.",
    "details": { "moduleId": "MOD-123" }
  }
}
```

## 4. Entity Specifications

### SKU (Stock Keeping Unit / Blueprint)
| Method | Endpoint | Allowed Roles | Description |
|--------|----------|---------------|-------------|
| GET | `/skus` | ALL | List all SKUs with filtering |
| POST | `/skus` | ADMIN, SUPERVISOR | Create new SKU blueprint |
| GET | `/skus/{id}` | ALL | Get detailed SKU spec |
| PATCH | `/skus/{id}/activate` | ADMIN | Transition from DRAFT to ACTIVE |

### Manufacturing Batch
| Method | Endpoint | Allowed Roles | Description |
|--------|----------|---------------|-------------|
| GET | `/batches` | ALL | List production batches |
| POST | `/batches` | PRODUCTION, ADMIN | Initialize a new batch for a SKU |
| PATCH | `/batches/{id}/start` | PRODUCTION | Move to IN_PROGRESS |
| PATCH | `/batches/{id}/complete` | SUPERVISOR, QA | Finalize batch once units pass EOL |

### Module (Sub-Assembly)
| Method | Endpoint | Allowed Roles | Description |
|--------|----------|---------------|-------------|
| POST | `/modules` | PRODUCTION | Create module within a batch |
| PATCH | `/modules/{id}/bind-cell` | PRODUCTION | Append cell serial to ledger |
| PATCH | `/modules/{id}/seal` | PRODUCTION | Seal module (Lock ledger) |

### Pack (Main Enclosure)
| Method | Endpoint | Allowed Roles | Description |
|--------|----------|---------------|-------------|
| POST | `/packs` | PRODUCTION | Create final pack enclosure |
| PATCH | `/packs/{id}/seal` | PRODUCTION | Finalize assembly |
| PATCH | `/packs/{id}/disposition`| QA | PASS/FAIL/QUARANTINE after EOL |

## 5. Workflow State Machine
Backend MUST enforce these state transitions and return `409 Conflict` on violation:

- **Batch**: `DRAFT` -> `IN_PROGRESS` -> `COMPLETED`
- **Module**: `DRAFT` -> `IN_PROGRESS` -> `SEALED`
- **Pack**: `DRAFT` -> `IN_PROGRESS` -> `READY_FOR_EOL` -> `FINALIZED`

## 6. Standard Error Codes
| Code | HTTP Status | Meaning |
|------|-------------|---------|
| `AUTH_EXPIRED` | 401 | Token has expired |
| `ACCESS_DENIED` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource does not exist |
| `WORKFLOW_VIOLATION`| 409 | State transition not allowed |
| `VALIDATION_ERROR` | 422 | Input data invalid |

## 7. Audit Logging Requirements
Every `POST`, `PUT`, `PATCH`, or `DELETE` request must be logged in a `system_audit_trail` table:
- `actor_id`: User performing the action.
- `entity_id`: ID of the resource modified.
- `action_type`: e.g., "MODULE_SEALED".
- `timestamp`: Precise UTC time.
- `payload_diff`: JSON blob of changed fields.

## 8. Notes for Backend Implementation
1. **Concurrency**: Use optimistic locking (versioning) on high-frequency assembly entities.
2. **Performance**: Eager load SKU definitions when returning Batch or Pack details to minimize UI round-trips.
3. **Validation**: Serial numbers must be globally unique across the entire system.
