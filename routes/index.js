const express = require("express");
const router = express.Router();
const db = require("../db");

// --- PUBLIC ROUTES (Login/Logout) ---
router.get("/login", (req, res) =>
  res.render("login", { title: "Login", error: null })
);
router.post("/login", (req, res) => {
  if (req.body.password === "admin") {
    req.session.loggedIn = true;
    res.redirect("/");
  } else {
    res.render("login", { title: "Login", error: "Incorrect Password" });
  }
});
router.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/login"));
});

// --- SECURE ROUTES (All routes below this point require login) ---
router.use((req, res, next) => {
  if (req.session.loggedIn) return next();
  res.redirect("/login");
});

// GET Home Page (Original card layout)
router.get("/", async (req, res) => {
  const filter = req.query.filter || "";

  try {
    const [devices] = await db.query(
      "SELECT * FROM devices ORDER BY CAMPUS, LOCATION"
    );
    const [locations] = await db.query("SELECT * FROM locations ORDER BY ID");

    // Fetch the latest reading for each device
    const deviceDataPromises = devices.map(async (device) => {
      // Sanitize table name just in case, though it comes from our DB
      const tableName = device.Name.replace(/[^a-zA-Z0-9_]/g, "");
      const [latestReading] = await db.query(
        `SELECT * FROM \`${tableName}\` ORDER BY id DESC LIMIT 1`
      );

      if (
        !filter ||
        (latestReading.length > 0 && latestReading[0].CAMPUS === filter)
      ) {
        return {
          ...device, // Name, Campus, Location
          temp: latestReading.length ? latestReading[0].TEMP : "N/A",
          time: latestReading.length
            ? new Date(
                latestReading[0].DATE + " " + latestReading[0].TIME
              ).toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
              })
            : "N/A",
          date: latestReading.length
            ? new Date(latestReading[0].DATE).toLocaleDateString("en-US")
            : "N/A",
        };
      }
      return null;
    });

    const deviceData = (await Promise.all(deviceDataPromises)).filter(
      (d) => d !== null
    );

    res.render("index", {
      title: "Temperature Alarms",
      deviceData,
      locations,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error on the main page.");
  }
});

router.get("/history", async (req, res) => {
  const { table, date } = req.query;
  if (!table) return res.status(400).send("Device table not specified.");

  // Default to today if no date is provided
  const searchDate =
    date ||
    new Date().toLocaleDateString("en-US", { timeZone: "America/Chicago" });

  try {
    const tableName = table.replace(/[^a-zA-Z0-9_]/g, "");

    // Get device info for the header
    const [deviceInfo] = await db.query(
      "SELECT Location, Campus FROM devices WHERE Name = ? LIMIT 1",
      [tableName]
    );

    // Get history data for the specified date
    const [historyData] = await db.query(
      `SELECT time, temp FROM \`${tableName}\` WHERE date = ?`,
      [searchDate]
    );

    res.render("history", {
      title: "Sensor History",
      device: deviceInfo.length
        ? deviceInfo[0]
        : { Location: "Unknown", Campus: "Unknown" },
      history: historyData,
      currentDate: searchDate,
      tableName: tableName,
    });
  } catch (err) {
    console.error(`Error fetching history for ${table}:`, err);
    res.status(500).send("Could not retrieve sensor history.");
  }
});

module.exports = router;
