# Cohesity Analytics & Monitoring System

**Comprehensive data collection, analytics, and real-time dashboard for Cohesity backup infrastructure**

[![System Status](https://img.shields.io/badge/Status-Operational-brightgreen)]()
[![Data Collection](https://img.shields.io/badge/Collection-Automated-blue)]()
[![Dashboard](https://img.shields.io/badge/Dashboard-Live-success)]()
[![Clusters](https://img.shields.io/badge/Clusters-3-informational)]()

---

## 🚀 Quick Start

### Access the Dashboard
**View live capacity metrics and analytics:**

**Local access:**
```
http://localhost:3000
```

**Network access (from other PCs):**
```
http://192.168.87.120:3000
http://192.168.90.240:3000
```

The dashboard provides:
- **AI Analysis** - One-click Claude Desktop integration
- Real-time cluster capacity status
- Capacity growth analysis (1-day, 7-day, 30-day views)
- System health monitoring with backup failure tracking
- Storage consumers with expandable VM/object details
- M365 backup monitoring
- Executive summary and tactical recommendations
- **Instant load** with progressive caching (<100ms subsequent loads)

### For Users
1. **View metrics?** → Open dashboard at http://localhost:3000
2. **Query data?** → Use Claude Desktop with MCP server (already configured)
3. **Check status?** → See [SYSTEM_STATUS.md](SYSTEM_STATUS.md)

### For Administrators
1. **First time setup?** → See [DASHBOARD_SETUP.md](DASHBOARD_SETUP.md)
2. **Configure automation?** → Services run via PM2 (auto-start on boot)
3. **Troubleshooting?** → Check PM2 logs: `pm2 logs cohesity-dashboard`

---

## 📋 Table of Contents

- [What This System Does](#what-this-system-does)
- [System Architecture](#system-architecture)
- [Dashboard Features](#dashboard-features)
- [Quick Operations](#quick-operations)
- [Documentation Index](#documentation-index)
- [Troubleshooting](#troubleshooting)

---

## 🎯 What This System Does

### Real-Time Dashboard (NEW!)
- 🖥️ **Retro-Futuristic UI** - Visual capacity matrix with 1980s terminal aesthetic
- 📊 **Multi-Cluster View** - Monitor all 3 clusters simultaneously
- 📈 **Capacity Trending** - 30-day historical data with projections
- 🔍 **Expandable Details** - Click any job to see individual VM/object breakdowns
- ⚡ **Auto-Refresh** - Updates every 10 minutes automatically
- 💾 **Offline Cache** - View last-known data even when APIs are down

### Data Collection & Analytics
- ✅ **Real-time API queries** - Live data from Cohesity clusters
- ✅ **Capacity tracking** - Current usage and growth trends
- ✅ **Storage consumers** - Per-job storage breakdown with deduplication ratios
- ✅ **Top growing objects** - Identify fastest-expanding VMs/databases
- ✅ **Multi-cluster support** - Unified view across chch1, chch2, cech1

### MCP Integration
- 🤖 **Natural language queries** - Ask Claude about your Cohesity environment
- 📊 **80+ pre-built prompts** - Common questions ready to use
- 🔍 **Advanced analytics** - Capacity forecasting, growth analysis, compliance checks
- 📝 **Report generation** - Executive summaries, capacity planning reports

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        System Components                             │
└─────────────────────────────────────────────────────────────────────┘

DASHBOARD PATH (Browser → HTTP APIs):
User Browser (Port 3000)
    ↓ HTTP REST
MCP Server (serves both Dashboard UI and API on Port 3000)
    ↓ HTTPS + Bearer Auth
Cohesity Clusters (REST APIs)
    ├─ chch1.ceinternal.com
    ├─ chch2.ceinternal.com
    └─ cech1.ceinternal.com

CLAUDE AI PATH (Desktop App → MCP Protocol):
Claude Desktop App
    ↓ MCP Protocol (stdio)
MCP Server (Model Context Protocol)
    ↓ HTTPS + Bearer Auth
Cohesity Clusters (REST APIs)
    ├─ chch1.ceinternal.com
    ├─ chch2.ceinternal.com
    └─ cech1.ceinternal.com

┌─────────────────────────────────────────────────────────────────────┐
│          MCP Server: Dual-Purpose Architecture                       │
└─────────────────────────────────────────────────────────────────────┘

The MCP Server serves TWO independent use cases:

1. HTTP API Server (Dashboard) - Port 3000
   - Standard REST API endpoints
   - No AI involved, pure data aggregation
   - Used by: Browser dashboard

2. MCP Protocol Server (Claude Desktop)
   - Implements Model Context Protocol
   - Enables Claude AI natural language queries
   - Used by: Claude Desktop app

┌─────────────────────────────────────────────────────────────────────┐
│                       Service Management                             │
└─────────────────────────────────────────────────────────────────────┘

PM2 Process Manager
├─ cohesity-mcp (Port 3000)       - Dual-purpose MCP server
│                                   (HTTP API + MCP Protocol)
└─ cohesity-dashboard (Port 3100) - Dashboard web interface
                                    (No AI, pure REST client)

Auto-start: Enabled (Windows Scheduled Task on login)
Logs: H:\.pm2\logs\
Status: pm2 list
```

### Components

| Component | Purpose | Port | Status |
|-----------|---------|------|--------|
| **MCP HTTP Server** | Cohesity API integration | 3000 | ✅ Running (PM2) |
| **Dashboard API** | Web dashboard backend | 3100 | ✅ Running (PM2) |
| **Dashboard UI** | Retro-futuristic interface | 3100 | ✅ Operational |
| **Token Auto-Refresh** | Maintains valid API tokens | - | ✅ Scheduled (2x daily) |

---

## 📊 Dashboard Features

### 1. AI Analysis Section (NEW!)
- **"Ask Claude" Integration** - One-click button to open Claude Desktop with dashboard context
- Auto-generates executive summary, capacity warnings, and key metrics
- Copies full dashboard context to clipboard for AI analysis
- Enables natural language questions about your infrastructure

### 2. Cluster Array Status
- Current capacity utilization for each cluster
- Visual progress bars with color-coded thresholds
- Percentage used and absolute TB values
- Real-time status indicators

### 3. Capacity Growth Analysis (ENHANCED!)
- **Three timeframes:** 1-day, 7-day, 30-day growth views
- Top 5 fastest growing resources per timeframe
- Merged view: VMs, SQL databases, and general resources
- Shows growth rate (GB/day) and current logical size
- Cluster and object type identification

### 4. System Health Analysis
- Protection job success rates
- Recent backup failures with error details
- Health status indicators (healthy, warning, critical)
- Based on most recent protection job runs

### 5. Top Storage Consumers
- **Protection jobs ranked by physical storage usage**
- Shows logical size, physical storage, and deduplication ratio
- **Expandable rows** - Click any job to see:
  - Top 10 individual VMs/objects within that job
  - Per-object logical and physical sizes
  - Backup status for each object
  - Object types (VMware, SQL, Physical, etc.)
  - **Nested SQL expansion** - SQL jobs expand to show databases, then instances
- File counts and storage breakdown

### 6. Microsoft 365 Monitoring (NEW!)
- Tenant count and protected object statistics
- Top M365 users by storage consumption
- Recent M365 backup failures
- Email, OneDrive, and SharePoint coverage

### 7. Executive Summary & Recommendations
- Total capacity across clusters
- Cluster count and overall utilization
- Hottest cluster identification
- Days to 80% capacity projection
- Critical capacity warnings
- Actionable insights and tactical recommendations

### Performance & UX Features
- **Instant Load (NEW!)** - Progressive loading with localStorage cache (<100ms perceived load time)
- **Auto-Refresh** - Configurable refresh interval with visual loading indicators
- **Network Sharing** - Accessible from other PCs on same VLAN with auto-detecting API endpoints
- **Offline Resilience** - Full localStorage caching with automatic fallback
- **Retro-futuristic design** - Cyan/magenta color scheme, Orbitron terminal font
- **Interactive Elements** - Hover effects with glow, expandable rows, click-to-expand
- **Status indicators** - Color-coded health badges (green/yellow/red)
- **Responsive layout** - Works on desktop and tablets

---

## ⚡ Quick Operations

### Dashboard Management

```powershell
# Check service status
pm2 list

# View dashboard logs
pm2 logs cohesity-dashboard

# View MCP server logs
pm2 logs cohesity-mcp

# Restart services
pm2 restart cohesity-dashboard
pm2 restart cohesity-mcp

# Restart all services
pm2 restart all

# Save PM2 configuration (after changes)
pm2 save
```

### Access Points

**Local Access (on server PC):**
```
Dashboard:        http://localhost:3100
MCP HTTP API:     http://localhost:3000/api/multi-cluster-status
Health Check:     http://localhost:3100/api/health
Capacity API:     http://localhost:3100/api/capacity
Trends API:       http://localhost:3100/api/trends?days=30
Consumers API:    http://localhost:3100/api/consumers?limit=20
```

**Network Access (from other PCs on same VLAN):**
```
Dashboard:        http://192.168.87.120:3100
                  http://192.168.90.240:3100
```
Note: Dashboard auto-detects hostname and adjusts API endpoint accordingly. Firewall rule configured for port 3100.

### Regenerate API Tokens

```powershell
# Manual token generation
cd C:\Claude
.\Generate_Cohesity_Tokens.ps1

# Restart services to pick up new tokens
pm2 restart all
```

### Rebuild MCP Server

```powershell
# Build from source
cd C:\Claude\MCPServers\cohesity-mcp-v2
npm run build

# Restart via PM2
pm2 restart cohesity-mcp
```

### Query Data via Claude

Ask Claude in Desktop app:
```
"Show me capacity for all clusters"
"What are the top storage consumers?"
"Show me objects in job 3684 on chch2"
"Analyze capacity trends for the last 30 days"
```

### Integrate Claude AI into Dashboard

Want AI-powered analysis directly in the dashboard?
See **[CLAUDE_AI_INTEGRATION_GUIDE.md](CLAUDE_AI_INTEGRATION_GUIDE.md)** for:
- 4 integration options (from simple button to full chat widget)
- Step-by-step implementation guide
- Cost analysis (~$5/month for typical usage)
- Security best practices
- Example use cases

---

## 📚 Documentation Index

### Essential Documents

| Document | Purpose | When to Use |
|----------|---------|-------------|
| **[DASHBOARD_SETUP.md](DASHBOARD_SETUP.md)** | Dashboard installation & config | First-time setup or troubleshooting |
| **[SYSTEM_STATUS.md](SYSTEM_STATUS.md)** | Current system health | Check operational status |
| **[QUICK_START.md](QUICK_START.md)** | Fast setup reference | Quick deployment |
| **[TOKEN_REFRESH_GUIDE.md](TOKEN_REFRESH_GUIDE.md)** | Token automation | Configure auto-renewal |
| **[EMAIL_REPORTING.md](EMAIL_REPORTING.md)** | Email dashboard reports | Configure daily email summaries |
| **[TOKEN_REFRESH_SOLUTION.md](TOKEN_REFRESH_SOLUTION.md)** | 4-layer token protection | Token management deep-dive |

### API Documentation

| Document | Purpose |
|----------|---------|
| **[API_REFERENCE.md](API_REFERENCE.md)** | Complete API endpoint listing |
| **[MCP_TOOLS_GUIDE.md](MCP_TOOLS_GUIDE.md)** | Claude MCP tool usage |

### Advanced Topics

| Document | Purpose |
|----------|---------|
| **[CLAUDE_AI_INTEGRATION_GUIDE.md](CLAUDE_AI_INTEGRATION_GUIDE.md)** | Add AI chat to dashboard |
| **[DASHBOARD_DOCUMENTATION.md](DASHBOARD_DOCUMENTATION.md)** | Technical dashboard details |
| **[DASHBOARD_README.md](DASHBOARD_README.md)** | Dashboard architecture |
| **[DASHBOARD_USER_GUIDE.md](DASHBOARD_USER_GUIDE.md)** | Complete user guide |
| **[CHANGELOG.md](CHANGELOG.md)** | Version history |
| **[RELEASE_NOTES_v1.1.md](RELEASE_NOTES_v1.1.md)** | v1.1 release notes |

---

## 🚨 Troubleshooting

### Dashboard Not Loading

**Symptoms:** Cannot access http://localhost:3100

**Check:**
```powershell
# Verify services are running
pm2 list

# If not running, start them
pm2 start cohesity-dashboard
pm2 start cohesity-mcp

# Check for errors
pm2 logs cohesity-dashboard --lines 50
```

**Common causes:**
- Services not started (run `pm2 resurrect` or `start-all-services.bat`)
- Port 3100 or 3000 already in use (check with `netstat -ano | findstr "3100"`)
- Node.js not installed

### Expandable Rows Show 404 Error

**Symptoms:** Clicking a job row shows "Error loading objects: HTTP 404"

**Fix:**
```powershell
# Hard refresh browser to clear cache
# Press: Ctrl + Shift + R (Windows) or Cmd + Shift + R (Mac)

# Or clear browser cache completely:
# 1. Close dashboard tab
# 2. Clear all cached images and files
# 3. Open dashboard again in new tab or incognito window

# Verify services are running
pm2 list

# Check MCP server has the endpoint
curl http://localhost:3000/api/dashboard/job-objects/chch2/3684?topN=5
```

**Expected browser title:** "COHESITY // CAPACITY MATRIX v1.1"
- If you see just "COHESITY // CAPACITY MATRIX", your browser is using old cached JavaScript

### API Returns No Data

**Symptoms:** Dashboard shows "LOADING..." or empty charts

**Check:**
```powershell
# Test MCP server directly
curl http://localhost:3000/api/multi-cluster-status

# Check tokens are valid
Get-Content C:\Claude\cohesity_tokens.json

# View MCP server logs
pm2 logs cohesity-mcp --lines 100
```

**Fix:**
```powershell
# Regenerate tokens
.\Generate_Cohesity_Tokens.ps1

# Restart services
pm2 restart all
```

### Services Not Auto-Starting

**Symptoms:** After reboot, dashboard not available

**Check:**
```powershell
# Verify scheduled task exists
Get-ScheduledTask | Where-Object {$_.TaskName -like "*Cohesity*"}

# Check PM2 startup script
pm2 startup
pm2 save
```

**Fix:**
```powershell
# Recreate startup task (PowerShell as Admin)
.\Setup-DashboardAutostart.ps1

# Or use schtasks directly
schtasks /create /tn "Cohesity Dashboard" /tr "pm2 resurrect" /sc onstart /ru "$env:USERNAME" /rl highest /f
```

### Chart Scale Issues

The 30-day projection chart is configured with a fixed Y-axis scale of 0-60 TB for clarity. If your clusters exceed 60 TB:

**Edit:** `C:\Claude\cohesity-dashboard.html` line 532-533
```javascript
y: {
    display: true,
    min: 0,
    max: 100,  // Increase to 100 TB or remove for auto-scale
    // ...
}
```

---

## 🔧 Maintenance

### Daily (Automated)
- ✅ Token refresh scheduled 2x daily (2:00 AM and 2:00 PM)
- ✅ Dashboard cache refresh at 3:00 AM with email notification
- ✅ Services auto-restart on failure (PM2 watch mode)
- ✅ Dashboard auto-refreshes every 10 minutes

### Weekly (5 minutes)
```powershell
# Check PM2 service health
pm2 list
pm2 logs cohesity-dashboard --lines 50 | Select-String "ERROR"
pm2 logs cohesity-mcp --lines 50 | Select-String "ERROR"

# Verify token expiration
.\Check-TokenExpiration.ps1

# Test dashboard loads
curl http://localhost:3100/api/health
```

### Monthly (15 minutes)
- Review dashboard performance
- Check browser console for JavaScript errors
- Verify expandable rows working on all jobs
- Update dashboard color scheme or styling if needed
- Archive old PM2 logs if needed

---

## 📁 Directory Structure

```
C:\Claude/
├── README.md                                    ← YOU ARE HERE
├── DASHBOARD_SETUP.md                           ← Dashboard setup guide
├── SYSTEM_STATUS.md                             ← Quick status check
│
├── dashboard-api.js                             ← Dashboard backend (Express)
├── cohesity-dashboard.html                      ← Dashboard frontend
├── start-all-services.bat                       ← Start PM2 services
├── Generate_Cohesity_Tokens.ps1                 ← Token generation
├── cohesity_tokens.json                         ← Active API tokens
│
├── MCPServers/
│   └── cohesity-mcp-v2/                         ← MCP HTTP server
│       ├── src/index.ts                         ← Main server code
│       ├── build/                               ← Compiled JavaScript
│       └── package.json
│
├── Documentation/                               ← Detailed guides
│   ├── DASHBOARD_SETUP.md
│   ├── DASHBOARD_DOCUMENTATION.md
│   ├── DASHBOARD_README.md
│   ├── QUICK_START.md
│   └── TOKEN_REFRESH_GUIDE.md
│
└── Logs/                                        ← PM2 logs at H:\.pm2\logs\
```

---

## 🤝 Contributing

### Making Dashboard Changes

1. **Modify HTML/CSS:**
   - Edit `cohesity-dashboard.html`
   - Hard refresh browser: `Ctrl + Shift + R`
   - Changes take effect immediately (no restart needed)

2. **Modify Dashboard API:**
   - Edit `dashboard-api.js`
   - Restart: `pm2 restart cohesity-dashboard`
   - Test: `curl http://localhost:3100/api/health`

3. **Modify MCP Server:**
   - Edit `MCPServers/cohesity-mcp-v2/src/index.ts`
   - Build: `npm run build` (in cohesity-mcp-v2 directory)
   - Restart: `pm2 restart cohesity-mcp`

4. **Update Documentation:**
   - Keep this README current
   - Update DASHBOARD_SETUP.md for setup changes
   - Update version number in HTML title

### Testing Changes

```powershell
# Test dashboard API endpoints
curl http://localhost:3100/api/health
curl http://localhost:3100/api/capacity
curl http://localhost:3100/api/consumers?limit=10

# Test MCP server endpoints
curl http://localhost:3000/api/multi-cluster-status
curl http://localhost:3000/api/dashboard/capacity

# Test expandable rows
curl http://localhost:3100/api/job-objects/chch2/3684?topN=5

# Check PM2 logs for errors
pm2 logs --lines 100
```

---

## 📊 System Metrics

- **Clusters Monitored:** 3 (chch1, chch2, cech1)
- **Dashboard Sections:** 7 (AI Analysis, Cluster Status, Capacity Growth, System Health, Storage Consumers, M365, Executive Summary)
- **Auto-Refresh:** Daily at 2:00 AM (scheduled task) + Manual refresh button
- **API Response Time:** <2 seconds per cluster
- **Page Load Time:** <100ms (with cache), 5-15 seconds (initial load)
- **Offline Cache:** Full localStorage with all sections (survives browser close)
- **Network Access:** Localhost + LAN (192.168.87.120, 192.168.90.240)
- **Browser Support:** Chrome, Firefox, Edge (modern browsers with localStorage support)

---

## 🔐 Security

### Dashboard Authentication (Windows SSO)
- **Method:** Windows Integrated Authentication (NTLM/Kerberos) via node-sspi
- **Access Control:** Active Directory group membership (default: Domain Admins)
- **User Experience:** Seamless pass-through - no login prompt for domain users
- **Caching:** Group membership cached for 5 minutes to reduce AD queries

**Configuration (environment variables):**
```powershell
$env:AUTH_ENABLED = "false"           # Disable auth entirely (default: true)
$env:AUTH_GROUP = "IT-Infrastructure" # Change required group (default: Domain Admins)
```

### Cohesity API Authentication
- **Method:** Bearer tokens (24-hour expiration, auto-renewed at 2:11 AM)
- **Permissions:** Read-only COHESITY_VIEWER role
- **Service Account:** svcCohesityReporting

### Network Security
- **Dashboard URL:** http://localhost:3000 (also accessible on internal VLAN)
- **API Tokens:** File-based storage with user permissions
- **Internal Only:** All services on .ceinternal.com domain

---

## 📜 Version History

### v1.5 (Dec 12, 2025) - Current
- ✅ **Windows SSO Authentication** - Seamless Active Directory integration
  - NTLM/Kerberos pass-through via node-sspi
  - Domain Admins group membership required (configurable)
  - No login prompt for authorized users
  - 5-minute group membership cache
- ✅ **Unified Architecture** - Single service on port 3000 (was 3000 + 3100)
- ✅ **Windows Service** - Runs as native Windows Service via NSSM (replaced PM2)

### v1.4 (Nov 12, 2025)
- ✅ **Email Dashboard Reports** - Automated daily email summaries at 3:00 AM
  - Cluster capacity tiles with days to 80% forecasting
  - Top 5 storage consumers with dedup ratios
  - Top 5 growing objects (7-day and 30-day)
  - Rich HTML email format with inline data
  - Sent to: dcampbell@ceflp.com
- ✅ **4-Layer Token Management** - Advanced protection against token expiration
  - Layer 1: Pre-refresh token expiry checking
  - Layer 2: Cache preservation on error
  - Layer 3: Automated scheduled task at 2:00 AM
  - Layer 4: Hourly token monitoring
- ✅ **Dashboard Cache System** - Two-tier caching (in-memory + file-based)
  - Capacity, consumers, growing objects, SQL sizes
  - Automatic refresh at 3:00 AM daily
  - Cache preservation on API errors

### v1.3 (Nov 10, 2025)
- ✅ **Performance Optimization** - Progressive loading with localStorage cache (instant perceived load)
- ✅ **Network Sharing** - Dashboard accessible from other PCs on same VLAN
- ✅ **Enhanced Capacity Growth** - Shows logical size metrics with top 5 items per timeframe
- ✅ **Loading Indicators** - Visual feedback during refresh operations
- ✅ **M365 Integration** - Microsoft 365 backup monitoring section
- ✅ **SQL Database Growth** - Dedicated SQL Server database growth tracking
- ✅ **Auto-Detecting API Endpoints** - Works seamlessly on localhost and remote access

### v1.2 (Nov 2025)
- ✅ "Ask Claude" integration button
- ✅ AI Analysis section for dashboard context
- ✅ Capacity growth analysis with 1-day, 7-day, 30-day views
- ✅ System health analysis based on protection job runs
- ✅ Enhanced font sizing and UI polish

### v1.1 (Nov 6, 2025)
- ✅ Added expandable storage consumers with VM/object drill-down
- ✅ Implemented click-to-expand functionality
- ✅ Added browser cache-busting for reliable updates
- ✅ Enhanced troubleshooting documentation
- ✅ Cleaned up test scripts and temporary files

### v1.0 (Nov 6, 2025)
- ✅ Real-time capacity dashboard with retro-futuristic UI
- ✅ Multi-cluster support (chch1, chch2, cech1)
- ✅ PM2 service management with auto-restart
- ✅ Top storage consumers table
- ✅ 30-day capacity trends chart
- ✅ Executive summary and recommendations

### v0.2 (Oct 2025)
- MCP HTTP server implementation
- Multi-cluster API aggregation
- Token auto-refresh scheduling

### v0.1 (Earlier)
- Initial MCP server for Claude Desktop integration

---

## 📄 License

Internal use only - Confidential business tool

---

**Dashboard:** http://localhost:3100 (or http://192.168.87.120:3100 from network)
**System Status:** ✅ Fully Operational
**Version:** v1.4
**Last Updated:** November 12, 2025
**Maintained By:** Infrastructure Team
