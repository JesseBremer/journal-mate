function storeEntry() {
    //eventually this will send data to google drive.
    // Get form elements by their IDs
    let entryTitle = document.getElementById('title');
    let journalEntry = document.getElementById('journal-entry');

    // Get values from the form inputs
    let titleValue = entryTitle.value;
    let entryValue = journalEntry.value;

    let formData = "Title: " + titleValue + "\nEntry: " + entryValue;


    console.table(formData)
};

function downloadFormData() {
    // Get form elements by their IDs
    let entryTitle = document.getElementById('title');
    let journalEntry = document.getElementById('journal-entry');
  
    // Get values from the form inputs
    let titleValue = entryTitle.value;
    let entryValue = journalEntry.value;
  
    // Create a data string with the form inputs
    let formData = "Title: " + titleValue + "\nEntry: " + entryValue;
  
    // Convert the formData string to an array buffer
    let dataArrayBuffer = new TextEncoder().encode(formData);
  
    // Create a Blob containing the data
    let downloadedEntry = new Blob([dataArrayBuffer], { type: "text/plain" });
  
    // Create a download link
    let a = document.createElement("a");
  
    // Generate a filename based on the title and current date
    let currentDate = new Date();
    let formattedDate = currentDate.toISOString().split('T')[0]; // Get YYYY-MM-DD
    let fileName = titleValue.trim().replace(/\s+/g, '-') + '-' + formattedDate + '.txt';
  
    a.href = URL.createObjectURL(downloadedEntry);
    a.download = fileName;
  
    // Append the link to the document and trigger the click event
    document.body.appendChild(a);
    a.click();
  
    // Remove the link from the document
    document.body.removeChild(a);

    // Clear localStorage after successful download
    clearLocalStorage();
  }

  // Auto-populate title with current date/time when page loads
  window.onload = function() {
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

    // Load saved content from localStorage
    loadFromLocalStorage();

    // Setup auto-save
    setupAutoSave();

    // Setup word count
    setupWordCount();
  };

  function generateNewPrompt() {
    // Array of possible placeholder values
    let placeholders = [
        "How am I feeling today?",
    "How does my body feel today?",
    "What am I nervous or anxious about today?",
    "What actions can I take on each of the things that make me nervous or anxious?",
    "What are my top priorities for the day?",
    "What’s something I can do to make today amazing?",
    "What did I learn today? How can I apply this knowledge in the future?",
    "What challenges did I face today? How did I overcome them? What can I learn from these experiences?",
    "What did I do today that brought me joy or fulfillment? How can I incorporate more of these activities into my daily routine?",
    "What was a moment of joy, delight, or contentment today?",
    "What was a small detail I noticed today?",
    "What was the weather like today?",
    "What am I thankful for today?",
    "What could I have done differently today?",
    "How can I make tomorrow even better?"
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