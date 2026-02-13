# Android App API Documentation

## Base URL
```
https://fabtech-backend.onrender.com/api/mobile
```

## Authentication
Most APIs require authentication. Include JWT token in header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 📱 LEAD MANAGEMENT APIs

### 1. Add New Lead
```http
POST /api/mobile/leads
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+91 9876543210",
  "company": "ABC Company",
  "title": "Website Development",
  "source": "mobile_app",
  "budget": "50000-100000",
  "notes": "Interested in e-commerce website",
  "priority": "high",
  "status": "new"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Lead created successfully",
  "data": {
    "_id": "lead_id",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+91 9876543210",
    "company": "ABC Company",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

### 2. Get All Leads (with filters)
```http
GET /api/mobile/leads?page=1&limit=50&status=new&search=john
```

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 50)
- `status` - Filter by status (new, assigned, contacted, converted)
- `priority` - Filter by priority (low, medium, high)
- `source` - Filter by source
- `assignedTo` - Filter by employee ID
- `search` - Search in name, email, phone, company
- `startDate` & `endDate` - Date range filter

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "lead_id",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+91 9876543210",
      "company": "ABC Company",
      "status": "new",
      "priority": "high",
      "assignedTo": {
        "_id": "employee_id",
        "name": "Employee Name",
        "email": "emp@company.com"
      },
      "followUps": [],
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalLeads": 250,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

### 3. Get Single Lead
```http
GET /api/mobile/leads/:id
```

### 4. Update Lead
```http
PUT /api/mobile/leads/:id
Content-Type: application/json

{
  "status": "contacted",
  "notes": "Called customer, interested in premium package",
  "priority": "high"
}
```

---

## 👥 LEAD ASSIGNMENT APIs

### 5. Assign Lead to Employee
```http
POST /api/mobile/leads/:id/assign
Content-Type: application/json

{
  "employeeId": "employee_id_here",
  "notes": "Assigned to sales team for follow-up"
}
```

### 6. Get All Employees (for assignment dropdown)
```http
GET /api/mobile/employees
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "employee_id",
      "name": "Rahul Sharma",
      "email": "rahul@company.com",
      "phone": "+91 9876543210",
      "department": "Sales",
      "position": "Sales Executive"
    }
  ]
}
```

---

## 📞 FOLLOW-UP APIs

### 7. Add Follow-up to Lead
```http
POST /api/mobile/leads/:id/followup
Content-Type: application/json

{
  "type": "call",
  "notes": "Customer wants demo next week",
  "nextFollowUpDate": "2024-01-20T10:00:00Z",
  "priority": "high",
  "status": "pending"
}
```

**Follow-up Types:**
- `call` - Phone call
- `email` - Email follow-up
- `meeting` - In-person meeting
- `demo` - Product demo
- `proposal` - Send proposal

### 8. Get All Follow-ups (with filters)
```http
GET /api/mobile/followups?page=1&limit=50&status=pending&employeeId=emp_id
```

**Query Parameters:**
- `status` - pending, completed, cancelled
- `priority` - low, medium, high
- `type` - call, email, meeting, demo, proposal
- `employeeId` - Filter by assigned employee
- `startDate` & `endDate` - Date range for follow-up dates

### 9. Update Follow-up Status
```http
PUT /api/mobile/followups/:id
Content-Type: application/json

{
  "status": "completed",
  "notes": "Customer agreed to demo, scheduled for next week",
  "completedAt": "2024-01-15T14:30:00Z"
}
```

---

## 📊 EMPLOYEE DASHBOARD API

### 10. Get Employee Dashboard Data
```http
GET /api/mobile/employee/:employeeId/dashboard
```

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalLeads": 25,
      "newLeads": 5,
      "contactedLeads": 15,
      "convertedLeads": 5,
      "pendingFollowUps": 8,
      "completedFollowUps": 12,
      "overdueFollowUps": 2
    },
    "assignedLeads": [
      // Latest 10 assigned leads
    ],
    "followUps": [
      // Next 10 follow-ups
    ],
    "todayFollowUps": [
      // Today's follow-ups
    ]
  }
}
```

---

## 🏢 ADMIN DASHBOARD APIs

