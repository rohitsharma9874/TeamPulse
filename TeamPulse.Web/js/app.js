const apiBase = 'http://localhost:5000/api';

const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');

const existingUser = sessionStorage.getItem('teamPulseUser');
if (existingUser) {
  window.location.href = 'dashboard.html';
}

if (loginForm) {
  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    loginError.classList.add('hidden');

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    try {
      const response = await fetch(`${apiBase}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      if (!response.ok) {
        loginError.textContent = 'Invalid username or password';
        loginError.classList.remove('hidden');
        return;
      }

      const result = await response.json();
      sessionStorage.setItem('teamPulseToken', result.token);
      sessionStorage.setItem('teamPulseUser', JSON.stringify(result));
      window.location.href = 'dashboard.html';
    } catch (error) {
      loginError.textContent = 'Unable to connect to the server';
      loginError.classList.remove('hidden');
    }
  });
}
