const HTTPCodes = require("../utils/HTTPCodes");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const { isEmail, isPassword } = require("../utils/validator");
const {
  registerUser,
  getCredentials,
  getAllUsers,
  getCredentialsById,
} = require("../services/user.services");

async function register(req, res) {
  console.log("Request body register:", req.body);
  const { email, password, name, user_id, vector } = req.body;
  try {
    const errorMessages = [];

    if (!email && !user_id) {
      errorMessages.push("Either email or user_id is required.");
    }

    if (email && !isEmail(email)) {
      errorMessages.push("Email is not valid.");
    }

    if (password && !isPassword(password)) {
      errorMessages.push("Password is not valid.");
    }

    if (name && name.trim() === "") {
      errorMessages.push("Name is required.");
    }

    if (errorMessages.length) {
      res.status(HTTPCodes.BAD_REQUEST).send({ error: errorMessages });
      return;
    }

    if (email) {
      const existingUser = await getCredentials(email);
      if (existingUser) {
        res
          .status(HTTPCodes.BAD_REQUEST)
          .send({ error: "Email already in use." });
        return;
      }
    }

    const user = {};

    if (email) {
      user.email = email;
    }

    if (password) {
      const salt = crypto.randomBytes(128).toString("base64");
      const encryptedPassword = crypto
        .pbkdf2Sync(password, salt, 30000, 64, "sha256")
        .toString("base64");
      user.encryptedPassword = encryptedPassword;
      user.salt = salt;
    }

    if (name) {
      user.name = name;
    }

    if (vector) {
      user.vector = vector;
    }

    if (user_id) {
      console.log("User ID:", user_id);
      user.id = BigInt(user_id);
      console.log("ID:", user.id.toString());
    } else {
      user.id = parseInt((Math.random() * 1000000).toFixed(0), 10);
    }

    const newUserId = await registerUser(user);

    res.send({
      success: true,
      newUserId,
    });
  } catch (e) {
    console.error(e);
    res.status(HTTPCodes.INTERNAL_SERVER_ERROR).send({
      error: "There is already a user with this email",
    });
  }
}

async function login(req, res) {
  console.log("Request body login:", req.body);
  const { email, password, id, vector } = req.body;
  try {
    const errorMessages = [];

    if (email && password) {
      if (!isEmail(email)) {
        errorMessages.push("Email is not valid.");
      }
      if (!isPassword(password)) {
        errorMessages.push("Password is not valid.");
      }
    }

    if (errorMessages.length) {
      return res.status(HTTPCodes.BAD_REQUEST).send({ error: errorMessages });
    }

    const credentials = await getCredentials(email);

    if (!credentials) {
      return res.status(HTTPCodes.UNAUTHORIZED).send({
        error: "There isn't a user with this email",
      });
    }

    if (email && password) {
      const encryptedPassword = crypto
        .pbkdf2Sync(password, credentials.salt, 30000, 64, "sha256")
        .toString("base64");

      if (encryptedPassword !== credentials.password) {
        return res.status(HTTPCodes.UNAUTHORIZED).send({
          error: "Password incorrect",
        });
      }
    } else if (id && email) {
      const convertedId = BigInt(id);
      const userId = BigInt(credentials.user_id);
      if (convertedId !== userId) {
        return res.status(HTTPCodes.UNAUTHORIZED).send({
          error: "ID incorrect",
        });
      }
    } else if (email && vector) {
      const storedVector = JSON.parse(credentials.vector);

      if (!areVectorsEqual(vector, storedVector)) {
        return res.status(HTTPCodes.UNAUTHORIZED).send({
          error: "Vector incorrect",
        });
      }
    }

    const accessToken = jwt.sign(
      { email },
      process.env.TOKENKEY || "AS4D5FF6G78NHCV7X6X5C",
      { expiresIn: "1d" }
    );

    const refreshToken = jwt.sign(
      { email },
      process.env.TOKENKEY || "AS4D5FF6G78NHCV7X6X5C",
      { expiresIn: "1m" }
    );

    res.send({
      accessToken,
      refreshToken,
      id: credentials.user_id,
    });
  } catch (e) {
    console.error("Login error:", e);
    res.status(HTTPCodes.INTERNAL_SERVER_ERROR).send({
      error: "There was an error processing your request",
    });
  }
}

function areVectorsEqual(vector1, vector2) {
  const keys1 = Object.keys(vector1).filter((key) => {
    const value = vector1[key];
    return (
      value !== null &&
      value !== undefined &&
      (typeof value !== "string" || value.trim() !== "")
    );
  });

  const keys2 = Object.keys(vector2).filter((key) => {
    const value = vector2[key];
    return (
      value !== null &&
      value !== undefined &&
      (typeof value !== "string" || value.trim() !== "")
    );
  });

  if (keys1.length !== keys2.length) {
    console.log("Lengths are different");
    return false;
  }

  for (let key of keys1) {
    if (parseFloat(vector1[key]) !== parseFloat(vector2[key])) {
      console.log("Values at key", key, "are different");
      console.log("Value 1:", vector1[key]);
      console.log("Value 2:", vector2[key]);
      return false;
    }
  }
  return true;
}

async function getUsers(req, res) {
  try {
    const users = await getAllUsers();
    res.send(users);
  } catch (e) {
    res.status(HTTPCodes.INTERNAL_SERVER_ERROR).send({
      error: "No se pudo obtener los usuarios.",
    });
  }
}

async function getUser(req, res) {
  const { id } = req.query;
  console.log("Received ID:", id);
  try {
    const user = await getCredentialsById(id);
    if (!user) {
      return res.status(404).send({ error: "User not found" });
    }
    res.send(user);
  } catch (e) {
    console.error("Error fetching user:", e);
    res.status(500).send({
      error: "There was an error processing your request",
    });
  }
}

module.exports = {
  register,
  login,
  getUsers,
  getUser,
};
