const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const session = require("express-session");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// View engine setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  session({
    secret: process.env.SESSION_SECRET || "a_very_strong_secret_key_12345",
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 }, // 30 days
  })
);

// Middleware to make session available to all views
app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

// --- ROUTER SEPARATION ---

// 1. Public API Router (for ESP8266 - NO LOGIN REQUIRED)
const apiRouter = require("./routes/api");
app.use("/api", apiRouter);

// 2. Secure User-Facing Router (for web pages - LOGIN REQUIRED)
const indexRouter = require("./routes/index");
app.use("/", indexRouter);

// 3. Secure Admin Router (for settings - LOGIN REQUIRED)
const adminRouter = require("./routes/admin");
app.use("/admin", adminRouter);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
