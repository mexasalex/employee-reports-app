import React, { useState, useEffect } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import { Table, Button, Form, Alert, Card, Container, Row, Col, Modal } from "react-bootstrap";
//import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const AdminPanel = ({ token, onLogout }) => {
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  //const [message, setMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState(""); // State for success message
  const [errorMessage, setErrorMessage] = useState(""); // State for error message
  const [showSuccessMessage, setShowSuccessMessage] = useState(false); // State for success message visibility
  const [showErrorMessage, setShowErrorMessage] = useState(false); // State for error message visibility
  const [filteredReports, setFilteredReports] = useState([]); // Add this line
  const [filterAppointmentType, setFilterAppointmentType] = useState("");
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;
  const [filterEmployee, setFilterEmployee] = useState("");
  const [filterAddress, setFilterAddress] = useState("");
  const [filterEquipment, setFilterEquipment] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  //const [employees, setEmployees] = useState([]);
  const [totalSpiralMeters, setTotalSpiralMeters] = useState(0);
  const [totalOtoHuawei, setTotalOtoHuawei] = useState(0);
  const [totalOtoClassic, setTotalOtoClassic] = useState(0);
  const [totalRouters, setTotalRouters] = useState(0);
  const [totalONT, setTotalONT] = useState(0);
  const [showCreateEmployeeForm, setShowCreateEmployeeForm] = useState(false);
  const [showEmployeeList, setShowEmployeeList] = useState(false);
  const [rowLimit, setRowLimit] = useState(20); // Default limit is 20
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null); // Store the item to delete

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all users
        const usersResponse = await axios.get("http://localhost:5000/admin/users", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(usersResponse.data);

        // Fetch all reports
        const reportsResponse = await axios.get("http://localhost:5000/admin/reports", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setReports(reportsResponse.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [token]);


  // Function to show temporary success message
  const showTemporarySuccessMessage = (message) => {
    setSuccessMessage(message);
    setShowSuccessMessage(true);
    setTimeout(() => {
      setShowSuccessMessage(false);
      setSuccessMessage("");
    }, 3000); // Hide after 3 seconds
  };

  // Function to show temporary error message
  const showTemporaryErrorMessage = (message) => {
    setErrorMessage(message);
    setShowErrorMessage(true);
    setTimeout(() => {
      setShowErrorMessage(false);
      setErrorMessage("");
    }, 3000); // Hide after 3 seconds
  };

  const fetchUsersUpdateOnClick = async () => {
    try {
      const response = await axios.get("http://localhost:5000/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  useEffect(() => {
    const filtered = reports.filter((report) => {
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

      // Filter by employee (use employee_name instead of name)
      if (filterEmployee) {
        const employeeName = report.employee_name || ""; // Use employee_name from reports

        // Strip "(Deleted)" from the filterEmployee value for comparison
        const filterEmployeeName = filterEmployee.replace(" (Deleted)", "");

        // Compare the names without the "(Deleted)" marker
        if (employeeName.replace(" (Deleted)", "") !== filterEmployeeName) {
          return false;
        }
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

    setFilteredReports(filtered); // Update the state
    // Calculate router and ONT counts
    const { routerCount, ontCount } = calculateRouterAndONTCounts(filtered);
    setTotalRouters(routerCount);
    setTotalONT(ontCount);

    setTotalSpiralMeters(calculateTotalSpiralMeters(filtered));
    const { otoHuaweiCount, otoClassicCount } = calculatePrizakiaCounts(filtered);
    setTotalOtoHuawei(otoHuaweiCount);
    setTotalOtoClassic(otoClassicCount);
  }, [reports, filterAppointmentType, startDate, endDate, filterEmployee, filterAddress, filterEquipment]);


  const getCombinedEmployeeList = () => {
    // Extract all unique employee names from the reports table
    const reportEmployeeNames = [...new Set(reports.map((report) => report.employee_name || ""))];

    // Create a list of active users from the users table
    const activeUsers = users.map((user) => user.name);

    // Combine the lists and mark deleted users
    const combinedList = reportEmployeeNames.map((name) => {
      // If the name is null or empty, skip it
      if (!name) return "";

      // If the name already contains "(Deleted)", return it as is
      if (name.includes("(Deleted)")) {
        return name;
      }

      // If the name is not in the active users list, mark it as deleted
      if (!activeUsers.includes(name)) {
        return `${name} (Deleted)`;
      }

      // Otherwise, return the name as is
      return name;
    });

    // Add active users who haven't submitted any reports yet
    activeUsers.forEach((name) => {
      if (!reportEmployeeNames.includes(name)) {
        combinedList.push(name);
      }
    });

    // Filter out empty strings (null or undefined names)
    return combinedList.filter((name) => name !== "");
  };

  // Function to calculate total spiral meters
  const calculateTotalSpiralMeters = (filteredReports) => {
    let total = 0;
    filteredReports.forEach((report) => {
      const spiralMeters = parseFloat(report.spiral_meters);
      if (!isNaN(spiralMeters)) {
        total += spiralMeters;
      }
    });
    return total;
  };

  //Function calculate routers
  const calculateRouterAndONTCounts = (filteredReports) => {
    let routerCount = 0;
    let ontCount = 0;

    filteredReports.forEach((report) => {
      if (report.router_serial) {
        routerCount++;
      }
      if (report.ont_serial) {
        ontCount++;
      }
    });

    return { routerCount, ontCount };
  };

  //Function to calculate total prizakia
  const calculatePrizakiaCounts = (filteredReports) => {
    let otoHuaweiCount = 0;
    let otoClassicCount = 0;

    filteredReports.forEach((report) => {
      if (report.prizakia === "Oto Huawei") {
        otoHuaweiCount++;
      } else if (report.prizakia === "Oto Classic") {
        otoClassicCount++;
      }
    });

    return { otoHuaweiCount, otoClassicCount };
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
      showTemporarySuccessMessage("✅ Employee created successfully!");
      setName("");
      setUsername("");
      setPassword("");
      fetchUsersUpdateOnClick();
    } catch (error) {
      showTemporaryErrorMessage("❌ Error creating employee.");
    }
  };


  const handleDeleteUser = (id) => {
    setItemToDelete({ id, type: "employee" });
    setShowDeleteModal(true);
  };

  const handleDeleteReport = (id) => {
    setItemToDelete({ id, type: "report" });
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (itemToDelete?.type === "employee") {
      await deleteUser(itemToDelete.id);
    } else if (itemToDelete?.type === "report") {
      await deleteReport(itemToDelete.id);
    }
    setShowDeleteModal(false);
  };

  // Delete a user
  const deleteUser = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/admin/delete-user/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(users.filter((user) => user.id !== id));
      showTemporarySuccessMessage("✅ Employee deleted.");
    } catch (error) {
      showTemporaryErrorMessage("❌ Error deleting employee.");
    }
  };

  // Delete a report
  const deleteReport = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/admin/delete-report/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReports(reports.filter((report) => report.id !== id));
      showTemporarySuccessMessage("✅ Report deleted.");
    } catch (error) {
      showTemporaryErrorMessage("❌ Error deleting report.");
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
  /*const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(reports);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Reports");
    XLSX.writeFile(workbook, "Employee_Reports.xlsx");
  };*/

  // Format date to "DD/MM/YYYY"
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatDateForCreatedAt = (dateString) => {
    if (!dateString) return "Invalid Date"; // Handle null or undefined values
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid Date"; // Handle invalid dates
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
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

  const limitedReports = filteredReports.slice(0, rowLimit);

  return (

    <Container fluid className="p-4">
      <Row className="mb-4">
        <Col>
          <h2 className="mb-3">Admin Panel</h2>
          <Button variant="danger" onClick={onLogout} className="mb-3">
            🚪 Logout
          </Button>
        </Col>
      </Row>
      {/* Success Message */}
      {showSuccessMessage && (
        <Row className="mb-4">
          <Col>
            <Alert variant="success" onClose={() => setShowSuccessMessage(false)} dismissible>
              {successMessage}
            </Alert>
          </Col>
        </Row>
      )}

      {/* Error Message */}
      {showErrorMessage && (
        <Row className="mb-4">
          <Col>
            <Alert variant="danger" onClose={() => setShowErrorMessage(false)} dismissible>
              {errorMessage}
            </Alert>
          </Col>
        </Row>
      )}
      {/* Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete this {itemToDelete?.type}?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleConfirmDelete}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
      <Row className="mb-4">
        <Col>
          <Button
            variant="primary"
            onClick={() => setShowCreateEmployeeForm(!showCreateEmployeeForm)}
            className="me-2"
          >
            {showCreateEmployeeForm ? "Hide Create Employee Form" : "Show Create Employee Form"}
          </Button>
          <Button
            variant="secondary"
            onClick={() => setShowEmployeeList(!showEmployeeList)}
          >
            {showEmployeeList ? "Hide Employee List" : "Show Employee List"}
          </Button>
        </Col>
      </Row>


      {showCreateEmployeeForm && (
        <Row className="mb-4">
          <Col>
            <Card>
              <Card.Body>
                <h3 className="mb-3">Create Employee</h3>
                <Form onSubmit={createUser}>
                  <Form.Group className="mb-3">
                    <Form.Control
                      type="text"
                      placeholder="Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </Form.Group>
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
                  <Button variant="primary" type="submit">
                    ➕ Create Employee
                  </Button>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
      {showEmployeeList && (
        <Row className="mb-4">
          <Col>
            <Card>
              <Card.Body>
                <h3 className="mb-3">Employee List</h3>
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
                          <Button variant="danger" size="sm" onClick={() => handleDeleteUser(user.id)}>
                            🗑️ Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Body>
              <h3 className="mb-3">Submitted Reports</h3>
              <Row className="mb-3">
                <Col>
                  <h4>Filters</h4>
                  <Form.Group className="mb-3">
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

                  <Form.Group className="mb-3">
                    <Form.Label>Date Range: &nbsp;</Form.Label>
                    <DatePicker
                      selectsRange={true}
                      startDate={startDate}
                      endDate={endDate}
                      onChange={(update) => setDateRange(update)}
                      isClearable={true}
                      placeholderText="Select a date range"
                      className="form-control"
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Employee:</Form.Label>
                    <Form.Control
                      as="select"
                      value={filterEmployee}
                      onChange={(e) => setFilterEmployee(e.target.value)}
                    >
                      <option value="">All</option>
                      {getCombinedEmployeeList().map((name, index) => (
                        <option key={index} value={name}>
                          {name}
                        </option>
                      ))}
                    </Form.Control>
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Address:</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Search by address"
                      value={filterAddress}
                      onChange={(e) => setFilterAddress(e.target.value)}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
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
                      setDateRange([null, null]);
                      setFilterEmployee("");
                      setFilterAddress("");
                      setFilterEquipment("");
                    }}
                  >
                    🔄 Reset Filters
                  </Button>
                </Col>
              </Row>

              <Row className="mb-3">
                <Col>
                  <strong>Total Appointments:</strong> {filteredReports.length}
                  <br></br>
                  <strong>Total Spiral Meters Used:</strong> {totalSpiralMeters.toFixed(2)}m
                  <br></br>
                  <strong>Total Oto Huawei:</strong> {totalOtoHuawei}
                  <br></br>
                  <strong>Total Oto Classic:</strong> {totalOtoClassic}
                  <br></br>
                  <strong>Total Routers:</strong> {totalRouters}
                  <br></br>
                  <strong>Total ONT Devices:</strong> {totalONT}
                </Col>
              </Row>
              <Row className="mb-3">
                <Col>
                  <Button variant="secondary" className="mb-2" onClick={sortReports}>
                    🔃 Sort by Date ({sortOrder.toUpperCase()})
                  </Button>
                  <Button variant="primary" className="mb-2" onClick={exportToPDF}>
                    📄 Export to PDF
                  </Button>
                </Col>
              </Row>
              <Form.Group className="w-25 mb-3">
                <Form.Label>Rows per page:</Form.Label>
                <Form.Control
                  as="select"
                  value={rowLimit}
                  onChange={(e) => setRowLimit(Number(e.target.value))}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </Form.Control>
              </Form.Group>
              <div className="table-responsive" style={{ overflowX: "auto" }}>
                <Table striped bordered hover>
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Date</th>
                      <th>Address</th>
                      <th>Type</th>
                      <th>Router Serial</th>
                      <th>ONT Serial</th>
                      <th>Ines (m)</th>
                      <th>Prizakia</th>
                      <th>Spiral (m)</th>
                      <th>Notes</th>
                      <th>Attachment</th>
                      <th>Created At</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {limitedReports.map((report) => (
                      <tr key={report.id}>
                        <td>{report.employee_name}</td>
                        <td>{formatDate(report.date)}</td>
                        <td>{report.address}</td>
                        <td>{report.appointment_type}</td>
                        <td>{report.router_serial}</td>
                        <td>{report.ont_serial}</td>
                        <td>{report.ines_length}</td>
                        <td>{report.prizakia}</td>
                        <td>{report.spiral_meters}</td>
                        <td>{report.notes}</td>
                        <td>
                          {report.attachments && report.attachments.length > 0 ? (
                            report.attachments.split(",").map((attachment, index) => (
                              <div key={index}>
                                {attachment.endsWith(".mp4") || attachment.endsWith(".avi") ? (
                                  <video width="100" controls>
                                    <source src={`http://localhost:5000/uploads/${attachment}`} type="video/mp4" />
                                    Your browser does not support the video tag.
                                  </video>
                                ) : (
                                  <a href={`http://localhost:5000/uploads/${attachment}`} target="_blank" rel="noopener noreferrer">
                                    <img src={`http://localhost:5000/uploads/${attachment}`} alt="Attachment" width="100" />
                                  </a>
                                )}
                              </div>
                            ))
                          ) : (
                            "No Attachment"
                          )}
                        </td>
                        <td>{formatDateForCreatedAt(report.created_at)}</td>
                        <td>
                          <Button variant="danger" size="sm" onClick={() => handleDeleteReport(report.id)}>
                            🗑️ Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container >
  );
};

export default AdminPanel;