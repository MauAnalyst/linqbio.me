import express from "express";
import path from "path";
import dotenv from "dotenv";
import { router } from "./routes/index.js";
import auth0 from "express-openid-connect";
import { connectDb } from "./config/db.js";
import cookieParser from "cookie-parser";

connectDb();

dotenv.config();
const { auth } = auth0;
const app = express();

const config = {
  authRequired: false,
  auth0Logout: true,
  secret: process.env.AUTH0_CLIENT_SECRET,
  baseURL: process.env.AUTH0_BASE_URL,
  clientID: process.env.AUTH0_CLIENT_ID,
  issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}`,
  clientAuthMethod: "client_secret_basic",
  authorizationParams: {
    response_type: "code",
    scope: "openid profile email",
    state: true, // Habilita o state
  },
  session: {
    cookie: {
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    },
  },
};

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(cookieParser());

// autenticação Auth0
app.use(auth(config));

app.use((req, res, next) => {
  console.log("Session:", req.oidc.session);
  console.log("Headers:", req.headers);
  console.log("Cookies:", req.cookies);
  next();
});

// Roteamento
app.use("/", router);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`);
});
