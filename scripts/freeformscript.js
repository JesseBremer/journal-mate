async function storeEntry() {
    // Get form elements by their IDs
    let entryTitle = document.getElementById('title');
    let journalEntry = document.getElementById('journal-entry');

    // Get values from the form inputs
    let titleValue = entryTitle.value || 'Untitled Entry';
    let entryValue = journalEntry.value;

    if (!entryValue.trim()) {
        alert('Please write something before saving your entry!');
        return;
    }

    try {
        const response = await fetch('/api/entries', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
                title: titleValue,
                content: entryValue
            })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            alert('Entry saved successfully to your journal!');
            // Clear the form after successful save
            entryTitle.value = '';
            journalEntry.value = '';
            clearLocalStorage(); // Clear auto-save data

            // Generate new auto-date for next entry
            generateAutoDateTime();
        } else {
            alert(data.error || 'Failed to save entry. Please try again.');
        }
    } catch (error) {
        console.error('Save error:', error);
        alert('Failed to save entry. Please check your connection and try again.');
    }
};

// Function to navigate to all entries view
function viewAllEntries() {
    window.location.href = '/pages/journal-entries.html';
}

  // Auto-populate title with current date/time when page loads
  window.onload = function() {
    // Check if we're in edit mode
    const urlParams = new URLSearchParams(window.location.search);
    const isEditMode = urlParams.get('edit') === 'true';

    if (isEditMode) {
      loadEditEntry();
    } else {
      generateAutoDateTime();
      // Load saved content from localStorage
      loadFromLocalStorage();
    }

    // Setup auto-save
    setupAutoSave();

    // Setup word count
    setupWordCount();

    // Check authentication status
    checkAuthStatus();
  };

  function loadEditEntry() {
    const editEntry = sessionStorage.getItem('editEntry');
    if (editEntry) {
      const entry = JSON.parse(editEntry);
      document.getElementById('title').value = entry.title;
      document.getElementById('journal-entry').value = entry.content;

      // Store entry ID for updating
      window.editingEntryId = entry.id;

      // Update button text
      const saveButton = document.querySelector('button[onclick="storeEntry()"]');
      if (saveButton) {
        saveButton.textContent = 'Update Entry';
        saveButton.onclick = updateEntry;
      }

      // Clear from sessionStorage
      sessionStorage.removeItem('editEntry');
    }
  }

  async function updateEntry() {
    if (!window.editingEntryId) {
      return storeEntry(); // Fall back to creating new entry
    }

    let titleValue = document.getElementById('title').value || 'Untitled Entry';
    let entryValue = document.getElementById('journal-entry').value;

    if (!entryValue.trim()) {
        alert('Please write something before updating your entry!');
        return;
    }

    try {
        const response = await fetch(`/api/entries/${window.editingEntryId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
                title: titleValue,
                content: entryValue
            })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            alert('Entry updated successfully!');
            // Redirect back to entries view
            window.location.href = '/pages/journal-entries.html';
        } else {
            alert(data.error || 'Failed to update entry. Please try again.');
        }
    } catch (error) {
        console.error('Update error:', error);
        alert('Failed to update entry. Please check your connection and try again.');
    }
  }

  function generateAutoDateTime() {
    let titleInput = document.getElementById('title');
    if (!titleInput.value) {
      let now = new Date();
      let formattedDateTime = now.toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      titleInput.value = formattedDateTime;
    }
  }

  async function checkAuthStatus() {
    try {
      const response = await fetch('/api/auth/status', {
        credentials: 'include'
      });
      const data = await response.json();

      if (!data.authenticated) {
        alert('Please log in to use Journal-Mate');
        window.location.href = '/pages/login.html';
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    }
  }

  function generateNewPrompt() {
    // Psychology-backed prompts for enhanced well-being and self-reflection
    let placeholders = [
        // Gratitude & Positive Psychology
        "Write about three things you're genuinely grateful for today and why they matter to you.",
        "Describe a moment today when you felt truly alive and engaged. What were you doing?",
        "What strengths did you use today? How did they help you navigate your day?",
        "Write about someone who made your day better, even in a small way.",

        // Emotional Intelligence & Self-Awareness
        "What emotions have you experienced today? Describe them without judgment.",
        "Write about a time today when you felt completely yourself. What was happening?",
        "What patterns do you notice in your thoughts or reactions today?",
        "Describe a challenging emotion you felt today. What was it trying to tell you?",

        // Growth Mindset & Learning
        "What did you learn about yourself today, even from small interactions?",
        "Describe a mistake or setback today. What growth opportunity does it offer?",
        "What's one thing you did today that moved you closer to who you want to become?",
        "Write about a moment when you stepped outside your comfort zone today.",

        // Meaning & Purpose (Values-based)
        "How did your actions today align with what you value most in life?",
        "What gave your day meaning, even if it seemed ordinary?",
        "Describe a moment when you acted in accordance with your deepest values.",
        "What legacy are you building through your daily choices?",

        // Mindfulness & Present Moment
        "Describe the most beautiful or interesting thing you noticed today using all your senses.",
        "Write about a moment today when you felt completely present. What anchored you there?",
        "What textures, sounds, or smells stood out to you today?",
        "Describe your breathing right now. How does your body feel in this moment?",

        // Relationships & Connection
        "How did you connect with others today, even in small ways?",
        "Write about a conversation that energized or inspired you today.",
        "What did you learn about someone else today that you didn't know before?",
        "How did you show care or kindness to yourself or others today?",

        // Self-Compassion & Acceptance
        "If your best friend had your exact day, what would you tell them?",
        "What would you like to forgive yourself for from today?",
        "Describe how you treated yourself today. What do you notice?",
        "Write yourself a note of encouragement for tomorrow.",

        // Future Self & Intention
        "What do you want to remember about today when you look back in a year?",
        "What intention do you want to set for tomorrow based on today's experiences?",
        "How did today contribute to the person you're becoming?",
        "What question do you want to explore further tomorrow?",

        // Creativity & Wonder
        "What sparked your curiosity today? What made you wonder?",
        "Describe today as if you were writing a story. What was the plot?",
        "What would you do differently if you lived today again?",
        "If today had a soundtrack, what would it be and why?"
    ];

    // Get the textbox element by its ID
    let textbox = document.getElementById('journal-entry');

    // Get a random index from the placeholders array
    let randomIndex = Math.floor(Math.random() * placeholders.length);

    // Change the placeholder to the randomly selected value
    textbox.placeholder = placeholders[randomIndex];
  }

  // Auto-save functionality
  function setupAutoSave() {
    let titleInput = document.getElementById('title');
    let journalEntry = document.getElementById('journal-entry');

    // Save to localStorage every 2 seconds when typing
    let saveTimeout;

    function saveToLocalStorage() {
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(() => {
        localStorage.setItem('journal-title', titleInput.value);
        localStorage.setItem('journal-entry', journalEntry.value);
      }, 2000);
    }

    titleInput.addEventListener('input', saveToLocalStorage);
    journalEntry.addEventListener('input', saveToLocalStorage);
  }

  function loadFromLocalStorage() {
    let titleInput = document.getElementById('title');
    let journalEntry = document.getElementById('journal-entry');

    // Only load if fields are empty (don't override auto-generated title)
    let savedTitle = localStorage.getItem('journal-title');
    let savedEntry = localStorage.getItem('journal-entry');

    if (savedEntry) {
      journalEntry.value = savedEntry;
    }

    // Only override auto-generated title if we have a user-modified one
    if (savedTitle && savedTitle.length > 0) {
      titleInput.value = savedTitle;
    }
  }

  function clearLocalStorage() {
    localStorage.removeItem('journal-title');
    localStorage.removeItem('journal-entry');
  }

  // Word count functionality
  function setupWordCount() {
    let journalEntry = document.getElementById('journal-entry');
    let wordCountElement = document.getElementById('word-count');

    function updateWordCount() {
      let text = journalEntry.value.trim();
      let wordCount = text === '' ? 0 : text.split(/\s+/).length;
      wordCountElement.textContent = wordCount;
    }

    // Update word count on input
    journalEntry.addEventListener('input', updateWordCount);

    // Initial word count update
    updateWordCount();
  }

  // Navigation function
  function goBack() {
    window.location.href = '/pages/selectionpage.html';
  }



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