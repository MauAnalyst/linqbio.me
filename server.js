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

const isProduction = process.env.NODE_ENV === "production";

const config = {
  authRequired: false,
  auth0Logout: true,
  secret: process.env.AUTH0_CLIENT_SECRET,
  baseURL: process.env.AUTH0_BASE_URL,
  clientID: process.env.AUTH0_CLIENT_ID,
  issuerBaseURL: `${process.env.AUTH0_DOMAIN}`,
  session: {
    cookie: {
      httpOnly: true,
      secure: isProduction, // Apenas cookies seguros em produção
      sameSite: "Lax",
    },
  },
};

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(cookieParser());

// autenticação Auth0
app.use(cookieParser(process.env.AUTH0_CLIENT_SECRET)); // Use o mesmo segredo do Auth0
app.use(auth(config));

// Roteamento
app.use("/", router);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`);
});
