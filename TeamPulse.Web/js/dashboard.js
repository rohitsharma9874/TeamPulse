const apiBase = 'http://localhost:5000/api';
const token = sessionStorage.getItem('teamPulseToken');
const user = JSON.parse(sessionStorage.getItem('teamPulseUser') || 'null');

if (!token || !user) {
  window.location.href = 'index.html';
}

const welcomeText = document.getElementById('welcomeText');
if (welcomeText) {
  welcomeText.textContent = `Welcome back, ${user.name}`;
}

const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    sessionStorage.removeItem('teamPulseToken');
    sessionStorage.removeItem('teamPulseUser');
    window.location.href = 'index.html';
  });
}

const createTaskForm = document.getElementById('createTaskForm');
const taskList = document.getElementById('taskList');

async function loadTasks() {
  if (!taskList) return;

  try {
    const response = await fetch(`${apiBase}/task`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      taskList.innerHTML = '<p style="color: #dc2626;">Unable to load tasks.</p>';
      return;
    }

    const tasks = await response.json();
    if (tasks.length === 0) {
      taskList.innerHTML = '<p style="color: #64748b;">No tasks available. Create one to get started!</p>';
    } else {
      taskList.innerHTML = tasks.map(t => `
        <div class="task-card">
          <h3 style="margin: 0 0 8px 0;">${t.title}</h3>
          <p style="margin: 0 0 8px 0; color: #64748b;">${t.description}</p>
          <div style="display: flex; justify-content: space-between; font-size: 13px;">
            <span style="background: #e0e7ff; padding: 4px 10px; border-radius: 6px;">Status: ${t.status}</span>
            <span style="color: #64748b;">${t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'No due date'}</span>
          </div>
        </div>
      `).join('');
    }
  } catch (error) {
    taskList.innerHTML = '<p style="color: #dc2626;">Unable to load tasks.</p>';
  }
}

if (createTaskForm) {
  createTaskForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const title = document.getElementById('taskTitle')?.value.trim();
    const description = document.getElementById('taskDescription')?.value.trim();
    const status = document.getElementById('taskStatus')?.value || 'pending';
    const dueDate = document.getElementById('taskDueDate')?.value;

    if (!title || !description) {
      alert('Please fill in all required fields.');
      return;
    }

    try {
      const response = await fetch(`${apiBase}/task`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          description,
          status,
          dueDate: dueDate ? new Date(dueDate).toISOString() : null,
          assigneeId: user.userId,
          companyId: user.companyId
        })
      });

      if (!response.ok) {
        alert('Failed to create task. Please try again.');
        return;
      }

      createTaskForm.reset();
      loadTasks();
    } catch (error) {
      alert('Unable to create task. Please try again.');
    }
  });
}

loadTasks();
