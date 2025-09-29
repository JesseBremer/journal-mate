async function login(event) {
    event.preventDefault();

    var username = document.getElementById('username').value;
    var password = document.getElementById('password').value;

    if (!username || !password) {
        alert('Please enter both username and password.');
        return;
    }

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            // Store user info in sessionStorage for quick access
            sessionStorage.setItem('user', JSON.stringify(data.user));

            // Redirect to selection page
            window.location.href = '/pages/selectionpage.html';
        } else {
            alert(data.error || 'Invalid username or password. Please try again.');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed. Please check your connection and try again.');
    }
}