import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

mongoose.set("strictQuery", true);

const connectDb = async () => {
  try {
    await mongoose.connect(
      `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@linqbio.wvka7.mongodb.net/?retryWrites=true&w=majority&appName=linqbio`
    );
  } catch (error) {
    console.log(error);
  }
};

export { connectDb };
