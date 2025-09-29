// Roteform functionality for structured journaling
let isAuthenticated = false;
let currentUser = null;
let formData = {};
let currentDate = new Date().toISOString().split('T')[0];

// Initialize page
document.addEventListener('DOMContentLoaded', async function() {
    await checkAuthentication();
    setEntryDate();
    loadExistingEntry();
    initializeFormTracking();
    scheduleAutoSave();
});

async function checkAuthentication() {
    try {
        const response = await fetch('/api/auth/status', {
            credentials: 'include'
        });
        const data = await response.json();

        if (data.authenticated) {
            isAuthenticated = true;
            currentUser = data.user;
            loadUserData();
        } else {
            window.location.href = '/pages/login.html';
            return;
        }
    } catch (error) {
        console.error('Authentication check failed:', error);
        window.location.href = '/pages/login.html';
        return;
    }
}

function loadUserData() {
    if (currentUser) {
        const usernameElement = document.querySelector('.navbar-username');
        if (usernameElement) {
            usernameElement.textContent = currentUser.username;
        }
    }
}

function setEntryDate() {
    const today = new Date();
    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };
    document.getElementById('entryDate').textContent = today.toLocaleDateString('en-US', options);
}

function loadExistingEntry() {
    // Try to load existing entry for today
    const savedEntry = localStorage.getItem(`roteform_${currentDate}`);
    if (savedEntry) {
        try {
            formData = JSON.parse(savedEntry);
            populateForm(formData);
        } catch (error) {
            console.error('Error loading saved entry:', error);
        }
    }
}

function populateForm(data) {
    const fields = ['gratitude', 'emotions', 'values', 'growth', 'connection', 'compassion', 'story'];

    fields.forEach(field => {
        const element = document.getElementById(field);
        if (element && data[field]) {
            element.value = data[field];
        }
    });

    updateProgress();
}

function initializeFormTracking() {
    const textareas = document.querySelectorAll('.question-input');

    textareas.forEach(textarea => {
        textarea.addEventListener('input', function() {
            formData[this.id] = this.value;
            updateProgress();
            saveToLocalStorage();
        });

        // Initial data capture
        formData[textarea.id] = textarea.value || '';
    });

    updateProgress();
}

function updateProgress() {
    const fields = ['gratitude', 'emotions', 'values', 'growth', 'connection', 'compassion', 'story'];
    const completedFields = fields.filter(field => {
        const element = document.getElementById(field);
        return element && element.value.trim().length > 0;
    });

    const progress = completedFields.length;
    const total = fields.length;
    const percentage = (progress / total) * 100;

    document.getElementById('progressText').textContent = `${progress}/${total} questions answered`;
    document.getElementById('progressFill').style.width = `${percentage}%`;
}

function saveToLocalStorage() {
    try {
        localStorage.setItem(`roteform_${currentDate}`, JSON.stringify(formData));
    } catch (error) {
        console.error('Error saving to localStorage:', error);
    }
}

function saveDraft() {
    saveToLocalStorage();

    // Visual feedback
    const button = document.querySelector('.save-draft-btn');
    const originalText = button.textContent;
    button.textContent = 'Draft Saved!';
    button.style.background = 'linear-gradient(145deg, #4caf50 0%, #45a049 100%)';

    setTimeout(() => {
        button.textContent = originalText;
        button.style.background = '';
    }, 2000);
}

async function saveEntry() {
    if (!isAuthenticated) {
        alert('Please log in to save your entry.');
        return;
    }

    // Validate that at least some questions are answered
    const fields = ['gratitude', 'emotions', 'values', 'growth', 'connection', 'compassion', 'story'];
    const answeredFields = fields.filter(field => {
        const element = document.getElementById(field);
        return element && element.value.trim().length > 0;
    });

    if (answeredFields.length === 0) {
        alert('Please answer at least one question before saving.');
        return;
    }

    // Prepare entry data
    const entryData = {
        type: 'roteform',
        date: currentDate,
        title: `Daily Reflection - ${new Date().toLocaleDateString()}`,
        content: formData,
        timestamp: new Date().toISOString()
    };

    try {
        // Check if entry already exists
        const existingResponse = await fetch('/api/journal-entries', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include'
        });

        if (existingResponse.ok) {
            const entries = await existingResponse.json();
            const existingEntry = entries.find(entry =>
                entry.type === 'roteform' &&
                entry.date === currentDate
            );

            let response;
            if (existingEntry) {
                // Update existing entry
                response = await fetch(`/api/journal-entries/${existingEntry.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify(entryData)
                });
            } else {
                // Create new entry
                response = await fetch('/api/journal-entries', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify(entryData)
                });
            }

            if (response.ok) {
                // Clear local storage after successful save
                localStorage.removeItem(`roteform_${currentDate}`);

                // Visual feedback
                const button = document.querySelector('.save-final-btn');
                const originalText = button.textContent;
                button.textContent = 'Entry Saved!';
                button.style.background = 'linear-gradient(145deg, #4caf50 0%, #45a049 100%)';

                setTimeout(() => {
                    button.textContent = originalText;
                    button.style.background = '';
                }, 2000);
            } else {
                throw new Error('Failed to save entry');
            }
        }
    } catch (error) {
        console.error('Error saving entry:', error);
        alert('Error saving entry. Please try again.');
    }
}

function scheduleAutoSave() {
    // Auto-save draft every 2 minutes
    setInterval(() => {
        if (Object.values(formData).some(value => value && value.trim().length > 0)) {
            saveToLocalStorage();
        }
    }, 120000); // 2 minutes
}

function goBack() {
    // Save draft before leaving
    saveToLocalStorage();
    window.location.href = '/pages/selectionpage.html';
}

// Navigation functions are handled by navbar.js