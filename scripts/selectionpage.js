function preferenceChoice(event) {
    if (event === 1) {
        window.location.href = '/pages/freeform.html';
    } else if (event === 2) {
        window.location.href = '/pages/flowform.html';
    } else if (event === 3) {
        // Rigid form not implemented yet - show coming soon message
        alert('Rigid Form journaling coming soon! Please try Freeform or Flowform for now.');
    }
}