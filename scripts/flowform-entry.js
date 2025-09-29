// Load and display flowform entry in scrapbook format
document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const entryId = urlParams.get('id');

    if (!entryId) {
        showError('No entry ID provided');
        return;
    }

    await loadEntry(entryId);
});

// Load entry from server
async function loadEntry(entryId) {
    try {
        const response = await fetch(`/api/entries/${entryId}`, {
            credentials: 'include'
        });

        if (!response.ok) {
            if (response.status === 401) {
                window.location.href = '/pages/login.html';
                return;
            }
            throw new Error('Failed to load entry');
        }

        const entry = await response.json();
        displayEntry(entry);

    } catch (error) {
        console.error('Error loading entry:', error);
        showError('Failed to load journal entry');
    }
}

// Display entry in scrapbook format
function displayEntry(entry) {
    const container = document.getElementById('entryContent');

    let flowformData;
    try {
        flowformData = JSON.parse(entry.content);
    } catch (error) {
        // If not flowform data, show regular entry
        container.innerHTML = `
            <div class="entry-header">
                <h1 class="entry-date">${entry.title}</h1>
                <p class="entry-subtitle">Created ${new Date(entry.created_at).toLocaleDateString()}</p>
            </div>
            <div class="text-entry">${entry.content}</div>
            <a href="/pages/selectionpage.html" class="back-button">← Back to Journal</a>
        `;
        return;
    }

    // Check if this is flowform data
    if (!flowformData.entries) {
        container.innerHTML = `
            <div class="entry-header">
                <h1 class="entry-date">${entry.title}</h1>
                <p class="entry-subtitle">Created ${new Date(entry.created_at).toLocaleDateString()}</p>
            </div>
            <div class="text-entry">${entry.content}</div>
            <a href="/pages/selectionpage.html" class="back-button">← Back to Journal</a>
        `;
        return;
    }

    // Display flowform data in scrapbook format
    const entryDate = new Date(flowformData.date);
    const categoryNames = {
        mood: 'My Mood',
        gratitude: 'Grateful For',
        event: 'What Happened',
        accomplishment: 'Accomplished',
        idea: 'Ideas & Thoughts',
        quote: 'Memorable Quotes',
        picture: 'Pictures & Memories'
    };

    let html = `
        <div class="entry-header">
            <h1 class="entry-date">${entryDate.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })}</h1>
            <p class="entry-subtitle">A day in my life</p>
        </div>
    `;

    // Display each category with entries
    Object.entries(flowformData.entries).forEach(([categoryKey, entries]) => {
        if (entries.length > 0) {
            const categoryName = categoryNames[categoryKey] || categoryKey;

            html += `
                <div class="category-section">
                    <div class="category-header">
                        <h2 class="category-title">${categoryName}</h2>
                        <span class="category-count">${entries.length}</span>
                    </div>
                    <div class="entry-items">
            `;

            entries.forEach(entry => {
                const timestamp = new Date(entry.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                });

                if (categoryKey === 'mood') {
                    html += `
                        <div class="entry-item">
                            <div class="entry-timestamp">${timestamp}</div>
                            <div class="mood-entry">
                                <div class="mood-emoji">${entry.emoji || '😊'}</div>
                                <div class="mood-details">
                                    <div class="mood-name">${entry.text}</div>
                                    ${entry.context ? `<div class="mood-context">"${entry.context}"</div>` : ''}
                                </div>
                            </div>
                        </div>
                    `;
                } else if (categoryKey === 'picture') {
                    html += `
                        <div class="entry-item">
                            <div class="entry-timestamp">${timestamp}</div>
                            <div class="picture-entry">
                                ${entry.imageData ? `<img src="${entry.imageData}" alt="Memory" class="picture-image">` : ''}
                                <p class="picture-caption">${entry.text}</p>
                            </div>
                        </div>
                    `;
                } else {
                    html += `
                        <div class="entry-item">
                            <div class="entry-timestamp">${timestamp}</div>
                            <p class="text-entry">${entry.text}</p>
                        </div>
                    `;
                }
            });

            html += `
                    </div>
                </div>
            `;
        }
    });

    // Check if no entries exist
    const hasAnyEntries = Object.values(flowformData.entries).some(arr => arr.length > 0);
    if (!hasAnyEntries) {
        html += '<div class="no-entries">No entries for this day</div>';
    }

    html += '<a href="/pages/selectionpage.html" class="back-button">← Back to Journal</a>';

    container.innerHTML = html;
}

// Show error message
function showError(message) {
    const container = document.getElementById('entryContent');
    container.innerHTML = `
        <div class="entry-header">
            <h1 class="entry-date">Error</h1>
        </div>
        <div class="no-entries">${message}</div>
        <a href="/pages/selectionpage.html" class="back-button">← Back to Journal</a>
    `;
}