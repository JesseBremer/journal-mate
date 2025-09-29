async function register(event) {
    event.preventDefault();

    var username = document.getElementById('username').value;
    var password = document.getElementById('password').value;
    var confirmPassword = document.getElementById('confirm-password').value;

    // Client-side validation
    if (!validateForm(username, password, confirmPassword)) {
        return;
    }

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            alert('Account created successfully! You are now logged in.');
            // Store user info in sessionStorage for quick access
            sessionStorage.setItem('user', JSON.stringify(data.user));

            // Redirect to selection page
            window.location.href = '/pages/selectionpage.html';
        } else {
            alert(data.error || 'Registration failed. Please try again.');
        }
    } catch (error) {
        console.error('Registration error:', error);
        alert('Registration failed. Please check your connection and try again.');
    }
}

function validateForm(username, password, confirmPassword) {
    // Username validation
    if (username.length < 3 || username.length > 30) {
        alert('Username must be between 3 and 30 characters long.');
        return false;
    }

    if (!/^[a-zA-Z0-9]+$/.test(username)) {
        alert('Username can only contain letters and numbers.');
        return false;
    }

    // Password validation
    if (password.length < 6) {
        alert('Password must be at least 6 characters long.');
        return false;
    }

    // Password confirmation
    if (password !== confirmPassword) {
        alert('Passwords do not match.');
        return false;
    }

    return true;
}

// Add real-time password confirmation validation
document.addEventListener('DOMContentLoaded', function() {
    const password = document.getElementById('password');
    const confirmPassword = document.getElementById('confirm-password');

    function checkPasswordMatch() {
        if (confirmPassword.value && password.value !== confirmPassword.value) {
            confirmPassword.setCustomValidity('Passwords do not match');
        } else {
            confirmPassword.setCustomValidity('');
        }
    }

    password.addEventListener('input', checkPasswordMatch);
    confirmPassword.addEventListener('input', checkPasswordMatch);
});