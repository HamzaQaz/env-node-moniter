const express = require("express");
const router = express.Router();
const db = require("../db");
const nodemailer = require("nodemailer"); 



router.get("/write", async (req, res) => {
  
  const { table, temp, humidity } = req.query;

  if (!table || !temp || !humidity) {
    return res
      .status(400)
      .send("Missing 'table', 'temp', or 'humidity' query parameter.");
  }

  const tableName = table.replace(/-/g, "_");

  try {
    const [devices] = await db.query("SELECT * FROM devices WHERE Name = ?", [
      tableName,
    ]);
    if (devices.length === 0) {
      return res.status(404).send("Device not found.");
    }

    const device = devices[0];
    const { Location, Campus } = device;
    const now = new Date();
    const date = now.toLocaleDateString("en-US", {
      timeZone: "America/Chicago",
    });
    const time = now.toLocaleTimeString("en-US", {
      timeZone: "America/Chicago",
      hour12: true,
    });

    const insertSql = `INSERT INTO \`${tableName}\` (CAMPUS, LOCATION, DATE, TIME, TEMP, HUMIDITY) VALUES (?, ?, ?, ?, ?, ?)`;
    await db.query(insertSql, [Campus, Location, date, time, temp, humidity]);

    
    
    const [alarms] = await db.query("SELECT * FROM alarms");
    for (const alarm of alarms) {
      
      if (parseFloat(temp) >= parseFloat(alarm.TEMP)) {
        
        console.log(
          `ALARM: Device ${tableName} temperature ${temp} is over the threshold of ${alarm.TEMP}`
        );
      }
    }

    res.status(200).send("Record created successfully.");
  } catch (err) {
    console.error("API Write Error:", err);
    res.status(500).send("Error processing your request.");
  }
});

module.exports = router;
