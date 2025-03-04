import React, { useState, useEffect } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import { Table, Button, Form, Alert } from "react-bootstrap";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const AdminPanel = ({ token, onLogout }) => {
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");

  useEffect(() => {
    fetchUsers();
    fetchReports();
  }, [token]);

  const fetchUsers = async () => {
    try {
      const res = await axios.get("http://localhost:5000/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data);
    } catch (err) {
      console.error("Error fetching employees:", err);
    }
  };

  const fetchReports = async () => {
    try {
      const res = await axios.get("http://localhost:5000/admin/reports", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReports(res.data);
    } catch (err) {
      console.error("Error fetching reports:", err);
    }
  };

  const createUser = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        "http://localhost:5000/admin/create-user",
        { name, username, password },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage("✅ Employee created successfully!");
      setName("");
      setUsername("");
      setPassword("");
      fetchUsers();
    } catch (error) {
      setMessage("❌ Error creating employee.");
    }
  };

  const deleteUser = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/admin/delete-user/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(users.filter((user) => user.id !== id));
      setMessage("✅ Employee deleted.");
    } catch (error) {
      setMessage("❌ Error deleting employee.");
    }
  };

  const deleteReport = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/admin/delete-report/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReports(reports.filter((report) => report.id !== id));
      setMessage("✅ Report deleted.");
    } catch (error) {
      setMessage("❌ Error deleting report.");
    }
  };

  const sortReports = () => {
    const sortedReports = [...reports].sort((a, b) => {
      return sortOrder === "asc"
        ? new Date(a.date) - new Date(b.date)
        : new Date(b.date) - new Date(a.date);
    });
    setReports(sortedReports);
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(reports);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Reports");
    XLSX.writeFile(workbook, "Employee_Reports.xlsx");
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Employee Reports", 20, 10);

    autoTable(doc, {
      head: [["Employee", "Date", "Appointments", "Type", "Equipment", "Materials", "Notes", "Attachment"]],
      body: reports.map(report => [
        report.name,
        report.date,
        report.appointments,
        report.appointment_type,
        report.equipment,
        report.materials,
        report.notes,
        report.attachment ? `http://localhost:5000/uploads/${report.attachment}` : "No Attachment",
      ]),
    });

    // If the attachment is an image, attempt to add it to the PDF
    reports.forEach((report, index) => {
      if (report.attachment && /\.(jpg|jpeg|png)$/i.test(report.attachment)) {
        const img = new Image();
        img.src = `http://localhost:5000/uploads/${report.attachment}`;
        img.onload = function () {
          doc.addImage(img, "JPEG", 15, doc.lastAutoTable.finalY + 10, 40, 20);
          doc.save("Employee_Reports.pdf");
        };
      }
    });

    doc.save("Employee_Reports.pdf");
  };

  const tableStyle = {
    wordWrap: "break-word",   // Allow breaking long words
    whiteSpace: "normal",     // Allow wrapping inside cells
    maxWidth: "200px",        // Limit column width for better readability
    overflow: "hidden",       // Prevent excessive overflow
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", { // "en-GB" formats as "DD/MM/YYYY"
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div className="container mt-4">
      <h2>Admin Panel</h2>
      <Button variant="danger" onClick={onLogout} className="mb-3">🚪 Logout</Button>

      {message && <Alert variant={message.startsWith("✅") ? "success" : "danger"}>{message}</Alert>}

      <h3>Create Employee</h3>
      <Form onSubmit={createUser} className="mb-4">
        <Form.Group>
          <Form.Control type="text" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
        </Form.Group>
        <Form.Group>
          <Form.Control type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
        </Form.Group>
        <Form.Group>
          <Form.Control type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </Form.Group>
        <Button variant="primary" type="submit">➕ Create Employee</Button>
      </Form>

      <h3>Employee List</h3>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Name</th>
            <th>Username</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.name}</td>
              <td>{user.username}</td>
              <td>
                <Button variant="danger" size="sm" onClick={() => deleteUser(user.id)}>🗑️ Delete</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <h3>Submitted Reports</h3>
      <Button variant="secondary" className="mb-2" onClick={sortReports}>🔃 Sort by Date ({sortOrder.toUpperCase()})</Button>
      <Button variant="success" className="mb-2 me-2" onClick={exportToExcel}>📊 Export to Excel</Button>
      <Button variant="primary" className="mb-2" onClick={exportToPDF}>📄 Export to PDF</Button>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th style={tableStyle}>Employee</th>
            <th style={tableStyle}>Date</th>
            <th style={tableStyle}>Type</th>
            <th style={tableStyle}>Equipment</th>
            <th style={tableStyle}>Materials</th>
            <th style={tableStyle}>Notes</th>
            <th style={tableStyle}>Attachment</th>
            <th style={tableStyle}>Action</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((report) => (
            <tr key={report.id}>
              <td style={tableStyle}>{report.name}</td>
              <td style={tableStyle}>{formatDate(report.date)}</td>
              <td style={tableStyle}>{report.appointment_type}</td>
              <td style={tableStyle}>{report.equipment}</td>
              <td style={tableStyle}>{report.materials}</td>
              <td style={tableStyle}>{report.notes}</td>
              <td>
                {report.attachment ? (
                  report.attachment.endsWith(".mp4") || report.attachment.endsWith(".avi") ? (
                    <video width="100" controls>
                      <source src={`http://localhost:5000/uploads/${report.attachment}`} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <a href={`http://localhost:5000/uploads/${report.attachment}`} target="_blank" rel="noopener noreferrer">
                      <img src={`http://localhost:5000/uploads/${report.attachment}`} alt="Attachment" width="100" />
                    </a>
                  )
                ) : (
                  "No Attachment"
                )}
              </td>
              <td>
                <Button variant="danger" size="sm" onClick={() => deleteReport(report.id)}>🗑️ Delete</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default AdminPanel;