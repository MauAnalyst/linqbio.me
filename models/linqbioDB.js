import mongoose from "mongoose";

const Schema = mongoose.Schema;

const LinqbioSchema = new Schema({
  user_id: { type: String, required: true },
  user_name: { type: String, required: true },
  user_email: { type: String, required: true },
  user_name_link: { type: String, default: "No Link" },
  user_picture: { type: String, default: "./imgs/cat.png" },
  stripe_id: { type: String, default: "Pending" },
  plan: { type: String, default: "Pending Payment" },
  coupon: { type: String, default: "No add" },
  buy_status: { type: String, default: "Pending" },
  date_created_payment: { type: String, default: "Pending payment" },
  reimbursement_status: { type: String, default: "Pending payment" },
  date_created_user: { type: Date, default: Date.now },
});

const UserCustomSchema = new Schema({
  user_id: { type: String, required: true },
  user_name_link: { type: String, required: true },
  user_picture: { type: String, required: true },
  profile: {
    user_name: { type: String, required: true },
    user_description: {
      type: String,
      default: "Me acompanhe em todas as redes",
    },
  },
  theme: {
    body_theme: { type: String, default: "body-theme-3" },
    theme_user_name: { type: String, default: "theme-user-name-3" },
    theme_user_slogan: { type: String, default: "theme-user-slogan-3" },
  },
  links_user: [
    {
      id_link: { type: String, default: "" },
      link: { type: String, default: "" },
      origin: { type: String, default: "" }, // TikTok, Instagram, etc.
      other: { type: String, default: "" }, // Para outras origens, onde o usuário define o nome
      title: { type: String, default: "" },
      description: { type: String, default: "" },
    },
  ],
  log: { type: String, default: "" },
});

const OverviewSchema = new Schema({
  user_id: { type: String, required: true },
  mother_reference: { type: String, default: "" },
  day_reference: { type: String, default: "" },
  access_today: { type: String, default: 0 },
  access_mother: { type: String, default: 0 },
  click_links: [
    {
      id_link: { type: String, required: true },
      click_today: { type: Number, default: 0 },
      click_mother: { type: Number, default: 0 },
    },
  ],
});

// const LinksUserSchema = new Schema({
//   user_id: { type: String, required: true },
//   links_user: {
//     instagram: { type: String, default: "No add" },
//     facebook: { type: String, default: "No add" },
//     twitter: { type: String, default: "No add" },
//     linkedin: { type: String, default: "No add" },
//     youtube: { type: String, default: "No add" },
//     tiktok: { type: String, default: "No add" },
//     twitch: { type: String, default: "No add" },
//     pinterest: { type: String, default: "No add" },
//     onlyfans: { type: String, default: "No add" },
//     snapchat: { type: String, default: "No add" },
//     discord: { type: String, default: "No add" },
//     telegram: { type: String, default: "No add" },
//     whatsapp: { type: String, default: "No add" },
//     wechat: { type: String, default: "No add" },
//     threads: { type: String, default: "No add" },
//     github: { type: String, default: "No add" },
//     personal_website: { type: String, default: "No add" },
//     blog: { type: String, default: "No add" },
//     privace: { type: String, default: "No add" },
//     fansly: { type: String, default: "No add" },
//     justforfans: { type: String, default: "No add" },
//     manyvids: { type: String, default: "No add" },
//     other: { type: String, default: "No add" },
//   },
// });

const LinqbioDb = mongoose.model("LinqbioDb", LinqbioSchema);
const UserCustom = mongoose.model("UserCustom", UserCustomSchema);
const OverviewDb = mongoose.model("OverviewDb", OverviewSchema);

export { LinqbioDb, UserCustom, OverviewDb };
