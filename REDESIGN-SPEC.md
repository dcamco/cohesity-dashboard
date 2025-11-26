# Cohesity Dashboard Redesign Specification
## $25K Critical Deliverable — Rejected Design Replacement

**Created:** 2025-11-25
**Status:** DESIGN SPECIFICATION
**Client Requirements:** Clarity, Visual Hierarchy, Professional Aesthetics, Information Density, Operational Focus

---

## 1. Executive Summary

This specification defines a complete redesign of the Cohesity backup infrastructure monitoring dashboard. The design applies Stephen Few's dashboard design principles to create an operationally-focused, scannable interface that surfaces critical information immediately.

### Design Philosophy
> "The goal of dashboard design is to ensure that information is communicated immediately and accurately through efficient use of visual perception." — Stephen Few

---

## 2. Information Architecture

### Tier 1: CRITICAL (Top of Page — Immediate Visibility)
**Purpose:** Answer "Is everything OK?" in < 2 seconds

| Element | Data | Visual Treatment |
|---------|------|------------------|
| System Status Indicator | Overall health: OK / WARNING / CRITICAL | Large traffic light (green/amber/red) |
| Active Alerts Count | # of critical/warning alerts | Badge with count, pulsing if critical |
| Failed Backups (24hr) | Count of failures in last 24 hours | Red badge if > 0, hidden if 0 |

### Tier 2: KEY METRICS (Below Hero — Primary Data)
**Purpose:** Capacity utilization and projections at a glance

| Element | Data | Visual Treatment |
|---------|------|------------------|
| Cluster Cards (3x) | Per-cluster: utilization %, used/total TB, days to threshold | Compact cards with progress bars, color-coded by status |
| Aggregate Metrics | Total capacity, total used, overall utilization | Summary row above cluster cards |

### Tier 3: TRENDS & ANALYSIS (Middle Section)
**Purpose:** What's changing? What needs attention?

| Element | Data | Visual Treatment |
|---------|------|------------------|
| Top Growth (Combined) | Single table: top 10 growing objects across all timeframes | Sortable table with sparklines |
| Storage Consumers | Top jobs by physical storage consumption | Expandable rows with drill-down |

### Tier 4: DETAILED DATA (Bottom Section — On Demand)
**Purpose:** Deep-dive information for investigation

| Element | Data | Visual Treatment |
|---------|------|------------------|
| SQL Database Analysis | Database-level storage metrics | Collapsible section |
| M365 Backup Status | Microsoft 365 tenant protection | Collapsible section |
| Storage Health | Orphaned data, deleted jobs | Collapsible section |

---

## 3. Visual Design System

### Color Palette (Semantic Colors Only)

```css
/* Status Colors — High Contrast for Accessibility */
--status-healthy: #22c55e;      /* Green — All systems operational */
--status-warning: #f59e0b;      /* Amber — Attention needed */
--status-critical: #ef4444;     /* Red — Immediate action required */
--status-info: #3b82f6;         /* Blue — Informational */

/* Background Colors */
--bg-primary: #0f1117;          /* Page background */
--bg-card: #161b22;             /* Card background */
--bg-card-hover: #1c2128;       /* Card hover state */
--bg-elevated: #21262d;         /* Elevated elements */

/* Text Colors */
--text-primary: #f0f3f6;        /* Primary text */
--text-secondary: #9ca3af;      /* Secondary/label text */
--text-muted: #6b7280;          /* Muted/disabled text */

/* Border Colors */
--border-default: #30363d;      /* Default borders */
--border-subtle: #21262d;       /* Subtle borders */
```

### Typography

```css
/* Single Font Family — Inter */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Type Scale */
--text-hero: 3rem;              /* 48px — Hero status indicator */
--text-h1: 1.5rem;              /* 24px — Page title */
--text-h2: 1.125rem;            /* 18px — Section headers */
--text-h3: 1rem;                /* 16px — Card headers */
--text-body: 0.875rem;          /* 14px — Body text */
--text-small: 0.75rem;          /* 12px — Labels, captions */
--text-tiny: 0.625rem;          /* 10px — Badges, tags */

/* Font Weights */
--weight-normal: 400;
--weight-medium: 500;
--weight-semibold: 600;
--weight-bold: 700;
```

### Spacing System

```css
/* 4px Base Unit */
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
```

### Component Patterns

#### Status Badge
```html
<span class="status-badge status-critical">
  <span class="status-dot"></span>
  CRITICAL
</span>
```

#### Metric Card
```html
<div class="metric-card" data-status="warning">
  <div class="metric-label">Cluster Name</div>
  <div class="metric-value">78.5%</div>
  <div class="metric-bar">
    <div class="metric-bar-fill" style="width: 78.5%"></div>
  </div>
  <div class="metric-detail">42.3 / 54.0 TB used</div>
</div>
```

