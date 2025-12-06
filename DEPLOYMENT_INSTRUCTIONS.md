# 🚀 Add Leads API to Your Backend

## Files Created:
- ✅ `models/Lead.js` - MongoDB Lead model
- ✅ `routes/leads.js` - Complete leads API routes
- ✅ This instruction file

## Step-by-Step Deployment:

### 1. Copy Files to Your Backend Project:

**Copy these files to your backend project:**
```
backend-files/models/Lead.js → your-backend/models/Lead.js
backend-files/routes/leads.js → your-backend/routes/leads.js
```

### 2. Update Your Main Server File:

**Add this line to your main server file (app.js or server.js):**
```javascript
// Add this with your other route imports
app.use('/api/leads', require('./routes/leads'));
```

### 3. Ensure You Have Auth Middleware:

**Make sure you have `middleware/auth.js` file with JWT verification:**
```javascript
// middleware/auth.js
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};
```

### 4. Update MongoDB Connection:

**Ensure your MongoDB connection points to the `test` database:**
```javascript
// In your database connection file
mongoose.connect('mongodb://your-connection-string/test', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
```

### 5. Deploy to Render/Heroku:

**Push your changes and deploy to https://crm-tkxn.onrender.com**

## API Endpoints Created:

- ✅ `GET /api/leads` - Get all leads (with pagination, search, filters)
- ✅ `GET /api/leads/:id` - Get single lead
- ✅ `POST /api/leads` - Create new lead
- ✅ `PUT /api/leads/:id` - Update lead
- ✅ `DELETE /api/leads/:id` - Delete lead
- ✅ `GET /api/leads/stats/summary` - Get lead statistics

## Expected Result:

After deployment, your frontend will:
- ✅ Store leads in MongoDB `test.leads` collection
- ✅ No more 404 errors
- ✅ Full CRUD operations working
- ✅ Data persistence in database

## Test After Deployment:

```bash
# Test getting leads
curl -X GET "https://crm-tkxn.onrender.com/api/leads" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Test creating a lead
curl -X POST "https://crm-tkxn.onrender.com/api/leads" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Lead",
    "email": "test@example.com",
    "phone": "+91 9876543210",
    "company": "Test Company"
  }'
```

## Important Notes:

1. **Authentication Required:** All endpoints require valid JWT token
2. **User Isolation:** Each user only sees their own leads
3. **Email Uniqueness:** Prevents duplicate leads with same email per user
4. **Database:** Uses `test.leads` collection as shown in your MongoDB Atlas

---

**Ready to deploy!** Copy the 2 files and add the route line to your server. 🚀
