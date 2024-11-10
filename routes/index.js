import express from "express";
import auth0 from "express-openid-connect";
//import session from "express-session";
import {
  UserController,
  AcessUser,
  fastUserCreation,
  DeleteAccount,
  Payment,
} from "../controllers/linqbioController.js";

const router = express.Router();
const { requiresAuth } = auth0;

router.get("/home", (req, res) => {
  res.render("home");
});
router.get("/", UserController);
router.post("/checkout", Payment);
router.post("/account", fastUserCreation);
router.post("/delete-account", DeleteAccount);
router.get("/dashboard", requiresAuth(), AcessUser);

export { router };
