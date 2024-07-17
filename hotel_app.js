const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const crypto = require('crypto');
const app = express();

// Middleware setup
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Database connection setup
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'hotel_db',
    port: 3306
});

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MariaDB:', err);
        return;
    }
    console.log('Connected to MariaDB as id', connection.threadId);

    // Create bookings table if not exists
    connection.query(`
        CREATE TABLE IF NOT EXISTS bookings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            full_name VARCHAR(100) NOT NULL,
            email VARCHAR(100) NOT NULL,
            phone_number VARCHAR(20) NOT NULL,
            check_in_date DATE NOT NULL,
            check_out_date DATE NOT NULL,
            guests INT NOT NULL,
            room_type VARCHAR(50) NOT NULL,
            unique_code VARCHAR(100) NOT NULL
        )
    `, (err, results, fields) => {
        if (err) {
            console.error('Error creating bookings table:', err);
            return;
        }
        console.log('Bookings table created successfully');

        // Check if unique_code column exists
        connection.query(`
            SELECT * FROM information_schema.columns 
            WHERE table_schema = 'hotel_db' 
            AND table_name = 'bookings' 
            AND column_name = 'unique_code'
        `, (err, results, fields) => {
            if (err) {
                console.error('Error checking column:', err);
                return;
            }

            if (results.length === 0) {
                // Column does not exist, alter table to add unique_code column
                connection.query(`
                    ALTER TABLE bookings ADD COLUMN unique_code VARCHAR(100) NOT NULL
                `, (err, results, fields) => {
                    if (err) {
                        console.error('Error adding unique_code column:', err);
                        return;
                    }
                    console.log('unique_code column added successfully');
                });
            } else {
                console.log('unique_code column already exists');
            }
        });
    });

    // Create rooms table and insert sample data
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

        // Insert sample data into rooms table
        connection.query(`
            INSERT INTO rooms (room_number, type, price, capacity, description) VALUES
            ('101', 'Single Room', 100.00, 1, 'A cozy single room'),
            ('102', 'Double Room', 150.00, 2, 'A comfortable double room'),
            ('103', 'Family Room', 200.00, 4, 'A spacious family room')
        `, (err, results, fields) => {
            if (err) {
                console.error('Error inserting data into rooms table:', err);
                return;
            }
            console.log('Data inserted into rooms table successfully');
        });
    });

});

// Function to generate a unique code
function generateUniqueCode() {
    return crypto.randomBytes(16).toString('hex');
}

// Route to handle form submission
app.post('/book', (req, res) => {
    const { name, email, phone_number, check_in_date, check_out_date, guests, room_type } = req.body;

    console.log(req.body);

    if (!name || !email || !phone_number || !check_in_date || !check_out_date || !guests || !room_type) {
        return res.status(400).send('All fields are required.');
    }

    const uniqueCode = generateUniqueCode();

    // Start transaction
    connection.beginTransaction(err => {
        if (err) {
            console.error('Error starting transaction:', err);
            return res.status(500).send('Error booking your room. Please try again later.');
        }

        // Insert booking
        connection.query(
            'INSERT INTO bookings (full_name, email, phone_number, check_in_date, check_out_date, guests, room_type, unique_code) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [name, email, phone_number, check_in_date, check_out_date, guests, room_type, uniqueCode],
            (err, results, fields) => {
                if (err) {
                    console.error('Error inserting booking:', err);
                    return connection.rollback(() => {
                        res.status(500).send('Error booking your room. Please try again later.');
                    });
                }

                console.log('Booking inserted:', results.insertId);

                // Log the room_type being queried
                console.log('Querying room type:', room_type);

                // Get the room details based on the room_type
                connection.query(
                    'SELECT room_number, type, price, capacity, description FROM rooms WHERE type = ? LIMIT 1',
                    [room_type],
                    (err, roomResults, fields) => {
                        if (err) {
                            console.error('Error fetching room details:', err);
                            return connection.rollback(() => {
                                res.status(500).send('Error booking your room. Please try again later.');
                            });
                        }

                        if (roomResults.length === 0) {
                            return connection.rollback(() => {
                                res.status(404).send('No rooms available of the selected type.');
                            });
                        }

                        console.log('Room details:', roomResults[0]);

                        // Commit transaction
                        connection.commit(err => {
                            if (err) {
                                console.error('Error committing transaction:', err);
                                return connection.rollback(() => {
                                    res.status(500).send('Error booking your room. Please try again later.');
                                });
                            }

                            // Send booking confirmation with room details and unique code
                            res.json({
                                message: 'Booking successful!',
                                uniqueCode: uniqueCode,
                                full_name: name,
                                email: email,
                                room: roomResults[0]
                            });
                        });
                    }
                );
            }
        );
    });
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
