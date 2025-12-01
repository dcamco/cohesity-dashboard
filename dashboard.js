        // Configuration
        const API_ENDPOINT = 'http://localhost:3100'; // Express API endpoint
        let capacityChart = null;

        // Initialize dashboard on load
        document.addEventListener('DOMContentLoaded', () => {
            refreshDashboard();

            // Auto-refresh at 2 AM daily
            scheduleAutoRefresh();
        });

        async function askClaudeDesktop() {
            try {
                // Gather current dashboard context
                const summaryElem = document.getElementById('executiveSummary');
                const consumersElem = document.getElementById('consumersStats');
                const lastUpdateElem = document.getElementById('lastUpdate');

                // Build context string
                let context = '=== COHESITY CAPACITY DASHBOARD CONTEXT ===\n\n';
                context += `Last Updated: ${lastUpdateElem?.textContent || 'Unknown'}\n\n`;

                if (summaryElem && summaryElem.textContent.trim()) {
                    context += 'SYSTEM ANALYSIS:\n';
                    context += summaryElem.textContent.trim() + '\n\n';
                }

                if (consumersElem && consumersElem.textContent.trim()) {
                    context += 'STORAGE CONSUMERS:\n';
                    context += consumersElem.textContent.trim() + '\n\n';
                }

                // Get cluster status
                const clustersGrid = document.getElementById('clustersGrid');
                if (clustersGrid) {
                    context += 'CLUSTER STATUS:\n';
                    const clusterCards = clustersGrid.querySelectorAll('.cluster-card');
                    clusterCards.forEach(card => {
                        const text = card.textContent.replace(/\s+/g, ' ').trim();
                        context += text + '\n';
                    });
                    context += '\n';
                }

                context += '=== END CONTEXT ===\n\n';
                context += 'You can now ask Claude AI questions about this data, such as:\n';
                context += '- "Which cluster needs attention first?"\n';
                context += '- "What\'s growing the fastest?"\n';
                context += '- "When should I add more storage?"\n';
                context += '- "Analyze the capacity trends"\n';

                // Copy to clipboard
                await navigator.clipboard.writeText(context);

                // Try to open Claude Desktop (may not work on all systems)
                const claudeUrls = [
                    'claude://new',
                    'claude://',
                    'https://claude.ai/new'
                ];

                let opened = false;
                for (const url of claudeUrls) {
                    try {
                        window.open(url, '_blank');
                        opened = true;
                        break;
                    } catch (e) {
                        continue;
                    }
                }

                // Show success message
                const message = opened
                    ? '✅ Context copied to clipboard!\n\nClaude Desktop should open. Paste the context and ask your question.'
                    : '✅ Context copied to clipboard!\n\nOpen Claude Desktop manually and paste to get started.';

                alert(message);

            } catch (error) {
                console.error('Error preparing Claude context:', error);
                alert('❌ Could not prepare context. Error: ' + error.message);
            }
        }

        // Helper function to format storage size with automatic unit conversion
        function formatStorageSize(sizeGB) {
            if (!sizeGB || sizeGB === 0) return 'N/A';

            // Convert to TB if >= 1000 GB
            if (sizeGB >= 1000) {
                const sizeTB = sizeGB / 1024;
                return sizeTB.toFixed(1) + ' TB';
            }

            return sizeGB.toFixed(1) + ' GB';
        }

        async function refreshDashboard() {
            try {
                document.getElementById('lastUpdate').textContent = 'Loading...';

                // Fetch all data in parallel
                const [capacityData, failuresData, systemAnalysisData, topGrowingData, consumersData, sqlGrowersData, m365Summary, m365TopUsers, m365Failures, storageHealthData] = await Promise.all([
                    fetchCapacityData(),
                    fetchFailures(),
                    fetchSystemAnalysis(),
                    fetchTopGrowingData(),
                    fetchConsumersData(),
                    fetchSQLTopGrowers(),
                    fetchM365Summary().catch(() => ({ tenants: 0, protectedObjects: 0, totalCapacityGB: 0, failedRuns: 0 })),
                    fetchM365TopUsers().catch(() => ({ topUsers: [] })),
                    fetchM365Failures().catch(() => ({ failures: [] })),
                    fetchStorageHealthData().catch(() => ({ summary: {}, deletedJobs: [], clusterStorage: [], staleSnapshots: [] }))
                ]);

                // Update UI
                updateClustersGrid(capacityData);
                updateFailures(failuresData);
                updateSystemAnalysis(systemAnalysisData);
                updateMergedGrowthInsights(topGrowingData, sqlGrowersData);
                updateSQLInsights(sqlGrowersData);
                updateConsumersTable(consumersData);
                updateExecutiveSummary(capacityData);
                updateRecommendations(capacityData);
                updateM365Dashboard(m365Summary, m365TopUsers, m365Failures);
                updateStorageHealth(storageHealthData);

                // Update timestamp
                const now = new Date();
                document.getElementById('lastUpdate').textContent = now.toLocaleString();

                // Save to localStorage for offline viewing
                localStorage.setItem('dashboardData', JSON.stringify({
                    timestamp: now.toISOString(),
                    capacity: capacityData,
                    trends: trendsData,
                    topGrowing: topGrowingData,
                    consumers: consumersData
                }));

            } catch (error) {
                console.error('Error refreshing dashboard:', error);

                // Try to load from localStorage if API fails
                loadFromCache();
            }
        }

        async function fetchCapacityData() {
            // Call your MCP server's analyze_multi_cluster_capacity
            const response = await fetch(`${API_ENDPOINT}/api/capacity`);
            if (!response.ok) throw new Error('Failed to fetch capacity data');
            return await response.json();
        }

        async function fetchTrendsData() {
            // Call your MCP server's get_capacity_trends_historical
            const response = await fetch(`${API_ENDPOINT}/api/trends?days=30`);
            if (!response.ok) throw new Error('Failed to fetch trends data');
            return await response.json();
        }

        async function fetchTopGrowingData() {
            // Fetch data for 1 day, 7 days, and 30 days in parallel
            const [data1day, data7day, data30day] = await Promise.all([
                fetch(`${API_ENDPOINT}/api/top-growing?days=1&limit=20`).then(r => r.json()),
                fetch(`${API_ENDPOINT}/api/top-growing?days=7&limit=20`).then(r => r.json()),
                fetch(`${API_ENDPOINT}/api/top-growing?days=30&limit=20`).then(r => r.json())
            ]);

            return { data1day, data7day, data30day };
        }

        async function fetchConsumersData() {
            const response = await fetch(`${API_ENDPOINT}/api/consumers?limit=15`);
            if (!response.ok) throw new Error('Failed to fetch consumers data');
            return await response.json();
        }

        async function fetchSQLTopGrowers() {
            const response = await fetch(`${API_ENDPOINT}/api/sql-top-growers?topN=5`);
            if (!response.ok) throw new Error('Failed to fetch SQL top growers');
            return await response.json();
        }

        async function fetchSystemAnalysis() {
            const response = await fetch(`${API_ENDPOINT}/api/system-analysis`);
            if (!response.ok) throw new Error('Failed to fetch system analysis');
            return await response.json();
        }

        async function fetchFailures() {
            const response = await fetch(`${API_ENDPOINT}/api/failures?days=7`);
            if (!response.ok) throw new Error('Failed to fetch failures');
            return await response.json();
        }

        // ==================== M365 FUNCTIONS ====================

        async function fetchM365Summary() {
            const response = await fetch(`${API_ENDPOINT}/api/m365-summary`);
            if (!response.ok) throw new Error('Failed to fetch M365 summary');
            return await response.json();
        }

        async function fetchM365TopUsers() {
            const response = await fetch(`${API_ENDPOINT}/api/m365-top-users?topN=10`);
            if (!response.ok) throw new Error('Failed to fetch M365 top users');
            return await response.json();
        }

        async function fetchM365Failures() {
            const response = await fetch(`${API_ENDPOINT}/api/m365-failures?days=7`);
            if (!response.ok) throw new Error('Failed to fetch M365 failures');
            return await response.json();
        }

        async function fetchStorageHealthData() {
            const response = await fetch(`${API_ENDPOINT}/api/storage-health`);
            if (!response.ok) throw new Error('Failed to fetch storage health data');
            return await response.json();
        }

        function updateM365Dashboard(summary, topUsers, failures) {
            const statsElem = document.getElementById('m365Stats');
            const tenantsElem = document.getElementById('m365Tenants');
            const usersElem = document.getElementById('m365Users');
            const capacityElem = document.getElementById('m365Capacity');
            const failuresElem = document.getElementById('m365Failures');
            const failuresTable = document.getElementById('m365FailuresTable');

            // Update summary stats
            tenantsElem.textContent = summary.tenants || 0;
            usersElem.textContent = summary.protectedObjects || 0;
            capacityElem.textContent = `${summary.totalCapacityGB || 0} GB`;
            failuresElem.textContent = summary.failedRuns || 0;

            // Update stats line
            if (summary.failedRuns === 0) {
                statsElem.innerHTML = `<strong style="color: #00ff41;">✓ All M365 backups healthy</strong> - ${summary.tenants} tenants, ${summary.protectedObjects} users protected`;
            } else {
                statsElem.innerHTML = `<strong style="color: #e50000;">${summary.failedRuns}</strong> recent failures | ${summary.tenants} tenants | ${summary.protectedObjects} users protected`;
            }

            // Separate objects by tenant
            const centaurusObjects = [];
            const copperwoodObjects = [];

            if (topUsers.topUsers && topUsers.topUsers.length > 0) {
                topUsers.topUsers.forEach(user => {
                    if (user.tenant === 'centcap.net') {
                        centaurusObjects.push(user);
                    } else if (user.tenant === 'ceflp.com') {
                        copperwoodObjects.push(user);
                    }
                });
            }

            // Update Centaurus section
            const centaurusUsersElem = document.getElementById('centaurusUsers');
            const centaurusCapacityElem = document.getElementById('centaurusCapacity');
            const centaurusProtectedElem = document.getElementById('centaurusProtected');
            const centaurusTable = document.getElementById('centaurusObjectsTable');

            const centaurusTotal = centaurusObjects.find(obj => obj.type === 'Total');
            if (centaurusTotal) {
                centaurusUsersElem.textContent = centaurusTotal.count || 0;
                centaurusCapacityElem.textContent = `${centaurusTotal.sizeGB} GB`;
                centaurusProtectedElem.textContent = centaurusTotal.count || 0;
            }

            centaurusTable.innerHTML = '';
            centaurusObjects.filter(obj => obj.type !== 'Total').forEach(obj => {
                const tr = document.createElement('tr');
                let typeIcon = '';
                if (obj.type === 'Mailbox') typeIcon = '📧';
                else if (obj.type === 'OneDrive') typeIcon = '📁';
                else if (obj.type === 'SharePoint') typeIcon = '🌐';

                tr.innerHTML = `
                    <td class="px-3 py-2 text-xs font-semibold" style="color: #00e5ff;">${typeIcon} ${obj.type}</td>
                    <td class="px-3 py-2 text-xs text-center" style="color: #ffffff;">${obj.count || 0}</td>
                    <td class="px-3 py-2 text-xs text-right font-semibold" style="color: #00e5ff;">${obj.sizeGB} GB</td>
                `;
                centaurusTable.appendChild(tr);
            });

            // Add Total row for Centaurus
            if (centaurusTotal) {
                const totalTr = document.createElement('tr');
                totalTr.style.borderTop = '2px solid #00e5ff';
                totalTr.style.background = 'rgba(0, 229, 255, 0.1)';
                totalTr.innerHTML = `
                    <td class="px-3 py-2 text-xs font-bold" style="color: #00e5ff;">📊 TOTAL</td>
                    <td class="px-3 py-2 text-xs text-center font-bold" style="color: #ffffff;">${centaurusTotal.count}</td>
                    <td class="px-3 py-2 text-xs text-right font-bold" style="color: #00e5ff;">${centaurusTotal.sizeGB} GB</td>
                `;
                centaurusTable.appendChild(totalTr);
            }

            // Update Copperwood section
            const copperwoodUsersElem = document.getElementById('copperwoodUsers');
            const copperwoodCapacityElem = document.getElementById('copperwoodCapacity');
            const copperwoodProtectedElem = document.getElementById('copperwoodProtected');
            const copperwoodTable = document.getElementById('copperwoodObjectsTable');

            const copperwoodTotal = copperwoodObjects.find(obj => obj.type === 'Total');
            if (copperwoodTotal) {
                copperwoodUsersElem.textContent = copperwoodTotal.count || 0;
                copperwoodCapacityElem.textContent = `${copperwoodTotal.sizeGB} GB`;
                copperwoodProtectedElem.textContent = copperwoodTotal.count || 0;
            }

            copperwoodTable.innerHTML = '';
            copperwoodObjects.filter(obj => obj.type !== 'Total').forEach(obj => {
                const tr = document.createElement('tr');
                let typeIcon = '';
                if (obj.type === 'Mailbox') typeIcon = '📧';
                else if (obj.type === 'OneDrive') typeIcon = '📁';
                else if (obj.type === 'SharePoint') typeIcon = '🌐';

                tr.innerHTML = `
                    <td class="px-3 py-2 text-xs font-semibold" style="color: #ffaa00;">${typeIcon} ${obj.type}</td>
                    <td class="px-3 py-2 text-xs text-center" style="color: #ffffff;">${obj.count || 0}</td>
                    <td class="px-3 py-2 text-xs text-right font-semibold" style="color: #ffaa00;">${obj.sizeGB} GB</td>
                `;
                copperwoodTable.appendChild(tr);
            });

            // Add Total row for Copperwood
            if (copperwoodTotal) {
                const totalTr = document.createElement('tr');
                totalTr.style.borderTop = '2px solid #ffaa00';
                totalTr.style.background = 'rgba(255, 170, 0, 0.1)';
                totalTr.innerHTML = `
                    <td class="px-3 py-2 text-xs font-bold" style="color: #ffaa00;">📊 TOTAL</td>
                    <td class="px-3 py-2 text-xs text-center font-bold" style="color: #ffffff;">${copperwoodTotal.count}</td>
                    <td class="px-3 py-2 text-xs text-right font-bold" style="color: #ffaa00;">${copperwoodTotal.sizeGB} GB</td>
                `;
                copperwoodTable.appendChild(totalTr);
            }

            // Update failures table with tenant column
            failuresTable.innerHTML = '';
            if (failures.failures && failures.failures.length > 0) {
                failures.failures.forEach(failure => {
                    const tr = document.createElement('tr');
                    const timeStr = new Date(failure.startTime).toLocaleDateString() + ' ' + new Date(failure.startTime).toLocaleTimeString();

                    // Determine tenant color
                    let tenantDisplay = failure.tenant || 'Unknown';
                    let tenantColor = '#ffffff';
                    if (failure.tenant === 'centcap.net') {
                        tenantDisplay = 'Centaurus';
                        tenantColor = '#00e5ff';
                    } else if (failure.tenant === 'ceflp.com') {
                        tenantDisplay = 'Copperwood';
                        tenantColor = '#ffaa00';
                    }

                    tr.innerHTML = `
                        <td class="px-3 py-2 text-xs font-semibold" style="color: ${tenantColor};">${tenantDisplay}</td>
                        <td class="px-3 py-2 text-xs font-semibold">${failure.protectionGroupName}</td>
                        <td class="px-3 py-2 text-xs" style="color: #888888;">${timeStr}</td>
                        <td class="px-3 py-2 text-xs text-center" style="color: #e50000; font-weight: 700;">${failure.objectsFailedCount || 0}</td>
                    `;
                    failuresTable.appendChild(tr);
                });
            } else {
                failuresTable.innerHTML = '<tr><td colspan="4" class="px-3 py-4 text-center text-xs" style="color: #00ff41;">✓ No recent failures</td></tr>';
            }
        }

        function updateSystemAnalysis(data) {
            const statsElem = document.getElementById('systemAnalysisStats');
            const unprotectedTable = document.getElementById('unprotectedTable');
            const duplicatesTable = document.getElementById('duplicatesTable');

            unprotectedTable.innerHTML = '';
            duplicatesTable.innerHTML = '';

            const unprotected = data.unprotectedResources || [];
            const duplicates = data.duplicateBackups || [];

            // Update stats
            const totalIssues = data.unprotectedCount + data.duplicateCount;
            if (totalIssues === 0) {
                statsElem.innerHTML = '<strong style="color: #51cf66;">✓ No issues detected</strong> - All resources protected, no duplicates found';
            } else {
                statsElem.innerHTML = `<strong style="color: #ffa500;">${data.unprotectedCount}</strong> unprotected resources | <strong style="color: #ff8c00;">${data.duplicateCount}</strong> resources backed up by multiple clusters`;
            }

            // Display unprotected resources
            if (unprotected.length === 0) {
                unprotectedTable.innerHTML = '<tr><td colspan="3" class="px-3 py-3 text-center text-xs text-green-600 font-semibold">✓ No unprotected resources found</td></tr>';
            } else {
                unprotected.forEach(resource => {
                    const tr = document.createElement('tr');
                    tr.className = 'border-b border-yellow-200 hover:bg-yellow-50';
                    const typeDisplay = resource.type.replace('k', '');
                    tr.innerHTML = `
                        <td class="px-3 py-2 text-xs text-gray-800 font-semibold">${resource.name}</td>
                        <td class="px-3 py-2 text-xs text-gray-600">${typeDisplay}</td>
                        <td class="px-3 py-2 text-xs text-gray-600">${resource.cluster}</td>
                    `;
                    unprotectedTable.appendChild(tr);
                });
            }

            // Display duplicate backups
            if (duplicates.length === 0) {
                duplicatesTable.innerHTML = '<tr><td colspan="3" class="px-3 py-3 text-center text-xs text-green-600 font-semibold">✓ No duplicate backups found</td></tr>';
            } else {
                duplicates.forEach(resource => {
                    const tr = document.createElement('tr');
                    tr.className = 'border-b border-orange-200 hover:bg-orange-50';
                    const typeDisplay = (resource.type || 'Unknown').replace('k', '');
                    const jobsList = resource.jobs ? resource.jobs.join('<br>') : 'Unknown';
                    tr.innerHTML = `
                        <td class="px-3 py-2 text-xs text-gray-800 font-semibold">${resource.name || 'Unknown'}</td>
                        <td class="px-3 py-2 text-xs text-gray-600">${typeDisplay}</td>
                        <td class="px-3 py-2 text-xs text-orange-700" style="font-size: 10px;">${jobsList}</td>
                    `;
                    duplicatesTable.appendChild(tr);
                });
            }
        }

        function updateStorageHealth(data) {
            // Update summary cards
            const statsElem = document.getElementById('storageHealthStats');
            const deletedJobsElem = document.getElementById('shDeletedJobs');
            const orphanedSnapsElem = document.getElementById('shOrphanedSnaps');
            const orphanedStorageElem = document.getElementById('shOrphanedStorage');
            const totalUsedElem = document.getElementById('shTotalUsed');
            const dedupeRatioElem = document.getElementById('shDedupeRatio');

            const summary = data.summary || {};

            // Update summary values
            deletedJobsElem.textContent = summary.deletedJobCount || 0;
            orphanedSnapsElem.textContent = summary.orphanedSnapshots || 0;
            orphanedStorageElem.textContent = `${summary.orphanedStorageTB || 0} TB`;
            totalUsedElem.textContent = `${summary.totalUsedTB || 0} TB`;
            dedupeRatioElem.textContent = `${summary.avgDedupeRatio || 1}x`;

            // Update stats line
            const deletedCount = summary.deletedJobCount || 0;
            const orphanedTB = parseFloat(summary.orphanedStorageTB) || 0;

            if (deletedCount === 0) {
                statsElem.innerHTML = '<strong style="color: #00ff41;">✓ No orphaned data detected</strong> - All storage is actively protected';
            } else {
                statsElem.innerHTML = `<strong style="color: #ff6b6b;">${deletedCount}</strong> deleted jobs with retained data | <strong style="color: #ffcc00;">${orphanedTB.toFixed(2)} TB</strong> potentially reclaimable`;
            }

            // Update deleted jobs table
            const deletedJobsTable = document.getElementById('deletedJobsTable');
            deletedJobsTable.innerHTML = '';

            const deletedJobs = data.deletedJobs || [];

            if (deletedJobs.length === 0) {
                deletedJobsTable.innerHTML = '<tr><td colspan="6" class="px-3 py-4 text-center text-xs" style="color: #00ff41;">✓ No deleted jobs with retained snapshots</td></tr>';
            } else {
                deletedJobs.forEach(job => {
                    const tr = document.createElement('tr');
                    tr.className = 'border-b hover:bg-opacity-10 hover:bg-red-500';
                    tr.style.borderColor = 'rgba(255, 107, 107, 0.3)';

                    const storageTB = parseFloat(job.storageTB) || 0;
                    const storageDisplay = storageTB >= 1 ? `${storageTB.toFixed(2)} TB` : `${(storageTB * 1024).toFixed(1)} GB`;

                    tr.innerHTML = `
                        <td class="px-3 py-2 text-xs font-semibold" style="color: #ffffff;">${job.name}</td>
                        <td class="px-3 py-2 text-xs" style="color: #888888;">${job.type}</td>
                        <td class="px-3 py-2 text-xs" style="color: #888888;">${job.cluster}</td>
                        <td class="px-3 py-2 text-xs text-center" style="color: #ff9500;">${job.snapshots}</td>
                        <td class="px-3 py-2 text-xs text-right font-semibold" style="color: #ff6b6b;">${storageDisplay}</td>
                        <td class="px-3 py-2 text-xs text-right" style="color: #888888;">${job.age}</td>
                    `;
                    deletedJobsTable.appendChild(tr);
                });
            }

            // Update cluster storage table
            const clusterStorageTable = document.getElementById('clusterStorageTable');
            clusterStorageTable.innerHTML = '';

            const clusterStorage = data.clusterStorage || [];

            if (clusterStorage.length === 0) {
                clusterStorageTable.innerHTML = '<tr><td colspan="6" class="px-3 py-4 text-center text-xs" style="color: #888888;">No cluster storage data available</td></tr>';
            } else {
                clusterStorage.forEach(cluster => {
                    const tr = document.createElement('tr');
                    tr.className = 'border-b hover:bg-opacity-10 hover:bg-cyan-500';
                    tr.style.borderColor = 'rgba(0, 229, 255, 0.3)';

                    // Determine status color
                    let statusColor = '#00ff41';
                    let statusBg = 'rgba(0, 255, 65, 0.2)';
                    if (cluster.status === 'CRITICAL') {
                        statusColor = '#ff4444';
                        statusBg = 'rgba(255, 68, 68, 0.2)';
                    } else if (cluster.status === 'WARNING') {
                        statusColor = '#ffaa00';
                        statusBg = 'rgba(255, 170, 0, 0.2)';
                    }

                    tr.innerHTML = `
                        <td class="px-3 py-2 text-xs font-semibold" style="color: #00e5ff;">${cluster.name}</td>
                        <td class="px-3 py-2 text-xs text-right" style="color: #ffffff;">${cluster.usedTB} TB</td>
                        <td class="px-3 py-2 text-xs text-right" style="color: #888888;">${cluster.capacityTB} TB</td>
                        <td class="px-3 py-2 text-xs text-right font-semibold" style="color: ${statusColor};">${cluster.usedPct}%</td>
                        <td class="px-3 py-2 text-xs text-right" style="color: #00ff41;">${cluster.dedupRatio}x</td>
                        <td class="px-3 py-2 text-xs text-center">
                            <span style="background: ${statusBg}; color: ${statusColor}; padding: 2px 8px; border-radius: 4px; font-weight: 700; font-size: 0.7rem;">${cluster.status}</span>
                        </td>
                    `;
                    clusterStorageTable.appendChild(tr);
                });
            }

            // Update stale snapshots table
            const staleSnapshotsTable = document.getElementById('staleSnapshotsTable');
            staleSnapshotsTable.innerHTML = '';

            const staleSnapshots = data.staleSnapshots || [];

            if (staleSnapshots.length === 0) {
                staleSnapshotsTable.innerHTML = '<tr><td colspan="5" class="px-3 py-4 text-center text-xs" style="color: #00ff41;">✓ No stale snapshots detected</td></tr>';
            } else {
                staleSnapshots.forEach(snap => {
                    const tr = document.createElement('tr');
                    tr.className = 'border-b hover:bg-opacity-10 hover:bg-yellow-500';
                    tr.style.borderColor = 'rgba(255, 204, 0, 0.3)';
                    tr.innerHTML = `
                        <td class="px-3 py-2 text-xs font-semibold" style="color: #ffffff;">${snap.jobName}</td>
                        <td class="px-3 py-2 text-xs" style="color: #888888;">${snap.cluster}</td>
                        <td class="px-3 py-2 text-xs text-center" style="color: #ffffff;">${snap.totalSnapshots}</td>
                        <td class="px-3 py-2 text-xs text-center font-semibold" style="color: #ffcc00;">${snap.staleSnapshots}</td>
                        <td class="px-3 py-2 text-xs text-right" style="color: #ff9500;">${snap.oldestAge}</td>
                    `;
                    staleSnapshotsTable.appendChild(tr);
                });
            }
        }

        function updateFailures(data) {
            const card = document.getElementById('failuresCard');
            const statsElem = document.getElementById('failuresStats');
            const tbody = document.getElementById('failuresTable');

            tbody.innerHTML = '';

            const failures = data.failures || [];

            if (failures.length === 0) {
                // Hide the card if there are no failures
                card.style.display = 'none';
                return;
            }

            // Show the card
            card.style.display = 'block';

            // Count failures by age
            const last24hr = failures.filter(f => f.hoursAgo <= 24).length;
            const last7days = failures.length;

            statsElem.innerHTML = `<strong style="color: #ff3333;">${last24hr}</strong> failures in last 24 hours | <strong>${last7days}</strong> total in last 7 days`;

            // Display failures
            failures.forEach(failure => {
                const is24hr = failure.hoursAgo <= 24;
                const rowClass = is24hr ? 'bg-red-50 font-bold' : '';
                const timeColor = is24hr ? 'text-red-700 font-bold' : 'text-gray-700';

                const timeStr = failure.hoursAgo < 1 ?
                    `<span class="${timeColor}">⚠ ${Math.round(failure.hoursAgo * 60)}m ago</span>` :
                    failure.hoursAgo < 24 ?
                    `<span class="${timeColor}">⚠ ${failure.hoursAgo}h ago</span>` :
                    `${Math.round(failure.hoursAgo / 24)}d ago`;

                const tr = document.createElement('tr');
                tr.className = `border-b border-gray-200 ${rowClass}`;
                tr.innerHTML = `
                    <td class="px-3 py-2 text-xs">${timeStr}</td>
                    <td class="px-3 py-2 text-xs text-gray-800">${failure.jobName}</td>
                    <td class="px-3 py-2 text-xs text-gray-700">${failure.objectName}</td>
                    <td class="px-3 py-2 text-xs text-gray-600">${failure.cluster}</td>
                    <td class="px-3 py-2 text-xs text-red-600">${failure.error}</td>
                `;
                tbody.appendChild(tr);
            });
        }

        function updateClustersGrid(data) {
            const grid = document.getElementById('clustersGrid');
            grid.innerHTML = '';

            data.clusters.forEach(cluster => {
                const riskClass = cluster.utilization > 80 ? 'status-critical' :
                                 cluster.utilization > 70 ? 'status-warning' : 'status-healthy';

                const borderColor = cluster.utilization > 80 ? '#ff4444' :
                                   cluster.utilization > 70 ? '#ffaa00' : '#00ff88';
                const barColor = borderColor;

                // Status text based on utilization
                let statusText = 'OPTIMAL';
                let statusColor = '#00ff88';
                if (cluster.utilization > 100) {
                    statusText = '⚠ OVER CAPACITY';
                    statusColor = '#ff4444';
                } else if (cluster.utilization > 80) {
                    statusText = 'CRITICAL';
                    statusColor = '#ff4444';
                } else if (cluster.utilization > 70) {
                    statusText = 'MONITOR';
                    statusColor = '#ffaa00';
                }

                const card = `
                    <div class="border-4 p-6" style="border-color: ${borderColor}; background: linear-gradient(135deg, rgba(20, 20, 20, 0.95) 0%, ${borderColor}15 100%); box-shadow: 0 8px 32px ${borderColor}40;">
                        <div class="mb-4" style="background: ${borderColor}20; padding: 12px; border-left: 4px solid ${borderColor}; margin: -24px -24px 16px -24px; padding-left: 20px;">
                            <div style="color: ${borderColor}; font-size: 1.35rem; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; font-family: 'Michroma', sans-serif; text-shadow: 0 0 10px ${borderColor}80;">${cluster.name}</div>
                            <div style="color: ${borderColor}; font-size: 0.70rem; font-weight: 600; letter-spacing: 1px; margin-top: 2px; font-family: 'Rajdhani', sans-serif;">COHESITY CLUSTER</div>
                        </div>

                        <div class="mb-4 text-center">
                            <div style="color: ${borderColor}; font-size: 4.5rem; font-weight: 700; line-height: 1; font-family: 'Orbitron', sans-serif; text-shadow: 0 0 20px ${borderColor}60;">${cluster.utilization.toFixed(1)}%</div>
                            <div style="color: #bbb; font-size: 1rem; margin-top: 8px; font-weight: 600;">${cluster.usedTB.toFixed(0)} / ${(cluster.usedTB / (cluster.utilization / 100)).toFixed(0)} TB USED</div>
                        </div>

                        <div class="w-full mb-4" style="background: rgba(60, 60, 60, 0.8); height: 12px; position: relative; overflow: hidden; border-radius: 6px;">
                            <div style="height: 100%; width: ${Math.min(cluster.utilization, 100)}%; background: linear-gradient(90deg, ${barColor} 0%, ${barColor}cc 100%); box-shadow: 0 0 10px ${barColor}80; border-radius: 6px;"></div>
                        </div>

                        <div class="flex justify-between text-sm mb-1" style="background: rgba(0,0,0,0.3); padding: 8px; border-radius: 4px;">
                            <span style="color: #aaa; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">DAYS TO 80%</span>
                            <span style="color: ${borderColor}; font-weight: 700; font-size: 0.95rem;">${cluster.daysTo80 || statusText}</span>
                        </div>

                        ${cluster.utilization <= 100 ? `
                        <div style="display: none;">
                            <div class="flex justify-between text-sm mb-1">
                                <span style="color: #888; text-transform: uppercase; letter-spacing: 0.5px;">DAILY GROWTH</span>
                                <span style="color: #00ff88; font-weight: 700;">-${cluster.dailyGrowth || '0 GB/day'}</span>
                            </div>
                            <div class="flex justify-between text-sm">
                                <span style="color: #888; text-transform: uppercase; letter-spacing: 0.5px;">MONTHLY GROWTH</span>
                                <span style="color: #00ff88; font-weight: 700;">-${cluster.monthlyGrowth || '0 GB/mo'}</span>
                            </div>
                        </div>
                        ` : `
                        <div class="flex justify-between text-sm" style="background: rgba(0,0,0,0.3); padding: 8px; border-radius: 4px; margin-top: 8px;">
                            <span style="color: #aaa; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">STATUS</span>
                            <span style="color: ${statusColor}; font-weight: 700; font-size: 0.95rem;">${statusText}</span>
                        </div>
                        `}
                    </div>
                `;
                grid.innerHTML += card;
            });
        }

        function updateCapacityChart(data) {
            const ctx = document.getElementById('capacityChart').getContext('2d');

            // Prepare chart data from trends
            const chartData = {
                labels: [],
                datasets: []
            };

            // Group by cluster
            const clusterData = {};
            data.clusters.forEach(clusterItem => {
                const clusterName = clusterItem.cluster;
                if (!clusterData[clusterName]) {
                    clusterData[clusterName] = [];
                }
                (clusterItem.trends || []).forEach(point => {
                    if (!chartData.labels.includes(point.date)) {
                        chartData.labels.push(point.date);
                    }
                    clusterData[clusterName].push({
                        date: point.date,
                        usedTB: point.usedTB
                    });
                });
            });

            // Sort labels chronologically
            chartData.labels.sort();

            // Create dataset per cluster
            const colors = ['#00ffff', '#ff00ff', '#00ff00', '#ffff00'];
            let colorIndex = 0;

            Object.keys(clusterData).forEach(clusterName => {
                const color = colors[colorIndex % colors.length];
                chartData.datasets.push({
                    label: clusterName,
                    data: chartData.labels.map(date => {
                        const point = clusterData[clusterName].find(p => p.date === date);
                        return point ? point.usedTB : null;
                    }),
                    borderColor: color,
                    backgroundColor: color + '30',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true,
                    pointRadius: 5,
                    pointHoverRadius: 8,
                    pointBackgroundColor: color,
                    pointBorderColor: '#0a0e27',
                    pointBorderWidth: 2
                });
                colorIndex++;
            });

            // Destroy existing chart if it exists
            if (capacityChart) {
                capacityChart.destroy();
            }

            // Create new chart
            capacityChart = new Chart(ctx, {
                type: 'line',
                data: chartData,
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top',
                            labels: {
                                color: '#00ffff',
                                font: {
                                    family: 'Orbitron',
                                    size: 12,
                                    weight: 'bold'
                                },
                                padding: 15
                            }
                        },
                        tooltip: {
                            mode: 'index',
                            intersect: false,
                            backgroundColor: 'rgba(10, 14, 39, 0.95)',
                            borderColor: '#00ffff',
                            borderWidth: 2,
                            titleColor: '#00ffff',
                            bodyColor: '#00ffff',
                            titleFont: {
                                family: 'Orbitron',
                                size: 14,
                                weight: 'bold'
                            },
                            bodyFont: {
                                family: 'Share Tech Mono',
                                size: 12
                            }
                        }
                    },
                    scales: {
                        x: {
                            display: true,
                            grid: {
                                color: 'rgba(0, 255, 255, 0.1)',
                                borderColor: '#00ffff'
                            },
                            ticks: {
                                color: '#00ffff',
                                font: {
                                    family: 'Share Tech Mono',
                                    size: 10
                                }
                            },
                            title: {
                                display: true,
                                text: 'TEMPORAL AXIS',
                                color: '#00ffff',
                                font: {
                                    family: 'Orbitron',
                                    size: 12,
                                    weight: 'bold'
                                }
                            }
                        },
                        y: {
                            display: true,
                            min: 0,
                            max: 60,
                            grid: {
                                color: 'rgba(0, 255, 255, 0.1)',
                                borderColor: '#00ffff'
                            },
                            ticks: {
                                color: '#00ffff',
                                font: {
                                    family: 'Share Tech Mono',
                                    size: 10
                                }
                            },
                            title: {
                                display: true,
                                text: 'CAPACITY (TB)',
                                color: '#00ffff',
                                font: {
                                    family: 'Orbitron',
                                    size: 12,
                                    weight: 'bold'
                                }
                            }
                        }
                    }
                }
            });
        }

        function updateMergedGrowthInsights(topGrowingData, sqlGrowersData) {
            const statsElem = document.getElementById('growthInsightsStats');
            const table24hr = document.getElementById('growth24hrTable');
            const table7day = document.getElementById('growth7dayTable');
            const table30day = document.getElementById('growth30dayTable');

            // Clear tables
            table24hr.innerHTML = '';
            table7day.innerHTML = '';
            table30day.innerHTML = '';

            // Helper function to format and populate a table with merged data
            const populateTable = (tbody, generalData, sqlData, topN = 10) => {
                const merged = [];

                // Add general resources
                if (generalData && generalData.topGrowing) {
                    generalData.topGrowing.forEach(obj => {
                        merged.push({
                            name: obj.name,
                            type: 'Resource',
                            cluster: obj.cluster,
                            growthGB: parseFloat(obj.dailyGrowth) || 0,
                            sizeGB: parseFloat(obj.size) || 0
                        });
                    });
                }

                // Add SQL databases
                if (sqlData && sqlData.length > 0) {
                    sqlData.forEach(db => {
                        merged.push({
                            name: db.database.split('/')[1] || db.database,
                            type: 'SQL DB',
                            cluster: db.cluster,
                            growthGB: db.growthGB,
                            sizeGB: db.currentSizeGB
                        });
                    });
                }

                // Sort by growth descending and take top N
                merged.sort((a, b) => b.growthGB - a.growthGB);
                const topItems = merged.slice(0, topN);

                if (topItems.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="3" class="px-2 py-2 text-center text-xs text-gray-500">No growth detected</td></tr>';
                    return;
                }

                topItems.forEach(item => {
                    const growthFormatted = item.growthGB >= 1 ? `${item.growthGB.toFixed(1)} GB` : `${(item.growthGB * 1024).toFixed(0)} MB`;
                    const sizeFormatted = item.sizeGB >= 1000 ? `${(item.sizeGB / 1024).toFixed(1)} TB` : `${item.sizeGB.toFixed(1)} GB`;

                    const typeColor = item.type === 'SQL DB' ? '#00d9ff' : '#888';

                    const tr = document.createElement('tr');
                    tr.className = 'border-b border-gray-200 hover:bg-opacity-5 hover:bg-cyan-500';
                    tr.innerHTML = `
                        <td class="px-2 py-2 text-xs text-gray-800">
                            <div class="font-semibold">${item.name}</div>
                            <div class="text-xxs" style="color: ${typeColor};">${item.type} • ${item.cluster}</div>
                        </td>
                        <td class="px-2 py-2 text-xs text-right font-bold text-red-600">+${growthFormatted}</td>
                        <td class="px-2 py-2 text-xs text-right text-gray-600">${sizeFormatted}</td>
                    `;
                    tbody.appendChild(tr);
                });
            };

            // Populate all three tables
            populateTable(table24hr, topGrowingData.data1day, sqlGrowersData.top1day);
            populateTable(table7day, topGrowingData.data7day, sqlGrowersData.top7day);
            populateTable(table30day, topGrowingData.data30day, sqlGrowersData.top30day);

            // Update stats
            const totalResources = (topGrowingData.data7day?.topGrowing?.length || 0);
            const totalSQL = sqlGrowersData.totalDatabases || 0;
            const activeResources7 = topGrowingData.data7day?.topGrowing?.length || 0;
            const activeResources30 = topGrowingData.data30day?.topGrowing?.length || 0;

            statsElem.innerHTML = `<strong>${totalResources}</strong> resources + <strong>${totalSQL}</strong> SQL databases monitored | Growth detected: <strong>${activeResources7}</strong> (7d) / <strong>${activeResources30}</strong> (30d)`;
        }

        function updateTopGrowingTable(data1day, data7day, data30day) {
            const tbody = document.getElementById('topGrowingTable');
            tbody.innerHTML = '';

            // Use 7-day data as the primary list
            const topGrowing = data7day.topGrowing || [];

            if (topGrowing.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8" class="px-4 py-3 text-center text-gray-500">No growing resources found</td></tr>';
                return;
            }

            // Create maps for quick lookup
            const day1Map = new Map((data1day.topGrowing || []).map(obj => [obj.name + obj.cluster, obj]));
            const day30Map = new Map((data30day.topGrowing || []).map(obj => [obj.name + obj.cluster, obj]));

            topGrowing.forEach((obj, index) => {
                const key = obj.name + obj.cluster;
                const obj30day = day30Map.get(key);

                // Parse daily growth rates (backend returns daily average for each period)
                const dailyGrowth7day = parseFloat(obj.dailyGrowth);
                const dailyGrowth30day = obj30day ? parseFloat(obj30day.dailyGrowth) : 0;

                // Calculate total growth over each period
                const growthDaily = dailyGrowth7day;       // Daily rate from 7-day data
                const growth7day = dailyGrowth7day * 7;    // 7 day total
                const growth30day = dailyGrowth30day * 30; // 30 day total

                // Parse current size
                const currentSizeGB = parseFloat(obj.size) || 0;

                const row = `
                    <tr class="border-b border-gray-200 hover:bg-opacity-5 hover:bg-cyan-500">
                        <td class="px-4 py-3 text-sm font-bold text-gray-700">#${index + 1}</td>
                        <td class="px-4 py-3 text-sm text-gray-800">${obj.name}</td>
                        <td class="px-4 py-3 text-sm text-gray-600">${obj.type}</td>
                        <td class="px-4 py-3 text-sm text-gray-600">${obj.cluster}</td>
                        <td class="px-4 py-3 text-sm text-right font-semibold text-blue-600">${formatStorageSize(growthDaily)}</td>
                        <td class="px-4 py-3 text-sm text-right font-semibold text-blue-600">${formatStorageSize(growth7day)}</td>
                        <td class="px-4 py-3 text-sm text-right font-semibold text-blue-600">${growth30day > 0 ? formatStorageSize(growth30day) : 'N/A'}</td>
                        <td class="px-4 py-3 text-sm text-right text-gray-700">${formatStorageSize(currentSizeGB)}</td>
                    </tr>
                `;
                tbody.innerHTML += row;
            });
        }

        async function toggleJobObjects(jobId, clusterName, rowElement) {
            const detailsRowId = `details-${clusterName}-${jobId}`;
            const existingDetailsRow = document.getElementById(detailsRowId);

            // If details are already shown, hide them
            if (existingDetailsRow) {
                existingDetailsRow.remove();
                rowElement.classList.remove('expanded');
                return;
            }

            // Show loading state
            rowElement.classList.add('expanded');
            const loadingRow = document.createElement('tr');
            loadingRow.id = detailsRowId;
            loadingRow.className = 'bg-gray-100';
            loadingRow.innerHTML = `
                <td colspan="7" class="px-4 py-3 text-sm text-gray-600">
                    <div class="ml-8">⏳ Loading objects...</div>
                </td>
            `;
            rowElement.after(loadingRow);

            try {
                // Fetch job objects from API
                const response = await fetch(`${API_ENDPOINT}/api/job-objects/${clusterName}/${jobId}?topN=10`);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }
                const data = await response.json();

                // Build details HTML
                const objects = data.objects || [];

                let detailsHTML = '<div class="ml-8 my-2">';

                if (objects.length === 0) {
                    detailsHTML += '<p class="text-gray-500 text-sm">No objects found or unable to retrieve details.</p>';
                } else {
                    detailsHTML += `<div class="text-sm mb-2" style="color: #00ffff;"><strong>Top ${objects.length} Objects</strong> (of ${data.totalObjects} total)</div>`;
                    detailsHTML += '<table class="w-full border border-gray-300" style="font-size: 0.85em;">';
                    detailsHTML += `
                        <thead class="bg-gray-200">
                            <tr>
                                <th class="px-3 py-2 text-left border-b">Object Name</th>
                                <th class="px-3 py-2 text-left border-b">Type</th>
                                <th class="px-3 py-2 text-right border-b">Logical</th>
                                <th class="px-3 py-2 text-right border-b">Physical</th>
                                <th class="px-3 py-2 text-left border-b">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                    `;

                    objects.forEach((obj, idx) => {
                        const statusClass = obj.status === 'kSuccess' ? 'status-healthy' :
                                          obj.status === 'kWarning' ? 'status-warning' : 'status-critical';
                        const statusText = obj.status.replace('k', '');

                        // Check if this is a SQL server (name contains .com or looks like a server)
                        const isSQLServer = obj.name.includes('.com') || obj.name.includes('.') ||
                                           obj.type === 'kHost' || obj.type === 'kPhysical';
                        const rowId = `obj-${clusterName}-${jobId}-${idx}`;
                        const cursorClass = isSQLServer ? 'cursor-pointer' : '';
                        const clickHandler = isSQLServer ? `onclick="toggleSQLDatabases('${clusterName}', ${jobId}, '${obj.name.replace(/'/g, "\\'")}', this)"` : '';

                        detailsHTML += `
                            <tr id="${rowId}" class="border-b border-gray-200 hover:bg-opacity-5 hover:bg-cyan-500 ${cursorClass}" ${clickHandler}>
                                <td class="px-3 py-2 text-gray-800">${isSQLServer ? '<span class="expand-icon">▸</span>' : ''}${obj.name}</td>
                                <td class="px-3 py-2 text-gray-600">${obj.type.replace('k', '')}</td>
                                <td class="px-3 py-2 text-right text-gray-700">${obj.logicalGB} GB</td>
                                <td class="px-3 py-2 text-right font-semibold text-blue-600">${obj.physicalGB} GB</td>
                                <td class="px-3 py-2 text-sm ${statusClass}">${statusText}</td>
                            </tr>
                        `;
                    });

                    detailsHTML += '</tbody></table>';
                }
                detailsHTML += '</div>';

                // Update the details row with actual data
                loadingRow.innerHTML = `<td colspan="7" class="px-4 py-2">${detailsHTML}</td>`;

            } catch (error) {
                console.error('Error fetching job objects:', error);
                loadingRow.innerHTML = `
                    <td colspan="7" class="px-4 py-3 text-sm text-red-600">
                        <div class="ml-8">❌ Error loading objects: ${error.message}</div>
                    </td>
                `;
            }
        }

        async function toggleSQLDatabases(clusterName, jobId, serverName, rowElement) {
            const dbRowId = `databases-${clusterName}-${jobId}-${serverName.replace(/\./g, '-')}`;
            const existingDbRow = document.getElementById(dbRowId);

            // Toggle icon
            const icon = rowElement.querySelector('.expand-icon');

            // If databases are already shown, hide them
            if (existingDbRow) {
                existingDbRow.remove();
                if (icon) icon.textContent = '▸';
                rowElement.classList.remove('expanded');
                return;
            }

            // Show loading state
            if (icon) icon.textContent = '▾';
            rowElement.classList.add('expanded');

            const loadingRow = document.createElement('tr');
            loadingRow.id = dbRowId;
            loadingRow.style.background = 'rgba(0, 255, 255, 0.05)';
            loadingRow.innerHTML = `
                <td colspan="5" class="px-3 py-2 text-sm text-gray-600">
                    <div class="ml-12">⏳ Loading databases...</div>
                </td>
            `;
            rowElement.after(loadingRow);

            try {
                // Fetch SQL databases from API
                const response = await fetch(`${API_ENDPOINT}/api/sql-databases/${clusterName}/${jobId}/${encodeURIComponent(serverName)}?topN=20`);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }
                const data = await response.json();

                // Build databases HTML
                const databases = data.databases || [];

                let dbHTML = '<div class="ml-12 my-2">';

                if (databases.length === 0) {
                    dbHTML += '<p class="text-gray-500 text-sm">No databases found.</p>';
                } else {
                    dbHTML += `<div class="text-xs mb-2" style="color: #00ffff;"><strong>${databases.length} Database(s)</strong> on ${serverName}</div>`;
                    dbHTML += '<table class="w-full border border-gray-300" style="font-size: 0.75em;">';
                    dbHTML += `
                        <thead style="background: rgba(0, 255, 255, 0.15);">
                            <tr>
                                <th class="px-2 py-1 text-left border-b">Database Name</th>
                                <th class="px-2 py-1 text-left border-b">Instance</th>
                                <th class="px-2 py-1 text-right border-b">Total Size</th>
                                <th class="px-2 py-1 text-right border-b">24hr Δ</th>
                                <th class="px-2 py-1 text-right border-b">7-day Δ</th>
                                <th class="px-2 py-1 text-right border-b">30-day Δ</th>
                                <th class="px-2 py-1 text-left border-b">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                    `;

                    databases.forEach(db => {
                        const statusClass = db.status === 'kSuccess' ? 'status-healthy' :
                                          db.status === 'kWarning' ? 'status-warning' : 'status-critical';
                        const statusText = db.status.replace('k', '');

                        // Format sizes
                        const totalSize = db.logicalGB != null ? formatStorageSize(db.logicalGB) : 'N/A';

                        // Format growth deltas with +/- signs and colors
                        const formatGrowth = (growthGB) => {
                            if (growthGB == null) return '<span style="color: #888;">-</span>';
                            // Explicitly handle zero or near-zero first
                            if (Math.abs(growthGB) < 0.01) {
                                return '<span style="color: #888;">~0</span>';
                            }
                            const formatted = formatStorageSize(Math.abs(growthGB));
                            if (growthGB > 0) {
                                return `<span style="color: #ff6b6b;">+${formatted}</span>`;
                            } else {
                                return `<span style="color: #51cf66;">-${formatted}</span>`;
                            }
                        };

                        const growth1day = formatGrowth(db.growth1day);
                        const growth7day = formatGrowth(db.growth7day);
                        const growth30day = formatGrowth(db.growth30day);

                        dbHTML += `
                            <tr class="border-b border-gray-200 hover:bg-opacity-5 hover:bg-cyan-500">
                                <td class="px-2 py-1 text-gray-800">${db.name}</td>
                                <td class="px-2 py-1 text-gray-600 text-xs">${db.instance}</td>
                                <td class="px-2 py-1 text-right text-gray-800 font-semibold">${totalSize}</td>
                                <td class="px-2 py-1 text-right text-xs">${growth1day}</td>
                                <td class="px-2 py-1 text-right text-xs">${growth7day}</td>
                                <td class="px-2 py-1 text-right text-xs">${growth30day}</td>
                                <td class="px-2 py-1 text-xs ${statusClass}">${statusText}</td>
                            </tr>
                        `;
                    });

                    dbHTML += '</tbody></table>';
                }
                dbHTML += '</div>';

                // Update the row with actual data
                loadingRow.innerHTML = `<td colspan="5" class="px-3 py-1">${dbHTML}</td>`;

            } catch (error) {
                console.error('Error fetching SQL databases:', error);
                loadingRow.innerHTML = `
                    <td colspan="5" class="px-3 py-2 text-sm text-red-600">
                        <div class="ml-12">❌ Error loading databases: ${error.message}</div>
                    </td>
                `;
                if (icon) icon.textContent = '▸';
            }
        }

        function updateConsumersTable(data) {
            const tbody = document.getElementById('consumersTable');
            const statsElem = document.getElementById('consumersStats');
            tbody.innerHTML = '';

            const topConsumers = data.topConsumers || [];

            if (topConsumers.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" class="px-4 py-3 text-center text-gray-500">No consumer data available</td></tr>';
                statsElem.textContent = 'NO DATA AVAILABLE';
                return;
            }

            // Update stats summary
            const summary = data.summary;
            statsElem.innerHTML = `TOTAL: <strong>${summary.totalStorageConsumedTB} TB</strong> physical / <strong>${summary.totalLogicalTB} TB</strong> logical across <strong>${summary.totalJobs}</strong> jobs (<strong>${summary.overallDedupRatio}x</strong> dedup)`;

            // Populate table
            topConsumers.forEach((consumer, index) => {
                const dedupBadge = consumer.dedupRatio >= 20 ? 'status-healthy' :
                                  consumer.dedupRatio >= 10 ? 'status-warning' : 'status-critical';

                const tr = document.createElement('tr');
                tr.className = 'border-b border-gray-200 hover:bg-opacity-5 hover:bg-cyan-500 cursor-pointer';
                tr.setAttribute('data-job-id', consumer.id);
                tr.setAttribute('data-cluster', consumer.clusterName);
                tr.style.transition = 'background-color 0.2s';

                tr.innerHTML = `
                    <td class="px-4 py-3 text-sm font-bold text-gray-700">
                        <span class="expand-icon">▸</span> #${index + 1}
                    </td>
                    <td class="px-4 py-3 text-sm text-gray-800"><strong>${consumer.name}</strong></td>
                    <td class="px-4 py-3 text-sm text-gray-600">${consumer.clusterName}</td>
                    <td class="px-4 py-3 text-sm text-right font-semibold text-blue-600">${consumer.storageConsumedTB} TB</td>
                    <td class="px-4 py-3 text-sm text-right text-gray-700">${consumer.logicalSizeTB} TB</td>
                    <td class="px-4 py-3 text-sm text-right font-semibold ${dedupBadge}">${consumer.dedupRatio}x</td>
                    <td class="px-4 py-3 text-sm text-right text-gray-600">${consumer.numFiles.toLocaleString()}</td>
                `;

                // Add click handler
                tr.addEventListener('click', function() {
                    const jobId = this.getAttribute('data-job-id');
                    const cluster = this.getAttribute('data-cluster');
                    const icon = this.querySelector('.expand-icon');

                    if (this.classList.contains('expanded')) {
                        icon.textContent = '▸';
                    } else {
                        icon.textContent = '▾';
                    }

                    toggleJobObjects(jobId, cluster, this);
                });

                tbody.appendChild(tr);
            });
        }

        function updateSQLInsights(data) {
            const statsElem = document.getElementById('sqlInsightsStats');
            const table24hr = document.getElementById('sql24hrTable');
            const table7day = document.getElementById('sql7dayTable');
            const table30day = document.getElementById('sql30dayTable');

            // Clear tables
            table24hr.innerHTML = '';
            table7day.innerHTML = '';
            table30day.innerHTML = '';

            // Update stats
            const total = data.totalDatabases || 0;
            const count24 = data.top1day?.length || 0;
            const count7 = data.top7day?.length || 0;
            const count30 = data.top30day?.length || 0;
            statsElem.innerHTML = `<strong>${total}</strong> databases tracked | Active growers: <strong>${count24}</strong> (24h) / <strong>${count7}</strong> (7d) / <strong>${count30}</strong> (30d)`;

            // Helper function to populate a table
            const populateTable = (tbody, databases) => {
                if (!databases || databases.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="3" class="px-2 py-2 text-center text-xs text-gray-500">No growth detected</td></tr>';
                    return;
                }

                databases.forEach(db => {
                    const growthFormatted = db.growthGB >= 1 ? `${db.growthGB.toFixed(1)} GB` : `${(db.growthGB * 1024).toFixed(0)} MB`;
                    const sizeFormatted = db.currentSizeGB >= 1000 ? `${(db.currentSizeGB / 1024).toFixed(1)} TB` : `${db.currentSizeGB.toFixed(1)} GB`;

                    const tr = document.createElement('tr');
                    tr.className = 'border-b border-gray-200 hover:bg-opacity-5 hover:bg-cyan-500';
                    tr.innerHTML = `
                        <td class="px-2 py-2 text-xs text-gray-800">
                            <div class="font-semibold">${db.database.split('/')[1] || db.database}</div>
                            <div class="text-gray-500 text-xxs">${db.cluster}</div>
                        </td>
                        <td class="px-2 py-2 text-xs text-right font-bold text-red-600">+${growthFormatted}</td>
                        <td class="px-2 py-2 text-xs text-right text-gray-600">${sizeFormatted}</td>
                    `;
                    tbody.appendChild(tr);
                });
            };

            // Populate all three tables
            populateTable(table24hr, data.top1day);
            populateTable(table7day, data.top7day);
            populateTable(table30day, data.top30day);
        }

        function updateExecutiveSummary(data) {
            const elem = document.getElementById('executiveSummary');

            const summary = `
                <p class="mb-3">
                    <strong>Overall Status:</strong>
                    Managing <strong>${data.summary.totalClusters} clusters</strong> with
                    <strong>${data.summary.aggregateUsedTB.toFixed(1)} TB</strong> of
                    <strong>${data.summary.aggregateCapacityTB.toFixed(1)} TB</strong> used
                    (<strong>${data.summary.aggregatePercentUsed.toFixed(1)}%</strong> utilization).
                </p>
                ${data.summary.criticalClusters > 0 ? `
                    <p class="mb-3 text-red-600 font-semibold">
                        ⚠️ <strong>${data.summary.criticalClusters} cluster(s)</strong> require immediate attention due to high utilization.
                    </p>
                ` : ''}
                ${data.hottestCluster ? `
                    <p class="mb-3">
                        <strong>Hottest Cluster:</strong>
                        ${data.hottestCluster.clusterName} at <strong>${data.hottestCluster.current.utilizationPct.toFixed(1)}%</strong>
                        capacity${data.hottestCluster.forecast.daysTo80Percent ? `, projected to reach 80% in <strong>${data.hottestCluster.forecast.daysTo80Percent} days</strong>` : ''}.
                    </p>
                ` : ''}
                <p>
                    <strong>Environment Health:</strong>
                    ${data.summary.criticalClusters === 0 ?
                        '🟢 All clusters operating within normal parameters.' :
                        '🔴 Capacity planning action required for flagged clusters.'}
                </p>
            `;

            elem.innerHTML = summary;
        }

        function updateRecommendations(data) {
            const list = document.getElementById('recommendationsList');
            list.innerHTML = '';

            data.recommendations.forEach(rec => {
                const li = document.createElement('li');
                li.className = 'flex items-start space-x-3';
                li.style.cssText = 'color: #00ffff; padding: 8px; background: rgba(0, 255, 255, 0.05); border-left: 3px solid #ff00ff; margin-bottom: 8px;';
                li.innerHTML = `
                    <span style="color: #ff00ff; font-size: 1.2rem; text-shadow: 0 0 10px #ff00ff;">▸</span>
                    <span style="font-family: Share Tech Mono; letter-spacing: 0.5px;">${rec}</span>
                `;
                list.appendChild(li);
            });

            if (data.recommendations.length === 0) {
                list.innerHTML = '<li style="color: #00ff00; text-align: center; padding: 20px;">✓ ALL SYSTEMS OPTIMAL // NO ACTION REQUIRED</li>';
            }
        }

        function calculateFutureDate(days) {
            const date = new Date();
            date.setDate(date.getDate() + days);
            return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        }

        function scheduleAutoRefresh() {
            // Calculate time until 2 AM
            const now = new Date();
            const next2AM = new Date();
            next2AM.setHours(2, 0, 0, 0);

            if (now > next2AM) {
                // If past 2 AM today, schedule for 2 AM tomorrow
                next2AM.setDate(next2AM.getDate() + 1);
            }

            const timeUntil2AM = next2AM - now;

            console.log(`Next auto-refresh scheduled for: ${next2AM.toLocaleString()}`);

            setTimeout(() => {
                refreshDashboard();
                // Schedule next refresh (24 hours)
                setInterval(refreshDashboard, 24 * 60 * 60 * 1000);
            }, timeUntil2AM);
        }

        function loadFromCache() {
            const cached = localStorage.getItem('dashboardData');
            if (cached) {
                const data = JSON.parse(cached);
                document.getElementById('lastUpdate').textContent =
                    new Date(data.timestamp).toLocaleString() + ' (cached)';

                updateClustersGrid(data.capacity);
                updateCapacityChart(data.trends);
                // For cached data, show 7-day data only (or create dummy structure)
                if (data.topGrowing) {
                    const dummyData = { topGrowing: [] };
                    updateTopGrowingTable(dummyData, data.topGrowing, dummyData);
                }
                if (data.consumers) {
                    updateConsumersTable(data.consumers);
                }
                updateExecutiveSummary(data.capacity);
                updateRecommendations(data.capacity);
            } else {
                document.getElementById('lastUpdate').textContent = 'No cached data available';
            }
        }