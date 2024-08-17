const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const app = express();

// Middleware to parse URL-encoded bodies and JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Folder where files will be stored
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Append timestamp to file name
    }
});
const upload = multer({ storage });

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Shriya@237',
    database: 'info_portal'
});

db.connect(err => {
    if (err) throw err;
    console.log('MySQL Connected..');
});

// Register admin
app.post('/register', (req, res) => {
    const { username, password } = req.body;

    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
            console.error('Error hashing password:', err);
            return res.status(500).send('Server error');
        }

        
        db.query('INSERT INTO admin (username, password) VALUES (?, ?)', [username, hashedPassword], (err, result) => {
            if (err) {
                console.error('Database query error:', err);
                return res.status(500).send('Server error');
            }
            res.send('User registered successfully!');
        });
    });
});

// Handle login POST request
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    db.query('SELECT * FROM admin WHERE username = ?', [username], (err, results) => {
        if (err) {
            console.error('Database query error:', err);
            return res.status(500).send('Server error');
        }

        if (results.length && bcrypt.compareSync(password, results[0].password)) {
            res.redirect('/upload');
        } else {
            res.send('Invalid credentials.');
        }
    });
});

// Serve the upload page
app.get('/upload', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'upload.html'));
});

// Handle file upload POST request
app.post('/materials/upload', upload.fields([
    { name: 'pdf_files[]', maxCount: 10 },
    { name: 'text_files[]', maxCount: 10 }
]), (req, res) => {
    const { title, date } = req.body;
    const pdfFiles = req.files['pdf_files[]'] || [];
    const textFiles = req.files['text_files[]'] || [];
    const urls = req.body.urls || [];

    // Insert file metadata into the database
    pdfFiles.forEach(file => {
        const query = 'INSERT INTO materials (title, type, url, date, filename) VALUES (?, ?, ?, ?, ?)';
        db.query(query, [title, 'pdf', '', date, file.filename], (err, result) => {
            if (err) {
                console.error('Database query error:', err);
                return res.status(500).send('Server error');
            }
        });
    });

    textFiles.forEach(file => {
        const query = 'INSERT INTO materials (title, type, url, date, filename) VALUES (?, ?, ?, ?, ?)';
        db.query(query, [title, 'text', '', date, file.filename], (err, result) => {
            if (err) {
                console.error('Database query error:', err);
                return res.status(500).send('Server error');
            }
        });
    });

    urls.forEach(url => {
        const query = 'INSERT INTO materials (title, type, url, date, filename) VALUES (?, ?, ?, ?, ?)';
        db.query(query, [title, 'url', url, date, ''], (err, result) => {
            if (err) {
                console.error('Database query error:', err);
                return res.status(500).send('Server error');
            }
        });
    });

    res.redirect('/class-notes.html');
});
app.get('/class-notes.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'class-notes.html'));
});


// Handle getting materials
app.get('/api/materials', (req, res) => {
    db.query('SELECT * FROM materials ORDER BY date DESC', (err, results) => {
        if (err) {
            console.error('Database query error:', err);
            return res.status(500).send('Server error');
        }
        res.json(results);
    });
});

app.listen(5000, () => {
    console.log('Server started on http://localhost:5000');
});
