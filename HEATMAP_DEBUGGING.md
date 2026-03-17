# Google Maps Heatmap Implementation & Debugging Guide

## Overview
This document explains the heatmap feature, common issues, and how to verify it's working correctly.

## Architecture

### Data Flow
```
Listings (DB) 
  → Geocoding (if lat/lng missing)
  → Aggregate by metric (views/bids/transactions)
  → `/api/heatmap` endpoint
  → Frontend fetches & renders
  → Google Maps HeatmapLayer displays
```

### Key Components

1. **Backend Service** (`server/src/services/heatmapService.ts`)
   - Geocodes listings with missing coordinates
   - Aggregates data by metric
   - Returns array of `{ lat, lng, weight }`

2. **Backend Route** (`server/src/routes/heatmapRoutes.ts`)
   - Requires authentication
   - Validates response structure
   - Logs all operations

3. **Frontend Component** (`client/src/pages/HeatMapPage.tsx`)
   - Fetches heatmap data from API
   - Validates point structure
   - Renders with Google Maps visualization library
   - Shows debug information

## Common Issues & Fixes

### Issue 1: "0 points" displayed

**Root Causes:**
1. **No listings exist** or all are inactive
2. **Missing lat/lng data** in listings table
3. **Geocoding disabled** (missing `GOOGLE_GEOCODING_API_KEY`)
4. **Data type mismatch** (numeric returned as strings)

**Debug Steps:**
1. Check database:
   ```sql
   SELECT COUNT(*) FROM listings WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
   SELECT COUNT(*) FROM listings WHERE status = 'active';
   ```
2. Open browser DevTools (F12) → Network tab
3. Look for `/api/heatmap` request
4. Check Response tab - verify it contains `"points": [...]`

### Issue 2: Heatmap renders but doesn't show clusters

**Root Causes:**
1. **Weight values too low** (clipped to 0 or 1)
2. **Coordinates not precise enough**
3. **Zoom level wrong** (showing zoomed-in area with few points)

**Solutions:**
1. Adjust weight calculation in heatmap service
2. Verify coordinates are in correct format (decimal degrees)
3. Use `zoom={10}` to view broader area

### Issue 3: API returns error "Missing GOOGLE_GEOCODING_API_KEY"

**This is not a blocking error** — it just means automatic geocoding is disabled.

**Solutions:**
1. **Add the key** to `.env`:
   ```
   GOOGLE_GEOCODING_API_KEY=your_api_key
   ```
   (Optional - if you want auto-geocoding)

2. **OR manually geocode listings** using a tool like:
   - Google Maps Geocoding API directly
   - PostGIS (if using PostgreSQL)
   - A cron job to batch-update coordinates

## Verification Checklist

### Backend Verification

```bash
# 1. Check environment
echo $GOOGLE_GEOCODING_API_KEY

# 2. Check database
npm run seed  # Ensure test data exists

# 3. Start server with logging
npm run dev

# 4. Make API request (replace with your actual cookie)
curl -H "Cookie: YOUR_SESSION_COOKIE" \
  http://localhost:8080/api/heatmap?metric=views

# Expected response:
# {
#   "metric": "views",
#   "points": [
#     { "lat": 51.047, "lng": -114.071, "weight": 5 },
#     ...
#   ]
# }
```

### Frontend Verification

1. **Open HeatMapPage** in your app
2. **Check browser console** (F12 → Console)
   - Look for `[HeatMap]` prefixed logs
   - Should show: "Loaded X valid heatmap points"
   - Check for errors in red

3. **Check Network tab** (F12 → Network)
   - Filter by "heatmap"
   - Click the request
   - Verify Response contains valid JSON with points array

4. **Visual verification**
   - Map should load (blue/gray tiles visible)
   - Toggle Metric dropdown - should see log activity
   - If points exist, you should see colored overlay on map

## Data Transformation Reference

### Input (from database - listings table)
```typescript
{
  latitude: "51.0447" | 51.0447,      // Can be string or number
  longitude: "-114.0719" | -114.0719,  // Can be string or number
  views_count: 15,                     // For "views" metric
}
```

### Output (to frontend)
```typescript
{
  lat: 51.0447,        // Must be number
  lng: -114.0719,      // Must be number
  weight: 15           // Must be number
}
```

### Frontend HeatmapLayer format
```typescript
[
  {
    location: new google.maps.LatLng(51.0447, -114.0719),
    weight: 15  // 1-100 scale for visibility
  }
]
```

## Metrics Explained

### Views (`metric=views`)
- **Data source**: `listings.views_count`
- **Aggregation**: Per listing
- **Weight**: Direct count of views
- **Use case**: See which areas have high-traffic listings

### Bids (`metric=bids`)
- **Data source**: `bids` table joined with `listings`
- **Aggregation**: Count of bids per listing location
- **Weight**: Number of bids
- **Use case**: See which areas have competitive auctions

### Transactions (`metric=transactions`)
- **Data source**: `transactions` table joined with `listings`
- **Aggregation**: Count of completed sales per location
- **Weight**: Number of sales
- **Use case**: See which areas have successful sales activity

## Weight Scaling

The heatmap weight is automatically clamped to 1-100 for optimal visibility:
```typescript
weight: Math.max(1, Math.min(100, p.weight))
```

If you want to adjust sensitivity:
- **More spread**: Increase upper bound (e.g., 200)
- **More concentrated**: Decrease or use logarithmic scale

Example logarithmic scale:
```typescript
weight: Math.max(1, Math.min(100, Math.log(p.weight + 1) * 10))
```

## Performance Considerations

- **Backfill batch size**: Default 25 listings per request (avoid API quota)
- **Query optimization**: Uses `GROUP BY` for bids/transactions
- **Caching**: Data is fresh-fetched each metric change

If you have 10,000+ listings:
1. Run geocoding as a separate cron job
2. Cache heatmap results (1-hour TTL)
3. Consider geographic pre-aggregation

## Environment Setup

### Required
- `VITE_API_BASE_URL` (client) - points to your backend
- `VITE_GOOGLE_MAPS_API_KEY` (client) - Maps + Visualization libraries

### Optional
- `GOOGLE_GEOCODING_API_KEY` (server) - automatic address geocoding
- `POSTGRES_URL` (server) - database connection

## Troubleshooting Commands

```bash
# Restart server with verbose logging
npm run dev

# Check if API endpoint exists
curl http://localhost:8080/api/heatmap?metric=views

# Verify database has data
npm run db:studio  # Opens Drizzle Studio

# Check Google Maps API is loaded
# In browser console:
typeof google.maps.HeatmapLayer
# Should return "function" (not undefined)

# Force reload heatmap
# In browser console:
location.reload()
```

## Next Steps

If heatmap still doesn't work after these fixes:

1. **Share browser console output** (F12 → Console tab)
   - Look for any red errors
   - Copy full error messages

2. **Share API response** 
   - Open Network tab → heatmap request → Response
   - Check point structure

3. **Check database directly**
   ```sql
   SELECT COUNT(*) FROM listings 
   WHERE latitude IS NOT NULL 
   AND longitude IS NOT NULL 
   AND status = 'active';
   ```

4. **Verify Visualization library loads**
   - In browser console: `typeof google.maps.visualization.HeatmapLayer`
   - Should return `"function"`
