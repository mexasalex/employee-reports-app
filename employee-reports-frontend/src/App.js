import React, { useState, useEffect } from "react";
import axios from "axios";
import AdminPanel from "./AdminPanel";
import "bootstrap/dist/css/bootstrap.min.css";
import { Form, Button, Alert, Card, Container, Row, Col } from "react-bootstrap";

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
  const [attachments, setAttachments] = useState([]);
  const [message, setMessage] = useState("");
  const [includeRouter, setIncludeRouter] = useState(false);
  const [includeONT, setIncludeONT] = useState(false);
  const [includeSpiralMeters, setIncludeSpiralMeters] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false); // New state for success message

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

  // Function to show success message and hide it after a few seconds
  const showTemporarySuccessMessage = (message) => {
    setMessage(message);
    setShowSuccessMessage(true);
    setTimeout(() => {
      setShowSuccessMessage(false);
      setMessage("");
    }, 3000); // Hide after 3 seconds
  };


  // ✅ Handle File Upload Change
  const handleFileChange = (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "video/mp4", "video/mpeg"];
    const maxSize = 25 * 1024 * 1024; // 25 MB per file
    const maxFiles = 5; // Maximum number of files allowed

    // Validate number of files
    if (files.length > maxFiles) {
      alert(`You can upload a maximum of ${maxFiles} files.`);
      e.target.value = ""; // Clear the file input
      return;
    }

    // Validate file types and sizes
    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        alert("Only images (JPEG, PNG, GIF) and videos (MP4, MPEG) are allowed.");
        e.target.value = ""; // Clear the file input
        return;
      }
      if (file.size > maxSize) {
        alert(`File "${file.name}" exceeds the limit of 25 MB.`);
        e.target.value = ""; // Clear the file input
        return;
      }
    }

    setAttachments(files); // Set the files if validation passes
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
    /*const allowedInesLengths = ["10m", "20m", "30m", "40m"];
    if (!allowedInesLengths.includes(inesLength)) {
      setMessage("Invalid INES Length. Allowed values are 10m or 20m.");
      return;
    }*/

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
    // Append each file to the form data
    for (const file of attachments) {
      formData.append("attachments", file);
    }

    try {
      await axios.post("http://localhost:5000/submit-report", formData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });

      showTemporarySuccessMessage("✅ Report submitted successfully!");
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
      setAttachments([]);
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
    <Container fluid className="p-4">
      {!token ? (
        <Row className="justify-content-center">
          <Col md={2}>
            <Card>
              <Card.Body>
                <h2 className="text-center mb-4">🔐 Login</h2>
                <Form onSubmit={handleLogin}>
                  <Form.Group className="mb-3">
                    <Form.Control
                      type="text"
                      placeholder="Username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Control
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </Form.Group>
                  <Button variant="primary" type="submit" className="w-25 mx-auto d-block mt-3">
                    Login
                  </Button>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      ) : role === "admin" ? (
        <AdminPanel token={token} onLogout={handleLogout} />
      ) : (
        <Row className="justify-content-center">
          <Col md={5}>
            <Card>
              <Card.Body>
                <h2 className="text-center mb-4">📋 Submit Daily Report</h2>
                {showSuccessMessage && (
                  <Row className="mb-4">
                    <Col>
                      <Alert variant="success" onClose={() => setShowSuccessMessage(false)} dismissible>
                        {message}
                      </Alert>
                    </Col>
                  </Row>
                )}
                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label>Date:</Form.Label>
                    <Form.Control
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Appointment Type:</Form.Label>
                    <Form.Control
                      as="select"
                      value={appointmentType}
                      onChange={(e) => setAppointmentType(e.target.value)}
                      required
                    >
                      <option value="">Select Appointment Type</option>
                      <option value="ΟΛΟΚΛΗΡΩΜΕΝΟ">ΟΛΟΚΛΗΡΩΜΕΝΟ</option>
                      <option value="ΚΑΤΑΣΚΕΥΗ">ΚΑΤΑΣΚΕΥΗ</option>
                      <option value="ΕΝΕΡΓΟΠΟΙΗΣΗ">ΕΝΕΡΓΟΠΟΙΗΣΗ</option>
                      <option value="ΣΠΙΡΑΛ">ΣΠΙΡΑΛ</option>
                      <option value="BEP-OTO">BEP-OTO</option>
                    </Form.Control>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Address:</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Check
                      type="checkbox"
                      label="Include Router"
                      checked={includeRouter}
                      onChange={(e) => setIncludeRouter(e.target.checked)}
                    />
                    {includeRouter && (
                      <Form.Control
                        type="text"
                        placeholder="Router Serial Number"
                        value={routerSerial}
                        onChange={(e) => setRouterSerial(e.target.value)}
                        required={includeRouter}
                        className="mt-2"
                      />
                    )}
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Check
                      type="checkbox"
                      label="Include ONT"
                      checked={includeONT}
                      onChange={(e) => setIncludeONT(e.target.checked)}
                    />
                    {includeONT && (
                      <Form.Control
                        type="text"
                        placeholder="ONT Serial Number"
                        value={ontSerial}
                        onChange={(e) => setOntSerial(e.target.value)}
                        required={includeONT}
                        className="mt-2"
                      />
                    )}
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>INES Length:</Form.Label>
                    <Form.Control
                      as="select"
                      value={inesLength}
                      onChange={(e) => setInesLength(e.target.value)}
                    >
                      <option value="">Select Length</option>
                      <option value="10m">10m</option>
                      <option value="20m">20m</option>
                      <option value="30m">30m</option>
                      <option value="40m">40m</option>
                    </Form.Control>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Prizakia:</Form.Label>
                    <Form.Control
                      as="select"
                      value={prizakia}
                      onChange={(e) => setPrizakia(e.target.value)}
                    >
                      <option value="">Select Prizakia</option>
                      <option value="Oto Huawei">Oto Huawei</option>
                      <option value="Oto Classic">Oto Classic</option>
                    </Form.Control>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Check
                      type="checkbox"
                      label="Include Spiral Meters"
                      checked={includeSpiralMeters}
                      onChange={(e) => setIncludeSpiralMeters(e.target.checked)}
                    />
                    {includeSpiralMeters && (
                      <Form.Control
                        type="number"
                        placeholder="Enter spiral meters"
                        value={spiralMeters}
                        onChange={(e) => setSpiralMeters(e.target.value)}
                        required={includeSpiralMeters}
                        className="mt-2"
                      />
                    )}
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Notes:</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      placeholder="Enter additional notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Attachment (Image/Video):</Form.Label>
                    <Form.Control type="file" accept="image/*,video/*" onChange={handleFileChange} multiple />
                  </Form.Group>

                  <Button variant="primary" type="submit" className="w-25 mx-auto d-block mt-3">
                    📩 Submit Report
                  </Button>
                </Form>

                <Button variant="danger" onClick={handleLogout} className="w-25 mx-auto d-block mt-3">
                  🚪 Logout
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </Container>
  );
};

export default App;
