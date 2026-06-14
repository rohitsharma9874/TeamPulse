// Data Management Module using LocalStorage

const DB_KEYS = {
    USERS: 'taskmanager_users',
    TASKS: 'taskmanager_tasks',
    ACTIVITIES: 'taskmanager_activities',
    CURRENT_USER: 'taskmanager_current_user'
};

const HIERARCHY = {
    'admin': 1,
    'sub-admin': 2,
    'senior_manager_audit': 3,
    'senior_manager_compliance': 3,
    'manager': 4,
    'manager_audit_accounts': 4,
    'manager_compliance_legal': 4,
    'associate_audit_accounts': 5,
    'associate_compliance_legal': 5,
    'audit_associate': 6,
    'audit_compliance_associate': 6,
    'executive_audit_accounts': 7,
    'executive_compliance_legal': 7,
    'audit_assistant': 8,
    'compliance_assistant': 8,
    'trainee': 9
};

const ROLE_LABELS = {
    'admin': 'Admin',
    'sub-admin': 'Sub Admin',
    'senior_manager_audit': 'Senior Manager Audit',
    'senior_manager_compliance': 'Senior Manager Compliance & Legal',
    'manager': 'Manager',
    'manager_audit_accounts': 'Manager Audit & Accounts',
    'manager_compliance_legal': 'Manager Compliance & Legal',
    'associate_audit_accounts': 'Associate Audit & Accounts',
    'associate_compliance_legal': 'Associate Compliance & Legal',
    'audit_associate': 'Audit Associate',
    'audit_compliance_associate': 'Audit Compliance Associate',
    'executive_audit_accounts': 'Executive Audit & Accounts',
    'executive_compliance_legal': 'Executive Compliance & Legal',
    'audit_assistant': 'Audit Assistant',
    'compliance_assistant': 'Compliance Assistant',
    'trainee': 'Trainee'
};


