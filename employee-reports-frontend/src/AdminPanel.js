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
  const [filterAppointmentType, setFilterAppointmentType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filterEmployee, setFilterEmployee] = useState("");
  const [filterAddress, setFilterAddress] = useState("");
  const [filterEquipment, setFilterEquipment] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");

  //Fetch all reports
  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await axios.get("http://localhost:5000/admin/reports", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setReports(response.data);
      } catch (error) {
        console.error("Error fetching reports:", error);
      }
    };

    const fetchUsers = async () => {
      try {
        const response = await axios.get("http://localhost:5000/admin/users", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(response.data);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchReports();
    fetchUsers();
  }, [token]); // Only `token` is included in the dependency array

  const fetchUsersUpdateOnClick= async () => {
    try {
      const response = await axios.get("http://localhost:5000/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  // Create a new user
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
      fetchUsersUpdateOnClick();
    } catch (error) {
      setMessage("❌ Error creating employee.");
    }
  };
  // Delete a user
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

  // Delete a report
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

  // Sort reports by date
  const sortReports = () => {
    const sortedReports = [...reports].sort((a, b) => {
      return sortOrder === "asc"
        ? new Date(a.date) - new Date(b.date)
        : new Date(b.date) - new Date(a.date);
    });
    setReports(sortedReports);
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  // Export reports to Excel
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(reports);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Reports");
    XLSX.writeFile(workbook, "Employee_Reports.xlsx");
  };

  // Format date to "DD/MM/YYYY"
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Export reports to PDF
  const exportToPDF = () => {
    const doc = new jsPDF();

    // Set the title
    doc.setFontSize(18);
    doc.text("Employee Reports", 14, 20);

    // Define the table headers and data
    autoTable(doc, {
      startY: 25, // Start table below the title
      head: [
        [
          "Employee",
          "Date",
          "Address",
          "Appointment Type",
          "Router Serial",
          "ONT Serial",
          "INES Length",
          "Prizakia",
          "Spiral Meters",
          "Notes",
          "Attachment",
        ],
      ],
      body: reports.map((report) => [
        report.name, // Employee name
        new Date(report.date).toLocaleDateString(), // Format date
        report.address, // Address
        report.appointment_type, // Appointment type (supports Greek letters)
        report.router_serial, // Router serial number
        report.ont_serial, // ONT serial number
        report.ines_length, // INES length
        report.prizakia, // Prizakia
        report.spiral_meters, // Spiral meters
        report.notes, // Notes
        report.attachment
          ? `http://localhost:5000/uploads/${report.attachment}`
          : "No Attachment", // Attachment link
      ]),
      theme: "grid", // Add grid lines for better readability
      styles: {
        font: "helvetica", // Use a standard font
        fontSize: 10, // Set font size
        cellPadding: 3, // Add padding to cells
        overflow: "linebreak", // Handle long text by breaking lines
      },
      headStyles: {
        fillColor: "#2c3e50", // Dark background for header
        textColor: "#ffffff", // White text for header
        fontStyle: "bold", // Bold header text
      },
      columnStyles: {
        0: { cellWidth: 30 }, // Employee column width
        1: { cellWidth: 25 }, // Date column width
        2: { cellWidth: 40 }, // Address column width
        3: { cellWidth: 40 }, // Appointment Type column width
        4: { cellWidth: 30 }, // Router Serial column width
        5: { cellWidth: 30 }, // ONT Serial column width
        6: { cellWidth: 25 }, // INES Length column width
        7: { cellWidth: 25 }, // Prizakia column width
        8: { cellWidth: 25 }, // Spiral Meters column width
        9: { cellWidth: 40 }, // Notes column width
        10: { cellWidth: 40 }, // Attachment column width
      },
    });
    // Save the PDF
    doc.save("Employee_Reports.pdf");
  };

  // Filter reports
  const filteredReports = reports.filter((report) => {
    // Filter by appointment type
    if (filterAppointmentType && report.appointment_type !== filterAppointmentType) {
      return false;
    }

    // Filter by date range
    if (startDate && endDate) {
      const reportDate = new Date(report.date).getTime();
      const start = new Date(startDate).getTime();
      const end = new Date(endDate).getTime();
      if (reportDate < start || reportDate > end) {
        return false;
      }
    }

    // Filter by employee
    if (filterEmployee && !report.name.toLowerCase().includes(filterEmployee.toLowerCase())) {
      return false;
    }

    // Filter by address
    if (filterAddress && !report.address.toLowerCase().includes(filterAddress.toLowerCase())) {
      return false;
    }

    // Filter by equipment
    if (filterEquipment === "router" && !report.router_serial) {
      return false;
    }
    if (filterEquipment === "ont" && !report.ont_serial) {
      return false;
    }

    return true;
  });

  // Table style for better readability
  const tableStyle = {
    wordWrap: "break-word", // Allow breaking long words
    whiteSpace: "normal", // Allow wrapping inside cells
    maxWidth: "200px", // Limit column width for better readability
    overflow: "hidden", // Prevent excessive overflow
  };

  return (
    <div className="container mt-4">
      <h2>Admin Panel</h2>
      <Button variant="danger" onClick={onLogout} className="mb-3">
        🚪 Logout
      </Button>

      {message && <Alert variant={message.startsWith("✅") ? "success" : "danger"}>{message}</Alert>}

      <h3>Create Employee</h3>
      <Form onSubmit={createUser} className="mb-4">
        <Form.Group>
          <Form.Control
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </Form.Group>
        <Form.Group>
          <Form.Control
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </Form.Group>
        <Form.Group>
          <Form.Control
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </Form.Group>
        <Button variant="primary" type="submit">
          ➕ Create Employee
        </Button>
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
                <Button variant="danger" size="sm" onClick={() => deleteUser(user.id)}>
                  🗑️ Delete
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <h3>Submitted Reports</h3>
      <div className="mb-3">
        <h4>Filters</h4>
        <Form.Group>
          <Form.Label>Appointment Type:</Form.Label>
          <Form.Control
            as="select"
            value={filterAppointmentType}
            onChange={(e) => setFilterAppointmentType(e.target.value)}
          >
            <option value="">All</option>
            <option value="ΟΛΟΚΛΗΡΩΜΕΝΟ">ΟΛΟΚΛΗΡΩΜΕΝΟ</option>
            <option value="ΚΑΤΑΣΚΕΥΗ">ΚΑΤΑΣΚΕΥΗ</option>
            <option value="ΕΝΕΡΓΟΠΟΙΗΣΗ">ΕΝΕΡΓΟΠΟΙΗΣΗ</option>
            <option value="ΣΠΙΡΑΛ">ΣΠΙΡΑΛ</option>
            <option value="BEP-OTO">BEP-OTO</option>
          </Form.Control>
        </Form.Group>

        <Form.Group>
          <Form.Label>Date Range:</Form.Label>
          <div className="d-flex gap-2">
            <Form.Control
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <Form.Control
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </Form.Group>

        <Form.Group>
          <Form.Label>Employee:</Form.Label>
          <Form.Control
            type="text"
            placeholder="Search by employee name"
            value={filterEmployee}
            onChange={(e) => setFilterEmployee(e.target.value)}
          />
        </Form.Group>

        <Form.Group>
          <Form.Label>Address:</Form.Label>
          <Form.Control
            type="text"
            placeholder="Search by address"
            value={filterAddress}
            onChange={(e) => setFilterAddress(e.target.value)}
          />
        </Form.Group>

        <Form.Group>
          <Form.Label>Equipment:</Form.Label>
          <Form.Control
            as="select"
            value={filterEquipment}
            onChange={(e) => setFilterEquipment(e.target.value)}
          >
            <option value="">All</option>
            <option value="router">Includes Router</option>
            <option value="ont">Includes ONT</option>
          </Form.Control>
        </Form.Group>

        <Button
          variant="secondary"
          className="mb-3"
          onClick={() => {
            setFilterAppointmentType("");
            setStartDate("");
            setEndDate("");
            setFilterEmployee("");
            setFilterAddress("");
            setFilterEquipment("");
          }}
        >
          🔄 Reset Filters
        </Button>
      </div>

      <div className="mb-3">
        <strong>Total Appointments:</strong> {filteredReports.length}
      </div>

      <Button variant="secondary" className="mb-2" onClick={sortReports}>
        🔃 Sort by Date ({sortOrder.toUpperCase()})
      </Button>
      <Button variant="success" className="mb-2 me-2" onClick={exportToExcel}>
        📊 Export to Excel
      </Button>
      <Button variant="primary" className="mb-2" onClick={exportToPDF}>
        📄 Export to PDF
      </Button>

      <Table striped bordered hover>
        <thead>
          <tr>
            <th style={tableStyle}>Employee</th>
            <th style={tableStyle}>Date</th>
            <th style={tableStyle}>Address</th>
            <th style={tableStyle}>Type</th>
            <th style={tableStyle}>Router Serial</th>
            <th style={tableStyle}>ONT Serial</th>
            <th style={tableStyle}>Prizakia</th>
            <th style={tableStyle}>Spiral (m)</th>
            <th style={tableStyle}>Notes</th>
            <th style={tableStyle}>Attachment</th>
            <th style={tableStyle}>Action</th>
          </tr>
        </thead>
        <tbody>
          {filteredReports.map((report) => (
            <tr key={report.id}>
              <td style={tableStyle}>{report.name}</td>
              <td style={tableStyle}>{formatDate(report.date)}</td>
              <td style={tableStyle}>{report.address}</td>
              <td style={tableStyle}>{report.appointment_type}</td>
              <td style={tableStyle}>{report.router_serial}</td>
              <td style={tableStyle}>{report.ont_serial}</td>
              <td style={tableStyle}>{report.ines_length}</td>
              <td style={tableStyle}>{report.prizakia}</td>
              <td style={tableStyle}>{report.spiral_meters}</td>
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
                <Button variant="danger" size="sm" onClick={() => deleteReport(report.id)}>
                  🗑️ Delete
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default AdminPanel;