import express from "express";
import auth0 from "express-openid-connect";
import { uploadPicture, uploadIcon } from "../config/s3.js";
import {
  cadAffiliate,
  EnvCadAff,
  Affiliate,
  UserController,
  AcessDashboard,
  fastUserCreation,
  DeleteAccount,
  Payment,
  CompletedPayment,
  AcessCustom,
  UploadPhoto,
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

router.get("/config/linqbio", requiresAuth(), cadAffiliate);
router.post("/configs/action-cad", requiresAuth(), EnvCadAff);

router.get("/h/home", (req, res) => {
  res.render("home");
});
router.get("/h/terms-and-privacy", (req, res) => {
  res.render("terms");
});

router.get("/h/not-found", (req, res) => {
  res.render("status404");
});
router.post("/user/create-account", fastUserCreation);
router.get("/", UserController);

router.get("/affiliate/dashboard", requiresAuth(), Affiliate);

//payment
router.post("/user/checkout", requiresAuth(), Payment);
router.get("/user/complete", requiresAuth(), CompletedPayment);

router.post("/user/delete-account", requiresAuth(), DeleteAccount);

//user account
router.get("/user/dashboard", requiresAuth(), AcessDashboard);
router.get("/user/custom-page", requiresAuth(), AcessCustom);
router.get("/user/help", requiresAuth(), AcessHelp);

router.post("/user/custom-page", (req, res) => {
  res.redirect("/user/custom-page");
});

router.post(
  "/user/upload-photo",
  requiresAuth(),
  uploadPicture.single("user_picture"),
  UploadPhoto
);

router.post("/user/update-profile", requiresAuth(), UpdateProfile);
router.post("/user/update-background", requiresAuth(), UpdateBackground);
router.post(
  "/user/update-link",
  requiresAuth(),
  uploadIcon.single("icon_picture"),
  UpdateLink
);

router.post("/action/track-link", requiresAuth(), TrackLink);

router.post("/user/help-me", requiresAuth(), sendHelp);

router.get("/:user_name_link", ViewPage);

export { router };
