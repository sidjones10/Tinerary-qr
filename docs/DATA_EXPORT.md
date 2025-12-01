# GDPR Data Export Feature

## Overview

Tinerary provides users with the ability to **export all their data** in a machine-readable JSON format, complying with GDPR Article 20 (Right to Data Portability) and CCPA data access requirements.

## User Experience

### How to Export Data

1. Go to **Profile** → **Settings** tab
2. Scroll to **Data & Privacy** section
3. Click **Download Data** button
4. File downloads as `tinerary-data-export-YYYY-MM-DD.json`

### What Data is Included

The export includes ALL user data:

- ✅ **Profile Information**: Name, email, username, bio, location, website, phone, avatar URLs
- ✅ **Itineraries**: All itineraries (public and private) with:
  - Activities (with locations, times, notes, costs)
  - Packing lists
  - Expenses
- ✅ **Comments**: All comments made by the user
- ✅ **Saved Itineraries**: All saved/liked itineraries
- ✅ **Notifications**: All notifications received
- ✅ **User Behavior**: Preferences and behavior data
- ✅ **Timestamps**: Export date, creation dates, update dates

### Example Export Structure

```json
{
  "export_date": "2025-01-15T10:30:00.000Z",
  "user_id": "uuid-here",
  "profile": {
    "id": "uuid-here",
    "email": "user@example.com",
    "name": "John Doe",
    "username": "johndoe",
    "bio": "Travel enthusiast",
    "location": "Los Angeles, CA",
    "website": "https://example.com",
    "avatar_url": "https://...",
    "created_at": "2024-01-01T00:00:00.000Z"
  },
  "itineraries": [
    {
      "id": "uuid",
      "title": "Trip to Paris",
      "description": "Spring vacation in Paris",
      "location": "Paris, France",
      "start_date": "2025-05-01",
      "end_date": "2025-05-07",
      "duration": 7,
      "is_public": true,
      "activities": [
        {
          "id": "uuid",
          "title": "Visit Eiffel Tower",
          "description": "See the iconic landmark",
          "location": "Eiffel Tower",
          "day": 1,
          "time": "10:00",
          "cost": 25.50
        }
      ],
      "packing_lists": [
        {
          "id": "uuid",
          "category": "Clothing",
          "item_name": "Jacket",
          "is_packed": false
        }
      ],
      "expenses": [
        {
          "id": "uuid",
          "category": "Food",
          "description": "Dinner at restaurant",
          "amount": 85.00,
          "currency": "EUR",
          "date": "2025-05-01"
        }
      ]
    }
  ],
  "comments": [
    {
      "id": "uuid",
      "itinerary_id": "uuid",
      "content": "Great itinerary!",
      "created_at": "2025-01-10T12:00:00.000Z"
    }
  ],
  "saved_itineraries": [
    {
      "itinerary_id": "uuid",
      "type": "save",
      "created_at": "2025-01-05T14:30:00.000Z"
    }
  ],
  "notifications": [
    {
      "id": "uuid",
      "type": "comment",
      "title": "New comment",
      "message": "Someone commented on your itinerary",
      "is_read": true,
      "created_at": "2025-01-10T12:05:00.000Z"
    }
  ],
  "behavior": {
    "user_id": "uuid",
    "last_active_at": "2025-01-15T10:00:00.000Z",
    "preferences": {}
  }
}
```

## Technical Implementation

### Database Function

**File**: `supabase/migrations/027_add_data_export_function.sql`

**Function**: `export_user_data(user_id UUID)`

**Returns**: JSONB containing all user data

**Features**:
- Uses `SECURITY DEFINER` for proper permissions
- Handles missing data gracefully (returns empty arrays)
- Includes all related data via JOINs
- Optimized queries with proper indexing

**Usage**:
```sql
-- Export data for a specific user
SELECT export_user_data('user-id-here');
```

### API Endpoint

**Path**: `/api/user/export-data`

**Method**: `GET`

**Authentication**: Required (must be logged in)

**Response**:
- **Content-Type**: `application/json`
- **Content-Disposition**: `attachment; filename="tinerary-data-export-YYYY-MM-DD.json"`
- **Status**: 200 OK (success), 401 Unauthorized, 500 Internal Server Error

**Example**:
```bash
# Must be authenticated with valid session
curl -X GET http://localhost:3000/api/user/export-data \
  -H "Cookie: session-cookie-here" \
  --output my-data.json
```

### UI Component

**File**: `components/profile-settings.tsx`

**Section**: Data & Privacy

**Features**:
- Download button with loading state
- Error handling with toast notifications
- Automatic file download via blob URL
- Filename includes current date
- Cleanup of temporary URLs

**Handler Function**:
```typescript
const handleDownloadData = async () => {
  // 1. Fetch data from API
  const response = await fetch("/api/user/export-data")

  // 2. Get blob
  const blob = await response.blob()

  // 3. Create download link
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `tinerary-data-export-${timestamp}.json`

  // 4. Trigger download
  a.click()

  // 5. Cleanup
  window.URL.revokeObjectURL(url)
}
```

## Privacy & Compliance

### GDPR Compliance

- ✅ **Article 20 - Right to Data Portability**: Users can export data in JSON format
- ✅ **Article 15 - Right of Access**: Users can access all their personal data
- ✅ **Article 17 - Right to Erasure**: Combined with account deletion feature
- ✅ **Article 12 - Transparent Information**: Clear UI and documentation

### CCPA Compliance

