# Cohesity Dashboard User Guide

**Quick reference for using the Cohesity Capacity Dashboard**

---

## 🚀 Quick Access

**Dashboard URL:**
```
http://localhost:3100
```

**Auto-refresh:** Every 10 minutes
**Offline mode:** LocalStorage cache (last-known data)

---

## 📊 Dashboard Sections

### 1. Cluster Array Status

**What it shows:**
- Current capacity usage for each cluster (chch1, chch2, cech1)
- Visual progress bars with color coding
- Percentage used and TB values

**Color coding:**
- 🟢 **Green (0-70%):** Healthy capacity
- 🟡 **Yellow (70-80%):** Approaching threshold
- 🔴 **Red (80-100%):** Critical - action needed

**Example:**
```
chch1: ████████████░░░░░░░░  62.5%  (25.0 TB / 40.0 TB)
```

---

### 2. Capacity Chart (30-Day Projection)

**What it shows:**
- Historical capacity usage for last 30 days
- Line graph with multiple clusters overlaid
- Trend visualization

**How to read it:**
- **X-axis:** Dates (last 30 days)
- **Y-axis:** Capacity in TB (0-60 TB scale)
- **Lines:** Different color per cluster
- **Trend:** Upward slope = growing storage

**Use cases:**
- Identify growth patterns
- Spot unusual spikes
- Forecast future capacity needs
- Compare cluster growth rates

---

### 3. Top 10 Data Expansion Vectors

**What it shows:**
- Fastest growing VMs/objects across all clusters
- Daily growth rate in GB
- Current total size

**Columns:**
- **Rank:** #1 = fastest growing
- **Object Name:** VM or database name
- **Type:** VMware, SQL, Physical, etc.
- **Cluster:** Source cluster
- **Daily Growth:** GB per day average
- **Size:** Current total size

**Use cases:**
- Identify runaway growth
- Find candidates for data cleanup
- Track specific VMs over time
- Plan capacity additions

---

### 4. Top Storage Consumers (Interactive!)

**What it shows:**
- Protection jobs ranked by physical storage usage
- Click any row to expand and see individual VMs/objects

**Main table columns:**
- **Rank:** #1 = largest consumer
- **Protection Job:** Job name (e.g., "CHVC2-VMs")
- **Cluster:** Source cluster
- **Physical Storage:** Actual TB consumed (after dedup/compression)
- **Logical Size:** Original data size before dedup
- **Dedup Ratio:** How much compression achieved (higher = better)
- **Files:** Number of files protected

**Dedup ratio color coding:**
- 🟢 **Green (20x+):** Excellent deduplication
- 🟡 **Yellow (10-20x):** Good deduplication
- 🔴 **Red (<10x):** Poor deduplication - investigate

#### Expandable Rows Feature

**How to use:**
1. **Click any row** in the Top Storage Consumers table
2. See **expand icon** (▸) rotate to (▾)
3. **Nested table appears** showing:
   - Top 10 individual VMs/objects within that job
   - Object name, type, sizes, and backup status
4. **Click again** to collapse and hide details

**Expanded view shows:**
- **Object Name:** Individual VM/database name
- **Type:** VMware, SQL, Physical, etc.
- **Logical:** Original size in GB
- **Physical:** Storage consumed in GB
- **Status:** Success/Warning/Failure

**Example workflow:**
```
Click: CHVC2-VMs (4.25 TB physical)
  ↓
See: 106 individual VMs
  ↓
Top object: "CWScraper2" (2.7 TB logical, 42 GB physical)
```

**Use cases:**
- Drill down into large protection jobs
- Identify specific VMs consuming most space
- Find VMs with poor dedup ratios
- Verify backup success status per object

---

### 5. System Analysis (Executive Summary)

**What it shows:**
- High-level overview of entire environment
- Cluster count and total capacity
- Overall utilization percentage
- Hottest cluster identification
- Days to 80% capacity warning

**Example:**
```
Monitoring 3 clusters with 120.0 TB total capacity.
Current utilization: 68.5% (82.2 TB used).

Hottest Cluster: chch2 at 75.3% capacity,
projected to reach 80% in 12 days.
```

