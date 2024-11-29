const express = require("express");
const app = express();
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require("path");
const cors = require('cors');
const multer = require('multer');

// Set up multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.use(cors({
    origin: 'http://localhost:3000', 
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type'],
}));

app.use(express.json());

const dbPath = path.join(__dirname, 'employeeDatabase.db');
let db = null;

const initializeAndCreateDatabase = async () => {
    try {
        db = await open({
            filename: dbPath,
            driver: sqlite3.Database
        });

        // Create table if it doesn't exist
        await db.run(`
            CREATE TABLE IF NOT EXISTS employees (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                mobileNo TEXT NOT NULL,
                designation TEXT NOT NULL,
                gender TEXT NOT NULL,
                courses TEXT,
                image BLOB
            )
        `);

        await db.run(`DROP TABLE IF EXISTS registration`);  // Drop the table if it exists

        await db.run(`
            CREATE TABLE IF NOT EXISTS registration (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                userName TEXT NOT NULL,
                password TEXT NOT NULL,
                mobile TEXT NOT NULL,
                email TEXT NOT NULL
            )
        `);
        
        

        console.log('Registration table created successfully!');
        
        
      
    } catch (error) {
        console.error("Error connecting to the database:", error.message);
    }
}

initializeAndCreateDatabase();

// CREATE EMPLOYEES
app.post('/employees', upload.single('image'), async (req, res) => {
    const { name, email, mobileNo, designation, gender, courses } = req.body;
    const file = req.file ? req.file.buffer : null;

    try {
        const result = await db.run(`
            INSERT INTO employees (name, email, mobileNo, designation, gender, courses, image) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [name, email, mobileNo, designation, gender, courses, file]
        );

        console.log("Employee added with ID:", result.lastID);
        res.status(201).json({ employeeId: result.lastID });
    } catch (error) {
        console.error("Error inserting employee:", error);
        res.status(500).json({ error: error.message });
    }
});

// GET EMPLOYEES
app.get('/employees', async (req, res) => {
    try {
        const result = await db.all(`SELECT * FROM employees`);
        res.status(200).json(result);
    } catch (error) {
        console.error('Error fetching employees:', error);
        res.status(500).json({ error: 'Failed to fetch employees' });
    }
});

// DELETE EMPLOYEE
app.delete('/employees/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await db.run(`DELETE FROM employees WHERE id = ?`, id);
        res.status(200).json({ message: 'Employee deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete employee' });
    }
});

//Registration

app.post('/registration', async (req, res) => {
    const { userName,password,mobile,email } = req.body;
    

    try {
        const result = await db.run(`
            INSERT INTO registration (userName, password, mobile, email) 
            VALUES (?, ?, ?, ?)`,
            [userName, password, mobile, email]
        );

        console.log("Registered With ID:", result.lastID);
        res.status(200).json({ regId: result.lastID });
    }
     catch (error) 
    {
        console.error("Error while registration:", error);
        res.status(500).json({ error: error.message });
    }
});

//LOGIN 
app.post('/login',async (req,res)=>{
    const {username,password}=req.body 
    console.log(username)
    console.log("Login attempt with:", username, password); // Debugging line
    try{
        const user = await db.get(`SELECT * FROM registration WHERE userName = ?`, [username]);
        if (!user) {
            return res.status(400).json({ error: 'User not found' });
        }
        if (user.password !== password) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }
        res.status(200).json({ message: 'Login successful', userName: user.userName });
    }
    catch (error) {
        console.error("Error during login:", error);
        res.status(500).json({ error: 'Internal server error' });
    }
   
});
// Serve static files from the React app's build directory
app.use(express.static(path.join(__dirname, '../frontend/build')));

// Handle React routing (for paths not handled by backend APIs)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));