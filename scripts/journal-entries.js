let allEntries = [];

window.onload = async function() {
    await checkAuthStatus();
    await loadEntries();
};

async function checkAuthStatus() {
    try {
        const response = await fetch('/api/auth/status', {
            credentials: 'include'
        });
        const data = await response.json();

        if (!data.authenticated) {
            alert('Please log in to view your journal entries');
            window.location.href = '/pages/login.html';
        }
    } catch (error) {
        console.error('Auth check failed:', error);
        window.location.href = '/pages/login.html';
    }
}

async function loadEntries() {
    try {
        const response = await fetch('/api/entries', {
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('Failed to fetch entries');
        }

        allEntries = await response.json();
        displayEntries(allEntries);

        // Hide loading, show content
        document.getElementById('loading').style.display = 'none';

        if (allEntries.length === 0) {
            document.getElementById('no-entries').style.display = 'block';
            document.getElementById('entries-list').style.display = 'none';
        } else {
            document.getElementById('no-entries').style.display = 'none';
            document.getElementById('entries-list').style.display = 'block';
        }
    } catch (error) {
        console.error('Error loading entries:', error);
        document.getElementById('loading').innerHTML = 'Error loading entries. Please refresh the page.';
    }
}

function displayEntries(entries) {
    const entriesList = document.getElementById('entries-list');

    if (entries.length === 0) {
        entriesList.innerHTML = '<div class="no-results">No entries match your search.</div>';
        return;
    }

    entriesList.innerHTML = entries.map(entry => {
        const date = new Date(entry.created_at).toLocaleString();
        const preview = entry.content.substring(0, 200) + (entry.content.length > 200 ? '...' : '');

        return `
            <div class="entry-card" onclick="viewFullEntry(${entry.id})">
                <div class="entry-header">
                    <h3 class="entry-title">${escapeHtml(entry.title)}</h3>
                    <span class="entry-date">${date}</span>
                </div>
                <div class="entry-preview">${escapeHtml(preview)}</div>
                <div class="entry-actions" onclick="event.stopPropagation()">
                    <button onclick="viewFullEntry(${entry.id})">Read Full Entry</button>
                    <button onclick="editEntry(${entry.id})">Edit</button>
                    <button onclick="deleteEntry(${entry.id})" class="delete-button">Delete</button>
                </div>
            </div>
        `;
    }).join('');
}

function searchEntries() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();

    if (!searchTerm.trim()) {
        displayEntries(allEntries);
        return;
    }

    const filteredEntries = allEntries.filter(entry =>
        entry.title.toLowerCase().includes(searchTerm) ||
        entry.content.toLowerCase().includes(searchTerm)
    );

    displayEntries(filteredEntries);
}

function viewFullEntry(entryId) {
    const entry = allEntries.find(e => e.id === entryId);
    if (!entry) return;

    // Create modal HTML
    const modal = document.createElement('div');
    modal.className = 'entry-modal';
    modal.innerHTML = `
        <div class="entry-modal-content">
            <span class="entry-modal-close" onclick="closeModal()">&times;</span>
            <h3>${escapeHtml(entry.title)}</h3>
            <div class="entry-date">${new Date(entry.created_at).toLocaleString()}</div>
            <div class="entry-modal-content-text">${escapeHtml(entry.content)}</div>
        </div>
    `;

    document.body.appendChild(modal);
    modal.style.display = 'block';

    // Close modal when clicking outside
    modal.onclick = function(event) {
        if (event.target === modal) {
            closeModal();
        }
    };
}

function closeModal() {
    const modal = document.querySelector('.entry-modal');
    if (modal) {
        modal.remove();
    }
}

async function editEntry(entryId) {
    const entry = allEntries.find(e => e.id === entryId);
    if (!entry) return;

    // For now, redirect to freeform with entry data in sessionStorage
    // This is a simple approach - you could create a dedicated edit page later
    sessionStorage.setItem('editEntry', JSON.stringify(entry));
    window.location.href = '/pages/freeform.html?edit=true';
}

async function deleteEntry(entryId) {
    const entry = allEntries.find(e => e.id === entryId);
    if (!entry) return;

    if (!confirm(`Are you sure you want to delete "${entry.title}"? This action cannot be undone.`)) {
        return;
    }

    try {
        const response = await fetch(`/api/entries/${entryId}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        if (response.ok) {
            alert('Entry deleted successfully');
            await loadEntries(); // Reload the entries
        } else {
            const data = await response.json();
            alert(data.error || 'Failed to delete entry');
        }
    } catch (error) {
        console.error('Delete error:', error);
        alert('Failed to delete entry. Please try again.');
    }
}

async function downloadCompleteJournal() {
    if (allEntries.length === 0) {
        alert('You have no entries to download yet!');
        return;
    }

    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Reverse entries to show oldest first in PDF
        const entriesForPDF = [...allEntries].reverse();

        entriesForPDF.forEach((entry, index) => {
            if (index > 0) {
                doc.addPage();
            }

            // Add parchment-like styling
            doc.setFillColor(237, 224, 200);
            doc.rect(0, 0, 210, 297, 'F');

            // Add title
            doc.setTextColor(74, 44, 32);
            doc.setFontSize(16);
            doc.setFont(undefined, 'bold');
            doc.text(entry.title, 20, 30);

            // Add date
            doc.setFontSize(12);
            doc.setFont(undefined, 'normal');
            let entryDate = new Date(entry.created_at).toLocaleString();
            doc.text(`Created: ${entryDate}`, 20, 40);

            // Add ruled lines and content
            addJournalContent(doc, entry.content, 55);
        });

        // Download the complete journal
        doc.save('my-complete-journal.pdf');

        alert(`Downloaded complete journal with ${entriesForPDF.length} entries!`);
    } catch (error) {
        console.error('Error creating journal PDF:', error);
        alert('Failed to create journal PDF. Please try again.');
    }
}

// Helper function from freeform script for PDF content
function addJournalContent(doc, content, startY) {
    doc.setTextColor(74, 44, 32);
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');

    // Add subtle ruled lines
    doc.setDrawColor(139, 108, 66);
    doc.setLineWidth(0.1);

    let y = startY;
    const lineHeight = 7;
    const maxWidth = 170;
    const pageHeight = 280;

    // Draw ruled lines
    for (let lineY = startY; lineY < pageHeight; lineY += lineHeight) {
        doc.line(20, lineY, 190, lineY);
    }

    if (content.trim()) {
        // Split text to fit within margins and lines
        const lines = doc.splitTextToSize(content, maxWidth);

        lines.forEach(line => {
            if (y > pageHeight - 20) {
                doc.addPage();
                doc.setFillColor(237, 224, 200);
                doc.rect(0, 0, 210, 297, 'F');
                y = 30;

                // Draw ruled lines on new page
                for (let lineY = 30; lineY < pageHeight; lineY += lineHeight) {
                    doc.line(20, lineY, 190, lineY);
                }
            }

            doc.text(line, 22, y);
            y += lineHeight;
        });
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function goBack() {
    window.location.href = '/pages/selectionpage.html';
}

function goToFreeform() {
    window.location.href = '/pages/freeform.html';
}