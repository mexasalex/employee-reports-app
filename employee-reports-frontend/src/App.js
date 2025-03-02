import React, { useState, useEffect } from "react";
import axios from "axios";
import AdminPanel from "./AdminPanel";
import "bootstrap/dist/css/bootstrap.min.css";

const App = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState(null);
  const [role, setRole] = useState("");
  const [appointments, setAppointments] = useState("");
  const [appointmentType, setAppointmentType] = useState("");
  const [equipment, setEquipment] = useState("");
  const [materials, setMaterials] = useState([]);
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [message, setMessage] = useState("");

  // ✅ Handle User Login
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:5000/login", { username, password });
      setToken(response.data.token);
      setRole(response.data.role);
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("role", response.data.role);
    } catch (error) {
      alert("Login failed. Check your credentials.");
    }
  };

  // ✅ Handle Report Submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("Sending Data:", { date, appointments, appointmentType, equipment, materials, notes });

    if (!appointments || !equipment || materials.length === 0 || !appointmentType) {
      setMessage("All fields must be filled out.");
      return;
    }

    try {
      await axios.post(
        "http://localhost:5000/submit-report",
        {
          date,
          appointments,
          appointmentType,
          equipment,
          materials: Array.isArray(materials) ? materials : [materials],
          notes,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage("✅ Report submitted successfully!");
      setAppointments("");
      setAppointmentType("");
      setEquipment("");
      setMaterials([]);
      setNotes("");
    } catch (error) {
      setMessage("❌ Error submitting report. You might have already submitted for today.");
    }
  };

  // ✅ Handle Logout
  const handleLogout = () => {
    setToken(null);
    setRole("");
    localStorage.removeItem("token");
    localStorage.removeItem("role");
  };

  // ✅ Handle Multiple Selection for Materials
  const handleMaterialChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions, (option) => option.value);
    setMaterials(selectedOptions);
  };

  // ✅ Check if user is already logged in (Token Persistence)
  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedRole = localStorage.getItem("role");
    if (savedToken) {
      setToken(savedToken);
      setRole(savedRole);
    }
  }, []);

  return (
    <div style={{ padding: "20px", maxWidth: "500px", margin: "auto", fontFamily: "Arial, sans-serif" }}>
      {!token ? (
        <>
          <h2>🔐 Login</h2>
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column" }}>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" required style={inputStyle} />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required style={inputStyle} />
            <button type="submit" style={buttonStyle}>Login</button>
          </form>
        </>
      ) : role === "admin" ? (
        <AdminPanel token={token} onLogout={handleLogout} />
      ) : (
        <>
          <h2>📋 Submit Daily Report</h2>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column" }}>
            <label>Date:</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required style={inputStyle} />
            
            <label>Appointments:</label>
            <input type="number" value={appointments} onChange={(e) => setAppointments(e.target.value)} required style={inputStyle} min="1" />

            <label>Appointment Type:</label>
            <select value={appointmentType} onChange={(e) => setAppointmentType(e.target.value)} required style={inputStyle}>
              <option value="">Select Appointment Type</option>
              <option value="BEP-OTO">BEP-OTO</option>
              <option value="1955.4">1955.4</option>
              <option value="1955.3">1955.3</option>
              <option value="1989">1989</option>
              <option value="1955.6">1955.6</option>
            </select>

            <label>Equipment Used:</label>
            <input type="text" value={equipment} onChange={(e) => setEquipment(e.target.value)} required style={inputStyle} />

            <label>Materials Used (Select multiple):</label>
            <select multiple value={materials} onChange={handleMaterialChange} required style={inputStyle}>
              <option value="Test Cable">Test Cable</option>
              <option value="Adapter">Adapter</option>
              <option value="Modem">Modem</option>
            </select>

            <label>Notes (Optional):</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} style={inputStyle} placeholder="Any additional comments..."></textarea>

            <button type="submit" style={buttonStyle}>📩 Submit Report</button>
          </form>

          {message && <p style={{ color: message.startsWith("✅") ? "green" : "red" }}>{message}</p>}
          
          <button onClick={handleLogout} style={logoutButtonStyle}>🚪 Logout</button>
        </>
      )}
    </div>
  );
};

// ✅ Inline Styles for Better UI
const inputStyle = { marginBottom: "10px", padding: "8px", border: "1px solid #ccc", borderRadius: "5px" };
const buttonStyle = { padding: "10px", backgroundColor: "#007BFF", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" };
const logoutButtonStyle = { marginTop: "10px", padding: "10px", backgroundColor: "#DC3545", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" };

export default App;
