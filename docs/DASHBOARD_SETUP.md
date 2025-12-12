# 📊 Cohesity Dashboard - Setup Guide

**Minimal single-page dashboard with 2 AM auto-refresh**

---

## 🎯 Features

✅ **Key Metrics:**
- Days to 80% capacity (projected date)
- Current utilization across all clusters
- Monthly growth rate

✅ **Capacity Trends:**
- 30-day historical chart
- Per-cluster visualization

✅ **Top Growing Resources:**
- Top 10 VMs/SQL/Mailboxes by growth
- Daily and 7-day average growth

✅ **Auto-Refresh:**
- Refreshes automatically at 2 AM daily
- Manual refresh button available
- Caches data for offline viewing

---

## 🚀 Quick Start (5 minutes)

### Step 1: Install Dependencies

```bash
cd C:\Claude
npm install express cors
```

### Step 2: Start the API Server

```bash
node dashboard-api.js
```

**Output:**
```
✅ Dashboard API server running on http://localhost:3100
📊 Dashboard: http://localhost:3100
🔧 API endpoints:
   GET /api/capacity - Multi-cluster capacity
   GET /api/trends?days=30 - Capacity trends
   GET /api/top-growing?days=7&limit=10 - Top growing resources
```

### Step 3: Open Dashboard

Open your browser to: **http://localhost:3100**

That's it! 🎉

---

## 📋 What You'll See

### Top Section - Key Metrics
```
┌────────────────┬────────────────┬────────────────┐
│ Days to 80%    │ Utilization    │ Monthly Growth │
│     120        │     65.2%      │   450 GB       │
│ chch2 - Dec 15 │ 65.1/100.0 TB  │                │
└────────────────┴────────────────┴────────────────┘
```

### Cluster Overview
```
┌─────────────┬─────────────┬─────────────┐
│ chch1       │ chch2       │ cech1       │
│ 🟡 75%      │ 🟢 65%      │ 🟢 70%      │
│ 90 days     │ 120 days    │ 105 days    │
└─────────────┴─────────────┴─────────────┘
```

### Capacity Trends (Chart)
```
30-day line chart showing growth per cluster
```

### Top 10 Growing Resources
```
#  Resource Name      Type        Cluster  Daily    7-Day Avg
1  PROD-SQL-01       SQL Server   chch2    12.5 GB  11.2 GB
2  Exchange-DB01     Mailbox      chch1    8.3 GB   7.9 GB
3  VM-Finance-01     VM           cech1    6.7 GB   6.1 GB
...
```

### Executive Summary
```
Managing 3 clusters with 65.1 TB of 100.0 TB used (65.2% utilization).

Hottest Cluster: chch1 at 75.0% capacity, projected to reach 80% in 90 days.

Environment Health: 🟢 All clusters operating within normal parameters.
```

### Recommendations
```
▸ Monitor chch1 closely - approaching 80% threshold
▸ Review retention policies for optimization opportunities
▸ Consider capacity expansion planning for Q1 2026
```

---

## ⚙️ Configuration

### Change Refresh Time

Edit `cohesity-dashboard.html`, line ~245:

```javascript
// Current: Refresh at 2 AM
next2AM.setHours(2, 0, 0, 0);

// Change to 6 AM:
next2AM.setHours(6, 0, 0, 0);
```

### Change API Endpoint

Edit `cohesity-dashboard.html`, line ~157:

```javascript
// Current: localhost
const API_ENDPOINT = 'http://localhost:3100';

// Change to server IP:
const API_ENDPOINT = 'http://192.168.1.100:3100';
```

### Change Trend Period

Edit `dashboard-api.js` or dashboard HTML to request different time periods:

```javascript
// 60 days instead of 30:
const days = parseInt(req.query.days) || 60;
```

---

## 🔧 Troubleshooting

### Dashboard shows "Loading..."

**Check:**
1. Is API server running? `node dashboard-api.js`
2. Can you access: http://localhost:3100/api/health
3. Check browser console (F12) for errors

**Fix:**
```bash
# Restart API server
Ctrl+C to stop
node dashboard-api.js
```

### "No data available"

**Check:**
1. Is your MCP server path correct in `dashboard-api.js`?
2. Can MCP server access SQL database?
3. Check API server logs for errors

**Test MCP directly:**
```bash
# In Claude Desktop, try:
"Analyze multi-cluster capacity"

# If this works, API should work too
```

### Chart not showing

**Check:**
1. Browser console for JavaScript errors
2. Data is being fetched: Check Network tab (F12)
3. Chart.js loaded: Look for 404 errors

**Fix:**
```
Refresh page with Ctrl+F5 (hard refresh)
```

---

## 🚀 Running as a Service

### Option 1: PM2 (Recommended)

```bash
npm install -g pm2

# Start dashboard API
pm2 start dashboard-api.js --name cohesity-dashboard

# Auto-start on boot
pm2 startup
pm2 save

# View logs
pm2 logs cohesity-dashboard
```

### Option 2: Windows Service

Use **NSSM** (Non-Sucking Service Manager):

