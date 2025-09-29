// Daily entry structure for flowform
let currentDayEntry = {
  date: null,
  entries: {
    mood: [],
    gratitude: [],
    event: [],
    accomplishment: [],
    idea: [],
    quote: [],
    picture: []
  }
};

// Category configurations
const categories = {
  1: { key: 'mood', name: 'Mood', prompt: 'How are you feeling right now?' },
  2: { key: 'gratitude', name: 'Gratitude', prompt: 'What are you grateful for?' },
  3: { key: 'event', name: 'Event', prompt: 'What happened today?' },
  4: { key: 'accomplishment', name: 'Accomplishment', prompt: 'What did you accomplish?' },
  5: { key: 'idea', name: 'Idea', prompt: 'What idea came to mind?' },
  6: { key: 'quote', name: 'Quote', prompt: 'Share a meaningful quote:' },
  7: { key: 'picture', name: 'Picture', prompt: 'Describe a moment you want to remember:' }
};

// Initialize daily entry on page load
function initializeDayEntry() {
  const today = new Date().toDateString();
  const savedEntry = localStorage.getItem(`flowform_${today}`);

  if (savedEntry) {
    currentDayEntry = JSON.parse(savedEntry);
  } else {
    currentDayEntry.date = today;
    saveDayEntry();
  }
}

// Save entry to localStorage
function saveDayEntry() {
  localStorage.setItem(`flowform_${currentDayEntry.date}`, JSON.stringify(currentDayEntry));
}

// Handle category button clicks
function handleButtonClick(buttonNumber) {
  if (buttonNumber === 8) {
    showOverview();
    return;
  }

  const category = categories[buttonNumber];
  if (!category) return;

  showCategoryInput(category);
}

// Mood options for quick selection (organized as a sliding scale: green → yellow → orange → red)
const moodOptions = [
  { emoji: '😇', name: 'Peaceful', color: '#4caf50' },
  { emoji: '😍', name: 'Grateful', color: '#66bb6a' },
  { emoji: '😊', name: 'Happy', color: '#8bc34a' },
  { emoji: '🤗', name: 'Excited', color: '#cddc39' },
  { emoji: '😌', name: 'Content', color: '#ffeb3b' },
  { emoji: '🤔', name: 'Thoughtful', color: '#ffc107' },
  { emoji: '😑', name: 'Neutral', color: '#ff9800' },
  { emoji: '😴', name: 'Tired', color: '#ff7043' },
  { emoji: '😰', name: 'Anxious', color: '#ff5722' },
  { emoji: '😤', name: 'Frustrated', color: '#f44336' },
  { emoji: '😢', name: 'Sad', color: '#d32f2f' },
  { emoji: '😠', name: 'Angry', color: '#b71c1c' }
];

// Show input interface for a category
function showCategoryInput(category) {
  const content = document.querySelector('.flowform-content');

  // Special handling for mood category
  if (category.key === 'mood') {
    showMoodSelection(category);
    return;
  }

  // Special handling for picture category
  if (category.key === 'picture') {
    showPictureUpload(category);
    return;
  }

  content.innerHTML = `
    <div class="button-column">
      <div class="title">
        <h2>${category.name}</h2>
      </div>
      <div class="input-section">
        <p class="prompt">${category.prompt}</p>
        <textarea id="categoryInput" class="category-input" placeholder="Share your thoughts..." rows="4"></textarea>
        <div class="button-row">
          <div class="button save-button" onclick="saveEntry('${category.key}')">
            <p>Save</p>
          </div>
          <div class="button cancel-button" onclick="returnToMain()">
            <p>Cancel</p>
          </div>
        </div>
        ${currentDayEntry.entries[category.key].length > 0 ?
          `<div class="previous-entries">
            <h3>Today's ${category.name} entries:</h3>
            <ul>
              ${currentDayEntry.entries[category.key].map((entry, index) =>
                `<li onclick="deleteEntry('${category.key}', ${index})" class="entry-item">
                  ${entry.text}
                  <span class="delete-hint">(click to delete)</span>
                  <small class="timestamp">${new Date(entry.timestamp).toLocaleTimeString()}</small>
                </li>`
              ).join('')}
            </ul>
          </div>` : ''
        }
      </div>
    </div>
  `;
}

