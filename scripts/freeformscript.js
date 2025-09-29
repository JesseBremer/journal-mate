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
    generateAutoDateTime();

    // Load saved content from localStorage
    loadFromLocalStorage();

    // Setup auto-save
    setupAutoSave();

    // Setup word count
    setupWordCount();

    // Check authentication status
    checkAuthStatus();
  };

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

  // Global variable to store uploaded PDF data
  let uploadedPDFData = null;

  // Handle PDF upload
  async function handlePDFUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      uploadedPDFData = arrayBuffer;

      // Show success message
      document.querySelector('.upload-info').textContent =
        `✅ Loaded "${file.name}" - ready to append new entries!`;
      document.querySelector('.upload-info').style.color = '#4a2c20';
      document.querySelector('.upload-info').style.fontWeight = 'bold';
    } catch (error) {
      alert('Error reading PDF file. Please make sure it\'s a valid PDF.');
      console.error('PDF upload error:', error);
    }
  }

  // PDF Generation functions
  function downloadAsPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    let titleValue = document.getElementById('title').value || 'Untitled Entry';
    let entryValue = document.getElementById('journal-entry').value;

    // Add parchment-like styling
    doc.setFillColor(237, 224, 200); // Parchment color
    doc.rect(0, 0, 210, 297, 'F'); // Fill entire page

    // Add title
    doc.setTextColor(74, 44, 32); // Dark brown text
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text(titleValue, 20, 30);

    // Add ruled lines and text
    addJournalContent(doc, entryValue, 45);

    // Download the PDF
    let currentDate = new Date().toISOString().split('T')[0];
    doc.save(`journal-entry-${currentDate}.pdf`);

    // Clear localStorage after successful download
    clearLocalStorage();
  }

  async function appendToPDF() {
    let titleValue = document.getElementById('title').value || 'Untitled Entry';
    let entryValue = document.getElementById('journal-entry').value;

    if (!entryValue.trim()) {
      alert('Please write something before appending to your journal!');
      return;
    }

    if (uploadedPDFData) {
      // Use uploaded PDF method
      await appendToUploadedPDF(titleValue, entryValue);
    } else {
      // Use localStorage method (original functionality)
      await appendToLocalStoragePDF(titleValue, entryValue);
    }
  }

  async function appendToUploadedPDF(titleValue, entryValue) {
    try {
      // Load the existing PDF using pdf-lib
      const existingPdfDoc = await PDFLib.PDFDocument.load(uploadedPDFData);

      // Create new page with our entry
      const newPage = existingPdfDoc.addPage([595.28, 841.89]); // A4 size

      // Add parchment background (approximate with light fill)
      newPage.drawRectangle({
        x: 0,
        y: 0,
        width: 595.28,
        height: 841.89,
        color: PDFLib.rgb(0.93, 0.88, 0.78), // Parchment color
      });

      // Add ruled lines
      const lineColor = PDFLib.rgb(0.55, 0.42, 0.26);
      for (let y = 750; y > 50; y -= 20) {
        newPage.drawLine({
          start: { x: 60, y: y },
          end: { x: 535, y: y },
          thickness: 0.5,
          color: lineColor,
        });
      }

      // Add title
      newPage.drawText(titleValue, {
        x: 60,
        y: 780,
        size: 16,
        color: PDFLib.rgb(0.29, 0.17, 0.13),
      });

      // Add date
      const entryDate = new Date().toLocaleString();
      newPage.drawText(`Added: ${entryDate}`, {
        x: 60,
        y: 760,
        size: 10,
        color: PDFLib.rgb(0.29, 0.17, 0.13),
      });

      // Add content (simple text wrapping)
      const lines = wrapText(entryValue, 70); // Approximate character limit per line
      let yPos = 730;

      lines.forEach((line) => {
        if (yPos > 60) {
          newPage.drawText(line, {
            x: 65,
            y: yPos,
            size: 12,
            color: PDFLib.rgb(0.29, 0.17, 0.13),
          });
          yPos -= 20;
        }
      });

      // Save and download
      const pdfBytes = await existingPdfDoc.save();
      downloadPDFBytes(pdfBytes, 'my-journal.pdf');

      // Clear current entry
      clearLocalStorage();

      alert('Entry successfully added to your journal PDF!');
    } catch (error) {
      alert('Error appending to PDF. The file might be corrupted or password-protected.');
      console.error('PDF append error:', error);
    }
  }

  async function appendToLocalStoragePDF(titleValue, entryValue) {
    try {
      // First, save the current entry to the database
      const saveResponse = await fetch('/api/entries', {
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

      if (!saveResponse.ok) {
        throw new Error('Failed to save entry to database');
      }

      // Get all entries from the database
      const entriesResponse = await fetch('/api/entries', {
        credentials: 'include'
      });

      if (!entriesResponse.ok) {
        throw new Error('Failed to fetch entries from database');
      }

      const entries = await entriesResponse.json();

      // Generate PDF with all entries
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();

      entries.reverse().forEach((entry, index) => { // Reverse to show oldest first
        if (index > 0) {
          doc.addPage(); // New page for each entry except the first
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
      doc.save('my-journal.pdf');

      // Clear current entry from localStorage and form
      clearLocalStorage();
      document.getElementById('title').value = '';
      document.getElementById('journal-entry').value = '';
      generateAutoDateTime();

      alert(`Entry added to journal! Your journal now contains ${entries.length} entries.`);
    } catch (error) {
      console.error('Error creating journal PDF:', error);
      alert('Failed to create journal PDF. Please try again.');
    }
  }

  // Helper functions
  function wrapText(text, maxChars) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    words.forEach(word => {
      if ((currentLine + word).length <= maxChars) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    });

    if (currentLine) lines.push(currentLine);
    return lines;
  }

  function downloadPDFBytes(pdfBytes, filename) {
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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