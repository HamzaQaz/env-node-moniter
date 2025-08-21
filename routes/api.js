const express = require("express");
const router = express.Router();
const db = require("../db");
const nodemailer = require("nodemailer"); // Assuming you use nodemailer for alarms

// This entire router is public. NO LOGIN CHECKS HERE.
const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
        user: 'mikayla.carroll@ethereal.email',
        pass: 'ApyqH3KcG6hRwMaSKQ'
    }
});

// GET /api/write
// This is the endpoint your ESP8266 will send data to.
// In /routes/api.js

router.get("/write", async (req, res) => {
  // We get temp and humidity from the request
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

    
    // Check for alarms using the correct 'temp' variable
    const [alarms] = await db.query("SELECT * FROM alarms");
    for (const alarm of alarms) {
      // The 'if' statement now correctly uses the 'temp' variable
      if (parseFloat(temp) >= parseFloat(alarm.TEMP)) {
        // Send an email alert
        const mailOptions = {
          from: '"Device Monitor" <mikayla.carroll@ethereal.email>',
          to: alarm.EMAIL,
          subject: `ALARM: Device ${tableName} Temperature Alert`,
          text: `Device ${tableName} temperature ${temp} is over the threshold of ${alarm.TEMP}. Location: ${Location}, Campus: ${Campus}.`,
        };
        await transporter.sendMail(mailOptions);

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