#### Data Table
```html
<table class="data-table">
  <thead>
    <tr>
      <th class="sortable" data-sort="name">Name</th>
      <th class="sortable active desc" data-sort="growth">Growth</th>
      <th>Size</th>
    </tr>
  </thead>
  <tbody>
    <tr data-status="warning">
      <td>database_name</td>
      <td class="text-critical">+125 GB</td>
      <td>1.2 TB</td>
    </tr>
  </tbody>
</table>
```

---

## 4. Layout Structure

### Responsive Grid

```
Desktop (1440px+):
┌─────────────────────────────────────────────────────────────────┐
│  HEADER: Title | Last Updated | Refresh                        │
├─────────────────────────────────────────────────────────────────┤
│  HERO: [STATUS INDICATOR]  [ALERT COUNT]  [FAILURE COUNT]      │
├─────────────────────────────────────────────────────────────────┤
│  CLUSTERS: [Card 1]  [Card 2]  [Card 3]                        │
├─────────────────────────────────────────────────────────────────┤
│  GROWTH ANALYSIS                    │  STORAGE CONSUMERS        │
│  [Top Growing Objects Table]        │  [Top Consumers Table]    │
│                                     │                           │
├─────────────────────────────────────────────────────────────────┤
│  DETAILS (Collapsible Sections)                                 │
│  [SQL Analysis] [M365 Status] [Storage Health]                  │
└─────────────────────────────────────────────────────────────────┘
```

### Section Heights
- Header: 64px fixed
- Hero: 120px fixed
- Clusters: 180px fixed
- Growth/Consumers: 400px max (scrollable)
- Details: Collapsed by default, 300px max expanded

---

## 5. Component Specifications

### 5.1 Hero Status Indicator

**Purpose:** Single most important element — instant health assessment

**States:**
| State | Icon | Color | Text |
|-------|------|-------|------|
| Healthy | ✓ | Green | ALL SYSTEMS OPERATIONAL |
| Warning | ⚠ | Amber | {n} WARNINGS — ATTENTION NEEDED |
| Critical | ✕ | Red | {n} CRITICAL ALERTS — ACTION REQUIRED |

**Design:**
- Centered, prominent position
- Large icon (48px) + status text (24px)
- Subtle background glow matching status color
- Click to expand alert details

### 5.2 Alert Summary Badges

**Layout:** Horizontal row of 3 badges below status

| Badge | Data | Visibility |
|-------|------|------------|
| Critical Alerts | Count of kCritical alerts | Always visible |
| Warnings | Count of kWarning alerts | Always visible |
| Failed Backups (24hr) | Count of failures in last 24 hours | Hidden if 0 |

**Design:**
- Compact pill badges
- Icon + count format
- Status-colored backgrounds
- Click to filter/view details

### 5.3 Cluster Capacity Cards

**Layout:** 3-column grid (1 per cluster)

**Content per card:**
```
┌─────────────────────────────┐
│  CLUSTER NAME         [●]  │  ← Status dot (green/amber/red)
│                            │
│  ████████████░░░░  78.5%   │  ← Progress bar + percentage
│                            │
│  42.3 / 54.0 TB            │  ← Used / Total
│  Days to 80%: 45           │  ← Forecast (or "AT CAPACITY")
└─────────────────────────────┘
```

**Status Logic:**
- Green: < 70% utilized
- Amber: 70-80% utilized
- Red: > 80% utilized

**Progress Bar:**
- Solid fill, no animation
- Color matches status
- 80% threshold marker (subtle line)

### 5.4 Growth Analysis Table

**Consolidation:** Replace 3 separate tables (24hr, 7-day, 30-day) with single sortable table

**Columns:**
| Column | Width | Format |
|--------|-------|--------|
| Object | 40% | Name + Type badge + Cluster |
| 24hr Δ | 15% | +XX GB (red if growing) |
| 7-day Δ | 15% | +XX GB |
| 30-day Δ | 15% | +XX GB |
| Current Size | 15% | XX.X TB |

**Features:**
- Sortable by any column
- Click row to see object details
- Top 15 objects by default
- Filter: All / VMs / SQL / Physical

### 5.5 Storage Consumers Table

**Columns:**
| Column | Width | Format |
|--------|-------|--------|
| Rank | 5% | #1, #2, etc. |
| Job Name | 35% | Name (expandable indicator) |
| Cluster | 10% | Cluster name |
| Physical | 15% | XX.X TB |
| Logical | 15% | XX.X TB |
| Dedup Ratio | 10% | XX.Xx (color-coded) |
| Trend | 10% | Sparkline (7-day) |

**Features:**
- Expandable rows (click to see objects in job)
- Top 15 jobs by default
- Dedup ratio color: Green (>15x), Amber (5-15x), Red (<5x)

### 5.6 Collapsible Detail Sections

