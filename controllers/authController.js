const bcrypt = require("bcryptjs");
const passport = require("passport");
const prisma = require("../prisma");

const signup = async (req, res) => {
  const { email, password, name } = req.body;

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      return res.send(
        'A user with this email already exists. <br><a href="/signup">Try again</a>',
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: { email, password: hashedPassword, name: name || null },
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
};

const login = passport.authenticate("local", {
  successRedirect: "/dashboard",
  failureRedirect: "/login",
});

const logout = (req, res) => {
  req.logout((err) => {
    if (err) return res.send("Error logging out");
    res.redirect("/");
  });
};

module.exports = { signup, login, logout };
