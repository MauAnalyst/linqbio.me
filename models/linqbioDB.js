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

const LinksUserSchema = new Schema({
  user_id: { type: String, required: true },
  links_user: {
    instagram: { type: String, default: "No add" },
    facebook: { type: String, default: "No add" },
    twitter: { type: String, default: "No add" },
    linkedin: { type: String, default: "No add" },
    youtube: { type: String, default: "No add" },
    tiktok: { type: String, default: "No add" },
    twitch: { type: String, default: "No add" },
    pinterest: { type: String, default: "No add" },
    onlyfans: { type: String, default: "No add" },
    snapchat: { type: String, default: "No add" },
    discord: { type: String, default: "No add" },
    telegram: { type: String, default: "No add" },
    whatsapp: { type: String, default: "No add" },
    wechat: { type: String, default: "No add" },
    threads: { type: String, default: "No add" },
    github: { type: String, default: "No add" },
    personal_website: { type: String, default: "No add" },
    blog: { type: String, default: "No add" },
    privace: { type: String, default: "No add" },
    fansly: { type: String, default: "No add" },
    justforfans: { type: String, default: "No add" },
    manyvids: { type: String, default: "No add" },
  },
});

const LinqbioDb = mongoose.model("LinqbioDb", LinqbioSchema);
const LinksUser = mongoose.model("LinksUser", LinksUserSchema);

export { LinqbioDb, LinksUser };
