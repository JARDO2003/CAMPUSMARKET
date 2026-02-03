const lampContainer = document.getElementById('lampContainer');
        const body = document.body;
        const loginForm = document.getElementById('loginForm');
        const passwordInput = document.getElementById('password');
        const errorMessage = document.getElementById('errorMessage');
        const successMessage = document.getElementById('successMessage');

        // Mot de passe encodé en base64
        const correctPassword = atob('bWFyY2lA');

        let isLit = false;

        lampContainer.addEventListener('click', () => {
            isLit = !isLit;
            body.classList.toggle('lit', isLit);
        });

        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            errorMessage.style.display = 'none';
            successMessage.style.display = 'none';

            const password = passwordInput.value;

            if (password === correctPassword) {
                successMessage.style.display = 'block';
                passwordInput.value = '';
                
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 800);
            } else {
                errorMessage.style.display = 'block';
                passwordInput.value = '';
                
                setTimeout(() => {
                    errorMessage.style.display = 'none';
                }, 3000);
            }
        });

        passwordInput.addEventListener('focus', () => {
            errorMessage.style.display = 'none';
            successMessage.style.display = 'none';
        });
