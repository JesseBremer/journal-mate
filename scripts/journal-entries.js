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

        // Check if this is a flowform entry
        let isFlowform = false;
        let preview = '';

        try {
            const parsedContent = JSON.parse(entry.content);
            if (parsedContent.entries) {
                isFlowform = true;
                // Create a preview showing categories with entries
                const categories = Object.entries(parsedContent.entries)
                    .filter(([key, entries]) => entries.length > 0)
                    .map(([key, entries]) => `${key}: ${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}`)
                    .join(', ');
                preview = categories || 'Daily journal entry';
            }
        } catch (e) {
            // Not JSON, treat as regular text entry
            preview = entry.content.substring(0, 200) + (entry.content.length > 200 ? '...' : '');
        }

        if (!isFlowform && !preview) {
            preview = entry.content.substring(0, 200) + (entry.content.length > 200 ? '...' : '');
        }

        const entryIcon = isFlowform ? '📖' : '📝';
        const viewButtonText = isFlowform ? 'View Scrapbook' : 'Read Full Entry';

        return `
            <div class="entry-card ${isFlowform ? 'flowform-entry' : ''}" onclick="viewFullEntry(${entry.id})">
                <div class="entry-header">
                    <h3 class="entry-title">
                        <span class="entry-icon">${entryIcon}</span>
                        ${escapeHtml(entry.title)}
                    </h3>
                    <span class="entry-date">${date}</span>
                </div>
                <div class="entry-preview">${escapeHtml(preview)}</div>
                <div class="entry-actions" onclick="event.stopPropagation()">
                    <button onclick="viewFullEntry(${entry.id})">${viewButtonText}</button>
                    <button onclick="editEntry(${entry.id})" ${isFlowform ? 'disabled title="Flowform entries cannot be edited"' : ''}>Edit</button>
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

    // Check if this is a flowform entry
    try {
        const parsedContent = JSON.parse(entry.content);
        if (parsedContent.entries) {
            // This is a flowform entry - redirect to scrapbook view
            window.location.href = `/pages/flowform-entry.html?id=${entryId}`;
            return;
        }
    } catch (e) {
        // Not JSON, continue with modal display
    }

    // Create modal HTML for regular text entries
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

            // Check if this is a flowform entry and format accordingly
            try {
                const parsedContent = JSON.parse(entry.content);
                if (parsedContent.entries) {
                    // Handle flowform entry with special single-page layout
                    addFlowformToPDF(doc, parsedContent, 55);
                } else {
                    // Regular text entry
                    addJournalContent(doc, entry.content, 55);
                }
            } catch (e) {
                // Not JSON, treat as regular text entry
                addJournalContent(doc, entry.content, 55);
            }
        });

        // Download the complete journal
        doc.save('my-complete-journal.pdf');

        alert(`Downloaded complete journal with ${entriesForPDF.length} entries!`);
    } catch (error) {
        console.error('Error creating journal PDF:', error);
        alert('Failed to create journal PDF. Please try again.');
    }
}

// Add flowform entry to PDF with single-page layout and embedded images
function addFlowformToPDF(doc, flowformData, startY) {
    const categoryNames = {
        mood: 'My Mood',
        gratitude: 'Grateful For',
        event: 'What Happened',
        accomplishment: 'Accomplished',
        idea: 'Ideas & Thoughts',
        quote: 'Memorable Quotes',
        picture: 'Pictures & Memories'
    };

    let currentY = startY;
    const pageHeight = 280;
    const maxWidth = 170;
    let hasImages = false;
    let imageY = startY; // Track where images should be placed

    // Set text styling
    doc.setTextColor(74, 44, 32);
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');

    // First pass: check if we have images and reserve space
    Object.entries(flowformData.entries).forEach(([categoryKey, entries]) => {
        if (categoryKey === 'picture' && entries.length > 0) {
            hasImages = true;
        }
    });

    // If we have images, use two-column layout
    const textMaxWidth = hasImages ? 85 : maxWidth;
    const imageStartX = hasImages ? 110 : 0;

    // Process each category
    Object.entries(flowformData.entries).forEach(([categoryKey, entries]) => {
        if (entries.length > 0 && currentY < pageHeight - 20) {
            const categoryName = categoryNames[categoryKey] || categoryKey;

            // Category header
            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.text(categoryName.toUpperCase(), 20, currentY);
            currentY += 8;

            doc.setFontSize(9);
            doc.setFont(undefined, 'normal');

            // Category entries
            entries.forEach((entry, index) => {
                if (currentY >= pageHeight - 15) return; // Stop if we're near page bottom

                const time = new Date(entry.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                });

                if (categoryKey === 'mood') {
                    // Just show time and mood name (skip emoji to avoid encoding issues)
                    let moodText = `${time} - ${entry.text}`;
                    let lines = doc.splitTextToSize(moodText, textMaxWidth);

                    lines.forEach(line => {
                        doc.text(line, 22, currentY);
                        currentY += 6;
                    });

                    if (entry.context) {
                        let contextText = `"${entry.context}"`;
                        let contextLines = doc.splitTextToSize(contextText, textMaxWidth - 10);
                        doc.setFont(undefined, 'italic');
                        contextLines.forEach(line => {
                            doc.text(line, 25, currentY);
                            currentY += 5;
                        });
                        doc.setFont(undefined, 'normal');
                    }
                    currentY += 3;

                } else if (categoryKey === 'picture') {
                    // Handle images - embed them in the PDF
                    if (entry.imageData && hasImages && imageY < pageHeight - 80) {
                        try {
                            // Polaroid dimensions - classic 3.5" x 4.2" ratio
                            const polaroidWidth = 45;  // mm (about 1.8 inches)
                            const polaroidHeight = 54; // mm (about 2.1 inches)
                            const imageSize = 35;      // mm (actual photo area)
                            const borderWidth = 5;     // mm (white border)
                            const captionHeight = 14;  // mm (bottom caption area)

                            // Draw white Polaroid background
                            doc.setFillColor(255, 255, 255);
                            doc.rect(imageStartX, imageY, polaroidWidth, polaroidHeight, 'F');

                            // Draw subtle border shadow
                            doc.setFillColor(200, 200, 200);
                            doc.rect(imageStartX + 1, imageY + 1, polaroidWidth, polaroidHeight, 'F');

                            // Draw main white Polaroid
                            doc.setFillColor(255, 255, 255);
                            doc.rect(imageStartX, imageY, polaroidWidth, polaroidHeight, 'F');

                            // Draw thin border line
                            doc.setDrawColor(220, 220, 220);
                            doc.setLineWidth(0.2);
                            doc.rect(imageStartX, imageY, polaroidWidth, polaroidHeight, 'S');

                            // Add the actual image in the photo area (centered)
                            const photoX = imageStartX + borderWidth;
                            const photoY = imageY + borderWidth;
                            doc.addImage(entry.imageData, 'JPEG', photoX, photoY, imageSize, imageSize);

                            // Add timestamp in small text at bottom left of photo
                            doc.setFontSize(6);
                            doc.setTextColor(150, 150, 150);
                            doc.text(time, photoX + 1, photoY + imageSize - 1);

                            // Add caption in the white space below photo (Polaroid style)
                            const captionY = photoY + imageSize + 3;
                            doc.setFontSize(8);
                            doc.setTextColor(80, 80, 80);
                            doc.setFont(undefined, 'normal');

                            let captionText = entry.text || 'Photo';
                            let captionLines = doc.splitTextToSize(captionText, imageSize - 2);

                            // Center the caption text
                            captionLines.forEach((line, lineIndex) => {
                                const textWidth = doc.getTextWidth(line);
                                const textX = photoX + (imageSize - textWidth) / 2;
                                doc.text(line, textX, captionY + (lineIndex * 4));
                            });

                            imageY += polaroidHeight + 8; // Move to next image position
                            doc.setFontSize(9);
                            doc.setTextColor(74, 44, 32); // Reset to normal text color
                        } catch (error) {
                            console.warn('Failed to add image to PDF:', error);
                            // Fallback to text description
                            let pictureText = `${time} - [Photo] ${entry.text}`;
                            let lines = doc.splitTextToSize(pictureText, textMaxWidth);
                            lines.forEach(line => {
                                doc.text(line, 22, currentY);
                                currentY += 6;
                            });
                        }
                    } else {
                        // No image or no space - just show text
                        let pictureText = `${time} - [Photo] ${entry.text}`;
                        let lines = doc.splitTextToSize(pictureText, textMaxWidth);
                        lines.forEach(line => {
                            doc.text(line, 22, currentY);
                            currentY += 6;
                        });
                    }

                } else {
                    // Regular text entries
                    let entryText = `${time} - ${entry.text}`;
                    let lines = doc.splitTextToSize(entryText, textMaxWidth);
                    lines.forEach(line => {
                        doc.text(line, 22, currentY);
                        currentY += 6;
                    });
                    currentY += 2;
                }
            });

            currentY += 5; // Space between categories
        }
    });

    // If no entries, add a note
    const hasAnyEntries = Object.values(flowformData.entries).some(arr => arr.length > 0);
    if (!hasAnyEntries) {
        doc.text('No entries recorded for this day.', 20, currentY);
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