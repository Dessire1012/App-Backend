const knex = require("knex")({
  client: "mysql2",
  connection: {
    host: "bspr39k37qq9zdaaum1t-mysql.services.clever-cloud.com",
    port: 3306,
    user: process.env.USERDB,
    password: process.env.PASSWORD,
    database: process.env.DATABASE,
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
    if (!user.id || !user.name || !user.email) {
      throw new Error("Datos del usuario incompletos");
    }

    const userData = {
      user_id: user.id,
      name: user.name,
      email: user.email,
      password: user.encryptedPassword || null,
      salt: user.salt || null,
      vector: user.vector || null,
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
      .select("password", "salt", "user_id", "vector")
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

const getCredentialsById = async (userId) => {
  try {
    let credentials = await knex
      .select("password", "salt", "user_id", "vector")
      .from("users")
      .where("user_id", userId)
      .first();

    return credentials || null;
  } catch (error) {
    console.error("Error retrieving credentials by ID:", error);
    throw error;
  }
};

module.exports = {
  registerUser,
  getCredentials,
  getAllUsers,
  getCredentialsById,
};
