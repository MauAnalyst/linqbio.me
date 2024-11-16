import express from "express";
import auth0 from "express-openid-connect";
//import session from "express-session";
import {
  UserController,
  AcessUser,
  fastUserCreation,
  DeleteAccount,
  Payment,
  CompletedPayment,
  AcessCustom,
  UpdateProfile,
  UpdateBackground,
  UpdateLink,
  ViewPage,
} from "../controllers/linqbioController.js";

const router = express.Router();
const { requiresAuth } = auth0;

router.get("/home", (req, res) => {
  res.render("home");
});
router.post("/create-account", fastUserCreation);
router.get("/", UserController);
router.get("/:user_name_link", ViewPage);

//authorized routes
router.use(requiresAuth());

//payment
router.post("/checkout", Payment);
router.get("/complete", CompletedPayment);

router.post("/delete-account", DeleteAccount);

//custom user
router.get("/dashboard", requiresAuth(), AcessUser);
router.get("/custom-page", requiresAuth(), AcessCustom);

router.post("/update-profile", UpdateProfile);
router.post("/update-background", UpdateBackground);
router.post("/update-link", UpdateLink);

export { router };
