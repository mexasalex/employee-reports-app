const { Pool } = require("pg");

const pool = new Pool({
  user: "reportadmin",  // Change to "reportadmin" if you created a new user
  host: "localhost",
  database: "employeereports",
  password: "mexas0258",  // Replace with your actual password
  port: 5432,  // Default PostgreSQL port
});

module.exports = pool;
