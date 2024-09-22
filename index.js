const cors = require("cors");
const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const crypto = require("crypto");
const fs = require("fs");
const axios = require("axios");
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
const secret = crypto.randomBytes(64).toString("hex");

app.use(
  session({
    secret: secret,
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
const agentRouter = require("./routes/agent.routes")

// Routes
app.use("/user", userRouter);
app.use("/agent", agentRouter)

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

app.post("/aws-function", async (req, res) => {
  try {
    const response = await axios.post(
      "https://72hhxr5zme.execute-api.us-east-1.amazonaws.com/Test/comprehend",
      req.body
    );
    res.json(response.data);
  } catch (error) {
    console.error("Error al acceder a la función de AWS:", error);
    res.status(500).json({ error: "Error al acceder a la función de AWS" });
  }
});

app.use(express.json());

// Start the server
app.listen(8080, () => {
  console.log("Server started on http://localhost:8080");
});
