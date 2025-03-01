require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("./db");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// ✅ Middleware: Verify authentication token
const authenticateToken = (req, res, next) => {
  const token = req.header("Authorization");
  if (!token) return res.status(401).json({ error: "Access denied" });

  try {
    const verified = jwt.verify(token.replace("Bearer ", ""), "your_jwt_secret");
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ error: "Invalid token" });
  }
};

// ✅ Admin-Only: Create Employee Accounts
app.post("/admin/create-user", authenticateToken, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Access denied" });
  }

  const { name, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const newUser = await pool.query(
      "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, 'employee') RETURNING id",
      [name, email, hashedPassword]
    );
    res.json({ message: "Employee account created", userId: newUser.rows[0].id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Email already exists or database error" });
  }
});

// ✅ Get All Employees (For Admin Panel)
app.get("/admin/users", authenticateToken, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Access denied" });
  }

  try {
    const users = await pool.query("SELECT id, name, email FROM users WHERE role = 'employee'");
    res.json(users.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error fetching employees" });
  }
});

// ✅ Delete Employee (For Admin Panel)
app.delete("/admin/delete-user/:id", authenticateToken, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Access denied" });
  }

  const { id } = req.params;

  try {
    await pool.query("DELETE FROM users WHERE id = $1", [id]);
    res.json({ message: "Employee deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error deleting employee" });
  }
});

// ✅ Employee Login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (user.rows.length === 0) return res.status(400).json({ error: "User not found" });

    const validPassword = await bcrypt.compare(password, user.rows[0].password);
    if (!validPassword) return res.status(400).json({ error: "Invalid password" });

    const token = jwt.sign({ userId: user.rows[0].id, role: user.rows[0].role }, "your_jwt_secret", { expiresIn: "1h" });
    res.json({ token, userId: user.rows[0].id, role: user.rows[0].role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login error" });
  }
});

// ✅ Submit Report (Only for Logged-In Employees)
// ✅ Submit Report (Updated for multiple materials)
// ✅ Submit Report (Updated to store appointment type)
app.post("/submit-report", authenticateToken, async (req, res) => {
    if (req.user.role !== "employee") {
      return res.status(403).json({ error: "Access denied" });
    }
  
    const { date, appointments, appointmentType, equipment, materials, notes } = req.body;
    const userId = req.user.userId;
  
    console.log("Received Data:", { date, appointments, appointmentType, equipment, materials, notes });
  
    // ✅ Ensure `materials` is an array, if not, convert it
    const formattedMaterials = Array.isArray(materials) ? materials.join(", ") : materials;
  
    try {
      const newReport = await pool.query(
        "INSERT INTO reports (user_id, date, appointments, appointment_type, equipment, materials, notes) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
        [userId, date, appointments, appointmentType, equipment, formattedMaterials, notes]
      );
      res.json(newReport.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Error submitting report" });
    }
  });
  
  

// ✅ Get Reports for Admin (View All Reports)
app.get("/admin/reports", authenticateToken, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Access denied" });
  }

  try {
    const reports = await pool.query(
      "SELECT reports.id, users.name, reports.date, reports.appointments, reports.appointment_type, reports.equipment, reports.materials, reports.notes FROM reports JOIN users ON reports.user_id = users.id ORDER BY reports.date DESC"
    );
    res.json(reports.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error fetching reports" });
  }
});

// ✅ Delete a Report (Admin Only)
app.delete("/admin/delete-report/:id", authenticateToken, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Access denied" });
  }

  const { id } = req.params;

  try {
    await pool.query("DELETE FROM reports WHERE id = $1", [id]);
    res.json({ message: "Report deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error deleting report" });
  }
});

// Start Server
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
