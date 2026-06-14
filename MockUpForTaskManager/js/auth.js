// Authentication Logic

document.addEventListener('DOMContentLoaded', () => {
    Theme.init();

    // Apply custom logo if stored in localStorage
    function applyLogo() {
        const savedLogo = localStorage.getItem('taskmanager_logo');
        if (savedLogo) {
            const logoContainer = document.querySelector('.login-header div');
            if (logoContainer) {
                const svg = logoContainer.querySelector('svg');
                if (svg) {
                    const img = document.createElement('img');
                    img.src = savedLogo;
                    img.style.width = '50px';
                    img.style.height = '50px';
                    img.style.objectFit = 'contain';
                    img.style.borderRadius = '8px';
                    img.className = 'custom-logo';
                    svg.replaceWith(img);
                }
            }
        }
    }
    applyLogo();

    const currentUser = Auth.getCurrentUser();
    if (currentUser) {
        window.location.href = 'dashboard.html';
        return;
    }

    const loginForm = document.getElementById('loginForm');
    const errorMsg = document.getElementById('error-msg');
    
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const u = document.getElementById('username').value;
            const p = document.getElementById('password').value;
            
            if (Auth.login(u, p)) {
                window.location.href = 'dashboard.html';
            } else {
                errorMsg.style.display = 'block';
            }
        });
    }

    // Modal Logic
    const registerModal = document.getElementById('registerModal');
    const showRegister = document.getElementById('showRegister');
    const closeRegister = document.getElementById('closeRegister');
    const registerForm = document.getElementById('registerForm');

    if (showRegister) {
        showRegister.addEventListener('click', (e) => {
            e.preventDefault();
            registerModal.classList.add('active');
        });
    }

    if (closeRegister) {
        closeRegister.addEventListener('click', () => {
            registerModal.classList.remove('active');
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const newUser = {
                name: document.getElementById('regName').value,
                username: document.getElementById('regUsername').value,
                password: document.getElementById('regPassword').value,
                role: document.getElementById('regRole').value,
                department: document.getElementById('regDept').value
            };
            
            if (UserDB.getByUsername(newUser.username)) {
                alert('Username already exists');
                return;
            }

            UserDB.add(newUser);
            alert('Profile created successfully! You can now login.');
            registerModal.classList.remove('active');
            registerForm.reset();
        });
    }
});
