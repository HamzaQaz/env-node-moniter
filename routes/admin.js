const express = require("express");
const router = express.Router();
const db = require("../db");


const secure = (req, res, next) => {
  if (req.session.loggedIn) {
    return next();
  } else {
    res.redirect("/login");
  }
};
router.use(secure);


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




router.post("/device/add", async (req, res) => {
  const { name, campus, location } = req.body;
  if (!name || !campus || !location) {
    return res.status(400).send("Missing required fields to add a device.");
  }


  const dbSafeName = name.replace(/-/g, "_");

  try {
    
    await db.query(
      "INSERT INTO devices (Name, Campus, Location) VALUES (?, ?, ?)",
      [dbSafeName, campus, location]
    );

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


router.get("/device/delete/:id/:name", async (req, res) => {
  const { id, name } = req.params;
  try {
    
    await db.query("DELETE FROM devices WHERE ID = ?", [id]);

    
    const tableName = name.replace(/[^a-zA-Z0-9_]/g, "");
    await db.query(`DROP TABLE IF EXISTS \`${tableName}\``);

    res.redirect("/admin");
  } catch (err) {
    console.error("Failed to delete device:", err);
    res.status(500).send("Failed to delete device.");
  }
});




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
