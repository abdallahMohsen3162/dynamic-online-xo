import mongoose from "mongoose";
import { Schema } from "mongoose";
const WaitSckema = new Schema({
    player:{
        type:String,
        required: true,
    }
})

const Waiting = mongoose.models.Waiting || mongoose.model("Waiting", WaitSckema);

export default Waiting;