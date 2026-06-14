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

async function loadTasks() {
  const taskList = document.getElementById('taskList');
  if (!taskList) return;

  try {
    const response = await fetch(`${apiBase}/task`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      taskList.textContent = 'Unable to load tasks.';
      return;
    }

    const tasks = await response.json();
    taskList.innerHTML = tasks.length ? tasks.map(t => `<div class="task-card"><h3>${t.title}</h3><p>${t.description}</p><small>Status: ${t.status}</small></div>`).join('') : '<p>No tasks available.</p>';
  } catch (error) {
    taskList.textContent = 'Unable to load tasks.';
  }
}

loadTasks();