```bash
# Download NSSM from nssm.cc
nssm install CohesityDashboard "C:\Program Files\nodejs\node.exe" "C:\Claude\dashboard-api.js"
nssm start CohesityDashboard
```

### Option 3: Task Scheduler

1. Open Task Scheduler
2. Create Basic Task
3. Trigger: At startup
4. Action: Start program
5. Program: `node`
6. Arguments: `C:\Claude\dashboard-api.js`
7. Start in: `C:\Claude`

---

## 📱 Access from Other Devices

### On Your Network

1. **Find your server IP:**
```bash
ipconfig
# Look for IPv4 Address: 192.168.1.XXX
```

2. **Update firewall:**
```bash
# Allow port 3100
netsh advfirewall firewall add rule name="Cohesity Dashboard" dir=in action=allow protocol=TCP localport=3100
```

3. **Access from other device:**
```
http://192.168.1.XXX:3100
```

### Mobile Bookmark

Add to home screen for app-like experience:
1. Open in mobile browser
2. Menu → "Add to Home Screen"
3. Now it's an app icon!

---

## 🎨 Customization

### Change Colors

Edit `cohesity-dashboard.html`:

```css
/* Line ~12 - Background gradient */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

/* Change to your brand colors: */
background: linear-gradient(135deg, #YOUR_COLOR1 0%, #YOUR_COLOR2 100%);
```

### Add Logo

Edit `cohesity-dashboard.html`, line ~24 (in header):

```html
<div class="flex justify-between items-center">
    <div class="flex items-center space-x-4">
        <img src="your-logo.png" alt="Logo" class="h-12">
        <div>
            <h1 class="text-3xl font-bold text-gray-800">Cohesity Dashboard</h1>
            ...
```

### Add More Metrics

Call additional MCP tools in `dashboard-api.js`:

```javascript
app.get('/api/health-dashboard', async (req, res) => {
    const data = await callMCPTool('generate_health_dashboard', {
        cluster: req.query.cluster || 'chch2'
    });
    res.json(data);
});
```

Then fetch in dashboard:

```javascript
const healthData = await fetch('/api/health-dashboard').then(r => r.json());
```

---

## 📊 Screenshots (What to Expect)

### Desktop View
- Full-width responsive layout
- 3-column metric cards
- Interactive chart with hover tooltips
- Sortable table

### Mobile View
- Stacked cards
- Touch-friendly buttons
- Swipeable chart
- Responsive table

---

## 🔒 Security Notes

**Current Setup:**
- ⚠️ No authentication (localhost only)
- ⚠️ No HTTPS
- ✅ CORS enabled for development

**For Production:**
1. **Add authentication:**
```javascript
app.use((req, res, next) => {
    const token = req.headers.authorization;
    if (token !== 'Bearer YOUR_SECRET_TOKEN') {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
});
```

2. **Enable HTTPS:**
```javascript
const https = require('https');
const fs = require('fs');

const options = {
    key: fs.readFileSync('server.key'),
    cert: fs.readFileSync('server.cert')
};

https.createServer(options, app).listen(3100);
```

3. **Restrict CORS:**
```javascript
app.use(cors({
    origin: 'https://your-dashboard-domain.com'
}));
```

---

## 📚 File Structure

```
C:\Claude\
├── cohesity-dashboard.html     (Frontend - Single HTML file)
├── dashboard-api.js            (Backend - Express API)
├── DASHBOARD_SETUP.md          (This file)
├── package.json                (Created by npm install)
└── node_modules/               (Created by npm install)
```

---

## 🎯 Next Steps

**After Setup:**
1. ✅ Bookmark the dashboard
2. ✅ Test manual refresh button
3. ✅ Verify 2 AM auto-refresh works
4. ✅ Access from mobile device
5. ✅ Set up PM2 for auto-start

**Enhancements:**
- Add more MCP tools (health, DR status, etc.)
- Customize colors and branding
- Add email alerts for critical thresholds
- Export reports to PDF
- Add user authentication

---

## 💡 Pro Tips

**1. Leave browser tab open**
   - Dashboard auto-refreshes at 2 AM
   - Data cached for offline viewing

**2. Use as NOC display**
   - Full-screen mode (F11)
   - Dark mode (edit CSS)
   - Large TV/monitor

**3. Mobile widget**
   - Add to home screen
   - Quick glance at capacity
   - Push notifications (future)

**4. Screenshot automation**
   - Use Puppeteer to auto-screenshot
   - Email daily reports
   - Archive for compliance

---

## 🆘 Support

**Issues:**
1. Check browser console (F12)
2. Check API server logs
3. Test MCP server directly in Claude Desktop
4. Verify SQL database connectivity

**Common Fixes:**
- Restart API server: `Ctrl+C` then `node dashboard-api.js`
- Clear cache: `Ctrl+F5` in browser
- Check firewall: Allow port 3100
- Verify MCP path: Edit `dashboard-api.js` line 11

---

**Status:** ✅ Ready to Deploy
**Time to Setup:** 5 minutes
**Complexity:** Minimal (2 files)
**Requirements:** Node.js + MCP Server

**Enjoy your new dashboard!** 📊🎉
