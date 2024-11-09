import { LinqbioDb } from "../models/linqbioDB.js";
import session from "express-session";

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
      //se o usuário fez login
      const user_name = req.oidc.user.name;
      const user_id = req.oidc.user.sub;
      const user_email = req.oidc.user.email;

      const user_name_link = req.cookies.user_name_link;
      res.clearCookie("user_name_link"); // Limpa o cookie após o uso

      let user = await LinqbioDb.findOne({ user_email });
      let check_login = "";

      //verificando se o usuário tem acesso
      if (!user) {
        //se não houver ele cria
        user = new LinqbioDb({
          user_id,
          user_name,
          user_email,
        });

        await user.save();
        check_login = `Seu Primeiro login ${user_name} e ${user_name_link}`;
        res.render("indexAuth", { check_login });
      } else {
        //se houver login, ele verificar se o pagamento foi feito
        res.render("indexAuth", { check_login });
      }
    } else {
      res.render("indexNoAuth");
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

export { UserController, AcessUser, fastUserCreation };

//modelo
const variavel = async (req, res) => {
  try {
  } catch (error) {
    console.log(error);
  }
};
