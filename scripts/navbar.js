// Navbar functionality

async function logout() {
    try {
        const response = await fetch('/api/logout', {
            method: 'POST',
            credentials: 'include'
        });

        if (response.ok) {
            // Clear any stored user data
            sessionStorage.removeItem('user');
            localStorage.clear();

            // Redirect to login page
            window.location.href = '/pages/login.html';
        } else {
            alert('Failed to log out. Please try again.');
        }
    } catch (error) {
        console.error('Logout error:', error);
        alert('Failed to log out. Please try again.');
    }
}

async function deleteAccount() {
    const confirmation = prompt(
        'Are you absolutely sure you want to delete your account? This will permanently delete ALL your journal entries and cannot be undone.\n\nType "DELETE" to confirm:'
    );

    if (confirmation !== 'DELETE') {
        return;
    }

    const doubleConfirm = confirm(
        'This is your final warning. Deleting your account will:\n\n' +
        '• Permanently delete all your journal entries\n' +
        '• Remove your account completely\n' +
        '• This action CANNOT be undone\n\n' +
        'Are you absolutely certain you want to proceed?'
    );

    if (!doubleConfirm) {
        return;
    }

    try {
        const response = await fetch('/api/delete-account', {
            method: 'DELETE',
            credentials: 'include'
        });

        const data = await response.json();

        if (response.ok && data.success) {
            alert('Your account has been deleted. Thank you for using Journal-Mate.');

            // Clear any stored data
            sessionStorage.clear();
            localStorage.clear();

            // Redirect to login page
            window.location.href = '/pages/login.html';
        } else {
            alert(data.error || 'Failed to delete account. Please try again.');
        }
    } catch (error) {
        console.error('Delete account error:', error);
        alert('Failed to delete account. Please try again.');
    }
}

// Initialize navbar with user info
async function initNavbar() {
    try {
        const response = await fetch('/api/auth/status', {
            credentials: 'include'
        });
        const data = await response.json();

        if (data.authenticated) {
            const usernameElement = document.querySelector('.navbar-username');
            if (usernameElement) {
                usernameElement.textContent = data.user.username;
            }
        }
    } catch (error) {
        console.error('Failed to load user info:', error);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initNavbar);