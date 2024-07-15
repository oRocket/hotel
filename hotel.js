const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const app = express();

// Middleware setup
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Database connection setup
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'password', // Replace with your MariaDB password
    database: 'hotel_db',
    port: 3306
});

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MariaDB:', err);
        return;
    }
    console.log('Connected to MariaDB as id', connection.threadId);

    // Create bookings table
    connection.query(`
        CREATE TABLE IF NOT EXISTS bookings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            full_name VARCHAR(100) NOT NULL,
            email VARCHAR(100) NOT NULL,
            phone_number VARCHAR(20) NOT NULL,
            check_in_date DATE NOT NULL,
            check_out_date DATE NOT NULL,
            guests INT NOT NULL,
            room_type VARCHAR(50) NOT NULL
        )
    `, (err, results, fields) => {
        if (err) {
            console.error('Error creating bookings table:', err);
            return;
        }
        console.log('Bookings table created successfully');
    });

    // Create rooms table
    connection.query(`
        CREATE TABLE IF NOT EXISTS rooms (
            id INT AUTO_INCREMENT PRIMARY KEY,
            room_number VARCHAR(50) NOT NULL,
            type VARCHAR(50) NOT NULL,
            price DECIMAL(10, 2) NOT NULL,
            capacity INT NOT NULL,
            description TEXT
        )
    `, (err, results, fields) => {
        if (err) {
            console.error('Error creating rooms table:', err);
            return;
        }
        console.log('Rooms table created successfully');
    });

    // Optionally close the connection after creating tables
    // connection.end();
});

// Route to handle form submission
app.post('/book', (req, res) => {
    const { name, email, phone_number, check_in_date, check_out_date, guests, room_type } = req.body;

    // Debugging log to check received form data
    console.log(req.body);

    if (!name || !email || !phone_number || !check_in_date || !check_out_date || !guests || !room_type) {
        return res.status(400).send('All fields are required.');
    }

    connection.query(
        'INSERT INTO bookings (full_name, email, phone_number, check_in_date, check_out_date, guests, room_type) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [name, email, phone_number, check_in_date, check_out_date, guests, room_type],
        (err, results, fields) => {
            if (err) {
                console.error('Error inserting booking:', err);
                if (err.code === 'ER_DATA_TOO_LONG') {
                    return res.status(400).send('One or more fields contain too many characters.');
                }
                return res.status(500).send('Error booking your room. Please try again later.');
            }
            res.send('Booking successful!');
        }
    );
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

connection.on('error', (err) => {
    console.error('Database error:', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        console.error('Database connection lost. Reconnecting...');
        connection.connect();
    } else {
        throw err;
    }
});