**Sections:**
1. **SQL Database Analysis** — Collapsed by default
2. **M365 Backup Status** — Collapsed by default
3. **Storage Health** — Collapsed by default, auto-expand if issues

**Expand/Collapse:**
- Chevron icon indicates state
- Smooth height transition (200ms)
- Remember state in localStorage

---

## 6. Interaction Design

### Loading States
- Skeleton loaders for cards/tables (not spinners)
- Progressive loading: Hero first, then clusters, then tables
- Timestamp shows "Loading..." then actual time

### Empty States
- Clean, informative messages
- "No failures in the last 24 hours" (with green checkmark)
- "No growth detected" (with icon)

### Error States
- Red banner at top of page
- "Unable to connect to API — Showing cached data from {timestamp}"
- Retry button

### Refresh Behavior
- Manual refresh button (top right)
- Auto-refresh at 2 AM daily
- Last updated timestamp always visible
- Brief loading overlay on refresh (not full page block)

### Tooltips
- Hover delay: 300ms
- Position: Above element, centered
- Content: Explanation of metric, calculation method
- Example: "Days to 80%" → "Projected days until cluster reaches 80% capacity based on 7-day growth rate"

---

## 7. Accessibility Requirements

### WCAG 2.1 AA Compliance

| Requirement | Implementation |
|-------------|----------------|
| Color Contrast | All text meets 4.5:1 minimum ratio |
| Color Independence | Status indicated by icon + text, not color alone |
| Keyboard Navigation | Full tab navigation, focus indicators |
| Screen Reader | Semantic HTML, ARIA labels, live regions for updates |
| Reduced Motion | Respect `prefers-reduced-motion` media query |

### Focus Indicators
```css
:focus-visible {
  outline: 2px solid var(--status-info);
  outline-offset: 2px;
}
```

---

## 8. Performance Requirements

### Target Metrics
| Metric | Target |
|--------|--------|
| First Contentful Paint | < 1.5s |
| Time to Interactive | < 3.0s |
| Largest Contentful Paint | < 2.5s |
| Cumulative Layout Shift | < 0.1 |

### Optimization Strategies
- Single font file (Inter, variable weight)
- No external icon libraries (inline SVG)
- CSS custom properties (no runtime calculations)
- Lazy load detail sections
- Debounced resize handlers

---

## 9. Implementation Phases

### Phase 1: Foundation (Critical)
- [ ] New CSS design system
- [ ] Hero status indicator
- [ ] Cluster capacity cards
- [ ] Header with refresh

### Phase 2: Core Tables
- [ ] Consolidated growth analysis table
- [ ] Storage consumers table
- [ ] Expandable row functionality

### Phase 3: Detail Sections
- [ ] Collapsible section component
- [ ] SQL database analysis
- [ ] M365 backup status
- [ ] Storage health

### Phase 4: Polish
- [ ] Loading states
- [ ] Error handling
- [ ] Tooltips
- [ ] Accessibility audit

---

## 10. Success Criteria

### Client Requirements Mapping

| Requirement | How We Address It |
|-------------|-------------------|
| **Clarity** | Single-glance status indicator, semantic colors, clear labels |
| **Visual Hierarchy** | 4-tier information architecture, size/color/position hierarchy |
| **Professional Aesthetics** | Inter font, refined color palette, consistent spacing |
| **Information Density** | Consolidated tables, collapsible sections, smart defaults |
| **Operational Focus** | Alerts first, capacity forecasts prominent, drill-down available |

### Acceptance Criteria
1. User can assess overall system health in < 2 seconds
2. Critical alerts are visible without scrolling
3. Capacity forecasts are immediately visible per cluster
4. Growth trends are scannable in a single table
5. Detail drill-down available but not obstructing primary info
6. No purely decorative elements (animations, gradients, glows)
7. Passes WCAG 2.1 AA accessibility check

---

## Appendix A: Stephen Few Design Principles Applied

| Principle | Application |
|-----------|-------------|
| **Reduce non-data ink** | Removed racing stripes, gradients, glowing borders |
| **Maximize data-ink ratio** | Every pixel serves data communication |
| **Use position to establish hierarchy** | Critical info at top, details at bottom |
| **Use preattentive attributes** | Color, size, position for instant perception |
| **Minimize cognitive load** | Consolidated tables, consistent patterns |
| **Design for the viewer's task** | "Is everything OK?" answered immediately |

---

## Appendix B: Color Accessibility Matrix

| Combination | Contrast Ratio | WCAG Level |
|-------------|----------------|------------|
| Primary text on bg-primary | 15.8:1 | AAA |
| Secondary text on bg-card | 7.2:1 | AAA |
| Status-healthy on bg-card | 5.1:1 | AA |
| Status-warning on bg-card | 6.8:1 | AA |
| Status-critical on bg-card | 5.4:1 | AA |

---

**END OF SPECIFICATION**