**Use cases:**
- Quick health check
- Executive reporting
- Capacity planning meetings
- Alert thresholds

---

### 6. Tactical Recommendations

**What it shows:**
- Actionable insights based on current data
- Capacity warnings
- Growth alerts
- Optimization suggestions

**Example recommendations:**
- "Cluster chch2 approaching capacity threshold - plan expansion"
- "CHVC2-VMs growing rapidly - review retention policies"
- "Poor deduplication on SQL-Backups job - investigate compression settings"

---

## 🖱️ Interactive Features

### Auto-Refresh
- Dashboard updates every **10 minutes** automatically
- Next refresh time shown at bottom
- **Manual refresh:** Reload browser page (F5)

### Offline Mode
- Dashboard caches last-known data in browser LocalStorage
- If APIs are unreachable, shows cached data with warning
- Data survives browser close/reopen

### Expandable Tables
- **Click any row** in Top Storage Consumers to expand
- **Icon changes:** ▸ becomes ▾ when expanded
- **Loading indicator:** "⏳ Loading objects..." appears briefly
- **Click again** to collapse

### Hover Effects
- Interactive elements glow on hover
- Tables highlight rows on mouse-over
- Visual feedback for clickable items

---

## 🎨 Visual Design

### Retro-Futuristic Theme
- **Colors:** Cyan (#00ffff) and magenta (#ff00ff)
- **Font:** Share Tech Mono (monospace terminal style)
- **Grid background:** Subtle scanlines
- **Glow effects:** Neon-style borders

### Status Colors
- **🟢 Green:** Healthy (0-70% capacity, 20x+ dedup, Success status)
- **🟡 Yellow:** Warning (70-80% capacity, 10-20x dedup, Warning status)
- **🔴 Red:** Critical (80-100% capacity, <10x dedup, Failure status)
- **🔵 Blue/Magenta:** Highlight values (physical storage, key metrics)
- **⚪ White/Cyan:** Normal text

---

## 🔄 Data Refresh Cycle

**Dashboard refresh:**
```
1. Every 10 minutes (auto)
2. On manual browser refresh (F5)
3. On first page load
```

**What gets updated:**
- Cluster capacity status
- 30-day trend data
- Top growing objects
- Storage consumers list
- Executive summary
- Recommendations

**Behind the scenes:**
```
Browser → Dashboard API (port 3100)
         → MCP Server (port 3000)
         → Cohesity APIs (3 clusters)
         → Data aggregated and returned
```

---

## 📱 Browser Compatibility

**Recommended browsers:**
- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ⚠️ Safari (works, may have minor visual differences)
- ❌ Internet Explorer (not supported)

**Screen resolution:**
- Minimum: 1280x720
- Recommended: 1920x1080 or higher
- Responsive design adapts to screen size

---

## 🔍 Common Use Cases

### Daily Capacity Check
1. Open dashboard
2. Check Cluster Array Status for any red bars
3. Review System Analysis for warnings
4. Check Tactical Recommendations

### Weekly Capacity Review
1. Review 30-Day Capacity Chart for trends
2. Check Top 10 Data Expansion Vectors
3. Identify fastest-growing VMs
4. Plan capacity additions if needed

### Monthly Planning Meeting
1. Screenshot Executive Summary
2. Note "Days to 80%" projection
3. Review Top Storage Consumers
4. Expand large jobs to identify candidates for cleanup
5. Check dedup ratios for optimization opportunities

### Troubleshooting High Capacity
1. Check Top Storage Consumers table
2. Click largest job to expand
3. Identify biggest VMs/objects
4. Check dedup ratio (low = investigate)
5. Review backup status for failures
6. Consider:
   - Retention policy adjustments
   - VM cleanup
   - Storage optimization
   - Capacity expansion

### Finding Specific VM Storage
1. Scroll to Top Storage Consumers
2. Click likely protection job (e.g., "CHVC2-VMs")
3. Find VM in expanded list
4. Note logical vs physical size
5. Check backup status

---

## ⚙️ Settings & Configuration

### Change Auto-Refresh Interval

**Default:** 10 minutes (600,000 ms)

**To change:**
1. Open `C:\Claude\cohesity-dashboard.html` in text editor
2. Find line ~890: `const REFRESH_INTERVAL = 600000;`
3. Change to desired milliseconds:
   - 5 minutes: `300000`
   - 15 minutes: `900000`
   - 30 minutes: `1800000`
4. Save file
5. Hard refresh browser: `Ctrl + Shift + R`

### Change Chart Scale

**Default:** 0-60 TB

**To change:**
1. Open `C:\Claude\cohesity-dashboard.html` in text editor
2. Find line ~532-533:
   ```javascript
   y: {
       min: 0,
       max: 60,  // Change this value
   ```
3. Change `max` to desired TB value (or remove for auto-scale)
4. Save file
5. Hard refresh browser: `Ctrl + Shift + R`

### Change Limit for Top Consumers

**Default:** Top 20 jobs

**To change:**
1. Open `C:\Claude\cohesity-dashboard.html` in text editor
2. Find line ~381: `const response = await fetch(\`${API_ENDPOINT}/api/consumers?limit=15\`);`
3. Change `limit=15` to desired number
4. Save file
5. Hard refresh browser: `Ctrl + Shift + R`

---

## 🚨 Troubleshooting

### Dashboard Not Loading

**Symptom:** "Connection refused" or blank page

**Check:**
1. Services running: `pm2 list`
2. If not, start: `start-all-services.bat` or `pm2 resurrect`
3. Verify URL: `http://localhost:3100` (not https)

### Data Shows "LOADING..." Forever

**Symptom:** Sections stuck on "LOADING..."

**Check:**
1. Browser console (F12) for errors
2. Network tab for failed API calls
3. PM2 logs: `pm2 logs cohesity-mcp`
4. Token validity: `.\Generate_Cohesity_Tokens.ps1` to refresh

### Expandable Rows Show 404 Error

**Symptom:** "Error loading objects: HTTP 404"

**Fix:**
1. **Hard refresh browser:** `Ctrl + Shift + R`
2. Check title bar says "v1.1" (not old version)
3. If still cached, use incognito window
4. Verify services: `pm2 list`

### Chart Not Displaying

**Symptom:** Empty chart area or JavaScript errors

**Check:**
1. Browser console (F12) for errors
2. Ensure Chart.js library loaded (check Network tab)
3. Hard refresh: `Ctrl + Shift + R`
4. Try different browser

### Wrong Data / Outdated Data

**Symptom:** Data doesn't match current state

**Check:**
1. Check "Last Updated" timestamp at bottom
2. Wait for next auto-refresh (every 10 minutes)
3. Manual refresh: F5
4. Check MCP server has latest data: `pm2 logs cohesity-mcp`

### Browser Cache Issues

**Symptom:** Changes not appearing after update

**Fix:**
1. **Hard refresh:** `Ctrl + Shift + R` (most important!)
2. Clear browser cache completely
3. Use incognito/private window
4. Close all tabs and reopen
5. Try different browser

---

## 📊 Understanding the Metrics

### Capacity Metrics

| Metric | Definition | Good | Warning | Critical |
|--------|------------|------|---------|----------|
| **Used %** | Percentage of total capacity used | <70% | 70-80% | >80% |
| **TB Used** | Absolute terabytes consumed | Varies | Varies | Varies |
| **Days to 80%** | Projected days until 80% threshold | >60 days | 30-60 days | <30 days |

### Storage Consumer Metrics

| Metric | Definition | Example |
|--------|------------|---------|
| **Physical Storage** | Actual TB consumed (post-dedup) | 4.25 TB |
| **Logical Size** | Original data size (pre-dedup) | 85.1 TB |
| **Dedup Ratio** | Logical / Physical | 20.0x |
| **Files** | Number of files protected | 156,234 |

### Growth Metrics

| Metric | Definition | Example |
|--------|------------|---------|
| **Daily Growth** | Average GB added per day | 450 GB/day |
| **7-Day Growth** | Growth over last week | 3.15 TB |
| **30-Day Trend** | Month-long capacity pattern | +12% |

---

## 💡 Tips & Best Practices

### Daily Use
1. **Bookmark** http://localhost:3100 for quick access
2. **Check status** first thing each morning
3. **Watch for red** in Cluster Array Status
4. **Review recommendations** section daily

### Weekly Review
1. **Check 30-day trend** for unexpected spikes
2. **Review top consumers** for new large jobs
3. **Expand largest jobs** to see VM details
4. **Compare dedup ratios** across clusters

### Monthly Reporting
1. **Screenshot dashboard** for capacity reports
2. **Note "Days to 80%"** projections
3. **Track top growers** month-over-month
4. **Review recommendations** for action items

### Troubleshooting Capacity Issues
1. **Start with Top Storage Consumers**
2. **Expand suspicious jobs** to find culprits
3. **Check dedup ratios** - low ratios indicate inefficiency
4. **Review backup status** - failures waste space on retries
5. **Cross-reference** with Top 10 Data Expansion Vectors

---

## 📞 Support

**Dashboard Issues:**
1. Check this guide first
2. Review [README.md](README.md) troubleshooting section
3. Check PM2 logs: `pm2 logs`
4. Check browser console (F12)

**Capacity Planning:**
1. Use "Days to 80%" metric
2. Review 30-day trend chart
3. Check top growing objects
4. Consult with infrastructure team

**Data Questions:**
1. Use Claude Desktop MCP integration for queries
2. Ask: "Show me capacity for all clusters"
3. Ask: "What are the largest storage consumers?"
4. Ask: "Analyze growth trends"

---

## 📚 Related Documentation

- **[README.md](README.md)** - Complete system overview
- **[DASHBOARD_SETUP.md](DASHBOARD_SETUP.md)** - Technical setup guide
- **[SYSTEM_STATUS.md](SYSTEM_STATUS.md)** - Current system health
- **[QUICK_START.md](QUICK_START.md)** - Fast deployment guide

---

## 📝 Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| **F5** | Refresh page (normal) |
| **Ctrl + Shift + R** | Hard refresh (bypass cache) |
| **F12** | Open browser developer tools |
| **Ctrl + Plus/Minus** | Zoom in/out |
| **Ctrl + 0** | Reset zoom to 100% |

---

## 🎯 Quick Reference Card

```
╔════════════════════════════════════════════════════════════╗
║         COHESITY DASHBOARD QUICK REFERENCE                 ║
╠════════════════════════════════════════════════════════════╣
║                                                            ║
║  URL: http://localhost:3100                                ║
║  Auto-Refresh: Every 10 minutes                            ║
║  Hard Refresh: Ctrl + Shift + R                            ║
║                                                            ║
║  SECTIONS:                                                 ║
║  ├─ Cluster Array Status (capacity bars)                  ║
║  ├─ 30-Day Capacity Chart (trend graph)                   ║
║  ├─ Top 10 Data Expansion (fastest growers)               ║
║  ├─ Top Storage Consumers (expandable!)                   ║
║  ├─ System Analysis (executive summary)                   ║
║  └─ Tactical Recommendations (action items)               ║
║                                                            ║
║  INTERACTIVE:                                              ║
║  • Click any job in Storage Consumers table                ║
║  • See individual VMs/objects                              ║
║  • Check sizes and backup status                           ║
║  • Click again to collapse                                 ║
║                                                            ║
║  COLOR CODES:                                              ║
║  • Green (🟢) = Healthy / Good                            ║
║  • Yellow (🟡) = Warning / Moderate                       ║
║  • Red (🔴) = Critical / Poor                             ║
║                                                            ║
║  TROUBLESHOOTING:                                          ║
║  1. Hard refresh: Ctrl + Shift + R                         ║
║  2. Check services: pm2 list                               ║
║  3. Check logs: pm2 logs                                   ║
║  4. Regenerate tokens: .\Generate_Cohesity_Tokens.ps1     ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
```

---

**Version:** 1.1
**Last Updated:** November 6, 2025
**Dashboard URL:** http://localhost:3100
