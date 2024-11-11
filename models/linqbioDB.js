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
  buy_status: { type: String, default: "Pending" },
  date_created_payment: { type: String, default: "Pending payment" },
  reimbursement_status: { type: String, default: "Pending payment" },
  date_created_user: { type: Date, default: Date.now },
});

const LinqbioDb = mongoose.model("LinqbioDb", LinqbioSchema);

export { LinqbioDb };
