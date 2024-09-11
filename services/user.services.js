const knex = require("knex")({
  client: "mysql2",
  connection: {
    host: "bspr39k37qq9zdaaum1t-mysql.services.clever-cloud.com",
    port: 3306,
    user: "u43kg4hjo8zgygpg",
    password: process.env.PASSWORD,
    database: "bspr39k37qq9zdaaum1t",
  },
});

async function testConnection() {
  try {
    await knex.raw("SELECT 1+1 AS result");
    console.log("Conexión exitosa");
  } catch (error) {
    console.error("Error en la conexión:", error);
  }
}

testConnection();

const registerUser = async (user) => {
  try {
    if (
      !user.id ||
      !user.name ||
      !user.email ||
      !user.encryptedPassword ||
      !user.salt
    ) {
      throw new Error("Datos del usuario incompletos");
    }

    const userData = {
      user_id: user.id,
      name: user.name,
      email: user.email,
      photo: user.photo,
      password: user.encryptedPassword,
      salt: user.salt,
    };

    const [userId] = await knex("users").insert(userData);
    return userId;
  } catch (error) {
    console.error("Error registering user:", error.message, error.stack);
    throw error;
  }
};

const getCredentials = async (email) => {
  try {
    let credentials = await knex
      .select("password", "salt", "user_id")
      .from("users")
      .where("email", email)
      .first();

    return credentials || null;
  } catch (error) {
    console.error("Error retrieving credentials:", error);
    throw error;
  }
};

async function getAllUsers() {
  try {
    const users = await knex("users").select("*");
    return users;
  } catch (error) {
    console.error("Error retrieving users:", error);
    throw error;
  }
}

async function getCredentialsById(userId) {
  try {
    console.log("Searching for user with ID:", userId);
    const user = await knex("users").where({ user_id: userId }).first();
    console.log(
      "Query executed:",
      knex("users").where({ user_id: userId }).toString()
    );
    console.log("User found:", user);
    if (!user) {
      throw new Error("User not found");
    }
    return user;
  } catch (error) {
    console.error("Error retrieving user by ID:", error);
    throw error;
  }
}

module.exports = {
  registerUser,
  getCredentials,
  getAllUsers,
  getCredentialsById,
};
