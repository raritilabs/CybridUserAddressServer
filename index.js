const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
// const cors = require("cors"); // Import cors
const axios = require("axios"); // Import axios

const app = express();
const port = 3006;

// Enable CORS
// app.use(cors()); // Allow all origins by default

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

// Address autocomplete API endpoint with state filtering
app.get("/autocomplete", (req, res) => {
  const query = req.query.q;
  const state = req.query.state;

  if (!query || query.length < 3) {
    return res
      .status(400)
      .json({ error: "Query must be at least 3 characters long." });
  }

  if (!state || state.length < 2) {
    return res
      .status(400)
      .json({ error: "State query must be at least 2 characters long." });
  }

  // Split the query into potential number and street parts
  const queryParts = query.split(" ");
  const number = queryParts[0];
  const street = queryParts.slice(1).join(" ");

  // SQL query to search for addresses matching the input query and state
  const sql = `
    SELECT * FROM addresses 
    WHERE number = ? AND street LIKE ? AND state LIKE ?
    LIMIT 10
  `;

  db.all(sql, [number, `%${street}%`, `%${state}%`], (err, rows) => {
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

// New endpoint for fetching addresses based on query and state
app.get("/states", (req, res) => {
  const number = req.query.number;
  const street = req.query.street;
  const state = req.query.state;

  if (!number || !street || !state) {
    return res.status(400).json({ error: "Invalid input parameters" });
  }

  const sql = `
    SELECT * FROM addresses 
    WHERE number = ? AND street LIKE ? AND state = ?
    LIMIT 10
  `;

  db.all(sql, [number, `%${street}%`, state], (err, rows) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch data" });
    } else {
      res.json({ results: rows });
    }
  });
});

// New exchange rates endpoint
app.get("/api/exchange-rates", async (req, res) => {
  try {
    const response = await axios.get(
      "https://api.coinbase.com/v2/exchange-rates?currency=USD"
    );
    res.json(response.data);
  } catch (error) {
    console.error("Error fetching exchange rates", error);
    res.status(500).send("Error fetching exchange rates");
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
