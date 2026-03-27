const express = require("express");
const dotenv = require("dotenv");
const path = require("path");
const session = require("express-session");
const passport = require("passport");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Import the shared Prisma instance
const prisma = require("./prisma");

// Load Passport Configuration
const passportConfig = require("./config/passport");
passportConfig(prisma); // ← pass the same instance

// Middleware
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));

// Session Setup with Prisma Session Store
const { PrismaSessionStore } = require("@quixo3/prisma-session-store");

app.use(
  session({
    secret: process.env.SESSION_SECRET || "simple-secret-key-for-development",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    },
    store: new PrismaSessionStore(prisma, {
      // ← use the shared prisma
      checkPeriod: 2 * 60 * 1000,
      dbRecordIdIsSessionId: true,
    }),
  }),
);

app.use(passport.initialize());
app.use(passport.session());

// Make currentUser available in all EJS views
app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  next();
});

// Import Routes (we'll update these next)
const authRoutes = require("./routes/authRoutes");
const folderRoutes = require("./routes/folderRoutes");
// const fileRoutes = require("./routes/fileRoutes");   // uncomment later

// Mount Routes
app.use("/", authRoutes);
app.use("/", folderRoutes);
// app.use("/", fileRoutes);

// Home Route
app.get("/", (req, res) => {
  res.render("index");
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
