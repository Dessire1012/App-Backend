const cors = require("cors");
const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
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
    credentials: true,
  })
);

app.use(bodyParser.json());
app.use(cookieParser());

// Configuración de sesión
app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: true,
      sameSite: "None",
    },
  })
);

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

// Authentication routes
app.post("/auth/google/token", async (req, res) => {
  const { token } = req.body;
  try {
    const payload = verifyGoogleToken(token);

    const existingUser = await getCredentials(payload.email);

    if (existingUser) {
      console.log("Existing user found:", existingUser);
      res.json(existingUser);
    } else {
      const salt = crypto.randomBytes(16).toString("base64");
      const password = crypto.randomBytes(16).toString("base64");
      const encryptedPassword = crypto
        .pbkdf2Sync(password, salt, 100000, 64, "sha512")
        .toString("base64");

      const newUser = {
        name: payload.name,
        email: payload.email,
        photo: payload.picture,
        encryptedPassword,
        salt,
      };

      const userId = await registerUser(newUser);
      newUser.user_id = userId;

      console.log("New user registered with ID:", userId);
      res.json(newUser);
    }
  } catch (error) {
    console.error(error);
    res.status(400).send("Invalid token");
  }
});

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
