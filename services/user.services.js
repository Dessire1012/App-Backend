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

async function getCredentialsById(userId) {
  try {
    console.log("Searching for the user with ID:", userId);
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

async function updateUserName(userId, name) {
  try {
    await knex("users").where({ user_id: userId }).update({ name });
  } catch (error) {
    console.error("Error updating user name:", error);
    throw error;
  }
}

async function upadateUserPassword(user) {
  try {
    const { id, password, salt } = user;
    await knex("users").where({ user_id: id }).update({ password, salt });
  } catch (error) {
    console.error("Error updating user password:", error);
    throw error;
  }
}

async function updateUserEmail(userId, email) {
  try {
    const emailExists = await knex("users").where({ email }).first();
    if (emailExists) {
      throw new Error("Email already in use");
    }

    await knex("users").where({ user_id: userId }).update({ email });
  } catch (error) {
    console.error("Error updating user email:", error);
    throw error;
  }
}

module.exports = {
  registerUser,
  getCredentials,
  getAllUsers,
  getCredentialsById,
  updateUserName,
  upadateUserPassword,
  updateUserEmail,
};