- ✅ **Right to Know**: Users can see all data collected about them
- ✅ **Right to Access**: Users can download their data
- ✅ **Right to Delete**: Combined with account deletion feature

### Security Features

- 🔒 **Authentication Required**: Only logged-in users can export data
- 🔒 **User Isolation**: Users can ONLY export their own data
- 🔒 **No Caching**: `Cache-Control: no-store` prevents caching sensitive data
- 🔒 **Audit Trail**: All exports are logged (via API logs)

## Setup Instructions

### Step 1: Run Migration

```bash
# Apply the database migration
supabase db push

# Or manually run in SQL Editor:
# - 027_add_data_export_function.sql
```

### Step 2: Verify Function

```sql
-- Test the export function
SELECT export_user_data('your-user-id');

-- Should return JSON object with all user data
```

### Step 3: Test API Endpoint

```bash
# Test in browser (must be logged in)
# Navigate to: http://localhost:3000/api/user/export-data

# Or test with curl (replace cookie with actual session)
curl -X GET http://localhost:3000/api/user/export-data \
  -H "Cookie: sb-access-token=..." \
  --output test-export.json
```

### Step 4: Verify UI

1. Log in to your app
2. Go to Profile → Settings
3. Scroll to "Data & Privacy" section
4. Click "Download Data"
5. Verify file downloads as `tinerary-data-export-YYYY-MM-DD.json`
6. Open JSON file and verify data is complete

## Testing

### Manual Testing

1. **Create test data**:
   - Create itineraries with activities, packing lists, expenses
   - Save/like other itineraries
   - Make comments
   - Generate notifications

2. **Export data**:
   - Go to Profile → Settings → Data & Privacy
   - Click "Download Data"
   - Wait for download to complete

3. **Verify export**:
   - Open JSON file
   - Check all sections are present
   - Verify data matches what you created
   - Ensure no other users' data is included

### Automated Testing

```typescript
// Test the database function
describe("export_user_data", () => {
  it("should export all user data", async () => {
    const { data, error } = await supabase.rpc("export_user_data", {
      user_id: testUserId,
    })

    expect(error).toBeNull()
    expect(data).toHaveProperty("profile")
    expect(data).toHaveProperty("itineraries")
    expect(data).toHaveProperty("comments")
    expect(data.user_id).toBe(testUserId)
  })

  it("should not include other users' data", async () => {
    const { data } = await supabase.rpc("export_user_data", {
      user_id: testUserId,
    })

    // All itineraries should belong to test user
    data.itineraries.forEach((itinerary) => {
      expect(itinerary.user_id).toBe(testUserId)
    })
  })
})

// Test the API endpoint
describe("GET /api/user/export-data", () => {
  it("should require authentication", async () => {
    const response = await fetch("/api/user/export-data")
    expect(response.status).toBe(401)
  })

  it("should return JSON data for authenticated user", async () => {
    const response = await fetch("/api/user/export-data", {
      headers: {
        Cookie: `session=${validSessionToken}`,
      },
    })

    expect(response.status).toBe(200)
    expect(response.headers.get("content-type")).toContain("application/json")
    expect(response.headers.get("content-disposition")).toContain("attachment")
  })
})
```

## Monitoring

### Check Export Usage

```sql
-- View recent exports (from API logs)
-- This would require setting up API logging

-- Count exports per user (if tracking in database)
SELECT
  user_id,
  COUNT(*) as export_count,
  MAX(exported_at) as last_export
FROM user_data_exports
GROUP BY user_id
ORDER BY export_count DESC;
```

### Performance Monitoring

The export function can be slow for users with lots of data. Monitor:

- Query execution time
- JSON object size
- Download time

**Optimization tips**:
- Add indexes on foreign keys
- Use pagination for very large datasets
- Consider background job for huge exports
- Add compression for downloads

## Troubleshooting

### Export Button Not Working

**Check**:
1. ✅ User is logged in
2. ✅ API endpoint is accessible
3. ✅ Browser console for errors
4. ✅ Network tab for failed requests

**Debug**:
```bash
# Check if API endpoint exists
curl http://localhost:3000/api/user/export-data

# Should return 401 Unauthorized (since not authenticated)
```

### Empty Export File

**Possible causes**:
- User has no data yet
- Database function not returning data
- JSON serialization issue

**Fix**:
```sql
-- Test function directly
SELECT export_user_data('user-id');

-- Check if user has data
SELECT * FROM profiles WHERE id = 'user-id';
SELECT * FROM itineraries WHERE user_id = 'user-id';
```

### Export Times Out

**For users with large amounts of data**:

**Solutions**:
1. Add timeout to fetch request
2. Implement pagination in database function
3. Use background job for export
4. Compress the export file

## Files

- **Migration**: `/supabase/migrations/027_add_data_export_function.sql`
- **API Endpoint**: `/app/api/user/export-data/route.ts`
- **UI Component**: `/components/profile-settings.tsx`
- **Documentation**: `/docs/DATA_EXPORT.md` (this file)

## Related Features

- **Account Deletion**: `/docs/ACCOUNT_DELETION.md`
- **Deletion Warnings**: `/docs/DELETION_WARNING_EMAILS.md`
- **Profile Settings**: `/components/profile-settings.tsx`

## Future Enhancements

- [ ] Export in multiple formats (CSV, XML)
- [ ] Scheduled automatic exports
- [ ] Email export as attachment
- [ ] Partial exports (select what to export)
- [ ] Export history/audit log
- [ ] Compressed exports (ZIP format)
- [ ] Incremental exports (only new data since last export)
- [ ] Export templates for different use cases
