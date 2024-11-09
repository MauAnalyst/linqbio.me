import mongoose from "mongoose";

const Schema = mongoose.Schema;

const LinqbioSchema = new Schema({
  user_id: { type: String, required: true },
  user_name: { type: String, required: true },
  user_email: { type: String, required: true },
  user_name_link: { type: String, default: "No Link" },
  buy_status: { type: String, default: "Pending" },
  data_user_created: { type: Date, default: Date.now },
});

const LinqbioDb = mongoose.model("LinqbioDb", LinqbioSchema);

export { LinqbioDb };
