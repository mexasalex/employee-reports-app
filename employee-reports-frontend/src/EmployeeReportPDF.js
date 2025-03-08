import React from "react";
import { Page, Text, View, Document, StyleSheet, Font } from "@react-pdf/renderer";

// Register the custom font
Font.register({
  family: "NotoSans",
  src: "/assets/fonts/NotoSans-Regular.ttf", // Path to the font file in the public folder
});

// Define styles for the PDF
const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    padding: 20,
    fontFamily: "NotoSans",
  },
  header: {
    fontSize: 18,
    marginBottom: 10,
    fontWeight: "bold",
  },
  subheader: {
    fontSize: 14,
    marginBottom: 5,
    fontWeight: "bold",
  },
  table: {
    display: "table",
    width: "auto",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#000",
    marginBottom: 10,
  },
  tableRow: {
    flexDirection: "row",
  },
  tableHeader: {
    backgroundColor: "#f0f0f0",
    fontWeight: "bold",
    padding: 5,
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#000",
    fontSize: 10,
  },
  tableCell: {
    padding: 5,
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#000",
    fontSize: 10,
  },
  summary: {
    fontSize: 12,
    marginTop: 10,
  },
});

// Helper function to format date as DD/MM/YY
const formatDateDDMMYY = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "N/A"; // Handle invalid dates
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear()).slice(-2);
  return `${day}/${month}/${year}`;
};

// Helper function to format created_at as MM/DD/YY hh:mm
const formatCreatedAtMMDDYYHHMM = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "N/A"; // Handle invalid dates
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = String(date.getFullYear()).slice(-2);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${month}/${day}/${year} ${hours}:${minutes}`;
};


// PDF Document Component
const EmployeeReportPDF = ({ filteredReports, filters, totals }) => {
  console.log("Filtered Reports:", filteredReports);
  console.log("Filters:", filters);
  console.log("Totals:", totals);

  return (
    <Document>
      <Page size="A4" style={styles.page} orientation="landscape">
        {/* Title */}
        <Text style={styles.header}>Employee Reports</Text>

        {/* Filter Details */}
        <Text style={styles.subheader}>Filters Applied:</Text>
        <Text>
          - Date Range: {filters.startDate ? formatDateDDMMYY(filters.startDate) : "N/A"} to {filters.endDate ? formatDateDDMMYY(filters.endDate) : "N/A"}
        </Text>
        <Text>- Appointment Type: {filters.appointmentType || "All"}</Text>
        <Text>- Employee: {filters.employee || "All"}</Text>
        <Text>- Address: {filters.address || "All"}</Text>
        <Text>- Equipment: {filters.equipment || "All"}</Text>

        {/* Table */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableRow}>
            <Text style={[styles.tableHeader, { width: 60 }]}>Employee</Text>
            <Text style={[styles.tableHeader, { width: 50 }]}>Date</Text>
            <Text style={[styles.tableHeader, { width: 80 }]}>Address</Text>
            <Text style={[styles.tableHeader, { width: 80 }]}>Appointment Type</Text>
            <Text style={[styles.tableHeader, { width: 60 }]}>Router Serial</Text>
            <Text style={[styles.tableHeader, { width: 60 }]}>ONT Serial</Text>
            <Text style={[styles.tableHeader, { width: 50 }]}>INES Length (m)</Text>
            <Text style={[styles.tableHeader, { width: 60 }]}>Prizakia</Text>
            <Text style={[styles.tableHeader, { width: 60 }]}>Spiral Meters (m)</Text>
            <Text style={[styles.tableHeader, { width: 80 }]}>Notes</Text>
            <Text style={[styles.tableHeader, { width: 80 }]}>Attachment</Text>
            <Text style={[styles.tableHeader, { width: 80 }]}>Created At</Text>
          </View>

          {/* Table Rows */}
          {filteredReports.map((report, index) => {
            console.log("Report:", report); // Debug each report
            return (
              <View style={styles.tableRow} key={index}>
                <Text style={[styles.tableCell, { width: 60 }]}>{report.name || "N/A"}</Text>
                <Text style={[styles.tableCell, { width: 50 }]}>{formatDateDDMMYY(report.date) || "N/A"}</Text>
                <Text style={[styles.tableCell, { width: 80 }]}>{report.address || "N/A"}</Text>
                <Text style={[styles.tableCell, { width: 80 }]}>{report.appointment_type || "N/A"}</Text>
                <Text style={[styles.tableCell, { width: 60 }]}>{report.router_serial || "N/A"}</Text>
                <Text style={[styles.tableCell, { width: 60 }]}>{report.ont_serial || "N/A"}</Text>
                <Text style={[styles.tableCell, { width: 50 }]}>{report.ines_length || "N/A"}</Text>
                <Text style={[styles.tableCell, { width: 60 }]}>{report.prizakia || "N/A"}</Text>
                <Text style={[styles.tableCell, { width: 60 }]}>{report.spiral_meters || "N/A"}</Text>
                <Text style={[styles.tableCell, { width: 80 }]}>{report.notes || "N/A"}</Text>
                <Text style={[styles.tableCell, { width: 80 }]}>
                  {report.attachment ? `http://localhost:5000/uploads/${report.attachment}` : "No Attachment"}
                </Text>
                <Text style={[styles.tableCell, { width: 80 }]}>{formatCreatedAtMMDDYYHHMM(report.created_at) || "N/A"}</Text>
              </View>
            );
          })}
        </View>

        {/* Summary Section */}
        <Text style={styles.summary}>Total Appointments: {filteredReports.length}</Text>
        <Text style={styles.summary}>Total Spiral Meters Used: {totals.spiralMeters.toFixed(2)}m</Text>
        <Text style={styles.summary}>Total Oto Huawei: {totals.otoHuawei}</Text>
        <Text style={styles.summary}>Total Oto Classic: {totals.otoClassic}</Text>
        <Text style={styles.summary}>Total Routers: {totals.routers}</Text>
        <Text style={styles.summary}>Total ONT Devices: {totals.ont}</Text>
      </Page>
    </Document>
  );
};

export default EmployeeReportPDF;