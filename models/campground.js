// @ts-check

const mongoose = require('mongoose');
const Review = require('./review');
const Schema = mongoose.Schema;

const ImageSchema = new Schema ({
            url: String,
            filename: String
});

ImageSchema.virtual('thumbnail').get(function() {
    return this.url.replace('/upload', '/upload/w_200');
});

const opts = { toJSON: { virtuals:true } };

const campGroundSchema = new Schema ({
    title: String,
    images: [ImageSchema],
    geometry: {
        type: {
          type: String, // Don't do `{ location: { type: String } }`
          enum: ['Point'], // 'location.type' must be 'Point'
          required: true
        },
        coordinates: {
          type: [Number],
          required: true
        }
      },
    price: Number,
    description: String,
    location: String,
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    reviews: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Review'
        }
    ]
}, opts);

campGroundSchema.virtual('properties.popUpMarkup').get(function() {
  return `
    <a href = "/campgrounds/${this._id}">${this.title}</a>
    <p>${this.description.substring(0,30)}...<p>`
});

campGroundSchema.post('findOneAndDelete', async function (doc) {
  if (doc) {
    await Review.deleteMany({
      _id: {
        $in: doc.reviews
      }
    })
  }
})

// campGroundSchema.path('images').schema.virtual('thumbnail').get(function() {
//     return this.url.replace('/upload/', '/upload/w_200/');
// });

module.exports = mongoose.model('Campground', campGroundSchema);