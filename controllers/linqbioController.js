import { LinqbioDb, UserCustom } from "../models/linqbioDB.js";
import { sendEmail } from "./sendEmail.js";
import { ManagementClient } from "auth0";
import { v4 as uuidv4 } from "uuid";
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

const DeleteAll = async (req, res) => {
  try {
    let deleteAllCustom = await UserCustom.deleteMany({});
    let deleteAllUser = await LinqbioDb.deleteMany({});

    res.json({
      msgm: "delete realizado com sucesso",
      deleteAllCustom,
      deleteAllUser,
    });
  } catch (error) {
    console.log(error);
  }
};

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

      let user = await LinqbioDb.findOne({ user_id });
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
        login.user_name = user.user_name;
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
              diffInDays > 7
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

      res.render("index", { log_erro: {}, login });
    } else {
      res.redirect("/h/home");
    }
  } catch (error) {
    console.log(error);
  }
};

const DeleteAccount = async (req, res) => {
  const { user_id, reimbursement_status } = req.body;

  try {
    if (user_id !== req.oidc.user.sub) {
      //garantindo se o usuário é o mesmo logado
      return res.redirect("/h/home");
    }
    const user = await LinqbioDb.findOne({ user_id });

    if (
      //reimbursement_status === "Authorized" &&
      user.buy_status === "Success"
    ) {
      if (user.reimbursement_status === "In review") {
        const date_now = new Date();
        const date_pay = new Date(user.date_created_payment);

        const diffInMs = Math.abs(date_now - date_pay);
        const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

        if (
          date_now.getFullYear() !== date_pay.getFullYear() ||
          diffInDays > 7
        ) {
          //não realizará o reembolso, pois tentou burlar
          await UserCustom.deleteOne({ user_id });

          await LinqbioDb.findOneAndUpdate(
            { user_id },
            {
              user_id: "Canceled",
              user_name_link: "Canceled",
              buy_status: "Canceled",
              user_picture: "Canceled",
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

          await UserCustom.deleteOne({ user_id });

          await LinqbioDb.findOneAndUpdate(
            { user_id },
            {
              user_id: "Canceled",
              user_name_link: "Canceled",
              user_picture: "Canceled",
              stripe_id: "Canceled",
              buy_status: "Canceled",
              reimbursement_status: "Refunded",
            },
            { new: true }
          );
        }
      } else {
        await UserCustom.deleteOne({ user_id });

        await LinqbioDb.findOneAndUpdate(
          { user_id },
          {
            user_id: "Canceled",
            user_name_link: "canceled",
            user_picture: "canceled",
            stripe_id: "Canceled",
            buy_status: "Canceled",
            reimbursement_status: "Expired",
          },
          { new: true }
        );
      }
    } else {
      await UserCustom.deleteOne({ user_id });

      await LinqbioDb.findOneAndUpdate(
        { user_id },
        {
          user_id: "Canceled",
          user_name_link: "canceled",
          user_picture: "canceled",
          stripe_id: "Canceled",
          buy_status: "Canceled",
          reimbursement_status: "Expired",
        },
        { new: true }
      );
    }

    await auth0Management.users.delete({ id: user_id });
    //console.log(`Usuário com ID ${user_id} foi deletado do Auth0 com sucesso.`);

    res.redirect("/h/home");
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
  const coupon_value = +process.env.COUPON_DESC;
  const coupons = process.env.COUPONS.split(",");

  let log_erro = {
    type_erro: "",
    msgm: "",
  };

  value_prod =
    plan === "basic"
      ? +process.env.PLAN_BASIC_VALUE
      : +process.env.PLAN_PREMIUM_VALUE;

  if (coupon !== "") {
    if (coupons.includes(coupon)) {
      value_prod *= coupon_value;
      value_prod = value_prod.toFixed();
    } else {
      log_erro.type_erro = "Coupon";
      log_erro.msgm = "Cupom Inválido, favor rever com o vendedor";
    }
  }

  const linkRegex = /^[a-zA-Z0-9_-]{3,15}$/; // Permite letras, números, underscores e hífens, com 3-20 caracteres
  if (!linkRegex.test(user_name_link)) {
    log_erro.type_erro = "Invalid link";
    log_erro.msgm =
      "Nome de usuário inválido. Use apenas letras, números, hífens e underscores, com 3-20 caracteres.";
  }

  let dados = {
    line_items: [
      {
        price_data: {
          currency: "brl",
          product_data: {
            name: name_prod,
          },
          unit_amount: Math.round(+value_prod * 100),
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${process.env.AUTH0_BASE_URL}user/complete?session_id={CHECKOUT_SESSION_ID}`,
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
    const user = await LinqbioDb.findOne({ user_id });
    login.user_picture = user.user_picture;
    const user_link = await LinqbioDb.findOne({ user_name_link }).select(
      "user_id user_name_link"
    );

    if (user_link && user_link.user_id !== user_id) {
      log_erro.type_erro = "Invalid link";
      log_erro.msgm = "Nome em uso ou inválido, por favor, tente outro";
    }

    if (log_erro.type_erro !== "") {
      res.render("index", { log_erro, login });
    } else {
      const session = await stripe.checkout.sessions.create(dados);

      const stripe_id = session.id;

      await LinqbioDb.findOneAndUpdate(
        { user_id },
        { user_name_link, stripe_id, plan, coupon },
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
  const uniqueId = uuidv4();

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

    const check_custom = await UserCustom.findOne({ user_id });

    if (!check_custom) {
      const userCustom = new UserCustom({
        user_id,
        user_picture: user.user_picture,
        user_name_link: user.user_name_link,
        profile: {
          user_name: user_name,
        },
        links_user: {
          id_link: uniqueId,
          link: `https://linqbio.me/${user.user_name_link}`,
          origin: "linqbio", // TikTok, Instagram, etc.
          other: "", // Para outras origens, onde o usuário define o nome
          title: "Meu Linqbio",
          description: "Veja todas as minhas redes sociais",
        },
      });

      await userCustom.save();
    }

    let login = {
      user_id: user_id,
      user_name: user_name,
      user_name_link: `${process.env.AUTH0_BASE_URL}${user.user_name_link}`,
      user_email: user_email,
      user_picture: user.user_picture,
      reimbursement_status: "Authorized",
    };

    res.render("completedPayment", { login });
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

//------------------ custom page
const AcessCustom = async (req, res) => {
  const user_id = req.oidc.user.sub;

  try {
    const user = await LinqbioDb.findOne({ user_id });

    if (!user) {
      // Se o usuário não for encontrado, redireciona ou envia uma resposta de erro
      return res.redirect("/");
    }

    let login = {
      user_id: user.user_id,
      user_name: user.user_name,
      user_email: user.user_email,
      user_picture: user.user_picture,
      buy_status: user.buy_status,
      reimbursement_status: user.reimbursement_status,
    };

    if (user.buy_status !== "Success") {
      res.redirect("/");
    } else {
      const SearchUserCustom = await UserCustom.findOne({ user_id });

      if (user.reimbursement_status === "In review") {
        const date_now = new Date();
        const date_pay = new Date(user.date_created_payment);

        const diffInMs = Math.abs(date_now - date_pay);
        const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
        if (
          date_now.getFullYear() !== date_pay.getFullYear() ||
          diffInDays > 7
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

      let userCustom = SearchUserCustom;

      await UserCustom.findOneAndUpdate(
        { user_id },
        {
          log: "",
        },
        { new: true }
      );

      return res.render("customPage", { userCustom, login });
      //res.json({ userCustom });
    }
  } catch (error) {
    console.error(error);
    // Em caso de erro, redireciona ou exibe uma página de erro
    return res.status(500).send("Internal Server Error");
  }
};

const UpdateProfile = async (req, res) => {
  const user_id = req.oidc.user.sub;
  let { user_name, user_description } = req.body;
  try {
    if (user_name.length > 20 || user_description.length > 60) {
      res.render("customPage");
    }

    if (user_name === "") {
      const check_user = await LinqbioDb.findOne({ user_id });
      user_name = check_user.user_name;
    }

    if (user_description === "") {
      const check_user = await LinqbioDb.findOne({ user_id });
      user_description = check_user.user_description;
    }

    //atualizando dados
    await LinqbioDb.findOneAndUpdate(
      { user_id },
      {
        user_name,
      },
      { new: true }
    );

    await UserCustom.findOneAndUpdate(
      { user_id },
      {
        "profile.user_name": user_name,
        "profile.user_description": user_description,
      },
      { new: true }
    );

    //return res.render("customPage", { userCustom, login });
    res.redirect("/user/custom-page");
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao atualizar o perfil" });
  }
};

const UpdateBackground = async (req, res) => {
  const user_id = req.oidc.user.sub;
  let { theme } = req.body; //ex: theme-1

  theme = theme.split("-")[1];
  try {
    await UserCustom.findOneAndUpdate(
      { user_id },
      {
        "theme.body_theme": `body-theme-${theme}`,
        "theme.theme_user_name": `theme-user-name-${theme}`,
        "theme.theme_user_slogan": `theme-user-slogan-${theme}`,
      },
      { new: true }
    );

    return res.redirect("/user/custom-page");
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Erro ao atualizar tema" });
  }
};

const UpdateLink = async (req, res) => {
  const uniqueId = uuidv4();
  const user_id = req.oidc.user.sub;
  let log;
  let { id_link, link, select_origin, other, title, description, action_link } =
    req.body;

  if (action_link === "save" && id_link !== "") {
    action_link = "edit";
  }

  try {
    if (!link.toUpperCase().startsWith("HTTPS")) {
      log = "O link não é seguro ou é inválido, por favor utilizar https.";

      await UserCustom.findOneAndUpdate(
        { user_id },
        {
          log,
        },
        { new: true }
      );
    } else {
      if (action_link === "save") {
        //adicionando novo link
        await UserCustom.findOneAndUpdate(
          { user_id },
          {
            $push: {
              links_user: {
                id_link: uniqueId,
                link,
                origin: select_origin,
                other,
                title,
                description,
              },
            },
          },
          { new: true }
        );
      } else if (action_link === "delete") {
        await UserCustom.findOneAndUpdate(
          { user_id },
          {
            $pull: {
              links_user: { id_link: id_link },
            },
          },
          { new: true }
        );
      } else {
        await UserCustom.findOneAndUpdate(
          { user_id, "links_user.id_link": id_link }, // Filtra pelo `id_link`
          {
            $set: {
              "links_user.$.link": link, // Atualiza campos específicos
              "links_user.$.origin": select_origin,
              "links_user.$.other": other,
              "links_user.$.title": title,
              "links_user.$.description": description,
            },
          },
          { new: true }
        );
      }
    }
    return res.redirect("/user/custom-page");
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Erro ao atualizar ou deletar link" });
  }
};

const ViewPage = async (req, res) => {
  const { user_name_link } = req.params;

  try {
    //const user = await LinqbioDb.findOne({ user_name_link });

    const SearchUserCustom = await UserCustom.findOne({ user_name_link });

    if (!SearchUserCustom) {
      return res.render("status404");
    }

    let userCustom = SearchUserCustom;

    return res.render("viewPage", { userCustom });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Usuário não encontrado" });
  }
};

// help page

const AcessHelp = async (req, res) => {
  const user_id = req.oidc.user.sub;

  try {
    const user = await LinqbioDb.findOne({ user_id });
    if (!user) {
      return res.redirect("/");
    }
    let login = {
      user_id: user.user_id,
      user_name: user.user_name,
      user_email: user.user_email,
      user_picture: user.user_picture,
      buy_status: user.buy_status,
      reimbursement_status: user.reimbursement_status,
    };

    return res.render("help", { login });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Erro ao buscar dados" });
  }
};

const sendHelp = async (req, res) => {
  const user_id = req.oidc.user.sub;
  const { title, description } = req.body;

  try {
    const user = await LinqbioDb.findOne({ user_id });

    const recipient = "mau.analyst@gmail.com";
    const origin = `${user.user_name} - ${user.user_email}`;

    sendEmail(recipient, origin, title, description);
    res.redirect("/user/help");
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Erro ao enviar dados" });
  }
};

//-------------,--------------

export {
  DeleteAll,
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
  AcessHelp,
  sendHelp,
};

//modelo
const variavel = async (req, res) => {
  try {
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Erro ao atualizar ou deletar link" });
  }
};
