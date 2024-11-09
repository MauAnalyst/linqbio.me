import express from "express";
import auth0 from "express-openid-connect";
//import session from "express-session";
import {
  UserController,
  AcessUser,
  fastUserCreation,
} from "../controllers/linqbioController.js";

const router = express.Router();
const { requiresAuth } = auth0;

router.post("/account", fastUserCreation);
router.get("/", UserController);
router.get("/dashboard", requiresAuth(), AcessUser);

export { router };