// Show mood selection interface
function showMoodSelection(category) {
  const content = document.querySelector('.flowform-content');
  content.innerHTML = `
    <div class="button-column">
      <div class="title">
        <h2>${category.name}</h2>
      </div>
      <div class="input-section">
        <p class="prompt">${category.prompt}</p>
        <div class="mood-grid">
          ${moodOptions.map(mood =>
            `<div class="mood-option" onclick="saveMoodEntry('${mood.emoji}', '${mood.name}')" style="border-color: ${mood.color};">
              <div class="mood-emoji">${mood.emoji}</div>
              <div class="mood-name">${mood.name}</div>
            </div>`
          ).join('')}
        </div>
        <div class="button-row">
          <div class="button cancel-button" onclick="returnToMain()">
            <p>← Back to Capture</p>
          </div>
        </div>
        ${currentDayEntry.entries[category.key].length > 0 ?
          `<div class="previous-entries">
            <h3>Today's ${category.name} entries:</h3>
            <ul>
              ${currentDayEntry.entries[category.key].map((entry, index) =>
                `<li onclick="deleteEntry('${category.key}', ${index})" class="entry-item mood-entry-item">
                  <span class="mood-display">${entry.emoji} ${entry.text}</span>
                  ${entry.context ? `<div class="mood-context">"${entry.context}"</div>` : ''}
                  <span class="delete-hint">(click to delete)</span>
                  <small class="timestamp">${new Date(entry.timestamp).toLocaleTimeString()}</small>
                </li>`
              ).join('')}
            </ul>
          </div>` : ''
        }
      </div>
    </div>
  `;
}

// Save mood entry (special handling for mood selection)
function saveMoodEntry(emoji, moodName) {
  // Show context prompt after mood selection
  showMoodContext(emoji, moodName);
}