// Initial Setup
function initializeDB() {
    if (!localStorage.getItem(DB_KEYS.USERS)) {
        // Create 50 default users
        const defaultUsers = [
            { id: 'u1', name: 'Koshal Sharma', role: 'admin', username: 'admin', password: 'password', department: 'Management', phone: '9876543210', email: 'koshal.sharma@kpacollp.com', photo: 'https://ui-avatars.com/api/?name=Koshal+Sharma&background=3b82f6&color=fff' },
            { id: 'u2', name: 'Amit Patel', role: 'sub-admin', username: 'amit', password: 'password', department: 'Management', phone: '9876543211', email: 'amit.patel@kpacollp.com', photo: 'https://ui-avatars.com/api/?name=Amit+Patel&background=10b981&color=fff' },
            { id: 'u3', name: 'Priya Mehta', role: 'senior_manager_audit', username: 'priya', password: 'password', department: 'Audit', phone: '9876543212', email: 'priya.mehta@kpacollp.com', photo: 'https://ui-avatars.com/api/?name=Priya+Mehta&background=f59e0b&color=fff' },
            { id: 'u4', name: 'Rajesh Gupta', role: 'senior_manager_compliance', username: 'rajesh', password: 'password', department: 'Compliance', phone: '9876543213', email: 'rajesh.gupta@kpacollp.com', photo: 'https://ui-avatars.com/api/?name=Rajesh+Gupta&background=ef4444&color=fff' }
        ];

        const firstNames = ['Sneha', 'Vikram', 'Neha', 'Sanjay', 'Pooja', 'Anil', 'Asha', 'Rohan', 'Kiran', 'Sunil', 'Jyoti', 'Vijay', 'Divya', 'Ramesh', 'Swati', 'Alok', 'Ritu', 'Manoj', 'Komal', 'Deepak', 'Preeti', 'Arun', 'Kavita', 'Sandeep', 'Meera', 'Rahul', 'Anjali', 'Ajay', 'Shalini', 'Harish', 'Nisha', 'Yogesh', 'Geeta', 'Kartik', 'Sapna', 'Ganesh', 'Varsha', 'Suresh', 'Anita', 'Vinod', 'Rekha', 'Ashok', 'Seema'];
        const lastNames = ['Joshi', 'Singh', 'Verma', 'Kumar', 'Shah', 'Trivedi', 'Rao', 'Nair', 'Mishra', 'Pandey', 'Desai', 'Kulkarni', 'Reddy', 'Jain', 'Bansal', 'Agarwal', 'Garg', 'Goyal', 'Chawla', 'Bhasin'];

        const roles = [
            'manager_audit_accounts', 'manager_compliance_legal',
            'associate_audit_accounts', 'associate_compliance_legal',
            'audit_associate', 'audit_compliance_associate',
            'executive_audit_accounts', 'executive_compliance_legal',
            'audit_assistant', 'compliance_assistant',
            'trainee'
        ];

        const depts = {
            'manager_audit_accounts': 'Audit',
            'manager_compliance_legal': 'Compliance',
            'associate_audit_accounts': 'Audit',
            'associate_compliance_legal': 'Compliance',
            'audit_associate': 'Audit',
            'audit_compliance_associate': 'Compliance',
            'executive_audit_accounts': 'Audit',
            'executive_compliance_legal': 'Compliance',
            'audit_assistant': 'Audit',
            'compliance_assistant': 'Compliance',
            'trainee': 'Audit'
        };

        for (let i = 0; i < 46; i++) {
            const fName = firstNames[i % firstNames.length];
            const lName = lastNames[(i + 3) % lastNames.length];
            const name = `${fName} ${lName}`;
            const role = roles[i % roles.length];
            const dept = depts[role] || 'General';
            const username = `${fName.toLowerCase()}${10 + i}`;
            const email = `${fName.toLowerCase()}.${lName.toLowerCase()}@kpacollp.com`;
            const phone = `98765${10000 + i}`;
            const photo = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff`;

            defaultUsers.push({
                id: `u${5 + i}`,
                name,
                role,
                username,
                password: 'password',
                department: dept,
                phone,
                email,
                photo
            });
        }
        localStorage.setItem(DB_KEYS.USERS, JSON.stringify(defaultUsers));
    }

    if (!localStorage.getItem(DB_KEYS.TASKS)) {
        // Create some sample tasks
        const sampleTasks = [
            { 
                id: 't1', title: 'Q1 Financial Report', description: 'Compile and review Q1 financials.', 
                assignee: 'u3', priority: 'High', status: 'pending', deadline: '2026-05-15', 
                clientContact: 'John Doe / 9876543210', billing: 'Client A - $500', paymentStatus: 'Pending', remarks: 'Needs approval', createdBy: 'u1'
            },
            { 
                id: 't2', title: 'Onboarding Docs', description: 'Update trainee onboarding materials.', 
                assignee: 'u4', priority: 'Medium', status: 'in-progress', deadline: '2026-05-20', 
                clientContact: 'Internal / HR Dept', billing: 'Internal', paymentStatus: 'N/A', remarks: '', createdBy: 'u2'
            },
            { 
                id: 't3', title: 'GST Return Filing - April 2026', description: 'File GST returns for prime clients.', 
                assignee: 'u5', priority: 'Urgent', status: 'pending', deadline: '2026-06-18', 
                clientContact: 'Vikas Shah / 9812345678', billing: '$350', paymentStatus: 'Pending', remarks: 'Urgent compliance', createdBy: 'u1'
            },
            { 
                id: 't4', title: 'Income Tax Audit for Client X', description: 'Conduct statutory audit and draft report.', 
                assignee: 'u7', priority: 'High', status: 'in-progress', deadline: '2026-06-25', 
                clientContact: 'Rakesh Jain / 9898989898', billing: '$1200', paymentStatus: 'Pending', remarks: 'Requires senior review', createdBy: 'u3'
            },
            { 
                id: 't5', title: 'ROC Annual Filing', description: 'Prepare and file ROC annual returns.', 
                assignee: 'u12', priority: 'Medium', status: 'completed', deadline: '2026-06-05', completedAt: '2026-06-04',
                clientContact: 'Mrs. Sonia Kapoor / 9811112222', billing: '$600', paymentStatus: 'Paid', remarks: 'Completed on time', createdBy: 'u2'
            },
            { 
                id: 't6', title: 'Statutory Audit of Client Y', description: 'Review internal controls and draft audit report.', 
                assignee: 'u18', priority: 'High', status: 'pending', deadline: '2026-06-22', 
                clientContact: 'Alok Bhasin / 9822223333', billing: '$1500', paymentStatus: 'Pending', remarks: 'Waiting for balance sheet', createdBy: 'u1'
            },
            { 
                id: 't7', title: 'TDS Return Compliance', description: 'Compute and file TDS return for Q4.', 
                assignee: 'u22', priority: 'Medium', status: 'completed', deadline: '2026-05-31', completedAt: '2026-05-29',
                clientContact: 'Deepak Soni / 9833334444', billing: '$250', paymentStatus: 'Paid', remarks: 'Filed successfully', createdBy: 'u4'
            },
            { 
                id: 't8', title: 'Transfer Pricing Documentation', description: 'Prepare transfer pricing report for international transactions.', 
                assignee: 'u31', priority: 'High', status: 'in-progress', deadline: '2026-06-30', 
                clientContact: 'Nikhil Garg / 9844445555', billing: '$2000', paymentStatus: 'Pending', remarks: 'Client queries pending', createdBy: 'u3'
            },
            { 
                id: 't9', title: 'Vouching of Purchase Transactions', description: 'Perform purchase vouching for the fiscal year.', 
                assignee: 'u45', priority: 'Low', status: 'in-progress', deadline: '2026-06-20', 
                clientContact: 'Finance Manager / 9855556666', billing: 'Internal', paymentStatus: 'N/A', remarks: 'Assigned to trainees', createdBy: 'u2'
            }
        ];

        // Generate mock historical tasks for the last 6 weeks to populate charts
        const now = new Date();
        for (let i = 0; i < 60; i++) {
            const randomDaysAgo = Math.floor(Math.random() * 42); // last 6 weeks
            const pastDate = new Date(now.getTime() - (randomDaysAgo * 24 * 60 * 60 * 1000));
            const yyyy = pastDate.getFullYear();
            const mm = String(pastDate.getMonth() + 1).padStart(2, '0');
            const dd = String(pastDate.getDate()).padStart(2, '0');
            
            sampleTasks.push({
                id: 'tmock' + i,
                title: 'Historical Task ' + i,
                description: 'Auto-generated historical audit and tax filings',
                assignee: 'u' + (Math.floor(Math.random() * 50) + 1), // Assign to any of the 50 users
                priority: ['Low', 'Medium', 'High', 'Urgent'][Math.floor(Math.random() * 4)],
                status: 'completed',
                deadline: `${yyyy}-${mm}-${dd}`,
                completedAt: `${yyyy}-${mm}-${dd}`,
                clientContact: 'Client ' + i + ' / 99999' + String(10000 + i),
                billing: '$' + (Math.floor(Math.random() * 10) + 1) * 100,
                paymentStatus: Math.random() > 0.3 ? 'Paid' : 'Pending',
                remarks: 'Auto-completed mock record',
                createdBy: 'u1'
            });
        }
        localStorage.setItem(DB_KEYS.TASKS, JSON.stringify(sampleTasks));
    }

    if (!localStorage.getItem(DB_KEYS.ACTIVITIES)) {
        const activities = [];
        const now = new Date();
        
        // Generate mock activity heatmap data for last 35 days
        for (let i = 0; i < 200; i++) {
            const randomDaysAgo = Math.floor(Math.random() * 35);
            const pastDate = new Date(now.getTime() - (randomDaysAgo * 24 * 60 * 60 * 1000));
            activities.push({
                id: 'a' + i,
                userId: 'u' + (Math.floor(Math.random() * 50) + 1), // Assign to any of the 50 users
                action: ['Created Task', 'Updated Status', 'Completed Task', 'Added Comment', 'Recorded Payment', 'Updated Profile'][Math.floor(Math.random() * 6)],
                target: 'Task ' + (Math.floor(Math.random() * 60) + 1),
                timestamp: pastDate.toISOString()
            });
        }
        
        // Sort chronologically
        activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        localStorage.setItem(DB_KEYS.ACTIVITIES, JSON.stringify(activities));
    }
}

// User Operations
const UserDB = {
    getAll: () => JSON.parse(localStorage.getItem(DB_KEYS.USERS) || '[]'),
    saveAll: (users) => localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users)),
    add: (user) => {
        const users = UserDB.getAll();
        user.id = 'u' + Date.now();
        if (!user.photo) {
            user.photo = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random&color=fff`;
        }
        users.push(user);
        UserDB.saveAll(users);
        return user;
    },
    getById: (id) => UserDB.getAll().find(u => u.id === id),
    getByUsername: (username) => UserDB.getAll().find(u => u.username === username),
    update: (updatedUser) => {
        const users = UserDB.getAll();
        const index = users.findIndex(u => u.id === updatedUser.id);
        if (index !== -1) {
            users[index] = { ...users[index], ...updatedUser };
            UserDB.saveAll(users);
        }
    }
};

