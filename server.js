import express from "express";
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
};

app.set("view engine", "ejs");

// Middleware para tratamento de erros
app.use((err, req, res, next) => {
  if (process.env.NODE_ENV === "development") {
    console.error(err);
    return res.status(500).send(err.message);
  }

  console.error(err);
  res.status(500).render("error", {
    message: "Ocorreu um erro, tente novamente mais tarde.",
  });
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(cookieParser());

// autenticação Auth0
app.use(auth(config));

// Roteamento
app.use("/", router);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`);
});
