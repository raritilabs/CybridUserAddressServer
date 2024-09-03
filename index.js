const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const app = express();
const port = 3001;

// Path to your SQLite database file
const dbPath = path.resolve("./", "addresses_sample.sqlite3");

// Connect to the SQLite database
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error("Could not connect to database", err);
  } else {
    console.log("Connected to the SQLite database");
  }
});

// Address autocomplete API endpoint
app.get("/autocomplete", (req, res) => {
  const query = req.query.q;

  if (!query || query.length < 3) {
    return res
      .status(400)
      .json({ error: "Query must be at least 3 characters long." });
  }

  // SQL query to search for addresses matching the input query
  const sql = `
    SELECT * FROM addresses 
    WHERE street LIKE ? 
    LIMIT 10
  `;

  db.all(sql, [`%${query}%`], (err, rows) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch data" });
    } else {
      res.json({ results: rows });
    }
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
