# Database Migrations

## Add Start Date to Existing Tasks

Ye migration script existing tasks mein `startDate` field add karega.

### Kaise Run Karein:

```bash
cd backend-files
node migrations/add-start-date-to-tasks.js
```

### Kya Karega:

1. Database se saare tasks fetch karega jo `startDate` nahi hai
2. Un tasks ka `startDate` = `createdAt` set karega
3. Summary dikhayega kitne tasks update hue

### Example Output:

```
🚀 Starting migration: Add startDate to existing tasks

🔄 Connecting to MongoDB...
✅ Connected to MongoDB

📋 Found 5 tasks without startDate

✅ Updated: Task 1
   Start Date set to: 10/12/2025
✅ Updated: Task 2
   Start Date set to: 11/12/2025
...

============================================================
📊 Migration Summary:
   ✅ Successfully updated: 5 tasks
   ❌ Failed: 0 tasks
   📋 Total processed: 5 tasks
============================================================

🔌 Disconnected from MongoDB
```

### Important Notes:

- ⚠️ Migration ek baar hi run karna hai
- ✅ Safe hai - sirf missing fields add karega
- 🔄 Agar dubara run karoge to "All tasks already have startDate!" dikhayega
- 📝 Backup lena recommended hai (optional)

### Fallback in Frontend:

Agar migration run nahi kiya, to frontend automatically `createdAt` use karega as fallback.

```javascript
// Frontend code automatically handles this:
task.startDate || task.createdAt
```

So migration optional hai, but recommended for clean data!
