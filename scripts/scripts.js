function storeEntry() {
    // Get form elements by their IDs
    var entryTitle = document.getElementById('title');
    var journalEntry = document.getElementById('journal-entry');

    // Get values from the form inputs
    var titleValue = entryTitle.value;
    var entryValue = journalEntry.value;

    var formData = "Title: " + titleValue + "\nEntry: " + entryValue;


    console.table(formData)
};

function downloadFormData() {
    // Get form elements by their IDs
    var entryTitle = document.getElementById('title');
    var journalEntry = document.getElementById('journal-entry');
  
    // Get values from the form inputs
    var titleValue = entryTitle.value;
    var entryValue = journalEntry.value;
  
    // Create a data string with the form inputs
    var formData = "Title: " + titleValue + "\nEntry: " + entryValue;
  
    // Convert the formData string to an array buffer
    var dataArrayBuffer = new TextEncoder().encode(formData);
  
    // Create a Blob containing the data
    var downloadedEntry = new Blob([dataArrayBuffer], { type: "text/plain" });
  
    // Create a download link
    var a = document.createElement("a");
  
    // Generate a filename based on the title and current date
    var currentDate = new Date();
    var formattedDate = currentDate.toISOString().split('T')[0]; // Get YYYY-MM-DD
    var fileName = titleValue.trim().replace(/\s+/g, '-') + '-' + formattedDate + '.txt';
  
    a.href = URL.createObjectURL(downloadedEntry);
    a.download = fileName;
  
    // Append the link to the document and trigger the click event
    document.body.appendChild(a);
    a.click();
  
    // Remove the link from the document
    document.body.removeChild(a);
  }