// Task Operations
const TaskDB = {
    getAll: () => JSON.parse(localStorage.getItem(DB_KEYS.TASKS) || '[]'),
    saveAll: (tasks) => localStorage.setItem(DB_KEYS.TASKS, JSON.stringify(tasks)),
    add: (task) => {
        const tasks = TaskDB.getAll();
        task.id = 't' + Date.now();
        tasks.push(task);
        TaskDB.saveAll(tasks);
        return task;
    },
    update: (updatedTask) => {
        const tasks = TaskDB.getAll();
        const index = tasks.findIndex(t => t.id === updatedTask.id);
        if (index !== -1) {
            tasks[index] = updatedTask;
            TaskDB.saveAll(tasks);
        }
    },
    delete: (id) => {
        const tasks = TaskDB.getAll().filter(t => t.id !== id);
        TaskDB.saveAll(tasks);
    },
    getByAssignee: (userId) => TaskDB.getAll().filter(t => t.assignee === userId)
};

// Activity Operations
const ActivityDB = {
    getAll: () => JSON.parse(localStorage.getItem(DB_KEYS.ACTIVITIES) || '[]'),
    log: (userId, action, target) => {
        const activities = ActivityDB.getAll();
        activities.unshift({
            id: 'a' + Date.now(),
            userId,
            action,
            target,
            timestamp: new Date().toISOString()
        });
        localStorage.setItem(DB_KEYS.ACTIVITIES, JSON.stringify(activities));
    }
};

// Auth Operations
const Auth = {
    login: (username, password) => {
        const user = UserDB.getByUsername(username);
        if (user && user.password === password) {
            localStorage.setItem(DB_KEYS.CURRENT_USER, JSON.stringify({ id: user.id, name: user.name, role: user.role }));
            return true;
        }
        return false;
    },
    logout: () => {
        localStorage.removeItem(DB_KEYS.CURRENT_USER);
        window.location.href = 'index.html';
    },
    getCurrentUser: () => {
        const user = localStorage.getItem(DB_KEYS.CURRENT_USER);
        if (user) {
            // Fetch latest user details from DB in case profile was updated
            const dbUser = UserDB.getById(JSON.parse(user).id);
            if (dbUser) {
                const updatedUser = { id: dbUser.id, name: dbUser.name, role: dbUser.role };
                localStorage.setItem(DB_KEYS.CURRENT_USER, JSON.stringify(updatedUser));
                return updatedUser;
            }
        }
        return null;
    }
};

// Theme Management
const Theme = {
    init: () => {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        return savedTheme;
    },
    toggle: () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
        return next;
    }
};

// Run init
initializeDB();
