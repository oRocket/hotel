# Albetop Hotel Booking Application

This is a simple Node.js application using Express and MySQL for managing hotel room bookings. The application sets up a web server that handles booking requests and manages the hotel's room and booking data in a MariaDB database.

## Prerequisites

Before you begin, ensure you have the following installed on your machine:

- Node.js (v14 or higher)
- npm (Node Package Manager)
- MariaDB or MySQL database

## Installation

1. **Clone the repository:**
    ```sh
    git clone https://github.com/oRocket/hotel.git
    cd hotel
    ```

2. **Install dependencies:**
    ```sh
    npm install
    ```

3. **Set up the database:**

    Make sure your MariaDB or MySQL server is running and create a new database named `hotel_db`:
    ```sql
    CREATE DATABASE hotel_db;
    ```

4. **Configure the database connection:**

    Edit the database connection settings in the code to match your local database configuration:
    ```javascript
    const connection = mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'password',
        database: 'hotel_db',
        port: 3306
    });
    ```

## Running the Application

1. **Start the server:**
    ```sh
    node hotel_app.js
    ```

2. **Access the application:**

    Open your browser and navigate to `http://localhost:3000`. The server should be running and ready to accept booking requests.

## API Endpoints

### POST /book

Endpoint to handle booking form submissions.

- **URL:** `/book`
- **Method:** `POST`
- **Content-Type:** `application/x-www-form-urlencoded`
- **Request Body Parameters:**
    - `name` (string): Full name of the guest
    - `email` (string): Email address of the guest
    - `phone_number` (string): Phone number of the guest
    - `check_in_date` (date): Check-in date
    - `check_out_date` (date): Check-out date
    - `guests` (number): Number of guests
    - `room_type` (string): Type of room

- **Response:**
    - `200 OK`: Booking successful with room details.
    - `400 Bad Request`: Missing required fields.
    - `404 Not Found`: No rooms available of the selected type.
    - `500 Internal Server Error`: Error processing the booking.

Example request:
```sh
curl -X POST -d "name=John Doe&email=johndoe@example.com&phone_number=1234567890&check_in_date=2024-07-20&check_out_date=2024-07-22&guests=2&room_type=Double Room" http://localhost:3000/book
```

## Database Schema
### Bookings Table
    - id (INT, AUTO_INCREMENT): Primary key
    - full_name (VARCHAR(100)): Full name of the guest
    - email (VARCHAR(100)): Email address of the guest
    - phone_number (VARCHAR(20)): Phone number of the guest
    - check_in_date (DATE): Check-in date
    - check_out_date (DATE): Check-out date
    - guests (INT): Number of guests
    - room_type (VARCHAR(50)): Type of room booked

### Rooms Table
    - id (INT, AUTO_INCREMENT): Primary key
    - room_number (VARCHAR(50)): Room number
    - type (VARCHAR(50)): Type of room
    - price (DECIMAL(10, 2)): Price per night
    - capacity (INT): Capacity of the room
    - description (TEXT): Description of the room
    - Error Handling
    - The application includes error handling for database connection errors, transaction errors, and validation errors. If the database connection is lost, it attempts to reconnect automatically.

## License
 - This project is licensed under the MIT License. See the LICENSE file for details.

## Acknowledgments
    - Node.js
    - Express.js
    - MySQL2
    - Body-parser

## Authors
    - Name: Albert Opoku-Twumasi
    - Github: https://www.github.com/orocket
    - X (Twitter): @Albert_O_T

    - Name: Benedict Owusu
    - Github: https://www.github.com/benedictowusu
    - X (Twitter): @benedictowusu_