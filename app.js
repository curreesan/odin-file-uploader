const express = require("express");
const dotenv = require("dotenv");
const path = require("path");
const session = require("express-session");
const passport = require("passport");

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaSessionStore } = require("@quixo3/prisma-session-store");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Prisma Setup
const connectionString = process.env.DATABASE_URL;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

// Load Passport Configuration
const passportConfig = require("./config/passport");
passportConfig(prisma);

// Middleware
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));

// Session Setup with Prisma Session Store
app.use(
  session({
    secret: process.env.SESSION_SECRET || "simple-secret-key-for-development",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    },
    store: new PrismaSessionStore(prisma, {
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

// Home Route
app.get("/", (req, res) => {
  res.render("index");
});

// Signup Route
app.get("/signup", (req, res) => {
  res.render("signup");
});

app.post("/signup", async (req, res) => {
  const { email, password, name } = req.body;

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.send(
        'A user with this email already exists. <br><a href="/signup">Try again</a>',
      );
    }

    const bcrypt = require("bcryptjs");
    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
      },
    });

    res.send(
      `✅ Account created successfully for ${email}! <br><br><a href="/login">Go to Login →</a>`,
    );
  } catch (error) {
    console.error(error);
    res.send(
      'Something went wrong during signup. <a href="/signup">Try again</a>',
    );
  }
});

// Login Route (GET)
app.get("/login", (req, res) => {
  res.render("login");
});

// Login POST
app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/dashboard",
    failureRedirect: "/login",
  }),
);

// Logout Route
app.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.send("Error logging out");
    }
    res.redirect("/");
  });
});

// GET Dashboard - Show folders
app.get("/dashboard", async (req, res) => {
  if (!req.user) {
    return res.redirect("/login");
  }

  const folders = await prisma.folder.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: "desc" },
  });

  res.render("dashboard", { folders });
});

// Create Folder
app.post("/folders", async (req, res) => {
  if (!req.user) {
    return res.redirect("/login");
  }

  const { name } = req.body;

  if (!name || name.trim() === "") {
    return res.send(
      'Folder name cannot be empty. <a href="/dashboard">Go back</a>',
    );
  }

  try {
    const newFolder = await prisma.folder.create({
      data: {
        name: name.trim(),
        userId: req.user.id,
      },
    });

    res.redirect("/dashboard");
  } catch (error) {
    // Handle duplicate folder name error
    if (error.code === "P2002") {
      return res.send(
        `Folder "${name}" already exists. <a href="/dashboard">Go back</a>`,
      );
    }
    res.send('Error creating folder. <a href="/dashboard">Go back</a>');
  }
});

// Delete Folder
app.post("/folders/:id/delete", async (req, res) => {
  if (!req.user) {
    return res.redirect("/login");
  }

  const folderId = parseInt(req.params.id);

  try {
    // Security check: Make sure the folder belongs to the current user
    const folder = await prisma.folder.findUnique({
      where: { id: folderId },
    });

    if (!folder || folder.userId !== req.user.id) {
      return res.send(
        'Folder not found or you do not have permission. <a href="/dashboard">Go back</a>',
      );
    }

    // Delete the folder (files inside will be auto-deleted due to cascade)
    await prisma.folder.delete({
      where: { id: folderId },
    });

    res.redirect("/dashboard");
  } catch (error) {
    console.error(error);
    res.send('Error deleting folder. <a href="/dashboard">Go back</a>');
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
