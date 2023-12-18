function login(event) {
    event.preventDefault();

    // Perform your authentication logic here
    var username = document.getElementById('username').value;
    var password = document.getElementById('password').value;

    // Replace the condition with your actual authentication logic
    if (username === 'example' && password === 'password') {
      // Redirect to another page upon successful login
      window.location.href = 'freeform.html';
    } else {
      alert('Invalid username or password. Please try again.');
    }
  }