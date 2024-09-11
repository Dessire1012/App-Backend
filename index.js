const cors = require("cors");
const express = require("express");
const bodyParser = require("body-parser");
const passport = require("passport");
const session = require("express-session");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const crypto = require("crypto");
const fs = require("fs");
const YAML = require("yaml");
const swaggerUi = require("swagger-ui-express");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const app = express();

// Swagger setup
const file = fs.readFileSync("./swagger.yaml", "utf8");
const swaggerDocument = YAML.parse(file);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Middleware setup
app.use(
  cors({
    origin: "https://vanguardchat.netlify.app",
    credentials: true, // Necesario para permitir el envío de cookies
  })
);

app.use(bodyParser.json());
app.use(cookieParser());
app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: true, sameSite: "None" },
  })
);
app.use(passport.initialize());
app.use(passport.session());

// Import routes and services
const userRouter = require("./routes/user.routes");
const {
  registerUser,
  getCredentials,
  getAllUsers,
  getCredentialsById,
} = require("./services/user.services");

// Routes
app.use("/user", userRouter);

// Passport configuration
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:
        "https://app-ffb84f79-a617-43e4-b3ef-d4e15dbc138f.cleverapps.io/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const existingUser = await getCredentials(profile.emails[0].value);

        if (existingUser) {
          return done(null, existingUser);
        } else {
          const salt = crypto.randomBytes(16).toString("base64");
          const password = crypto.randomBytes(16).toString("base64");
          const encryptedPassword = crypto
            .pbkdf2Sync(password, salt, 100000, 64, "sha512")
            .toString("base64");

          const newUser = {
            name: profile.displayName,
            email: profile.emails[0].value,
            photo: String(profile.photos[0].value),
            encryptedPassword,
            salt,
          };

          const userId = await registerUser(newUser);
          newUser.user_id = userId;

          return done(null, newUser);
        }
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  console.log("Serializing user:", user);
  done(null, user.user_id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await getCredentialsById(id);
    if (user) {
      done(null, user);
    } else {
      done(new Error("User not found"), null);
    }
  } catch (err) {
    done(err, null);
  }
});

// Authentication routes
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {
    const userId = req.user.user_id;
    console.log("Setting cookie with userId:", userId);
    res.cookie("userId", userId, {
      httpOnly: false,
      secure: false,
      sameSite: "Lax",
    });
    res.redirect("https://vanguardchat.netlify.app/chatbot");
  }
);

// Profile route
app.get("/profile", (req, res) => {
  if (req.isAuthenticated()) {
    res.json({
      ...req.user,
      userId: req.cookies.userId,
    });
  } else {
    res.redirect("/");
  }
});

// Home route
app.get("/", (req, res) => {
  res.send("Welcome to the home page!");
});

// Start the server
app.listen(8080, () => {
  console.log("Server started on http://localhost:8080");
});
