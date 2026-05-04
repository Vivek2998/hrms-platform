# HRMS API Specification

> Auto-generated Swagger docs available at `/api/v1/docs` when the API server is running.

## Base URL

```
Development: http://localhost:3001/api/v1
Production:  https://api.hrmsplatform.com/api/v1
```

## Authentication

All endpoints (except `/auth/login` and `/auth/refresh`) require a Bearer token:

```
Authorization: Bearer <accessToken>
```

## Response Envelope

All responses follow this structure:

```json
{
  "success": true,
  "data": {},
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPrevPage": false
  },
  "error": null
}
```

## Error Response

```json
{
  "success": false,
  "data": null,
  "error": "Validation failed",
  "details": [{ "field": "email", "message": "Invalid email format" }]
}
```

## Modules

| Module         | Prefix                  | Status  |
| -------------- | ----------------------- | ------- |
| Auth           | `/api/v1/auth`          | Phase 1 |
| Employees      | `/api/v1/employees`     | Phase 1 |
| Departments    | `/api/v1/departments`   | Phase 1 |
| Shifts         | `/api/v1/shifts`        | Phase 1 |
| Attendance     | `/api/v1/attendance`    | Phase 2 |
| Leave Types    | `/api/v1/leave-types`   | Phase 3 |
| Leave Requests | `/api/v1/leaves`        | Phase 3 |
| Payroll        | `/api/v1/payroll`       | Phase 4 |
| Notifications  | `/api/v1/notifications` | Phase 2 |
| Health         | `/api/v1/health`        | Done    |