// Show mood context input
function showMoodContext(emoji, moodName) {
  const content = document.querySelector('.flowform-content');
  content.innerHTML = `
    <div class="button-column">
      <div class="title">
        <h2>You're feeling ${moodName} ${emoji}</h2>
      </div>
      <div class="input-section">
        <p class="prompt">What triggered this feeling? (Optional)</p>
        <textarea id="moodContext" class="category-input" placeholder="e.g., Had a great meeting, received good news, feeling stressed about work..." rows="3"></textarea>
        <div class="button-row">
          <div class="button save-button" onclick="saveMoodWithContext('${emoji}', '${moodName}')">
            <p>Save</p>
          </div>
          <div class="button skip-button" onclick="saveMoodWithContext('${emoji}', '${moodName}', true)">
            <p>Skip & Save</p>
          </div>
          <div class="button cancel-button" onclick="showMoodSelection(categories[1])">
            <p>← Back to Moods</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Save mood with optional context
function saveMoodWithContext(emoji, moodName, skipContext = false) {
  const contextInput = document.getElementById('moodContext');
  const context = skipContext ? '' : contextInput.value.trim();

  currentDayEntry.entries.mood.push({
    text: moodName,
    emoji: emoji,
    context: context,
    timestamp: new Date().toISOString()
  });

  saveDayEntry();
  returnToMain();
}

// Show picture upload interface
function showPictureUpload(category) {
  const content = document.querySelector('.flowform-content');
  content.innerHTML = `
    <div class="button-column">
      <div class="title">
        <h2>${category.name}</h2>
      </div>
      <div class="input-section">
        <p class="prompt">${category.prompt}</p>

        <div class="picture-upload-area">
          <input type="file" id="pictureInput" accept="image/*" style="display: none;" onchange="previewImage(event)">
          <div class="upload-dropzone" onclick="document.getElementById('pictureInput').click()">
            <div class="upload-icon">📸</div>
            <div class="upload-text">Click to select an image</div>
            <div class="upload-hint">or drag and drop</div>
          </div>
          <div id="imagePreview" class="image-preview" style="display: none;">
            <img id="previewImg" src="" alt="Preview">
            <div class="preview-overlay">
              <button class="change-image-btn" onclick="document.getElementById('pictureInput').click()">Change Image</button>
            </div>
          </div>
        </div>

        <textarea id="pictureCaption" class="category-input" placeholder="Add a caption or description (optional)..." rows="3"></textarea>

        <div class="button-row">
          <div class="button save-button" onclick="savePictureEntry()" id="saveButton" style="opacity: 0.5; pointer-events: none;">
            <p>Save</p>
          </div>
          <div class="button cancel-button" onclick="returnToMain()">
            <p>Cancel</p>
          </div>
        </div>

        ${currentDayEntry.entries[category.key].length > 0 ?
          `<div class="previous-entries">
            <h3>Today's ${category.name} entries:</h3>
            <ul>
              ${currentDayEntry.entries[category.key].map((entry, index) =>
                `<li onclick="deleteEntry('${category.key}', ${index})" class="entry-item picture-entry-item">
                  ${entry.imageData ? `<img src="${entry.imageData}" class="thumbnail-image" alt="Entry image">` : ''}
                  <div class="picture-entry-text">
                    ${entry.text || 'No caption'}
                  </div>
                  <span class="delete-hint">(click to delete)</span>
                  <small class="timestamp">${new Date(entry.timestamp).toLocaleTimeString()}</small>
                </li>`
              ).join('')}
            </ul>
          </div>` : ''
        }
      </div>
    </div>
  `;

  // Add drag and drop functionality
  const dropzone = document.querySelector('.upload-dropzone');

  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('drag-over');
  });

  dropzone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dropzone.classList.remove('drag-over');
  });

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('drag-over');

    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith('image/')) {
      const fileInput = document.getElementById('pictureInput');
      fileInput.files = files;
      previewImage({target: fileInput});
    }
  });
}

// Preview uploaded image
function previewImage(event) {
  const file = event.target.files[0];
  if (!file || !file.type.startsWith('image/')) {
    alert('Please select a valid image file.');
    return;
  }

  // Check file size (limit to 5MB)
  if (file.size > 5 * 1024 * 1024) {
    alert('Image size must be less than 5MB.');
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    const preview = document.getElementById('imagePreview');
    const previewImg = document.getElementById('previewImg');
    const dropzone = document.querySelector('.upload-dropzone');
    const saveButton = document.getElementById('saveButton');

    previewImg.src = e.target.result;
    dropzone.style.display = 'none';
    preview.style.display = 'block';

    // Enable save button
    saveButton.style.opacity = '1';
    saveButton.style.pointerEvents = 'auto';
  };
  reader.readAsDataURL(file);
}

// Save picture entry with image data
function savePictureEntry() {
  const fileInput = document.getElementById('pictureInput');
  const caption = document.getElementById('pictureCaption').value.trim();
  const previewImg = document.getElementById('previewImg');

  if (!fileInput.files[0]) {
    alert('Please select an image first.');
    return;
  }

  currentDayEntry.entries.picture.push({
    text: caption || 'Photo',
    imageData: previewImg.src, // Base64 data URL
    imageName: fileInput.files[0].name,
    timestamp: new Date().toISOString()
  });

  saveDayEntry();
  returnToMain();
}

// Save category entry
function saveEntry(categoryKey) {
  const input = document.getElementById('categoryInput');
  const text = input.value.trim();

  if (!text) {
    alert('Please enter some text before saving.');
    return;
  }

  currentDayEntry.entries[categoryKey].push({
    text: text,
    timestamp: new Date().toISOString()
  });

  saveDayEntry();
  returnToMain();
}

// Delete a specific entry
function deleteEntry(categoryKey, index) {
  if (confirm('Delete this entry?')) {
    currentDayEntry.entries[categoryKey].splice(index, 1);
    saveDayEntry();
    showCategoryInput(categories[Object.keys(categories).find(k => categories[k].key === categoryKey)]);
  }
}

// Return to main flowform view
function returnToMain() {
  location.reload();
}

// Show overview of all day's entries
function showOverview() {
  const content = document.querySelector('.flowform-content');

  const hasEntries = Object.values(currentDayEntry.entries).some(arr => arr.length > 0);

  if (!hasEntries) {
    content.innerHTML = `
      <div class="button-column">
        <div class="title">
          <h2>Daily Overview</h2>
        </div>
        <div class="overview-section">
          <p class="no-entries">No entries for today yet. Start capturing moments!</p>
          <div class="button back-button" onclick="returnToMain()">
            <p>← Back to Capture</p>
          </div>
        </div>
      </div>
    `;
    return;
  }

  let overviewHTML = `
    <div class="button-column overview-column">
      <div class="title">
        <h2>Daily Overview</h2>
        <p class="overview-date">${new Date(currentDayEntry.date).toLocaleDateString()}</p>
      </div>
      <div class="overview-section">
  `;

  Object.entries(currentDayEntry.entries).forEach(([key, entries]) => {
    if (entries.length > 0) {
      const categoryName = Object.values(categories).find(cat => cat.key === key).name;
      overviewHTML += `
        <div class="overview-category">
          <h3>${categoryName} (${entries.length})</h3>
          <ul class="overview-list">
            ${entries.map(entry => `
              <li class="overview-item ${key === 'mood' ? 'mood-overview-item' : ''} ${key === 'picture' ? 'picture-overview-item' : ''}">
                <div class="overview-entry-content">
                  ${key === 'picture' && entry.imageData ? `<img src="${entry.imageData}" class="overview-image" alt="Entry image">` : ''}
                  <span class="entry-text">
                    ${key === 'mood' && entry.emoji ? `${entry.emoji} ` : ''}${entry.text}
                  </span>
                  ${key === 'mood' && entry.context ? `<div class="mood-context-overview">"${entry.context}"</div>` : ''}
                </div>
                <span class="entry-time">${new Date(entry.timestamp).toLocaleTimeString()}</span>
              </li>
            `).join('')}
          </ul>
        </div>
      `;
    }
  });

  overviewHTML += `
        <div class="overview-actions">
          <div class="button save-to-server-button" onclick="saveToServer()">
            <p>Save to Journal</p>
          </div>
          <div class="button back-button" onclick="returnToMain()">
            <p>← Back to Capture</p>
          </div>
        </div>
      </div>
    </div>
  `;

  content.innerHTML = overviewHTML;
}

// Save current day's entries to server
async function saveToServer() {
  const hasEntries = Object.values(currentDayEntry.entries).some(arr => arr.length > 0);

  if (!hasEntries) {
    alert('No entries to save.');
    return;
  }

  console.log('Saving to server...', currentDayEntry);

  try {
    const response = await fetch('/api/entries', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include', // Include cookies for session
      body: JSON.stringify({
        title: `Daily Journal - ${new Date(currentDayEntry.date).toLocaleDateString()}`,
        content: JSON.stringify(currentDayEntry)
      })
    });

    const responseData = await response.json();
    console.log('Server response:', response.status, responseData);

    if (response.ok) {
      alert('Journal saved successfully!');
      localStorage.removeItem(`flowform_${currentDayEntry.date}`);
      // Reset for tomorrow
      initializeDayEntry();
      returnToMain();
    } else {
      console.error('Save failed:', responseData);
      if (response.status === 401) {
        alert('Please log in first to save your journal.');
        window.location.href = '/pages/login.html';
      } else {
        alert(`Failed to save journal: ${responseData.error || 'Unknown error'}`);
      }
    }
  } catch (error) {
    console.error('Error saving journal:', error);
    alert('Error saving journal. Please check your connection and try again.');
  }
}

// Auto-save functionality
function setupAutoSave() {
  const now = new Date();
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
  const timeUntilMidnight = tomorrow.getTime() - now.getTime() - 1000; // 1 second before midnight

  setTimeout(() => {
    // Auto-save at 11:59:59 PM
    if (Object.values(currentDayEntry.entries).some(arr => arr.length > 0)) {
      saveToServer();
    }

    // Set up daily recurring auto-save
    setInterval(() => {
      if (Object.values(currentDayEntry.entries).some(arr => arr.length > 0)) {
        saveToServer();
      }
    }, 24 * 60 * 60 * 1000); // Every 24 hours
  }, timeUntilMidnight);
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
  initializeDayEntry();
  setupAutoSave();
});

  // Navigation function
  function goBack() {
    window.location.href = '/pages/selectionpage.html';
  }