### 11. Get Admin Dashboard Data
```http
GET /api/mobile/admin/dashboard
```

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalLeads": 500,
      "newLeads": 50,
      "assignedLeads": 200,
      "contactedLeads": 180,
      "convertedLeads": 70,
      "totalFollowUps": 300,
      "pendingFollowUps": 120,
      "completedFollowUps": 180,
      "totalEmployees": 10
    },
    "employeePerformance": [
      {
        "employee": {
          "_id": "emp_id",
          "name": "Rahul Sharma",
          "email": "rahul@company.com"
        },
        "assignedLeads": 25,
        "convertedLeads": 8,
        "totalFollowUps": 30,
        "completedFollowUps": 25,
        "conversionRate": "32.00"
      }
    ],
    "recentActivities": [
      {
        "id": "activity_id",
        "type": "follow_up_completed",
        "employee": {
          "name": "Rahul Sharma"
        },
        "lead": {
          "name": "John Doe",
          "company": "ABC Company"
        },
        "notes": "Customer interested in premium package",
        "completedAt": "2024-01-15T14:30:00Z"
      }
    ],
    "recentLeads": [
      // Latest 10 leads
    ],
    "upcomingFollowUps": [
      // Next 10 upcoming follow-ups
    ]
  }
}
```

### 12. Get Employee Follow-ups (Admin View)
```http
GET /api/mobile/admin/employee-followups?page=1&employeeId=emp_id&status=completed
```

**Query Parameters:**
- `employeeId` - Filter by specific employee
- `status` - pending, completed, cancelled
- `startDate` & `endDate` - Date range filter
- `page` & `limit` - Pagination

---

## 🔐 AUTHENTICATION APIs

### 13. Employee Login
```http
POST /api/auth/employee-login
Content-Type: application/json

{
  "email": "employee@company.com",
  "password": "password123"
}
```

### 14. Admin Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@company.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "_id": "user_id",
    "name": "Admin Name",
    "email": "admin@company.com",
    "userType": "admin"
  }
}
```

---

## 📱 ANDROID APP USAGE GUIDE

### For Employee App:
1. **Login**: Use employee credentials
2. **Dashboard**: GET `/api/mobile/employee/:id/dashboard`
3. **View Assigned Leads**: GET `/api/mobile/leads?assignedTo=employee_id`
4. **Add Follow-up**: POST `/api/mobile/leads/:id/followup`
5. **Update Follow-up**: PUT `/api/mobile/followups/:id`
6. **View Follow-ups**: GET `/api/mobile/followups?employeeId=employee_id`

### For Admin App:
1. **Login**: Use admin credentials
2. **Dashboard**: GET `/api/mobile/admin/dashboard`
3. **Add Lead**: POST `/api/mobile/leads`
4. **Assign Lead**: POST `/api/mobile/leads/:id/assign`
5. **View All Leads**: GET `/api/mobile/leads`
6. **Employee Performance**: GET `/api/mobile/admin/dashboard` (includes performance data)
7. **Employee Follow-ups**: GET `/api/mobile/admin/employee-followups`

---

## 🚀 QUICK START FOR ANDROID

### 1. Base Configuration
```java
public class ApiConfig {
    public static final String BASE_URL = "http://your-server-ip:5001/api/mobile/";
    public static final String AUTH_URL = "http://your-server-ip:5001/api/auth/";
}
```

### 2. Authentication Header
```java
// Add to all API calls after login
headers.put("Authorization", "Bearer " + token);
headers.put("Content-Type", "application/json");
```

### 3. Sample API Call (Java/Kotlin)
```java
// Add new lead
JSONObject leadData = new JSONObject();
leadData.put("name", "John Doe");
leadData.put("phone", "+91 9876543210");
leadData.put("email", "john@example.com");

// Make POST request to /api/mobile/leads
```

---

## 📊 STATUS CODES

- `200` - Success
- `201` - Created successfully
- `400` - Bad request (validation error)
- `401` - Unauthorized (invalid token)
- `404` - Not found
- `500` - Server error

---

## 🔄 REAL-TIME UPDATES

For real-time updates in Android app:
1. Poll dashboard APIs every 30 seconds
2. Refresh follow-ups when status changes
3. Update lead list after assignment
4. Show notifications for overdue follow-ups

---

## 📞 SUPPORT

If you need help with Android integration:
1. Check API response format
2. Verify authentication token
3. Test with Postman first
4. Check server logs for errors
