// Dashboard Logic

document.addEventListener('DOMContentLoaded', () => {
    Theme.init();
    
    let currentUser = Auth.getCurrentUser();
    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }

    // Apply custom logo if stored in localStorage
    function applyLogo() {
        const savedLogo = localStorage.getItem('taskmanager_logo');
        if (savedLogo) {
            // Target sidebar header logo
            const sbLogo = document.getElementById('sidebarLogoContainer');
            if (sbLogo) {
                sbLogo.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <img src="${savedLogo}" style="width: 38px; height: 38px; object-fit: contain; border-radius: 6px;" class="custom-logo" alt="Logo">
                        <div>
                            <div class="logo-title" style="font-size: 15px;">KPA & Co.</div>
                            <div class="logo-sub" style="font-size: 9px;">Team Tracker</div>
                        </div>
                    </div>
                `;
            }
            
            // Target login page logo (if on login page)
            const loginLogo = document.querySelector('.login-header div');
            if (loginLogo) {
                const svg = loginLogo.querySelector('svg');
                if (svg) {
                    const img = document.createElement('img');
                    img.src = savedLogo;
                    img.style.width = '50px';
                    img.style.height = '50px';
                    img.style.objectFit = 'contain';
                    img.style.borderRadius = '8px';
                    img.className = 'custom-logo';
                    svg.replaceWith(img);
                } else {
                    const img = loginLogo.querySelector('.custom-logo');
                    if (img) img.src = savedLogo;
                }
            }
        }
    }
    applyLogo();

    // Setup User Profile UI
    function updateHeaderProfile() {
        const fullUser = UserDB.getById(currentUser.id);
        const nameNode = document.getElementById('userName');
        if (nameNode) nameNode.textContent = fullUser.name;
        const roleNode = document.getElementById('userRole');
        if (roleNode) roleNode.textContent = ROLE_LABELS[fullUser.role] || fullUser.role;
        const avNode = document.getElementById('userAvatar');
        if (avNode) avNode.src = fullUser.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullUser.name)}&background=random&color=fff`;

        // Update sidebar user details
        const sbName = document.getElementById('userSidebarName');
        const sbRole = document.getElementById('userSidebarRole');
        const sbAv = document.getElementById('userSidebarAvatar');
        if (sbName) sbName.textContent = fullUser.name;
        if (sbRole) sbRole.textContent = ROLE_LABELS[fullUser.role] || fullUser.role;
        if (sbAv) {
            sbAv.textContent = fullUser.name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);
        }
    }
    updateHeaderProfile();

    // Live clock timer
    function updateClock() {
        const clockNode = document.getElementById('topbarClock');
        if (clockNode) {
            clockNode.textContent = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
        }
    }
    setInterval(updateClock, 1000);
    updateClock();

    // Sidebar overdue badges updater
    function updateSidebarBadges() {
        const tasks = TaskDB.getAll();
        const now = new Date();
        now.setHours(0,0,0,0);
        
        const overdueWork = tasks.filter(t => t.status !== 'completed' && new Date(t.deadline) < now).length;
        const overdueBills = tasks.filter(t => t.paymentStatus === 'Pending' && new Date(t.deadline) < now).length;
        
        const overdueNode = document.getElementById('nb-overdue');
        if (overdueNode) overdueNode.textContent = overdueWork;

        const alertsNode = document.getElementById('nb-alerts');
        if (alertsNode) alertsNode.textContent = overdueWork + overdueBills;
    }
    updateSidebarBadges();

    // Role-based Access Control
    if (currentUser.role !== 'admin' && currentUser.role !== 'sub-admin') {
        document.querySelectorAll('.admin-only').forEach(el => el.classList.add('hidden'));
    }

    // Theme Toggle
    document.getElementById('themeToggle').addEventListener('click', () => {
        Theme.toggle();
        renderCharts(); // Re-render charts for theme colors
    });

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', () => Auth.logout());

    // Navigation
    const navLinks = document.querySelectorAll('.nav-links li');
    const views = document.querySelectorAll('.view-section');
    const viewTitle = document.getElementById('viewTitle');
    const viewSubtitle = document.getElementById('viewSubtitle');

    const PAGE_META = {
        'overview': ['Team Dashboard', 'Live summary — work, billing & team health'],
        'performance': ['Team Performance', 'Individual workload, leaderboard & billing stats'],
        'tasks': ['Work Items', 'All compliance matters with live status'],
        'workflow': ['Task Work Flow', 'Interactive compliance status board'],
        'deadlines': ['Deadline Tracker', 'Overdue & upcoming matters'],
        'alerts': ['Alerts & Health Scorecard', 'Issues requiring immediate attention'],
        'activity': ['Activity Log', 'Chronological audit trail of all team actions'],
        'team': ['Team Directory', 'Full profile details & CA department structure']
    };

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            const targetView = link.getAttribute('data-view');
            views.forEach(view => view.classList.add('hidden'));
            document.getElementById(`view-${targetView}`).classList.remove('hidden');
            
            const meta = PAGE_META[targetView] || [link.textContent.trim(), ''];
            viewTitle.textContent = meta[0];
            if (viewSubtitle) viewSubtitle.textContent = meta[1];

            updateSidebarBadges();

            if (targetView === 'overview') renderOverview();
            if (targetView === 'performance') renderPerformance();
            if (targetView === 'deadlines') renderDeadlines();
            if (targetView === 'alerts') renderAlerts();
            if (targetView === 'activity') renderActivity();
            if (targetView === 'team') renderDashboard(); 
            if (targetView === 'workflow') renderKanban();
            if (targetView === 'tasks') renderDashboard();
        });
    });

    // Task Modal Logic
    const taskModal = document.getElementById('taskModal');
    const openTaskModalBtns = document.querySelectorAll('.openTaskModalBtn');
    const closeTaskModal = document.getElementById('closeTaskModal');
    const taskForm = document.getElementById('taskForm');

    openTaskModalBtns.forEach(btn => btn.addEventListener('click', () => {
        document.getElementById('taskModalTitle').textContent = 'Create New Task';
        taskForm.reset();
        document.getElementById('taskId').value = '';
        populateAssignees();
        taskModal.classList.add('active');
    }));

    closeTaskModal.addEventListener('click', () => taskModal.classList.remove('active'));

    function populateAssignees() {
        const select = document.getElementById('taskAssignee');
        select.innerHTML = '';
        const users = UserDB.getAll();
        const currentUserLevel = HIERARCHY[currentUser.role] || 99;
        const currentFullUser = UserDB.getById(currentUser.id);

        let selectableUsers = users;
        
        if (currentUser.role !== 'admin' && currentUser.role !== 'sub-admin') {
            selectableUsers = users.filter(u => {
                if (u.id === currentUser.id) return true; // self assign
                const uLevel = HIERARCHY[u.role] || 99;
                return uLevel > currentUserLevel && u.department === currentFullUser.department;
            });
        }

        if (selectableUsers.length === 0) {
            const opt = document.createElement('option');
            opt.value = "";
            opt.textContent = "No subordinates available";
            select.appendChild(opt);
            return;
        }

        selectableUsers.forEach(u => {
            const opt = document.createElement('option');
            opt.value = u.id;
            opt.textContent = `${u.name} (${ROLE_LABELS[u.role] || u.role})`;
            select.appendChild(opt);
        });
    }

    // Handle Task Submit
    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const assignee = document.getElementById('taskAssignee').value;
        if (!assignee) {
            alert('Please select a valid assignee.');
            return;
        }

        const tId = document.getElementById('taskId').value;
        const taskData = {
            title: document.getElementById('taskTitle').value,
            description: document.getElementById('taskDesc').value,
            assignee: assignee,
            priority: document.getElementById('taskPriority').value,
            deadline: document.getElementById('taskDeadline').value,
            status: document.getElementById('taskStatus').value,
            clientContact: document.getElementById('taskClientContact').value,
            billing: document.getElementById('taskBilling').value,
            paymentStatus: document.getElementById('taskPayment').value,
            remarks: document.getElementById('taskRemarks').value,
            createdBy: currentUser.id
        };

        if (tId) {
            taskData.id = tId;
            TaskDB.update(taskData);
            ActivityDB.log(currentUser.id, 'Updated Task', taskData.title);
        } else {
            const newTask = TaskDB.add(taskData);
            ActivityDB.log(currentUser.id, 'Created Task', newTask.title);
        }
        
        taskModal.classList.remove('active');
        renderDashboard();
        renderKanban();
        renderOverview();
    });

    // Profile Modal Logic
    const profileModal = document.getElementById('profileModal');
    const closeProfileModal = document.getElementById('closeProfileModal');
    const profileForm = document.getElementById('profileForm');

    document.getElementById('userName').addEventListener('click', openProfileModal);
    document.getElementById('userAvatar').addEventListener('click', openProfileModal);

    function openProfileModal() {
        const fullUser = UserDB.getById(currentUser.id);
        document.getElementById('profName').value = fullUser.name;
        document.getElementById('profDept').value = fullUser.department || '';
        document.getElementById('profPhone').value = fullUser.phone || '';
        document.getElementById('profEmail').value = fullUser.email || '';
        document.getElementById('profPhoto').value = fullUser.photo && !fullUser.photo.includes('ui-avatars.com') ? fullUser.photo : '';
        document.getElementById('profPassword').value = '';

        // Show company logo upload only for admin/sub-admin
        const logoSection = document.getElementById('logoUploadSection');
        if (logoSection) {
            if (currentUser.role === 'admin' || currentUser.role === 'sub-admin') {
                logoSection.classList.remove('hidden');
            } else {
                logoSection.classList.add('hidden');
            }
        }

        profileModal.classList.add('active');
    }

    closeProfileModal.addEventListener('click', () => profileModal.classList.remove('active'));

    profileForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const fullUser = UserDB.getById(currentUser.id);
        fullUser.name = document.getElementById('profName').value;
        fullUser.department = document.getElementById('profDept').value;
        fullUser.phone = document.getElementById('profPhone').value;
        fullUser.email = document.getElementById('profEmail').value;
        
        const photoUrl = document.getElementById('profPhoto').value;
        if (photoUrl.trim() !== '') {
            fullUser.photo = photoUrl;
        } else {
            fullUser.photo = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullUser.name)}&background=random&color=fff`;
        }

        const newPass = document.getElementById('profPassword').value;
        if (newPass.trim() !== '') {
            fullUser.password = newPass;
        }

        // Handle logo upload if present (admin/sub-admin)
        const logoFileInput = document.getElementById('compLogoFile');
        if (logoFileInput && logoFileInput.files && logoFileInput.files[0]) {
            const file = logoFileInput.files[0];
            const reader = new FileReader();
            reader.onload = function(evt) {
                localStorage.setItem('taskmanager_logo', evt.target.result);
                applyLogo();
            };
            reader.readAsDataURL(file);
        }

        UserDB.update(fullUser);
        
        currentUser = Auth.getCurrentUser();
        updateHeaderProfile();
        
        profileModal.classList.remove('active');
        alert('Profile updated successfully!');
        renderDashboard();
        renderKanban();
    });

    // Team Creation Modal Logic (Admin only)
    const teamModal = document.getElementById('teamModal');
    const openTeamModalBtn = document.getElementById('openTeamModalBtn');
    const closeTeamModal = document.getElementById('closeTeamModal');
    const teamForm = document.getElementById('teamForm');

    if (openTeamModalBtn) {
        openTeamModalBtn.addEventListener('click', () => {
            teamForm.reset();
            teamModal.classList.add('active');
        });
    }

    if (closeTeamModal) {
        closeTeamModal.addEventListener('click', () => teamModal.classList.remove('active'));
    }

    if (teamForm) {
        teamForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const photoInput = document.getElementById('teamPhoto').value;
            const newUser = {
                name: document.getElementById('teamName').value,
                username: document.getElementById('teamUsername').value,
                password: document.getElementById('teamPassword').value,
                role: document.getElementById('teamRole').value,
                department: document.getElementById('teamDept').value,
                phone: document.getElementById('teamPhone').value,
                email: document.getElementById('teamEmail').value,
                photo: photoInput || null
            };
            
            if (UserDB.getByUsername(newUser.username)) {
                alert('Username already exists!');
                return;
            }

            UserDB.add(newUser);
            teamModal.classList.remove('active');
            alert('Team member added successfully!');
            renderDashboard();
        });
    }

    function openEditTaskModal(tId) {
        const tasks = TaskDB.getAll();
        const users = UserDB.getAll();
        const t = tasks.find(x => x.id === tId);
        if(t) {
            document.getElementById('taskModalTitle').textContent = 'Edit Task';
            document.getElementById('taskId').value = t.id;
            document.getElementById('taskTitle').value = t.title;
            document.getElementById('taskDesc').value = t.description;
            
            populateAssignees();
            
            const assigneeSelect = document.getElementById('taskAssignee');
            if (!Array.from(assigneeSelect.options).some(opt => opt.value === t.assignee)) {
                const originalAssignee = users.find(u => u.id === t.assignee);
                if (originalAssignee) {
                    const opt = document.createElement('option');
                    opt.value = originalAssignee.id;
                    opt.textContent = `${originalAssignee.name} (${ROLE_LABELS[originalAssignee.role] || originalAssignee.role}) - Current`;
                    assigneeSelect.appendChild(opt);
                }
            }

            assigneeSelect.value = t.assignee;
            document.getElementById('taskPriority').value = t.priority;
            document.getElementById('taskDeadline').value = t.deadline;
            document.getElementById('taskStatus').value = t.status;
            document.getElementById('taskClientContact').value = t.clientContact || '';
            document.getElementById('taskBilling').value = t.billing || '';
            document.getElementById('taskPayment').value = t.paymentStatus || 'N/A';
            document.getElementById('taskRemarks').value = t.remarks || '';
            taskModal.classList.add('active');
        }
    }

    function getVisibleTasks() {
        const tasks = TaskDB.getAll();
        if (currentUser.role === 'admin') return tasks;
        return tasks.filter(t => t.assignee === currentUser.id || t.createdBy === currentUser.id);
    }

    // Render Kanban Board
    function renderKanban() {
        const tasks = getVisibleTasks();
        const users = UserDB.getAll();

        const cols = {
            'pending': { el: document.querySelector('#kanban-pending .kanban-cards'), countEl: document.getElementById('count-pending') },
            'in-progress': { el: document.querySelector('#kanban-in-progress .kanban-cards'), countEl: document.getElementById('count-in-progress') },
            'completed': { el: document.querySelector('#kanban-completed .kanban-cards'), countEl: document.getElementById('count-completed') }
        };

        // Clear cols
        Object.values(cols).forEach(c => { c.el.innerHTML = ''; c.count = 0; });

        tasks.forEach(t => {
            const assignee = users.find(u => u.id === t.assignee);
            const avatarUrl = assignee?.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(assignee?.name || 'Unknown')}`;
            const assigneeName = assignee?.name || 'Unknown';

            const card = document.createElement('div');
            card.className = 'kanban-card';
            card.innerHTML = `
                <div class="kanban-card-title">${t.title}</div>
                <div class="kanban-card-desc">${t.description}</div>
                <div class="kanban-card-footer">
                    <div class="kanban-assignee">
                        <img src="${avatarUrl}" class="kanban-avatar" alt="${assigneeName}">
                        <span>${assigneeName}</span>
                    </div>
                    <span class="badge ${t.priority === 'High' || t.priority === 'Urgent' ? 'high-priority' : 'inprogress'}">${t.priority}</span>
                </div>
            `;
            card.addEventListener('click', () => openEditTaskModal(t.id));

            if (cols[t.status]) {
                cols[t.status].el.appendChild(card);
                cols[t.status].count++;
            }
        });

        // Update counts
        Object.values(cols).forEach(c => { if (c.countEl) c.countEl.textContent = c.count; });

        // Update flowchart counts
        const flowPending = document.getElementById('flow-count-pending');
        const flowProgress = document.getElementById('flow-count-progress');
        const flowCompleted = document.getElementById('flow-count-completed');
        if (flowPending) flowPending.textContent = `${cols['pending'].count} Tasks`;
        if (flowProgress) flowProgress.textContent = `${cols['in-progress'].count} Tasks`;
        if (flowCompleted) flowCompleted.textContent = `${cols['completed'].count} Tasks`;
    }

    // Render Data Lists
    function renderDashboard() {
        const tasks = getVisibleTasks();
        const users = UserDB.getAll();
        
        // Stats
        const statTotal = document.getElementById('statTotal');
        const statCompleted = document.getElementById('statCompleted');
        const statPending = document.getElementById('statPending');
        if (statTotal) statTotal.textContent = tasks.length;
        if (statCompleted) statCompleted.textContent = tasks.filter(t => t.status === 'completed').length;
        if (statPending) statPending.textContent = tasks.filter(t => t.status !== 'completed').length;

        // Tasks Table
        const taskBody = document.getElementById('taskTableBody');
        if (taskBody) {
            taskBody.innerHTML = '';
            tasks.forEach(t => {
                const assigneeName = users.find(u => u.id === t.assignee)?.name || 'Unknown';
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>${t.title}</strong><br><small style="color:var(--text-secondary)">${t.description.substring(0, 30)}...</small></td>
                    <td>${assigneeName}</td>
                    <td><span class="badge ${t.priority === 'High' || t.priority === 'Urgent' ? 'high-priority' : ''}">${t.priority}</span></td>
                    <td><span class="badge ${t.status.replace('-', '')}">${t.status}</span></td>
                    <td>${t.deadline}</td>
                    <td>
                        <button class="btn-icon edit-btn" data-id="${t.id}">✏️</button>
                        ${(currentUser.role === 'admin' || currentUser.role === 'sub-admin' || t.createdBy === currentUser.id) ? `<button class="btn-icon del-btn" data-id="${t.id}">🗑️</button>` : ''}
                    </td>
                `;
                taskBody.appendChild(tr);
            });
        }

        // Billing Table
        const billingBody = document.getElementById('billingTableBody');
        if (billingBody) {
            billingBody.innerHTML = '';
            tasks.forEach(t => {
                if(t.billing || t.paymentStatus !== 'N/A' || t.remarks || t.clientContact) {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td><strong>${t.title}</strong><br><small style="color:var(--text-secondary)">${t.clientContact || 'No client info'}</small></td>
                        <td>${t.billing || '-'}</td>
                        <td><span class="badge ${t.paymentStatus === 'Paid' ? 'completed' : 'pending'}">${t.paymentStatus}</span></td>
                        <td>${t.remarks || '-'}</td>
                    `;
                    billingBody.appendChild(tr);
                }
            });
        }

        // Team Table (Admin/Sub-Admin view)
        if (currentUser.role === 'admin' || currentUser.role === 'sub-admin') {
            const teamBody = document.getElementById('teamTableBody');
            if (teamBody) {
                teamBody.innerHTML = '';
                users.forEach(u => {
                    const userTasks = TaskDB.getAll().filter(t => t.assignee === u.id).length;
                    const avatarUrl = u.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}`;
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td><img src="${avatarUrl}" style="width:32px; height:32px; border-radius:50%; object-fit:cover;" alt="${u.name}"></td>
                        <td><strong>${u.name}</strong><br><small style="color:var(--text-secondary)">@${u.username}</small></td>
                        <td><span style="font-size:12px; color:var(--text-secondary)">📞 ${u.phone || 'N/A'}<br>✉️ ${u.email || 'N/A'}</span></td>
                        <td>${ROLE_LABELS[u.role] || u.role}<br><small style="color:var(--text-secondary)">${u.department || '-'}</small></td>
                        <td>${userTasks}</td>
                    `;
                    teamBody.appendChild(tr);
                });
            }
        }

        // Bind Edit/Delete buttons
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                openEditTaskModal(e.currentTarget.getAttribute('data-id'));
            });
        });

        document.querySelectorAll('.del-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                    if(confirm('Are you sure you want to delete this task?')) {
                        const tId = e.currentTarget.getAttribute('data-id');
                        const t = TaskDB.getAll().find(x => x.id === tId);
                        if(t) ActivityDB.log(currentUser.id, 'Deleted Task', t.title);
                        TaskDB.delete(tId);
                        renderDashboard();
                        renderKanban();
                        renderOverview();
                    }
            });
        });
    }

    // -------------------------------------------------------------
    // ADVANCED DASHBOARD RENDERING LOGIC
    // -------------------------------------------------------------
    
    let chartInstances = {};
    
    function parseValue(val) {
        if (!val) return 0;
        let num = String(val).replace(/[^0-9.]/g, '');
        return parseFloat(num) || 0;
    }

    function renderOverview() {
        const tasks = getVisibleTasks();
        const users = UserDB.getAll();
        const now = new Date();
        
        // Metrics
        let pending = 0, completed = 0, overdue = 0, billed = 0, collected = 0;
        tasks.forEach(t => {
            if (t.status === 'completed') completed++;
            else pending++;
            
            if (t.status !== 'completed' && new Date(t.deadline) < now) overdue++;
            
            billed += parseValue(t.billing);
            if (t.paymentStatus === 'Paid') collected += parseValue(t.billing);
        });
        
        document.getElementById('ovTotal').textContent = tasks.length;
        document.getElementById('ovPending').textContent = pending;
        document.getElementById('ovCompleted').textContent = completed;
        document.getElementById('ovOverdue').textContent = overdue;
        document.getElementById('ovBilled').textContent = '$' + billed.toLocaleString();
        document.getElementById('ovCollected').textContent = '$' + collected.toLocaleString();
        
        // Calculate weekly velocity (completions in last 6 weeks / 6)
        const sixWeeksAgo = new Date(now.getTime() - (42 * 24 * 60 * 60 * 1000));
        const recentCompletions = tasks.filter(t => t.status === 'completed' && t.completedAt && new Date(t.completedAt) >= sixWeeksAgo).length;
        const velocity = Math.round((recentCompletions / 6) * 10) / 10;
        document.getElementById('ovVelocity').textContent = `${velocity} tasks/wk`;

        // Calculate Team Health Score
        const completionRate = tasks.length > 0 ? (completed / tasks.length) * 100 : 100;
        const billingRecovery = billed > 0 ? (collected / billed) * 100 : 100;
        const zeroOverdue = pending > 0 ? (1 - (overdue / pending)) * 100 : 100;
        const teamHealth = Math.round((completionRate + billingRecovery + zeroOverdue) / 3);
        document.getElementById('ovHealth').textContent = `${teamHealth}%`;

        // Donut Chart
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const textColor = isDark ? '#f8fafc' : '#1e293b';
        const gridColor = isDark ? '#334155' : '#e2e8f0';
        
        if (chartInstances.donut) chartInstances.donut.destroy();
        chartInstances.donut = new Chart(document.getElementById('ovDonutChart'), {
            type: 'doughnut',
            data: {
                labels: ['Pending', 'In Progress', 'Completed'],
                datasets: [{
                    data: [tasks.filter(t=>t.status==='pending').length, tasks.filter(t=>t.status==='in-progress').length, completed],
                    backgroundColor: ['#f59e0b', '#3b82f6', '#10b981'],
                    borderWidth: 0
                }]
            },
            options: { responsive: true, plugins: { legend: { labels: { color: textColor } } } }
        });
        
        // Line Chart (Weekly Completions - dynamic calculation)
        const weekCounts = [0, 0, 0, 0, 0, 0];
        const oneDay = 24 * 60 * 60 * 1000;
        tasks.forEach(t => {
            if (t.status === 'completed' && t.completedAt) {
                const completedDate = new Date(t.completedAt);
                const diffDays = Math.floor((now - completedDate) / oneDay);
                if (diffDays >= 0 && diffDays < 42) {
                    const weekIdx = 5 - Math.floor(diffDays / 7);
                    if (weekIdx >= 0 && weekIdx < 6) {
                        weekCounts[weekIdx]++;
                    }
                }
            }
        });

        if (chartInstances.line) chartInstances.line.destroy();
        chartInstances.line = new Chart(document.getElementById('ovLineChart'), {
            type: 'line',
            data: {
                labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'This Week'],
                datasets: [{
                    label: 'Tasks Completed',
                    data: weekCounts,
                    borderColor: '#3b82f6', tension: 0.4, fill: true, backgroundColor: 'rgba(59, 130, 246, 0.1)'
                }]
            },
            options: { scales: { y: { ticks:{color:textColor}, grid:{color:gridColor} }, x: { ticks:{color:textColor}, grid:{display:false} } }, plugins: { legend: {display:false} } }
        });
        
        // Bar Chart
        if (chartInstances.bar) chartInstances.bar.destroy();
        const workloads = {};
        tasks.filter(t=>t.status!=='completed').forEach(t => workloads[t.assignee] = (workloads[t.assignee]||0)+1);
        const topMembers = Object.keys(workloads).sort((a,b)=>workloads[b]-workloads[a]).slice(0,5);
        
        chartInstances.bar = new Chart(document.getElementById('ovBarChart'), {
            type: 'bar',
            data: {
                labels: topMembers.map(id => users.find(u=>u.id===id)?.name || 'Unknown'),
                datasets: [{ label: 'Active Tasks', data: topMembers.map(id=>workloads[id]), backgroundColor: '#10b981' }]
            },
            options: { scales: { y: { ticks:{color:textColor}, grid:{color:gridColor} }, x: { ticks:{color:textColor}, grid:{display:false} } }, plugins: { legend: {display:false} } }
        });
        
        // Heatmap
        const hm = document.getElementById('ovHeatmap');
        hm.innerHTML = '';
        const acts = ActivityDB.getAll();
        for (let i = 34; i >= 0; i--) {
            const d = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
            const count = acts.filter(a => a.timestamp.startsWith(d)).length;
            const level = count === 0 ? 0 : count < 3 ? 1 : count < 6 ? 2 : count < 10 ? 3 : 4;
            const cell = document.createElement('div');
            cell.className = 'heatmap-cell';
            cell.setAttribute('data-level', level);
            cell.title = `${d}: ${count} activities`;
            hm.appendChild(cell);
        }
        
        // Top Tasks
        const topList = document.getElementById('ovTopTasks');
        topList.innerHTML = '';
        tasks.filter(t=>t.status!=='completed' && (t.priority==='High'||t.priority==='Urgent')).slice(0,5).forEach(t => {
            const tr = document.createElement('tr');
            const assign = users.find(u=>u.id===t.assignee)?.name || '';
            tr.innerHTML = `<td><strong>${t.title}</strong></td><td>${assign}</td><td><span class="badge high-priority">${t.deadline}</span></td><td><div class="progress-bg"><div class="progress-fill" style="width:${t.status==='in-progress'?'50%':'10%'}; background:var(--status-inprogress)"></div></div></td>`;
            topList.appendChild(tr);
        });
    }

    function renderPerformance() {
        const tasks = TaskDB.getAll();
        const users = UserDB.getAll();
        
        const perf = users.map(u => {
            const uTasks = tasks.filter(t=>t.assignee === u.id);
            const comp = uTasks.filter(t=>t.status==='completed').length;
            let b = 0, c = 0;
            uTasks.forEach(t => {
                b += parseValue(t.billing);
                if(t.paymentStatus==='Paid') c += parseValue(t.billing);
            });
            const score = Math.min(100, Math.round((comp * 10) + (c/1000)));
            return { ...u, comp, b, c, score };
        }).sort((a,b)=>b.score - a.score);

        const lb = document.getElementById('perfLeaderboard');
        lb.innerHTML = '';
        perf.slice(0,3).forEach((u, i) => {
            const medals = ['🥇', '🥈', '🥉'];
            lb.innerHTML += `<div class="leaderboard-item"><span class="medal">${medals[i]}</span><img src="${u.photo||`https://ui-avatars.com/api/?name=${u.name}`}" style="width:40px; border-radius:50%"><div><strong>${u.name}</strong><br><small style="color:var(--text-secondary)">Score: ${u.score}</small></div><div style="margin-left:auto; font-weight:bold;">${u.comp} done</div></div>`;
        });

        const mc = document.getElementById('perfMemberCards');
        mc.innerHTML = '';
        perf.forEach(u => {
            const color = u.score > 80 ? '#10b981' : u.score > 50 ? '#f59e0b' : '#ef4444';
            mc.innerHTML += `<div class="member-card"><img src="${u.photo||`https://ui-avatars.com/api/?name=${u.name}`}"><div style="flex:1"><strong>${u.name}</strong><br><small style="color:var(--text-secondary)">Billed: $${u.b} | Col: $${u.c}</small></div><div class="score-circle" style="background:${color}">${u.score}</div></div>`;
        });

        // Dual Bar Chart
        if (chartInstances.dual) chartInstances.dual.destroy();
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const tc = isDark ? '#f8fafc' : '#1e293b';
        chartInstances.dual = new Chart(document.getElementById('perfDualBar'), {
            type: 'bar',
            data: {
                labels: perf.slice(0,5).map(u=>u.name),
                datasets: [
                    { label: 'Billed', data: perf.slice(0,5).map(u=>u.b), backgroundColor: '#3b82f6' },
                    { label: 'Collected', data: perf.slice(0,5).map(u=>u.c), backgroundColor: '#10b981' }
                ]
            },
            options: { responsive: true, plugins: { legend: { labels: { color: tc } } }, scales: { y: { ticks:{color:tc} }, x: { ticks:{color:tc} } } }
        });
    }

    function renderDeadlines() {
        const tasks = getVisibleTasks().filter(t=>t.status!=='completed');
        const now = new Date();
        now.setHours(0,0,0,0);
        const nextWeek = new Date(now.getTime() + 7*24*60*60*1000);

        const overdue = tasks.filter(t => new Date(t.deadline) < now).sort((a,b)=>new Date(a.deadline)-new Date(b.deadline));
        const upcoming = tasks.filter(t => new Date(t.deadline) >= now && new Date(t.deadline) <= nextWeek).sort((a,b)=>new Date(a.deadline)-new Date(b.deadline));

        const ol = document.getElementById('deadOverdueList');
        ol.innerHTML = overdue.length ? '' : '<p style="color:var(--text-secondary)">No overdue matters! 🎉</p>';
        overdue.forEach(t => ol.innerHTML += `<div style="padding:10px; background:rgba(239,68,68,0.1); border-radius:6px; border-left:3px solid var(--status-overdue)"><strong>${t.title}</strong><br><small style="color:var(--status-overdue)">Due: ${t.deadline}</small></div>`);

        const ul = document.getElementById('deadUpcomingList');
        ul.innerHTML = upcoming.length ? '' : '<p style="color:var(--text-secondary)">No upcoming deadlines.</p>';
        upcoming.forEach(t => ul.innerHTML += `<div style="padding:10px; background:rgba(245,158,11,0.1); border-radius:6px; border-left:3px solid var(--status-pending)"><strong>${t.title}</strong><br><small style="color:var(--status-pending)">Due: ${t.deadline}</small></div>`);

        const reg = document.getElementById('deadRegisterBody');
        reg.innerHTML = '';
        tasks.sort((a,b)=>new Date(a.deadline)-new Date(b.deadline)).forEach(t => {
            const isOv = new Date(t.deadline) < now;
            reg.innerHTML += `<tr><td><span class="badge ${isOv?'high-priority':''}">${t.deadline}</span></td><td><strong>${t.title}</strong></td><td>${UserDB.getById(t.assignee)?.name||''}</td><td>${t.status}</td></tr>`;
        });
    }

    function renderAlerts() {
        const tasks = getVisibleTasks();
        const users = UserDB.getAll();
        const now = new Date();
        
        let crits = [], warns = [];
        let pending = 0, completed = 0, overdue = 0, billed = 0, collected = 0;

        tasks.forEach(t => {
            if (t.status === 'completed') {
                completed++;
            } else {
                pending++;
                const diff = (now - new Date(t.deadline)) / (1000*60*60*24);
                if (diff > 7) crits.push(`Task severely overdue: <strong>${t.title}</strong> (>7 days)`);
                else if (diff > 0) warns.push(`Task overdue: <strong>${t.title}</strong>`);
            }
            
            if (t.status !== 'completed' && new Date(t.deadline) < now) overdue++;
            
            const taskBill = parseValue(t.billing);
            billed += taskBill;
            if (t.paymentStatus === 'Paid') collected += taskBill;

            if (t.status !== 'completed' && taskBill > 1000 && t.paymentStatus !== 'Paid') {
                warns.push(`High value bill pending: $${t.billing} for <strong>${t.title}</strong>`);
            }
        });

        document.getElementById('alertsCritical').innerHTML = crits.length ? crits.map(c=>`<div style="color:var(--status-overdue); padding:10px; background:rgba(239,68,68,0.1); border-radius:4px;">🚨 ${c}</div>`).join('') : '<p>No critical alerts.</p>';
        document.getElementById('alertsWarnings').innerHTML = warns.length ? warns.map(w=>`<div style="color:var(--status-pending); padding:10px; background:rgba(245,158,11,0.1); border-radius:4px;">⚠️ ${w}</div>`).join('') : '<p>No warnings.</p>';

        const billingRecovery = billed > 0 ? (collected / billed) * 100 : 100;
        const zeroOverdue = pending > 0 ? (1 - (overdue / pending)) * 100 : 100;

        const h = document.getElementById('alertsHealth');
        const kpis = [
            { label: 'Completion Rate', val: tasks.length > 0 ? (completed / tasks.length) * 100 : 100, color: '#10b981' },
            { label: 'Billing Recovery', val: billingRecovery, color: '#3b82f6' }, 
            { label: 'Zero-Overdue Target', val: zeroOverdue, color: '#f59e0b' }
        ];
        
        h.innerHTML = kpis.map(k => `<div><div style="display:flex;justify-content:space-between;margin-bottom:5px;font-size:14px"><span>${k.label}</span><strong>${Math.round(k.val)}%</strong></div><div class="progress-bg"><div class="progress-fill" style="width:${k.val}%; background:${k.color}"></div></div></div>`).join('');
    }

    function renderActivity() {
        const feed = document.getElementById('activityFeedList');
        const acts = ActivityDB.getAll();
        const users = UserDB.getAll();
        
        feed.innerHTML = acts.map(a => {
            const u = users.find(x=>x.id === a.userId);
            const time = new Date(a.timestamp).toLocaleString();
            let icon = '📝'; color = '#3b82f6';
            if (a.action.includes('Created')) { icon = '✨'; color = '#10b981'; }
            if (a.action.includes('Deleted')) { icon = '🗑️'; color = '#ef4444'; }
            if (a.action.includes('Completed')) { icon = '✅'; color = '#10b981'; }
            
            return `<div class="activity-item">
                <div class="activity-icon" style="background:${color}">${icon}</div>
                <div>
                    <div style="font-size:14px"><strong>${u?.name||'System'}</strong> ${a.action} <strong style="color:var(--accent-color)">${a.target}</strong></div>
                    <div style="font-size:12px; color:var(--text-secondary)">${time}</div>
                </div>
            </div>`;
        }).join('');
    }

    // Initialize initial views
    renderOverview();
    renderDashboard();
    renderKanban();
});
