# Dashboard Troubleshooting Guide

## Issue: Dashboard Shows "No Cached Data Available"

### Root Cause Identified (Nov 21, 2025)

**Problem**: Frontend HTML was updated with new API endpoints, but backend `dashboard-api.js` wasn't updated with matching routes.

**What Happened**:
1. Dashboard HTML (v2025-11-19-18:30) added calls to new endpoints:
   - `/api/alerts`
   - `/api/m365-summary`
   - `/api/m365-top-users`
   - `/api/m365-failures`

2. Backend `dashboard-api.js` didn't have these endpoints implemented

3. When dashboard JavaScript called `Promise.all()` to fetch all data, the missing endpoints returned 404 errors

4. The entire `Promise.all()` failed, preventing ANY data from loading

5. Result: Dashboard stuck showing "No cached data available"

### Why This Happened

**Frontend-Backend Sync Issue**: The dashboard HTML and API backend were developed/updated separately without coordination. The HTML was updated on Nov 19-20, but the API wasn't updated until today (Nov 21).

---

## Prevention Strategy

### 1. Endpoint Validation Script ✓

Created: `Scripts/Validate-Dashboard-Endpoints.ps1`

**Purpose**: Automatically detects when dashboard HTML calls endpoints that don't exist in the API

**Usage**:
```powershell
.\Scripts\Validate-Dashboard-Endpoints.ps1
```

**Run this**:
- After updating dashboard HTML
- After updating dashboard-api.js
- Before deploying changes
- As part of startup scripts

**Output Example**:
```
Dashboard Endpoint Validation

Found 14 endpoints
  OK /api/alerts
  OK /api/capacity
  MISSING /api/new-feature

ERROR: 1 missing endpoint!
```

### 2. Better Error Handling in Dashboard

**Current Issue**: `Promise.all()` fails completely if ANY fetch fails

**Solution**: The dashboard already has `.catch()` handlers for some endpoints:
```javascript
fetchM365Summary().catch(() => ({ tenants: 0, ... }))
```

**Best Practice**: ALL optional endpoints should have `.catch()` handlers with default values so the dashboard can still show partial data if some endpoints fail.

### 3. API Endpoint Checklist

When adding a new feature to the dashboard:

**Step 1**: Decide what data you need
```
Example: "I need to show M365 backup failures"
```

**Step 2**: Update `dashboard-api.js` FIRST
```javascript
app.get('/api/m365-failures', async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 7;
        const data = await callMCPEndpoint(`/api/dashboard/m365-failures?days=${days}`);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
```

**Step 3**: Restart dashboard service
```powershell
pm2 restart cohesity-dashboard
```

**Step 4**: Test the endpoint
```powershell
curl http://localhost:3100/api/m365-failures?days=7
```

**Step 5**: Update dashboard HTML to use it
```javascript
async function fetchM365Failures() {
    const response = await fetch(`${API_ENDPOINT}/api/m365-failures?days=7`);
    return await response.json();
}
```

**Step 6**: Run validation
```powershell
.\Scripts\Validate-Dashboard-Endpoints.ps1
```

### 4. Development Workflow

**ALWAYS develop in this order**:
1. Backend API endpoint first (`dashboard-api.js`)
2. Test endpoint with `curl` or browser
3. Frontend HTML/JavaScript (`cohesity-dashboard.html`)
4. Validate with script
5. Deploy

**NEVER**:
- Update HTML without updating API
- Deploy without testing endpoints
- Skip the validation script

---

## Quick Fix Guide

If dashboard shows "No cached data available":

### Step 1: Check Browser Console
Press `F12` → Console tab

Look for errors like:
```
Failed to fetch
404 Not Found
```

### Step 2: Identify Missing Endpoint
The error will show which endpoint is failing:
```
GET http://localhost:3100/api/alerts 404 (Not Found)
```

### Step 3: Add Missing Endpoint

Edit `Dashboard/dashboard-api.js`:
```javascript
app.get('/api/alerts', async (req, res) => {
    try {
        const data = await callMCPEndpoint('/api/dashboard/alerts');
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
```

### Step 4: Restart
```powershell
pm2 restart cohesity-dashboard
```

