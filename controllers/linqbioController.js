import { LinqbioDb } from "../models/linqbioDB.js";
import { ManagementClient } from "auth0";
import dotenv from "dotenv";
import Stripe from "stripe";

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const auth0Management = new ManagementClient({
  domain: process.env.AUTH0_DOMAIN,
  clientId: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  scope: "read:users delete:users",
});

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
      const user_picture = req.oidc.user.picture;

      const user_name_link = req.cookies.user_name_link || "";
      res.clearCookie("user_name_link"); // Limpa o cookie após o uso

      let user = await LinqbioDb.findOne({ user_email });
      let login = {
        user_id: user_id,
        user_name: user_name,
        user_email: user_email,
        buy_status: "Pending",
        user_picture: user_picture,
        user_name_link: user_name_link,
        reimbursement_status: "Pending payment",
      };

      if (!user) {
        user = new LinqbioDb({
          user_id,
          user_name,
          user_email,
          user_picture,
        });

        await user.save();
      } else {
        if (user.buy_status === "Success") {
          login.buy_status = "Success";

          //verificando se o usuário tem direito a reembolso
          if (user.reimbursement_status === "In review") {
            const date_now = new Date();

            const date_pay = new Date(user.date_created_payment);

            const diffInMs = Math.abs(date_now - date_pay);
            const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

            if (
              date_pay.getFullYear() !== date_now.getFullYear() ||
              diffInDays > 30
            ) {
              login.reimbursement_status = "Expired";
              await LinqbioDb.findOneAndUpdate(
                { user_id },
                { reimbursement_status: "Expired" },
                { new: true }
              );
            } else {
              login.reimbursement_status = "Authorized";
            }
          }
        } else {
          login.user_name_link =
            user.user_name_link !== "No Link" ? user.user_name_link : "";
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
  const { user_id, reimbursement_status } = req.body;

  try {
    if (user_id !== req.oidc.user.sub) {
      //garantindo se o usuário é o mesmo logado
      return res.redirect("/home");
    }
    const user = await LinqbioDb.findOne({ user_id });

    if (
      reimbursement_status === "Authorized" &&
      user.buy_status === "Success"
    ) {
      if (user.reimbursement_status === "In review") {
        const date_now = new Date();
        const date_pay = new Date(user.date_created_payment);

        const diffInMs = Math.abs(date_now - date_pay);
        const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

        if (
          date_now.getFullYear() !== date_pay.getFullYear() ||
          diffInDays > 30
        ) {
          //não realizará o reembolso, pois tentou burlar
          await LinqbioDb.findOneAndUpdate(
            { user_id },
            {
              user_id: "Canceled",
              user_email: "Canceled",
              user_name_link: "canceled",
              buy_status: "Canceled",
              reimbursement_status: "Canceled",
            },
            { new: true }
          );
        } else {
          //realizará o reembolso

          const session = await stripe.checkout.sessions.retrieve(
            user.stripe_id
          );

          //realizando o reembolso
          await stripe.refunds.create({
            payment_intent: session.payment_intent,
          });

          await LinqbioDb.findOneAndUpdate(
            { user_id },
            {
              user_id: "Canceled",
              user_email: "Canceled",
              user_name_link: "canceled",
              stripe_id: "Canceled",
              buy_status: "Canceled",
              reimbursement_status: "Refunded",
            },
            { new: true }
          );
        }
      } else {
        await LinqbioDb.findOneAndUpdate(
          { user_id },
          {
            user_id: "Canceled",
            user_email: "Canceled",
            user_name_link: "canceled",
            stripe_id: "Canceled",
            buy_status: "Canceled",
            reimbursement_status: "Expired",
          },
          { new: true }
        );
      }
    }

    await auth0Management.users.delete({ id: user_id });
    //console.log(`Usuário com ID ${user_id} foi deletado do Auth0 com sucesso.`);

    res.redirect("/home");
  } catch (error) {
    console.log(error);
  }
};

const Payment = async (req, res) => {
  const { user_id, plan, coupon, user_name_link } = req.body;
  const user_name = req.oidc.user.name;
  const user_email = req.oidc.user.email;
  let name_prod = "PLANO " + plan.toUpperCase();
  let value_prod;
  const couponValue = +process.env.COUPON_VALUE;
  const coupons = process.env.COUPONS.split(",");

  value_prod =
    plan === "basic"
      ? +process.env.PLAN_BASIC_VALUE
      : +process.env.PLAN_PREMIUM_VALUE;

  if (coupons.includes(coupon)) {
    value_prod -= couponValue;
  }

  let dados = {
    line_items: [
      {
        price_data: {
          currency: "brl",
          product_data: {
            name: name_prod,
          },
          unit_amount: Math.round(value_prod * 100),
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${process.env.AUTH0_BASE_URL}complete?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.AUTH0_BASE_URL}`,
  };

  let login = {
    user_id: user_id,
    user_name: user_name,
    user_email: user_email,
    buy_status: "Pending",
    user_picture: "./imgs/cat.png",
    user_name_link: user_name_link,
  };
  try {
    //const user_link = await LinqbioDb.find({ user_name_link });
    const user_link = await LinqbioDb.findOne({ user_name_link }).select(
      "user_id user_name_link"
    );

    if (user_link && user_link.user_id !== user_id) {
      const msgm = "nome já utilizado, por favor, tente outro";
      res.render("index", { msgm, login });
    } else {
      const session = await stripe.checkout.sessions.create(dados);

      const stripe_id = session.id;

      let log = await LinqbioDb.findOneAndUpdate(
        { user_id },
        { user_name_link, stripe_id, plan },
        { new: true }
      );

      res.redirect(session.url);
    }
  } catch (error) {
    console.log(error);
  }
};

const CompletedPayment = async (req, res) => {
  const user_name = req.oidc.user.name;
  const user_id = req.oidc.user.sub;
  const user_email = req.oidc.user.email;

  const formatDate = (timestamp) => {
    const date = new Date(timestamp * 1000);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  try {
    const result = Promise.all([
      stripe.checkout.sessions.retrieve(req.query.session_id, {
        expand: ["payment_intent.payment_method"],
      }),
      stripe.checkout.sessions.listLineItems(req.query.session_id),
    ]);

    const response = JSON.parse(JSON.stringify(await result));
    const stripe_id = response[0].id;
    const date_created_payment = new Date().toISOString(); //formatDate(response[0].payment_intent.created);

    await LinqbioDb.findOneAndUpdate(
      { stripe_id },
      {
        buy_status: "Success",
        date_created_payment,
        reimbursement_status: "In review",
      },
      { new: true }
    );

    const user = await LinqbioDb.findOne({ user_id });

    let login = {
      user_id: user_id,
      user_name: user_name,
      user_email: user_email,
      user_picture: user.user_picture,
      reimbursement_status: "Authorized",
    };

    res.render("completedPayment", { login });
  } catch (error) {
    console.log(error);
  }
};

export {
  UserController,
  AcessUser,
  fastUserCreation,
  DeleteAccount,
  Payment,
  CompletedPayment,
};

//modelo
const variavel = async (req, res) => {
  try {
  } catch (error) {
    console.log(error);
  }
};
