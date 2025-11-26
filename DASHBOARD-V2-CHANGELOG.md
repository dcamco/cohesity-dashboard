# Cohesity Dashboard V2 - Work Completed

**Date:** 2025-11-25
**File:** `cohesity-dashboard-v2.html`

---

## Overview

Complete redesign of the Cohesity backup infrastructure monitoring dashboard based on Stephen Few's dashboard design principles. This was a $25K critical deliverable replacing a rejected design.

---

## Design Philosophy

- 4-tier information hierarchy (Critical → Key Metrics → Trends → Details)
- Semantic color usage (green/amber/red for status only)
- Collapsible sections for progressive disclosure
- "Is everything OK?" answerable in < 2 seconds

---

## Features Implemented

### 1. Hero Status Indicator
- Large "ALL SYSTEMS OPERATIONAL" display
- Traffic light status (green/amber/red)
- Alert count badges

### 2. Cluster Capacity Cards
- 3-column layout showing all clusters (chch1, chch2, cech1)
- Progress bars with 80% threshold markers
- Days to 80% capacity forecast
- Color-coded by utilization level

### 3. Capacity Growth Table
- Consolidated single table (replaced 3 separate tables)
- Shows 24hr, 7-day, 30-day growth
- Column header clarified as "Logical Size"
- Sortable columns
- Object type badges (SQL, VM, Physical)

### 4. Top Storage Consumers Table
- Expandable rows to see individual objects within protection groups
- Shows Physical storage consumption
- Dedup ratio color-coded (Green >15x, Amber 5-15x, Red <5x)
- Click to drill down into job objects

### 5. SQL Database Analysis Section
- Summary bar: Total Physical, Database count, Avg Compression
- Table columns:
  - Database name
  - Cluster
  - Logical Size
  - Physical (Cluster) - actual cluster consumption
  - Compression ratio
  - Daily Physical Delta
  - Weekly Physical Delta
- Sorted by physical consumption (largest first)
- Growth deltas color-coded (red=growing, green=shrinking)

### 6. Microsoft 365 Backups Section
- Summary stats: Tenants, Protected Users, Total Capacity, Recent Failures
- **Tenant cards layout** (side-by-side):
  - Copperwood (ceflp.com)
  - Centaurus (centcap.net)
- Each card shows:
  - Friendly company name (large)
  - Domain name (small, muted)
  - User count and total size summary
  - Breakdown table by type:
    - 📧 Mailbox
    - ☁️ OneDrive
    - 📁 SharePoint
    - 👥 Teams
    - 📂 PublicFolders

### 7. Storage Health Section
- Summary metrics:
  - Deleted Jobs count
  - Orphaned Snaps count
  - Orphaned (Physical) - clarified as physical storage
  - Avg Dedupe ratio

- **NEW: Orphaned Snapshots by Protection Group table**
  - Protection Group name
  - Cluster
  - Type (SQL, VMware, Exchange, etc.)
  - Snapshot count (highlighted in amber)
  - Physical Storage
  - Oldest Snapshot date

- Deleted Jobs with Retained Data table
  - Full job names
  - Type, Cluster, Snapshots
  - Physical Storage
  - Age in years

---

## Data Clarifications Added

Throughout the dashboard, storage values are now explicitly labeled:
- **Physical** = actual cluster disk consumption after dedupe
- **Logical** = source data size before dedupe/compression

This distinction is critical for Cohesity environments with high deduplication ratios.

---

## CSS Components Added

```css
/* M365 Tenant Cards */
.m365-tenant-grid - Grid layout for tenant cards
.m365-tenant-card - Individual tenant card container
.m365-tenant-header - Card header with name/domain
.m365-tenant-name - Large friendly name
.m365-tenant-domain - Small domain text
.m365-tenant-summary - Users/size summary bar
.m365-type-table - Compact type breakdown table

/* Expandable Rows */
.expandable-row - Clickable row for drill-down
.expand-icon - Rotation animation on expand
.details-row - Expanded content row
.nested-table - Child table styling
```

---

## API Endpoints Used

| Endpoint | Purpose |
|----------|---------|
| `/api/capacity` | Cluster capacity data |
| `/api/alerts` | Active alerts |
| `/api/failures` | Backup failures |
| `/api/growth-1day` | 24-hour growth data |
| `/api/growth-7day` | 7-day growth data |
| `/api/growth-30day` | 30-day growth data |
| `/api/consumers` | Top storage consumers |
| `/api/sql-storage-analysis` | SQL database analysis |
| `/api/m365-summary` | M365 summary stats |
| `/api/m365-top-users` | M365 tenant/type breakdown |
| `/api/storage-health` | Orphaned data analysis |
| `/api/job-objects/:cluster/:jobId` | Objects within a protection job |

---

## Tenant Name Mapping

```javascript
const tenantDisplayNames = {
    'ceflp.com': 'Copperwood',
    'centcap.net': 'Centaurus'
};
```

---

## Files Modified

1. `C:\Claude\Projects\Cohesity\Dashboard\cohesity-dashboard-v2.html` - Main dashboard file
2. `C:\Claude\Projects\Cohesity\Dashboard\REDESIGN-SPEC.md` - Design specification

---

## Testing

Dashboard tested at: `http://localhost:3100/cohesity-dashboard-v2.html`
All sections verified with live API data from MCP server.
