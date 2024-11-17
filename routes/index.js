import express from "express";
import auth0 from "express-openid-connect";
//import session from "express-session";
import {
  DeleteAll,
  UserController,
  AcessDashboard,
  fastUserCreation,
  DeleteAccount,
  Payment,
  CompletedPayment,
  AcessCustom,
  UpdateProfile,
  UpdateBackground,
  UpdateLink,
  ViewPage,
  AcessHelp,
  sendHelp,
  TrackLink,
} from "../controllers/linqbioController.js";

const app = express();
const router = express.Router();
const { requiresAuth } = auth0;

app.use(express.static("public"));

router.get("/config/deleteCustm", DeleteAll);

router.get("/h/home", (req, res) => {
  res.render("home");
});
router.get("/h/not-found", (req, res) => {
  res.render("status404");
});
router.post("/user/create-account", fastUserCreation);
router.get("/", UserController);
//router.get("/:user_name_link", ViewPage);

//payment
router.post("/user/checkout", requiresAuth(), Payment);
router.get("/user/complete", requiresAuth(), CompletedPayment);

router.post("/user/delete-account", requiresAuth(), DeleteAccount);

//user account
router.get("/user/dashboard", requiresAuth(), AcessDashboard);
router.get("/user/custom-page", requiresAuth(), AcessCustom);
router.get("/user/help", requiresAuth(), AcessHelp);

router.post("/user/update-profile", UpdateProfile);
router.post("/user/update-background", UpdateBackground);
router.post("/user/update-link", UpdateLink);

router.post("/action/track-link", TrackLink);

router.post("/user/help-me", sendHelp);

router.get("/:user_name_link", ViewPage);

export { router };
