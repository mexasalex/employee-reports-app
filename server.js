require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("./db");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const app = express();
app.use(cors());
app.use(express.json());

const uploadDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}


const PORT = process.env.PORT || 5000;

// ✅ Set up Multer for File Uploads (Only images & videos)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Save files in the 'uploads' folder
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Rename file with timestamp
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "video/mp4", "video/mpeg"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only images and videos are allowed"), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 25 * 1024 * 1024 }, // Limit file size to 25 MB
}).array("attachments", 5);


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

// ✅ Admin-Only: Create Employee Accounts (Username instead of Email)
app.post("/admin/create-user", authenticateToken, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Access denied" });
  }

  const { name, username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const newUser = await pool.query(
      "INSERT INTO users (name, username, password, role) VALUES ($1, $2, $3, 'employee') RETURNING id",
      [name, username, hashedPassword]
    );
    res.json({ message: "Employee account created", userId: newUser.rows[0].id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Username already exists or database error" });
  }
});

// ✅ Get All Employees (For Admin Panel)
app.get("/admin/users", authenticateToken, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Access denied" });
  }

  try {
    const users = await pool.query("SELECT id, name, username FROM users WHERE role = 'employee'");
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
    // Set user_id to NULL for all reports associated with the user
    await pool.query("UPDATE reports SET user_id = NULL WHERE user_id = $1", [id]);

    // Delete the user
    await pool.query("DELETE FROM users WHERE id = $1", [id]);

    res.json({ message: "Employee deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error deleting employee" });
  }
});

// ✅ Employee Login (Now Uses Username)
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
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

// ✅ Submit Report (Only for Logged-In Employees, Removes `appointments`)
app.post("/submit-report", authenticateToken, (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ error: "File size exceeds the limit of 25 MB" });
      }
      if (err.message) {
        return res.status(400).json({ error: err.message });
      }
      return res.status(500).json({ error: "Error uploading files" });
    }

    if (req.user.role !== "employee") {
      return res.status(403).json({ error: "Access denied" });
    }

    const { date, address, appointmentType, includeRouter, routerSerial, includeONT, ontSerial, includeSpiralMeters, spiralMeters, inesLength, prizakia, notes } = req.body;
    const userId = req.user.userId;

    // Fetch the employee's name from the users table
    try {
      const user = await pool.query("SELECT name FROM users WHERE id = $1", [userId]);
      if (user.rows.length === 0) {
        return res.status(400).json({ error: "User not found" });
      }

      const employeeName = user.rows[0].name;

      // Get the list of uploaded files
      const attachments = req.files ? req.files.map((file) => file.filename) : [];

      // Required fields validation
      if (!date || !address || !appointmentType || !inesLength || !prizakia) {
        return res.status(400).json({ error: "All fields are required." });
      }

      // If router is included, ensure the serial number is provided
      if (includeRouter === "true" && !routerSerial) {
        return res.status(400).json({ error: "Router Serial Number is required." });
      }

      // If ONT is included, ensure the serial number is provided
      if (includeONT === "true" && !ontSerial) {
        return res.status(400).json({ error: "ONT Serial Number is required." });
      }

      // If Spiral Meters is included, ensure the value is provided and valid
      if (includeSpiralMeters === "true" && !spiralMeters) {
        return res.status(400).json({ error: "Spiral Number is required." });
      }

      // Insert the report with the employee_name
      const newReport = await pool.query(
        `INSERT INTO reports 
         (user_id, employee_name, date, address, appointment_type, router_serial, ont_serial, ines_length, prizakia, spiral_meters, notes, attachments, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW()) 
         RETURNING *`,
        [
          userId,
          employeeName, // Add the employee_name here
          date,
          address,
          appointmentType,
          includeRouter === "true" ? routerSerial : null,
          includeONT === "true" ? ontSerial : null,
          inesLength,
          prizakia,
          includeSpiralMeters === "true" ? spiralMeters : null,
          notes,
          attachments.join(","), // Store file paths as a comma-separated string
        ]
      );
      res.json(newReport.rows[0]);
    } catch (err) {
      console.error("Database Error:", err);
      res.status(500).json({ error: "Error submitting report." });
    }
  });
});

// ✅ Get Reports for Admin (View All Reports)
app.get("/admin/reports", authenticateToken, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Access denied" });
  }

  try {
    const reports = await pool.query(
      `SELECT reports.id, users.name, reports.employee_name, reports.date, reports.address, reports.appointment_type, 
              reports.router_serial, reports.ont_serial, reports.ines_length, reports.prizakia, 
              reports.spiral_meters, reports.notes, reports.attachments, reports.created_at 
       FROM reports 
       LEFT JOIN users ON reports.user_id = users.id 
       ORDER BY reports.date DESC`
    );

    // Add (Deleted) marker to employee_name if the user is deleted
    const reportsWithDeletedMarker = reports.rows.map((report) => {
      if (report.name === null) { // If the user is deleted, users.name will be NULL
        return {
          ...report,
          employee_name: `${report.employee_name} (Deleted)`,
        };
      }
      return report;
    });

    res.json(reportsWithDeletedMarker);
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

// ✅ Serve Uploaded Files
app.use("/uploads", express.static("uploads"));

// Start Server
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
