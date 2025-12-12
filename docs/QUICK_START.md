# Quick Start Guide - Find What You Need

**Choose your path based on what you want to do:**

---

## 🎯 I want to...

### Check if Everything is Working
→ **[SYSTEM_STATUS.md](SYSTEM_STATUS.md)**
- Current system status
- Last collection results
- Quick health check commands

---

### Query Cohesity Data (User)
→ **Already set up! Use Claude Desktop**
- Just ask: "Show me capacity across all clusters"
- Or: "What backups failed yesterday?"
- Or: "Show me agent health status"

The MCP server is already configured and working.

---

### Set Up This System (First Time)
**Start here:** [Documentation/GETTING_STARTED.md](Documentation/GETTING_STARTED.md)

**Then follow this order:**
1. Set up SQL Database → [GETTING_STARTED.md](Documentation/GETTING_STARTED.md#step-1-create-sql-database)
2. Configure tokens → [GETTING_STARTED.md](Documentation/GETTING_STARTED.md#step-2-configure-cluster-connections)
3. Test collection → [GETTING_STARTED.md](Documentation/GETTING_STARTED.md#step-4-test-collection)
4. Set up automation → [Documentation/COMPLETE_AUTOMATION_GUIDE.md](Documentation/COMPLETE_AUTOMATION_GUIDE.md)

**Total time:** ~30 minutes

---

### Configure Automated Collection
→ **[Documentation/COMPLETE_AUTOMATION_GUIDE.md](Documentation/COMPLETE_AUTOMATION_GUIDE.md)**

**What it does:**
- Automatically renews tokens daily (2:00 AM)
- Automatically collects data daily (3:00 AM)
- Zero maintenance required

**Prerequisites:**
- System already set up (see above)
- Administrator access to Windows

**Time:** ~5 minutes

---

### Understand What Data Gets Collected
→ **[Documentation/DATA_COLLECTION_REFERENCE.md](Documentation/DATA_COLLECTION_REFERENCE.md)**

**Covers:**
- 9 data types collected
- API endpoints used
- Collection frequency
- Storage requirements

---

### Troubleshoot Problems

**Step 1:** Check [SYSTEM_STATUS.md](SYSTEM_STATUS.md) for known issues

**Step 2:** Check the relevant log:
```powershell
# Collection problems
Get-Content Logs/CohesityDataCollection.log -Tail 100

# Token problems
Get-Content Logs/token_renewal.log -Tail 100
```

**Step 3:** Run manual test:
```powershell
# Test data collection
python CollectCohesityComprehensive.py

# Test token generation
.\Generate_Cohesity_Tokens.ps1
```

**Step 4:** See common issues in [README.md#troubleshooting](README.md#troubleshooting)

---

### Build Reports or Dashboards
→ **[Documentation/REPORTING_DASHBOARD_GUIDE.md](Documentation/REPORTING_DASHBOARD_GUIDE.md)**

**Options:**
- Power BI dashboards
- SQL Server Reporting Services
- Custom queries via Claude MCP
- Excel with ODBC connection

---

### Modify the Collection Script
→ **[Scripts/DataCollection/README.md](Scripts/DataCollection/README.md)**

**Important:**
1. Edit: `Scripts/DataCollection/CollectCohesityComprehensive.py`
2. Test: `python CollectCohesityComprehensive.py`
3. Copy to root: `cp Scripts/DataCollection/CollectCohesityComprehensive.py C:\Claude\`

The scheduled task uses the root directory copy.

---

### Work with SQL Database
→ **SQL Schema:** `SQL/Schema/`

**Connect to:**
- Server: `chsql2.ceinternal.com`
- Database: `CohesityAnalytics`
- Authentication: Windows Authentication

**Main tables:**
- `daily_cluster_capacity` - Capacity snapshots
- `protection_run_history` - Backup runs
- `alert_history` - Alerts
- `agent_health` - Agent status
- `database_inventory` - SQL/Oracle databases
- `datalock_status` - WORM compliance

---

### Deploy to Production
→ **[Documentation/DEPLOYMENT_CHECKLIST.md](Documentation/DEPLOYMENT_CHECKLIST.md)**

**Checklist covers:**
- Pre-deployment verification
- Production configuration
- Post-deployment testing
- Monitoring setup

---

### Understand Multi-Cluster Setup
→ **[Documentation/MULTI_CLUSTER_QUICK_REFERENCE.md](Documentation/MULTI_CLUSTER_QUICK_REFERENCE.md)**

**Current clusters:**
- **chch2** - Primary cluster (default)
- **chch1** - Secondary cluster
- **cech1** - Europe cluster

All three are collected automatically.

---

### Explore API Endpoints
→ **[Documentation/API_DISCOVERY_README.md](Documentation/API_DISCOVERY_README.md)**

**Tools available:**
- `Discover-CohesityEndpoints.ps1` - Manual exploration
- `Master-APIDiscovery.ps1` - Automated discovery

**Use case:** Finding new data sources or undocumented APIs

---

## 🆘 Emergency Procedures

### Everything Stopped Working
```powershell
# 1. Check scheduled tasks
Get-ScheduledTask | Where-Object {$_.TaskName -like "Cohesity*"}

# 2. Regenerate tokens
.\Generate_Cohesity_Tokens.ps1

# 3. Test collection manually
python CollectCohesityComprehensive.py

# 4. Check logs for errors
Get-Content Logs/CohesityDataCollection.log -Tail 100
```

### Data Collection Failing
```powershell
# Test SQL connection
python -c "import pyodbc; conn = pyodbc.connect('DRIVER={ODBC Driver 17 for SQL Server};SERVER=chsql2.ceinternal.com;DATABASE=CohesityAnalytics;Trusted_Connection=yes'); print('Success')"

# Test API tokens
python -c "import json; t=json.load(open('cohesity_tokens.json')); print(f'{len(t)} tokens loaded')"

# Check ODBC drivers
python -c "import pyodbc; print(pyodbc.drivers())"
```

### MCP Server Not Working
```powershell
# Rebuild and restart
.\rebuild-mcp-multi-cluster.bat
# Then completely close and restart Claude Desktop
```

---

## 📚 Full Documentation Index

**In root directory:**
- `README.md` - Complete system documentation (comprehensive)
- `SYSTEM_STATUS.md` - Current status (check first for issues)
- `QUICK_START.md` - This file (find what you need)

**In Documentation/ directory:**
- Setup & Configuration:
  - `GETTING_STARTED.md`
  - `README_SETUP.md`
  - `COMPLETE_AUTOMATION_GUIDE.md`
  - `DEPLOYMENT_CHECKLIST.md`

- Technical References:
  - `DATA_COLLECTION_REFERENCE.md`
  - `README_COMPREHENSIVE_COLLECTION.md`
  - `TOKEN_AUTOMATION_GUIDE.md`

- Multi-Cluster:
  - `MULTI_CLUSTER_MIGRATION_COMPLETE.md`
  - `MULTI_CLUSTER_QUICK_REFERENCE.md`

- Dashboards & Reporting:
  - `REPORTING_DASHBOARD_GUIDE.md`

- API Exploration:
  - `API_DISCOVERY_README.md`
  - `API_DISCOVERY_SYSTEM_README.md`

- Historical:
  - `BEFORE_AFTER_COMPARISON.md`
  - `CLEANUP_PLAN.md`
  - `README_SYSTEM.md`

**In Scripts/ directory:**
- `Scripts/DataCollection/README.md` - Active scripts guide
- `Scripts/DataCollection/WRAPPER_COMPARISON.md` - Wrapper comparison

---

## ⏱️ How Long Will This Take?

| Task | Time Required |
|------|---------------|
| Check system status | 1 minute |
| Query data via Claude | Instant (already working) |
| First time setup | 30 minutes |
| Configure automation | 5 minutes |
| Build custom dashboard | 1-2 hours |
| Troubleshoot issues | 5-30 minutes |
| Modify collection script | 30-60 minutes |

---

## 🎓 Learning Path

**If you're new to this system, follow this learning path:**

1. **Day 1:** Read [SYSTEM_STATUS.md](SYSTEM_STATUS.md) to understand current state
2. **Day 1:** Try querying via Claude Desktop (already works!)
3. **Day 2:** Read [README.md](README.md) to understand architecture
4. **Week 1:** Explore [DATA_COLLECTION_REFERENCE.md](Documentation/DATA_COLLECTION_REFERENCE.md)
5. **Week 2:** Review SQL schema in `SQL/Schema/`
6. **Month 1:** Modify collection script if needed

---

**Still can't find what you need?**
- Check [README.md](README.md) - Comprehensive documentation
- Search code comments in `CollectCohesityComprehensive.py`
- Review logs in `Logs/` directory
