import mongoose from "mongoose";
import { Schema } from "mongoose";
const MessageSchema = new Schema({
    player1:{
        type:String,
        required: true,
    },
    player2:{
        type:String,
        required: true,
    },
    content:{
        type:String,
        required: true,
    }
})

const Message = mongoose.models.Message || mongoose.model("Message", MessageSchema);

export default Message;