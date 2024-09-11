const express = require("express");
const router = express.Router();

const userController = require("../controllers/user.controllers");

router.post("/register", userController.register);
router.post("/login", userController.login);

router.get("/viewUsers", userController.getUsers);
router.get("/viewUser", userController.getUser);

module.exports = router;