### Step 5: Refresh Browser
Press `Ctrl + Shift + R` (hard refresh)

---

## Testing Checklist

Before declaring "dashboard is fixed":

- [ ] Run validation script: `.\Scripts\Validate-Dashboard-Endpoints.ps1`
- [ ] All endpoints return green "OK"
- [ ] Open `http://localhost:3100/test.html` - all tests pass
- [ ] Open `http://localhost:3100` - data loads within 5 seconds
- [ ] Browser console (F12) shows no errors
- [ ] Dashboard shows cluster metrics, not "No cached data"
- [ ] PM2 status shows both services online: `pm2 status`

---

## Architecture Notes

### How the Dashboard Works

```
Browser
  ↓ fetch('http://localhost:3100/api/capacity')
Dashboard API (port 3100)
  ↓ callMCPEndpoint('/api/dashboard/capacity')
MCP Server (port 3000)
  ↓ Queries Cohesity clusters
Cohesity Clusters (chch1, chch2, cech1)
```

**Key Point**: The dashboard API (`dashboard-api.js`) is a **thin proxy** that:
1. Receives requests from browser
2. Forwards to MCP server
3. Returns response to browser

All actual data logic is in the MCP server, not in `dashboard-api.js`.

### Why Two Servers?

- **MCP Server (3000)**: MCP protocol server (stdio), also exposes HTTP API
- **Dashboard API (3100)**: Web server that serves HTML and proxies API calls

The dashboard needs a separate web server because the MCP server's primary interface is stdio (for Claude Desktop), and the HTTP API is a secondary feature.

---

## Common Patterns

### Adding a New API Endpoint

**Pattern to follow** (all endpoints in `dashboard-api.js` follow this):

```javascript
// Get [description]
app.get('/api/[endpoint-name]', async (req, res) => {
    try {
        // Extract parameters if needed
        const param = parseInt(req.query.param) || defaultValue;

        // Log what we're doing
        console.log(`[API] Fetching [description]...`);

        // Call MCP server (usually same endpoint name)
        const data = await callMCPEndpoint('/api/dashboard/[endpoint-name]');

        // Return JSON
        res.json(data);
    } catch (error) {
        // Log and return error
        console.error('[API] Error fetching [description]:', error.message);
        res.status(500).json({ error: error.message });
    }
});
```

### Examples from Working Code

**Simple endpoint** (no parameters):
```javascript
app.get('/api/capacity', async (req, res) => {
    try {
        console.log('[API] Fetching capacity data...');
        const data = await callMCPEndpoint('/api/dashboard/capacity');
        res.json(data);
    } catch (error) {
        console.error('[API] Error fetching capacity:', error.message);
        res.status(500).json({ error: error.message });
    }
});
```

**With query parameters**:
```javascript
app.get('/api/alerts', async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 1;
        console.log(`[API] Fetching alerts (${days} days)...`);
        const data = await callMCPEndpoint(`/api/dashboard/alerts?days=${days}`);
        res.json(data);
    } catch (error) {
        console.error('[API] Error fetching alerts:', error.message);
        res.status(500).json({ error: error.message });
    }
});
```

**With path parameters**:
```javascript
app.get('/api/job-objects/:clusterName', async (req, res) => {
    try {
        const clusterName = req.params.clusterName;
        const jobId = req.query.jobId;
        console.log(`[API] Fetching job objects for ${clusterName}...`);
        const data = await callMCPEndpoint(`/api/dashboard/job-objects/${clusterName}?jobId=${jobId}`);
        res.json(data);
    } catch (error) {
        console.error('[API] Error fetching job objects:', error.message);
        res.status(500).json({ error: error.message });
    }
});
```

---

## Summary

**What went wrong**: Frontend/backend mismatch - HTML called endpoints that didn't exist

**How we fixed it**: Added the missing 4 endpoints to `dashboard-api.js`

**How to prevent**:
1. Always update backend API first
2. Test endpoints before updating frontend
3. Run validation script before deploying
4. Use `.catch()` handlers for optional endpoints

**Validation script**: `Scripts/Validate-Dashboard-Endpoints.ps1`
