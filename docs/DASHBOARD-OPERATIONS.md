# Dashboard Operations Guide

## Quick Commands

### Service Management (Windows Service via NSSM)
```powershell
# Check status
Get-Service CohesityDashboard

# Start/Stop/Restart
Start-Service CohesityDashboard
Stop-Service CohesityDashboard
Restart-Service CohesityDashboard

# Or use the management script
.\Scripts\Manage-DashboardService.ps1 -Action Status
.\Scripts\Manage-DashboardService.ps1 -Action Start
.\Scripts\Manage-DashboardService.ps1 -Action Stop
.\Scripts\Manage-DashboardService.ps1 -Action Restart
.\Scripts\Manage-DashboardService.ps1 -Action Health
```

### Access Dashboard
- **URL**: http://localhost:3000
- **API Endpoints**: http://localhost:3000/api/*
- **Health Check**: http://localhost:3000/health

### View Logs
```powershell
Get-Content C:\Claude\Projects\Cohesity\Logs\dashboard.log -Tail 50
```

## Maintenance Mode

Maintenance mode prevents the background monitor from auto-restarting the dashboard, allowing you to safely stop it for updates or troubleshooting.

### Enable Maintenance Mode
```powershell
.\Scripts\Enable-Maintenance.ps1
```

Now you can safely stop the dashboard:
```powershell
pm2 stop cohesity-dashboard
# or
pm2 delete cohesity-dashboard
```

### Disable Maintenance Mode
```powershell
.\Scripts\Disable-Maintenance.ps1
```

The monitor will resume auto-restart. If the dashboard is stopped, it will restart within 60 seconds.

### Check Maintenance Status
```powershell
.\Scripts\Check-Maintenance.ps1
```

Shows whether maintenance mode is enabled and the current dashboard status.

## What Caused the Downtime?

Based on the investigation:

1. **PM2 daemon was restarted** - The PM2 logs show a new daemon started on 2025-11-21 at 09:47:39
2. **No saved process list** - When PM2 restarted, there was no saved process list to resurrect
3. **The application was not configured to auto-start** on system boot or PM2 restart

### Root Cause
- System reboot or PM2 daemon restart cleared all running processes
- Without `pm2 save` or auto-start configuration, processes don't come back

## Prevention Measures Implemented

### 1. PM2 Auto-Save ✓
The application is now saved in PM2's process dump:
```powershell
pm2 save  # Already executed
pm2 set pm2:autodump true  # Automatic saving enabled
```

### 2. Auto-Restart on Crashes ✓
PM2 configuration includes:
- `autorestart: true` - Automatically restart if the process crashes
- `autostart: true` - Start process when PM2 starts

### 3. Windows Auto-Start Scripts
Three PowerShell scripts have been created:

#### **Start-Dashboard.ps1**
- Intelligently starts or restarts the dashboard
- Checks if already running
- Verifies HTTP connectivity
- Location: `Scripts\Start-Dashboard.ps1`

#### **Monitor-Dashboard.ps1**
- Continuously monitors dashboard health
- Checks every 60 seconds
- Auto-restarts if unresponsive
- Logs all activities
- Location: `Scripts\Monitor-Dashboard.ps1`

Usage:
```powershell
.\Scripts\Monitor-Dashboard.ps1
# Leave running in background to ensure 24/7 availability
```

#### **Install-DashboardService.ps1** (Requires Admin)
- Creates a Windows Scheduled Task
- Starts dashboard on system boot
- Starts dashboard on user login
- Location: `Scripts\Install-DashboardService.ps1`

Usage:
```powershell
# Run PowerShell as Administrator
.\Scripts\Install-DashboardService.ps1
```

## Recommended Setup for Maximum Availability

### Option 1: Windows Scheduled Task (Recommended)
1. Run PowerShell as Administrator
2. Execute: `.\Scripts\Install-DashboardService.ps1`
3. Dashboard will automatically start on boot and login

### Option 2: Manual Monitoring
1. Run: `.\Scripts\Monitor-Dashboard.ps1`
2. Leave the PowerShell window open (minimize it)
3. The monitor will keep the dashboard running 24/7

### Option 3: PM2 Resurrection (Current Setup)
- PM2 will automatically restart the process if it crashes
- Run `pm2 save` after any configuration changes
- Note: Requires manual start after system reboot

## Troubleshooting

### Dashboard Not Starting
```powershell
# Check PM2 status
pm2 status

# View logs
pm2 logs cohesity-dashboard --lines 50

# Force restart
pm2 delete cohesity-dashboard
.\Scripts\Start-Dashboard.ps1
```

### Check if Port 3100 is in Use
```powershell
netstat -ano | findstr :3100
```

### PM2 Issues
```powershell
# Restart PM2 daemon
pm2 kill
pm2 resurrect

# If that doesn't work
pm2 kill
.\Scripts\Start-Dashboard.ps1
```

### View Scheduled Task Status
```powershell
Get-ScheduledTask -TaskName "Cohesity-Dashboard-AutoStart"
Get-ScheduledTaskInfo -TaskName "Cohesity-Dashboard-AutoStart"
```

## Monitoring and Logs

### PM2 Logs
```powershell
# Tail logs in real-time
pm2 logs cohesity-dashboard

# View last 100 lines
pm2 logs cohesity-dashboard --lines 100

# Error logs only
pm2 logs cohesity-dashboard --err

# Out logs only
pm2 logs cohesity-dashboard --out
```

### Log File Locations
- PM2 Output: `H:\.pm2\logs\cohesity-dashboard-out.log`
- PM2 Error: `H:\.pm2\logs\cohesity-dashboard-error.log`
- PM2 System: `H:\.pm2\pm2.log`

## Performance Monitoring

```powershell
# Real-time monitoring
pm2 monit

# Detailed process info
pm2 show cohesity-dashboard

# Process metrics
pm2 describe cohesity-dashboard
```

## Known Issues

### wmic ENOENT Errors
The PM2 logs show repeated "spawn wmic ENOENT" errors. This is a PM2 issue on Windows where it can't find the `wmic` command for CPU/memory monitoring. This doesn't affect the dashboard's functionality, only PM2's ability to display CPU/memory metrics in `pm2 status`.

**Impact**: Low - Does not affect dashboard operation
**Fix**: Can be ignored, or configure Windows PATH to include wmic location

## Backup and Recovery

### Save Current Configuration
```powershell
pm2 save
```

### Restore from Saved Configuration
```powershell
pm2 resurrect
```

### Full Reset
```powershell
pm2 kill
pm2 delete all
.\Scripts\Start-Dashboard.ps1
```
