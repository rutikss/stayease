const mongoose = require("mongoose");
const { Schema } = mongoose;

const reviewSchema = new mongoose.Schema({
    comment:{
        type:String,
        required:[true,"Comment is required"],
        trim:true
    },
    rating:{
        type:Number,
        required:[true,"Rating is required"],
        min:1,
        max:5
    },
    author:{
        type:Schema.Types.ObjectId,
        ref:"User",
    }
},
{
    timestamps:true,
}
);

reviewSchema.index({rating:-1});
reviewSchema.index({createdAt:-1}); 


const Review = mongoose.model("Review",reviewSchema);

module.exports = Review;