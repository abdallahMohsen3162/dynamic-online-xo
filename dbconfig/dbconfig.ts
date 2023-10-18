import mongoose from "mongoose";
const connect = async () => {
    try {
        await mongoose.connect(process.env.DATABASE!);
    } catch (error) {
        throw new Error("connection fail")
    }
}

export default connect;