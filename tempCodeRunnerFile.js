const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Shriya@237',
    database: 'info_portal'
});

db.connect(err => {
    if (err) throw err;
    console.log('MySQL Connected...');
});
