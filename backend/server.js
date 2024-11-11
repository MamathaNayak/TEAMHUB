const express=require("express")
const app=express()
const sqlite3=require('sqlite3')
const {open}=require('sqlite')
const path=require("path")
const cors=require('cors')
app.use(cors({
    origin: 'http://localhost:3000',  // Allow only this origin (your frontend)
    methods: ['GET', 'POST', 'PUT', 'DELETE'],  // Allow these HTTP methods
    allowedHeaders: ['Content-Type'],  // Allow only the Content-Type header
}));
app.use(express.json()); 
const dbPath=path.join(__dirname,'employeeDatabase.db')
let db=null

const  initializeAndCreateDatabase =async ()=>{
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

        console.log('Database connected and employees table ensured.');
        const PORT=5000;
        app.listen(PORT,()=>{
            console.log(`Server is running on port ${PORT}`);
        })
    } catch (error) {
        console.error("Error connecting to the database:", error.message);
    }

}
 
initializeAndCreateDatabase()

//CREATE EMPLOYEES
app.post('/employees',async (req,res)=>{
    const {name,email,mobileNo,designation,gender,isCheckedCourse,file}=req.body 
    try{
    const result=await db.run(` INSERT INTO employees (name,email,mobileno,designation,gender,courses,image) Values(?,?,?,?,?,?,?)`,
    [name,email,mobileNo,designation,gender,isCheckedCourse,file])
    console.log("Employee added with ID:", result.lastID);
    res.status(201).json({ employeeId: result.lastID });
    }
    catch (error){
        console.error("Error inserting employee:", error);
        res.status(500).json({ error: error.message });
    }

})

//GET EMPLOYEES 
app.get('/employees',async (req,res)=>{
    try{
        const result=await db.all(`SELECT * FROM employees`);
        res.status(200).json(result)
    }
    catch(error){
        console.error('Error fetching employees:', error);
       res.status(500).json({ error: 'Failed to fetch employees' });
    }
})


//DELETE EMPLOYEE 
app.delete('/employees/:id',async (req,res)=>{
    try {
        const { id } = req.params;
        await db.run(`DELETE FROM employees WHERE id = ?`, id);
        res.status(200).json({ message: 'Employee deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete employee' });
    }
})






