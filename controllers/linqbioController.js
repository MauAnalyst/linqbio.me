import { LinqbioDb } from "../models/linqbioDB.js";
import dotenv from "dotenv";
import Stripe from "stripe";

dotenv.config();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const fastUserCreation = async (req, res) => {
  const { user_name_link } = req.body;

  res.cookie("user_name_link", user_name_link, {
    maxAge: 60000,
    httpOnly: true,
  });
  res.redirect("/login");
};

const UserController = async (req, res) => {
  const auth = req.oidc.isAuthenticated();

  try {
    if (auth) {
      const user_name = req.oidc.user.name;
      const user_id = req.oidc.user.sub;
      const user_email = req.oidc.user.email;

      const user_name_link = req.cookies.user_name_link || "";
      res.clearCookie("user_name_link"); // Limpa o cookie após o uso

      let user = await LinqbioDb.findOne({ user_email });
      let login = {
        user_id: user_id,
        user_name: user_name,
        user_email: user_email,
        buy_status: "Pending",
        user_picture: "./imgs/cat.png",
        user_name_link: user_name_link,
      };

      if (!user) {
        user = new LinqbioDb({
          user_id,
          user_name,
          user_email,
        });

        await user.save();
      } else {
        if (user.buy_status === "Success") {
          login.buy_status = "Success";
        }
      }

      res.render("index", { login });
    } else {
      res.redirect("/home");
    }
  } catch (error) {
    console.log(error);
  }
};

const AcessUser = async (req, res) => {
  const user_name = req.oidc.user.name;
  const user_id = req.oidc.user.sub;
  const user_email = req.oidc.user.email;

  try {
    res.render("dashboard", { user_name });
  } catch (error) {
    console.log(error);
  }
};

const DeleteAccount = async (req, res) => {
  const { user_id } = req.body;

  console.log(user_id);
  try {
    const result = await LinqbioDb.deleteMany({ user_id });
    console.log(result);

    res.redirect("/home");
  } catch (error) {
    console.log(error);
  }
};

const Payment = async (req, res) => {
  const { user_id, plan, coupon, user_name_link } = req.body;
  let name_prod = plan;
  let value_prod;
  let couponValue = process.env.COUPON_VALUE;
  const coupons = process.env.COUPONS.split(",");

  if (plan === "basic") {
    value_prod = +process.env.PLAN_BASIC_VALUE;
  } else {
    value_prod = +process.env.PLAN_PREMIUM_VALUE;
  }

  if (coupons.includes(coupon)) {
    const discount = process.env.COUPON_VALUE;
    value_prod = value_prod - discount;
  }

  let dados = {
    line_items: [
      {
        price_data: {
          currency: "brl",
          product_data: {
            name: name_prod,
          },
          unit_amount: value_prod * 100,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${process.env.AUTH0_BASE_URL}complete?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.AUTH0_BASE_URL}`,
  };
  try {
    const session = await stripe.checkout.sessions.create(dados);
    const stripe_id = session.id;
    let check_user = await LinqbioDb.findOne({ user_id });
  } catch (error) {
    console.log(error);
  }
};

export { UserController, AcessUser, fastUserCreation, DeleteAccount, Payment };

//modelo
const variavel = async (req, res) => {
  try {
  } catch (error) {
    console.log(error);
  }
};
