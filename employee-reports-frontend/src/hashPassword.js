const bcrypt = require("bcryptjs");

// Generate a salt (a random string added to the password before hashing)
const salt = bcrypt.genSaltSync(10);

// Hash the password
const password = "1234"; // Replace with the desired password
const hashedPassword = bcrypt.hashSync(password, salt);

console.log("Hashed Password:", hashedPassword);