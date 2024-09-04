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

  // Split the query into potential number and street parts
  const queryParts = query.split(" ");
  const number = queryParts[0];
  const street = queryParts.slice(1).join(" ");

  // SQL query to search for addresses matching the input query
  const sql = `
    SELECT * FROM addresses 
    WHERE number = ? AND street LIKE ?
    LIMIT 10
  `;

  db.all(sql, [number, `%${street}%`], (err, rows) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch data" });
    } else {
      res.json({ results: rows });
    }
  });
});

// Address filtering by state endpoint
app.get("/addresses-by-state", (req, res) => {
  const state = req.query.state;

  if (!state || state.length < 2) {
    return res
      .status(400)
      .json({ error: "State query must be at least 2 characters long." });
  }

  // SQL query to search for addresses by state
  const sql = `
    SELECT * FROM addresses 
    WHERE state LIKE ?
    LIMIT 10
  `;

  db.all(sql, [`%${state}%`], (err, rows) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch data" });
    } else {
      res.json({ results: rows });
    }
  });
});
// Add this new endpoint to your existing Express app
// Add this new endpoint to your existing Express app
app.get("/states", (req, res) => {
  const sql = "SELECT DISTINCT state FROM addresses ORDER BY state";

  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch states" });
    } else {
      // Map to include state codes and names
      const states = rows.map((row) => ({ code: row.state, name: row.state }));
      res.json({ results: states });
    }
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
