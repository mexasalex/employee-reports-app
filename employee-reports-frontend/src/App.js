import React, { useState, useEffect } from "react";
import axios from "axios";
import AdminPanel from "./AdminPanel";
import "bootstrap/dist/css/bootstrap.min.css";

const App = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState(null);
  const [role, setRole] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [address, setAddress] = useState("");
  //const [materials, setMaterials] = useState([]);
  const [appointmentType, setAppointmentType] = useState("");
  const [routerSerial, setRouterSerial] = useState("");
  const [ontSerial, setOntSerial] = useState("");
  const [inesLength, setInesLength] = useState("");
  const [prizakia, setPrizakia] = useState("");
  const [spiralMeters, setSpiralMeters] = useState("");
  const [notes, setNotes] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [message, setMessage] = useState("");

  const checkTokenExpiration = () => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = JSON.parse(atob(token.split(".")[1])); // Decode JWT payload
        const expiry = decoded.exp * 1000; // Convert to milliseconds

        if (Date.now() >= expiry) {
          console.warn("Token expired. Logging out.");
          localStorage.removeItem("token");
          window.location.href = "/login"; // Redirect to login
        }
      } catch (error) {
        console.error("Invalid token format. Logging out.");
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
    }
  };


  // ✅ Handle File Upload Change
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setAttachment(file);
  };

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
  
    if (!appointmentType || !date || !address) {
      setMessage("All fields must be filled out.");
      return;
    }
  
    const formData = new FormData();
    formData.append("date", date);
    formData.append("address", address);
    formData.append("appointmentType", appointmentType);
    formData.append("routerSerial", routerSerial);
    formData.append("ontSerial", ontSerial);
    formData.append("inesLength", inesLength);
    formData.append("prizakia", prizakia); // Convert array to string
    formData.append("spiralMeters", spiralMeters);
    formData.append("notes", notes);
    if (attachment) {
      formData.append("attachment", attachment);
    }
  
    try {
      await axios.post("http://localhost:5000/submit-report", formData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });
  
      setMessage("✅ Report submitted successfully!");
      // Reset form fields
      setAddress("");
      setAppointmentType("");
      setRouterSerial("");
      setOntSerial("");
      setInesLength("");
      setPrizakia("");
      setSpiralMeters("");
      setNotes("");
      setAttachment(null);
    } catch (error) {
      setMessage("❌ Error submitting report.");
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
  /*const handleMaterialChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions, (option) => option.value);
    console.log("Selected Materials:", selectedOptions); // ✅ Check if options are detected
    setMaterials(selectedOptions);
  };*/

  // ✅ Check if user is already logged in (Token Persistence)
  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedRole = localStorage.getItem("role");
    if (savedToken) {
      setToken(savedToken);
      setRole(savedRole);
      checkTokenExpiration()
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

            <label>Appointment Type:</label>
            <select value={appointmentType} onChange={(e) => setAppointmentType(e.target.value)} required style={inputStyle}>
              <option value="">Select Appointment Type</option>
              <option value="ΟΛΟΚΛΗΡΩΜΕΝΟ">ΟΛΟΚΛΗΡΩΜΕΝΟ</option>
              <option value="ΚΑΤΑΣΚΕΥΗ">ΚΑΤΑΣΚΕΥΗ</option>
              <option value="ΕΝΕΡΓΟΠΟΙΗΣΗ">ΕΝΕΡΓΟΠΟΙΗΣΗ</option>
              <option value="ΣΠΙΡΑΛ">ΣΠΙΡΑΛ</option>
              <option value="BEP-OTO">BEP-OTO</option>
            </select>

            <label>📡 Address</label>
            <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} />

            <label>📡 Router Serial Number:</label>
            <input type="text" value={routerSerial} onChange={(e) => setRouterSerial(e.target.value)} />

            <label>🌐 ONT Serial Number:</label>
            <input type="text" value={ontSerial} onChange={(e) => setOntSerial(e.target.value)} />

            <label>🔌 INES Length:</label>
            <select value={inesLength} onChange={(e) => setInesLength(e.target.value)}>
              <option value="">Select Length</option>
              <option value="10m">10m</option>
              <option value="20m">20m</option>
            </select>

            <label>🏠 Prizakia:</label>
            <select value={prizakia} onChange={(e) => setPrizakia(e.target.value)}>
              <option value="">Select ONT</option>
              <option value="Oto Huawei">Oto Huawei</option>
              <option value="Oto Classic">Oto Classic</option>
            </select>

            <label>🔄 Spiral Meters:</label>
            <input type="number" value={spiralMeters} onChange={(e) => setSpiralMeters(e.target.value)} />


            <label>Notes (Optional):</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} style={inputStyle} placeholder="Any additional comments..."></textarea>

            <label>Attachment (Image/Video Only):</label>
            <input type="file" accept="image/*,video/*" onChange={handleFileChange} />


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
