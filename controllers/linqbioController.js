import {
  LinqbioDb,
  UserCustom,
  OverviewDb,
  AffiliateDb,
} from "../models/linqbioDB.js";
import {
  getFileUrlFromAws,
  deleteFileFromAws,
  uploadIcon,
} from "../config/s3.js";
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

const cadAffiliate = async (req, res) => {
  const email = req.oidc.user.email;
  const email_fun = process.env.EMAIL_FUND;
  try {
    if (email !== email_fun) {
      return res.redirect("/"); // Usar return para garantir que não haja mais execução
    }
    // Se o email for o correto
    res.send(
      '<h1>Bem-vindo senhor</h1> <form action="/configs/action-cad" method="post"><label for="user_email">Email</label> <input type="email" id="user_email" name="user_email"> <input type="text" id="coupon" name="coupon">  <button type="submit">Cadastrar</button> </form>'
    );
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Erro ao processar a requisição" });
  }
};

const EnvCadAff = async (req, res) => {
  const email = req.oidc.user.email;
  const { user_email, coupon } = req.body;
  try {
    const user_aff = await LinqbioDb.findOne({ user_email });

    if (!user_aff) {
      return res.redirect("/"); // Usar return para garantir que a execução pare aqui
    }

    // Se o usuário for encontrado, cria o novo registro
    const create = new AffiliateDb({
      user_email,
      coupon,
    });

    await create.save();

    // Envia a confirmação após salvar
    res.send("<h1>Usuário cadastrado com sucesso</h1>");
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Erro ao processar a requisição" });
  }
};

