const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const session = require('express-session');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
  secret: 'journal-mate-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true if using HTTPS
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  }
}));

// Serve static files from the current directory
app.use(express.static(__dirname));

// Initialize SQLite database
const db = new sqlite3.Database('./journal.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database.');
    initializeTables();
  }
});

function initializeTables() {
  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Journal entries table
  db.run(`
    CREATE TABLE IF NOT EXISTS journal_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `);

  // Create default user if none exists
  db.get("SELECT COUNT(*) as count FROM users", (err, row) => {
    if (!err && row.count === 0) {
      const defaultPassword = bcrypt.hashSync('password', 10);
      db.run("INSERT INTO users (username, password_hash) VALUES (?, ?)",
        ['example', defaultPassword], (err) => {
          if (!err) {
            console.log('Default user created: username="example", password="password"');
          }
        }
      );
    }
  });
}

// Authentication middleware
function requireAuth(req, res, next) {
  if (req.session.userId) {
    next();
  } else {
    res.status(401).json({ error: 'Authentication required' });
  }
}

// API Routes

// User authentication
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  db.get("SELECT * FROM users WHERE username = ?", [username], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    req.session.userId = user.id;
    req.session.username = user.username;
    res.json({
      success: true,
      user: { id: user.id, username: user.username }
    });
  });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Could not log out' });
    }
    res.json({ success: true });
  });
});

// Check authentication status
app.get('/api/auth/status', (req, res) => {
  if (req.session.userId) {
    res.json({
      authenticated: true,
      user: {
        id: req.session.userId,
        username: req.session.username
      }
    });
  } else {
    res.json({ authenticated: false });
  }
});

// Journal entries CRUD operations

// Get all entries for authenticated user
app.get('/api/entries', requireAuth, (req, res) => {
  db.all(
    "SELECT * FROM journal_entries WHERE user_id = ? ORDER BY created_at DESC",
    [req.session.userId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(rows);
    }
  );
});

// Get single entry
app.get('/api/entries/:id', requireAuth, (req, res) => {
  db.get(
    "SELECT * FROM journal_entries WHERE id = ? AND user_id = ?",
    [req.params.id, req.session.userId],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!row) {
        return res.status(404).json({ error: 'Entry not found' });
      }
      res.json(row);
    }
  );
});

// Create new entry
app.post('/api/entries', requireAuth, (req, res) => {
  const { title, content } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }

  db.run(
    "INSERT INTO journal_entries (user_id, title, content) VALUES (?, ?, ?)",
    [req.session.userId, title, content],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({
        success: true,
        id: this.lastID,
        message: 'Entry saved successfully'
      });
    }
  );
});

// Update entry
app.put('/api/entries/:id', requireAuth, (req, res) => {
  const { title, content } = req.body;

  db.run(
    "UPDATE journal_entries SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?",
    [title, content, req.params.id, req.session.userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Entry not found' });
      }
      res.json({ success: true, message: 'Entry updated successfully' });
    }
  );
});

// Delete entry
app.delete('/api/entries/:id', requireAuth, (req, res) => {
  db.run(
    "DELETE FROM journal_entries WHERE id = ? AND user_id = ?",
    [req.params.id, req.session.userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Entry not found' });
      }
      res.json({ success: true, message: 'Entry deleted successfully' });
    }
  );
});

// Serve the main application
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed.');
    }
    process.exit(0);
  });
});

app.listen(PORT, () => {
  console.log(`Journal-Mate server running on http://localhost:${PORT}`);
});