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
  const [includeRouter, setIncludeRouter] = useState(false);
  const [includeONT, setIncludeONT] = useState(false);
  const [includeSpiralMeters, setIncludeSpiralMeters] = useState(false);

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

    // Required fields validation (excluding routerSerial, ontSerial, and spiralMeters)
    if (!date || !address || !appointmentType || !inesLength || !prizakia) {
      setMessage("All fields are required.");
      return;
    }

    // If router is included, ensure the serial number is provided
    if (includeRouter && !routerSerial) {
      setMessage("Router Serial Number is required.");
      return;
    }

    // If ONT is included, ensure the serial number is provided
    if (includeONT && !ontSerial) {
      setMessage("ONT Serial Number is required.");
      return;
    }

    // If Spiral Meters is included, ensure the value is provided and valid
    if (includeSpiralMeters && !spiralMeters) {
      setMessage("Sprial is required.");
        return;
    }

    // Date validation (ensure date is not in the future)
    const selectedDate = new Date(date);
    const currentDate = new Date();
    if (selectedDate > currentDate) {
      setMessage("Date cannot be in the future.");
      return;
    }

    // INES Length validation
    const allowedInesLengths = ["10m", "20m"];
    if (!allowedInesLengths.includes(inesLength)) {
      setMessage("Invalid INES Length. Allowed values are 10m or 20m.");
      return;
    }

    // Prizakia validation
    const allowedPrizakia = ["Oto Huawei", "Oto Classic"];
    if (!allowedPrizakia.includes(prizakia)) {
      setMessage("Invalid Prizakia. Allowed values are Oto Huawei or Oto Classic.");
      return;
    }

    // Spiral Meters validation
    /*const spiralMetersNumber = parseFloat(spiralMeters);
    if (isNaN(spiralMetersNumber) || spiralMetersNumber < 1 || spiralMetersNumber > 100) {
      setMessage("Spiral Meters must be a number between 1 and 100.");
      return;
    }*/

    // Attachment validation (if provided)
    if (attachment) {
      const allowedFileTypes = ["image/jpeg", "image/png", "video/mp4"];
      if (!allowedFileTypes.includes(attachment.type)) {
        setMessage("Invalid file type. Only images (JPEG, PNG) and videos (MP4) are allowed.");
        return;
      }
    }

    // Prepare form data
    const formData = new FormData();
    formData.append("date", date);
    formData.append("address", address);
    formData.append("appointmentType", appointmentType);
    formData.append("includeRouter", includeRouter); // Add whether router is included
    if (includeRouter) {
      formData.append("routerSerial", routerSerial); // Add router serial number only if included
    }
    formData.append("includeONT", includeONT); // Add whether ONT is included
    if (includeONT) {
      formData.append("ontSerial", ontSerial); // Add ONT serial number only if included
    }
    formData.append("includeSpiralMeters", includeSpiralMeters); // Add whether Spiral Meters is included
    if (includeSpiralMeters) {
      formData.append("spiralMeters", spiralMeters); // Add Spiral Meters only if included
    }
    formData.append("inesLength", inesLength);
    formData.append("prizakia", prizakia);
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
      setIncludeRouter(false); // Reset the router checkbox
      setRouterSerial(""); // Reset the router serial number
      setIncludeONT(false); // Reset the ONT checkbox
      setOntSerial(""); // Reset the ONT serial number
      setIncludeSpiralMeters(false); // Reset the Spiral Meters checkbox
      setSpiralMeters(""); // Reset the Spiral Meters value
      setInesLength("");
      setPrizakia("");
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

            <label>
              <input
                type="checkbox"
                checked={includeRouter}
                onChange={(e) => setIncludeRouter(e.target.checked)}
              />
              Include Router
            </label>

            {includeRouter && (
              <>
                <label>Router Serial Number:</label>
                <input
                  type="text"
                  value={routerSerial}
                  onChange={(e) => setRouterSerial(e.target.value)}
                  required={includeRouter} // Make it required only if the checkbox is checked
                  style={inputStyle}
                />
              </>
            )}

            <label>
              <input
                type="checkbox"
                checked={includeONT}
                onChange={(e) => setIncludeONT(e.target.checked)}
              />
              Include ONT
            </label>

            {includeONT && (
              <>
                <label>ONT Serial Number:</label>
                <input
                  type="text"
                  value={ontSerial}
                  onChange={(e) => setOntSerial(e.target.value)}
                  required={includeONT} // Make it required only if the checkbox is checked
                  style={inputStyle}
                />
              </>
            )}

            <label>🔌 INES Length:</label>
            <select value={inesLength} onChange={(e) => setInesLength(e.target.value)}>
              <option value="">Select Length</option>
              <option value="10m">10m</option>
              <option value="20m">20m</option>
              <option value="30m">30m</option>
              <option value="40m">40m</option>
            </select>

            <label>🏠 Prizakia:</label>
            <select value={prizakia} onChange={(e) => setPrizakia(e.target.value)}>
              <option value="">Select ONT</option>
              <option value="Oto Huawei">Oto Huawei</option>
              <option value="Oto Classic">Oto Classic</option>
            </select>

            <label>
              <input
                type="checkbox"
                checked={includeSpiralMeters}
                onChange={(e) => setIncludeSpiralMeters(e.target.checked)}
              />
              Include Spiral Meters
            </label>

            {includeSpiralMeters && (
              <>
                <label>Spiral Meters:</label>
                <input
                  type="number"
                  value={spiralMeters}
                  onChange={(e) => setSpiralMeters(e.target.value)}
                  required={includeSpiralMeters} // Make it required only if the checkbox is checked
                  style={inputStyle}
                />
              </>
            )}


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