const Affiliate = async (req, res) => {
  const user_name = req.oidc.user.name;
  const user_id = req.oidc.user.sub;
  const user_email = req.oidc.user.email;
  const user_picture = req.oidc.user.picture;

  const user_name_link = req.cookies.user_name_link || "";
  res.clearCookie("user_name_link"); // Limpa o cookie após o uso

  // let user = await LinqbioDb.findOne({ user_id });
  let login = {
    user_id: user_id,
    user_name: user_name,
    user_email: user_email,
    buy_status: "Pending",
    user_picture: user_picture,
    user_name_link: user_name_link,
    reimbursement_status: "Pending payment",
    affiliate: false,
    coupon: "",
  };

  try {
    const affiliate = await AffiliateDb.findOne({ user_email });

    if (affiliate) {
      login.affiliate = true;
      login.coupon = affiliate.coupon;
    } else {
      return res.redirect("/");
    }

    let overview = {
      sales: affiliate.sales,
      sales_canceled: affiliate.sales_canceled,
      sales_balance: affiliate.sales_balance
        .toFixed(2)
        .toString()
        .replace(".", ","),
      sales_paid: affiliate.sales_paid.toFixed(2).toString().replace(".", ","),
      sales_pending: 0,
      sales_expand: 0,
      sales_start: 0,
    };

    const { coupon } = affiliate;
    const clients = await LinqbioDb.find({ coupon }).select(
      "user_id plan buy_status reimbursement_status"
    );

    clients.forEach((e, i) => {
      switch (e.buy_status) {
        case "Success":
          if (e.plan === "start") {
            overview.sales_start += 1;
          } else {
            overview.sales_expand += 1;
          }
          break;

        case "Pending":
          overview.sales_pending += 1;
        default:
          console.log("nada acontece");
          break;
      }
    });

    return res.render("affiliate", { login, overview });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Erro ao atualizar ou deletar link" });
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

      const affiliate = await AffiliateDb.findOne({ user_email });

      let user = await LinqbioDb.findOne({ user_id });
      let login = {
        user_id: user_id,
        user_name: user_name,
        user_email: user_email,
        buy_status: "Pending",
        user_picture: user_picture,
        user_name_link: user_name_link,
        reimbursement_status: "Pending payment",
        affiliate: false,
      };

      if (affiliate) {
        login.affiliate = true;
      }

      if (!user) {
        user = new LinqbioDb({
          user_id,
          user_name,
          user_email,
          user_picture,
        });

        await user.save();
      } else {
        login.user_name_link = user.user_name_link;
        login.user_name = user.user_name;

        if (user.origin_picture === "aws") {
          login.user_picture = await getFileUrlFromAws(user.user_picture, 3600);
        }

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
  const user_id = req.oidc.user.sub;

  try {
    const user = await LinqbioDb.findOne({ user_id });

    const recipient = "mau.analyst@gmail.com";
    const origin = user.user_email;
    const title = `Usuário deletando consta`;
    const description = `segue dados \n ${JSON.stringify(user)}`;

    sendEmail("delete-account", recipient, origin, title, description);

    if (!user) {
      return res.redirect("/");
    }

    let userCustom = await UserCustom.findOne({ user_id });

    userCustom.links_user.forEach(async (e) => {
      if (e.icon_question === "yes-custom") {
        await deleteFileFromAws(e.icon_picture);
      }
    });

    if (user.buy_status === "Success") {
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

          await OverviewDb.deleteOne({ user_id });

          await LinqbioDb.findOneAndUpdate(
            { user_id },
            {
              user_id: "Canceled",
              user_name_link: "Canceled",
              buy_status: "Canceled",
              user_picture: "Canceled",
              reimbursement_status: "Expired",
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

          await OverviewDb.deleteOne({ user_id });

          //retirando a comissão
          const { plan } = user;
          const coupon_value = +process.env.COUPON_DESC;
          const commission = +process.env.COMMISSION;

          let value_prod =
            plan === "start"
              ? +process.env.PLAN_BASIC_VALUE
              : +process.env.PLAN_PREMIUM_VALUE;

          const discount = value_prod * coupon_value;
          value_prod = ((value_prod - discount) * commission).toFixed(2);

          const value_number = parseFloat(value_prod);

          await AffiliateDb.findOneAndUpdate(
            { "client_sales.id_client": user_id },
            {
              $inc: {
                sales: -1,
                sales_canceled: 1,
                sales_balance: -value_number,
              },
              $pull: {
                client_sales: {
                  id_client: user_id,
                },
              },
            },
            { new: true }
          );

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

        await OverviewDb.deleteOne({ user_id });

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
        },
        { new: true }
      );
    }

    await auth0Management.users.delete({ id: user_id });

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
  let value_prod = 0;
  const coupon_value = +process.env.COUPON_DESC;
  const coupons = process.env.COUPONS.split(",");

  let log_erro = {
    type_erro: "",
    msgm: "",
  };

  value_prod =
    plan === "start"
      ? +process.env.PLAN_BASIC_VALUE
      : +process.env.PLAN_PREMIUM_VALUE;

  if (coupon !== "") {
    if (coupons.includes(coupon)) {
      let discount = value_prod * coupon_value;
      value_prod = value_prod - discount;
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
          link: `https://linqbio.me/`,
          origin: "linqbio",
          icon_question: "no-custom",
          icon_picture: "/imgs/icones/linqbio.svg",
          other: "",
          title: "Linqbio",
          description: "Link para as suas bios",
        },
      });

      await userCustom.save();

      const date_now = new Date().getDate();
      const mother_now = new Date().getMonth();
      const year_now = new Date().getFullYear();

      const overview = new OverviewDb({
        user_id,
        mother_reference: `${mother_now + 1}/${year_now}`,
        day_reference: `${date_now}`,
        click_links: {
          id_link: uniqueId,
        },
      });

      await overview.save();

      const { coupon, plan } = user;
      const coupon_value = +process.env.COUPON_DESC;
      const commission = +process.env.COMMISSION;

      let value_prod =
        plan === "start"
          ? +process.env.PLAN_BASIC_VALUE
          : +process.env.PLAN_PREMIUM_VALUE;

      //definindo o valor final do plano
      const discount = value_prod * coupon_value;
      value_prod = ((value_prod - discount) * commission).toFixed(2);

      let check_sales = await AffiliateDb.findOne({
        "client_sales.id_client": user_id,
      });

      const value_number = parseFloat(value_prod);

      if (!check_sales) {
        await AffiliateDb.findOneAndUpdate(
          { coupon },
          {
            $inc: {
              sales: 1,
              sales_balance: value_number,
            },
            $push: {
              client_sales: {
                id_client: user_id,
              },
            },
          },
          { new: true }
        );
      }
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

const AcessDashboard = async (req, res) => {
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

    if (user.reimbursement_status === "In review") {
      const date_now = new Date();
      const date_pay = new Date(user.date_created_payment);

      const diffInMs = Math.abs(date_now - date_pay);
      const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
      if (date_now.getFullYear() !== date_pay.getFullYear() || diffInDays > 7) {
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

    if (user.origin_picture === "aws") {
      login.user_picture = await getFileUrlFromAws(user.user_picture, 3600);
    }

    const userCustom = await UserCustom.findOne({ user_id });
    if (!userCustom) {
      console.log("erro ao consultar dados");
    }

    const overview = await OverviewDb.findOne({ user_id });
    if (!overview) {
      console.log("erro ao consultar dados");
    }

    res.render("dashboard", { login, userCustom, overview });
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

      await UserCustom.findOneAndUpdate(
        { user_id },
        {
          log: "",
        },
        { new: true }
      );

      (async () => {
        let userCustom = SearchUserCustom;

        userCustom.links_user.forEach(async (e) => {
          if (e.icon_question === "yes-custom") {
            e.icon_picture = await getFileUrlFromAws(e.icon_picture, 3600);
          }
        });

        if (user.origin_picture === "aws") {
          login.user_picture = await getFileUrlFromAws(user.user_picture, 3600);
        }
        return res.render("customPage", { userCustom, login });
      })();
    }
  } catch (error) {
    console.error(error);
    // Em caso de erro, redireciona ou exibe uma página de erro
    return res.status(500).send("Internal Server Error");
  }
};

const UploadPhoto = async (req, res) => {
  const user_id = req.oidc.user.sub;
  const file = req.file;
  try {
    const user = await LinqbioDb.findOne({ user_id }).select(
      "user_picture origin_picture"
    );

    // if (!file) {
    //   return res.redirect("/user/custom-page");
    // }

    if (user.origin_picture === "aws") {
      await deleteFileFromAws(user.user_picture);
    }

    await LinqbioDb.findOneAndUpdate(
      { user_id },
      { user_picture: file.key, origin_picture: "aws" },
      { new: true }
    );

    await UserCustom.findOneAndUpdate(
      { user_id },
      { user_picture: file.key, origin_picture: "aws" },
      { new: true }
    );
    res.redirect("/user/custom-page");
    //res.json({ redirectTo: `/user/custom-page?updated=${Date.now()}` });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Erro ao atualizar dados" });
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
  const file = req.file;
  let log;
  let {
    id_link,
    link,
    select_origin,
    other,
    title,
    description,
    icon_question,
    icon_picture,
    action_link,
  } = req.body;

  if (action_link === "save" && id_link !== "") {
    action_link = "edit";
  }

  if (!file) {
    icon_question = "no-custom";
    icon_picture = `/imgs/icones/${select_origin}.svg`;
  }

  try {
    let check_custom = await UserCustom.findOne({
      "links_user.id_link": id_link,
    });
    let picture = "";
    let question = "";

    if (check_custom) {
      check_custom.links_user.forEach((e) => {
        if (e.id_link === id_link) {
          picture = e.icon_picture;
          question = e.icon_question;
        }
      });
    }

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
        if (icon_question === "yes-custom") {
          icon_picture = file.key;
        }

        await UserCustom.findOneAndUpdate(
          { user_id },
          {
            $push: {
              links_user: {
                id_link: uniqueId,
                link,
                origin: select_origin,
                icon_question,
                icon_picture,
                other,
                title,
                description,
              },
            },
          },
          { new: true }
        );

        await OverviewDb.findOneAndUpdate(
          { user_id },
          {
            $push: {
              click_links: {
                id_link: uniqueId,
              },
            },
          },
          { new: true }
        );
      } else if (action_link === "delete") {
        if (question === "yes-custom") {
          await deleteFileFromAws(picture);
        }
        await UserCustom.findOneAndUpdate(
          { user_id },
          {
            $pull: {
              links_user: { id_link: id_link },
            },
          },
          { new: true }
        );
        await OverviewDb.findOneAndUpdate(
          { user_id },
          {
            $pull: {
              click_links: { id_link: id_link },
            },
          },
          { new: true }
        );
      } else {
        if (question === "yes-custom") {
          await deleteFileFromAws(picture);
          if (icon_question === "yes-custom") {
            icon_picture = file.key;
          }
        } else {
          if (icon_question === "yes-custom") {
            icon_picture = file.key;
          }
        }
        await UserCustom.findOneAndUpdate(
          { user_id, "links_user.id_link": id_link }, // Filtra pelo `id_link`
          {
            $set: {
              "links_user.$.link": link, // Atualiza campos específicos
              "links_user.$.origin": select_origin,
              "links_user.$.icon_question": icon_question,
              "links_user.$.icon_picture": icon_picture,
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
  const day_now = new Date().getDate();
  const mother_now = new Date().getMonth();
  const year_now = new Date().getFullYear();
  const date_now = `${mother_now + 1}/${year_now}`;

  try {
    const SearchUserCustom = await UserCustom.findOne({ user_name_link });

    if (!SearchUserCustom) {
      return res.render("status404");
    }
    let userCustom = SearchUserCustom;

    const user_id = SearchUserCustom.user_id;
    const overview = await OverviewDb.findOne({ user_id });

    if (!overview) {
      console.error(
        `Nenhum documento de overview encontrado para o user_id: ${user_id}`
      );
      return res.render("status404");
    }

    if (date_now !== overview.mother_reference) {
      await OverviewDb.findOneAndUpdate(
        { user_id },
        {
          $set: {
            mother_reference: date_now,
            day_reference: `${day_now}`,
            access_today: 1,
            access_mother: 1,
          },
        },
        { new: true }
      );
    } else {
      if (day_now.toString() !== overview.day_reference) {
        //se o dias forem diferente, reinicia a contagem do dia e depois atualiza o dia
        await OverviewDb.findOneAndUpdate(
          { user_id },
          {
            $set: {
              day_reference: `${day_now}`,
              access_today: 1,
            },
            $inc: {
              access_mother: 1,
            },
          },
          { new: true }
        );
      } else {
        //caso o dia seja o mesmo, apenas incrementa
        await OverviewDb.findOneAndUpdate(
          { user_id },
          {
            $inc: {
              access_today: 1,
              access_mother: 1,
            },
          },
          { new: true }
        );
      }
    }

    if (userCustom.origin_picture === "aws") {
      userCustom.user_picture = await getFileUrlFromAws(
        userCustom.user_picture,
        3600
      );
    }

    (async () => {
      for (const e of userCustom.links_user) {
        if (e.icon_question === "yes-custom") {
          e.icon_picture = await getFileUrlFromAws(e.icon_picture);
        }
      }

      return res.render("viewPage", { userCustom });
    })();
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
      user_name_link: user.user_name_link,
      user_email: user.user_email,
      user_picture: user.user_picture,
      buy_status: user.buy_status,
      reimbursement_status: user.reimbursement_status,
    };

    if (user.reimbursement_status === "In review") {
      const date_now = new Date();
      const date_pay = new Date(user.date_created_payment);

      const diffInMs = Math.abs(date_now - date_pay);
      const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
      if (date_now.getFullYear() !== date_pay.getFullYear() || diffInDays > 7) {
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

    if (user.origin_picture === "aws") {
      login.user_picture = await getFileUrlFromAws(user.user_picture, 3600);
    }

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

    sendEmail("help", recipient, origin, title, description);
    res.redirect("/user/help");
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Erro ao enviar dados" });
  }
};

const TrackLink = async (req, res) => {
  const { id_link } = req.body;
  const day_now = new Date().getDate();
  const mother_now = new Date().getMonth();
  const year_now = new Date().getFullYear();
  const date_now = `${mother_now + 1}/${year_now}`;

  try {
    const link = await OverviewDb.findOne({ "click_links.id_link": id_link });

    if (link.mother_reference !== date_now) {
      await OverviewDb.findOneAndUpdate(
        { "click_links.id_link": id_link },
        {
          $set: {
            mother_reference: date_now,
            "click_links.$.click_today": 1,
            "click_links.$.click_mother": 1,
          },
        },
        { new: true }
      );
    } else {
      //caso os meses sejam iguais mas o dia não
      if (link.day_reference !== day_now.toString()) {
        await OverviewDb.findOneAndUpdate(
          { "click_links.id_link": id_link },
          {
            $set: {
              day_reference: day_now,
              "click_links.$.click_today": 1,
            },
            $inc: {
              "click_links.$.click_mother": 1,
            },
          },
          { new: true }
        );
      } else {
        await OverviewDb.updateOne(
          { "click_links.id_link": id_link },
          {
            $inc: {
              "click_links.$.click_today": 1,
              "click_links.$.click_mother": 1,
            },
          }
        );
      }
    }
    // Retorna sucesso
    res.status(200).json({ message: "Clique registrado com sucesso!" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Erro ao atualizar ou deletar link" });
  }
};

//-------------,--------------

export {
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
};

//modelo

const variavel = async (req, res) => {
  try {
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Erro ao atualizar ou deletar link" });
  }
};
