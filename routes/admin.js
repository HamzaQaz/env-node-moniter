const express = require("express");
const router = express.Router();
const db = require("../db");

// Middleware to secure all admin routes
const secure = (req, res, next) => {
  if (req.session.loggedIn) {
    return next();
  } else {
    res.redirect("/login");
  }
};
router.use(secure);

// GET Admin Page - Fetches all data for display
router.get("/", async (req, res) => {
  try {
    const [devices] = await db.query("SELECT * FROM devices ORDER BY Name");
    const [locations] = await db.query("SELECT * FROM locations ORDER BY NAME");
    const [alarms] = await db.query("SELECT * FROM alarms ORDER BY ID");

    res.render("admin", {
      title: "Settings",
      devices,
      locations,
      alarms,
    });
  } catch (err) {
    console.error("Database error on admin page:", err);
    res.status(500).send("Database error on admin page.");
  }
});

// --- DEVICE MANAGEMENT ---

// Handles adding a new device
router.post("/device/add", async (req, res) => {
  const { name, campus, location } = req.body;
  if (!name || !campus || !location) {
    return res.status(400).send("Missing required fields to add a device.");
  }

  // 1. Create a database-safe name by replacing hyphens with underscores.
  const dbSafeName = name.replace(/-/g, "_");

  try {
    // 2. Use the corrected 'dbSafeName' when inserting into the main devices list.
    await db.query(
      "INSERT INTO devices (Name, Campus, Location) VALUES (?, ?, ?)",
      [dbSafeName, campus, location]
    );

    // 3. Use the same 'dbSafeName' when creating the new data table for that device.
    // NOTE: Corrected a missing backtick in the LOCATION column definition.
    const createTableSql = `CREATE TABLE IF NOT EXISTS \`${dbSafeName}\` (\`ID\` int(11) NOT NULL AUTO_INCREMENT, \`CAMPUS\` varchar(20) NOT NULL, \`LOCATION\` varchar(20) NOT NULL, \`DATE\` varchar(20) NOT NULL, \`TIME\` varchar(20) NOT NULL, \`TEMP\` int(20) NOT NULL, \`HUMIDITY\` int(20) NOT NULL, PRIMARY KEY (\`ID\`))`;
    await db.query(createTableSql);

    res.redirect("/admin");
  } catch (err) {
    console.error("Failed to add device:", err);
    res
      .status(500)
      .send("Failed to add device. Check server logs for details.");
  }
});

// Handles deleting a device
router.get("/device/delete/:id/:name", async (req, res) => {
  const { id, name } = req.params;
  try {
    // First, delete the record from the main devices list
    await db.query("DELETE FROM devices WHERE ID = ?", [id]);

    // Then, drop the specific data table for that device
    const tableName = name.replace(/[^a-zA-Z0-9_]/g, ""); // Basic sanitization
    await db.query(`DROP TABLE IF EXISTS \`${tableName}\``);

    res.redirect("/admin");
  } catch (err) {
    console.error("Failed to delete device:", err);
    res.status(500).send("Failed to delete device.");
  }
});

// --- LOCATION MANAGEMENT ---

// Handles adding a new location
router.post("/location/add", async (req, res) => {
  const { name, shortcode } = req.body;
  try {
    await db.query("INSERT INTO locations (NAME, SHORTCODE) VALUES (?, ?)", [
      name,
      shortcode,
    ]);
    res.redirect("/admin");
  } catch (err) {
    console.error("Failed to add location:", err);
    res.status(500).send("Failed to add location.");
  }
});

// Handles deleting a location
router.get("/location/delete/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await db.query("DELETE FROM locations WHERE ID = ?", [id]);
    res.redirect("/admin");
  } catch (err) {
    console.error("Failed to delete location:", err);
    res.status(500).send("Failed to delete location.");
  }
});

// --- ALARM MANAGEMENT ---

// Handles adding a new alarm
router.post("/alarm/add", async (req, res) => {
  const { email, temp } = req.body;
  try {
    await db.query("INSERT INTO alarms (EMAIL, TEMP) VALUES (?, ?)", [
      email,
      temp,
    ]);
    res.redirect("/admin");
  } catch (err) {
    console.error("Failed to add alarm:", err);
    res.status(500).send("Failed to add alarm.");
  }
});

// Handles deleting an alarm
router.get("/alarm/delete/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await db.query("DELETE FROM alarms WHERE ID = ?", [id]);
    res.redirect("/admin");
  } catch (err) {
    console.error("Failed to delete alarm:", err);
    res.status(500).send("Failed to delete alarm.");
  }
});

module.exports = router;
