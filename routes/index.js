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

const app = express();
const router = express.Router();
const { requiresAuth } = auth0;

app.use(express.static("public"));

router.get("/home/g", (req, res) => {
  res.render("home");
});
router.post("/user/create-account", fastUserCreation);
router.get("/", UserController);
//router.get("/:user_name_link", ViewPage);

//payment
router.post("/user/checkout", requiresAuth(), Payment);
router.get("/user/complete", requiresAuth(), CompletedPayment);

router.post("/user/delete-account", requiresAuth(), DeleteAccount);

//custom user
router.get("/user/dashboard", requiresAuth(), AcessUser);
router.get("/user/custom-page", requiresAuth(), AcessCustom);

router.post("/user/update-profile", UpdateProfile);
router.post("/user/update-background", UpdateBackground);
router.post("/user/update-link", UpdateLink);

router.get("/:user_name_link", ViewPage);

export { router };
