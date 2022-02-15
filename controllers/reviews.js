const campground = require('../models/campground');
const Review = require('../models/review');

module.exports.createReview = async (req, res) => {
    const campgrnd = await campground.findById(req.params.id);
    const review = new Review(req.body.review);
    review.author = req.user._id;
    campgrnd.reviews.push(review);
    await review.save();
    await campgrnd.save();
    req.flash('success','Created a new review!');
    res.redirect(`/campgrounds/${campgrnd._id}`);
}

module.exports.destroyReview = async (req, res) => {
    const {id, reviewId} = req.params;
    await campground.findByIdAndUpdate(id, { $pull: { reviews: reviewId } } );
    await Review.findByIdAndDelete(reviewId);
    req.flash('success','Successfully deleted a review!');
    res.redirect(`/campgrounds/${id}`);
    // res.send('Delete Me!!!');
}