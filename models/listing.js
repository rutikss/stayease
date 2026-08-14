const mongoose = require("mongoose");
const { Schema } = mongoose;
const Review = require("./review.js");

const listingSchema = new mongoose.Schema({
    title: {
        type:String,
        required:[true,"Title is required"],
        trim:true,
        minlength:2,
        maxlength:60
    },
    price: {
        type:Number,
        required:[true,"Valid price is required"],  
        min:0
    },

    description: {
        type:String,
        trim:true,
        minlength:2,
        maxlength:250
    },
    image: {
        url: {
            type: String,
            trim: true,
            default: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800"
        },
        filename: {
            type: String,
            trim: true,
            default: "default"
        }
    },
    location: {
        type:String,
        required:[true,"Location is required"],
        trim:true,
        minlength:2,
        maxlength:200
    },
    country:{
        type:String,
        required: [true,"Country is required"],
        trim:true,
        minlength:2,
        maxlength:50
    },
    reviews: [
        {
           type:Schema.Types.ObjectId,
            ref:"Review",
        }
    ],
    owner:{
        type:Schema.Types.ObjectId,
        ref:"User"
    },

    // Denormalized — updated by reviewController after every create/delete
    avgRating:   { type: Number, default: null },
    reviewCount: { type: Number, default: 0 },
    
},
{
    timestamps: true,
}
);

listingSchema.post("findOneAndDelete",async(listing) => {
  if(listing.reviews.length){
    await Review.deleteMany({_id:{$in:listing.reviews}});
  }
});

listingSchema.index({
    title:"text",
    location:"text"
});
listingSchema.index({country:1});
listingSchema.index({ country: 1, price: 1 });
listingSchema.index({ createdAt: -1 });


const Listing = mongoose.model("Listing",listingSchema);

module.exports = Listing;