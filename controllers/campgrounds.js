const campground = require('../models/campground');
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapBoxToken = process.env.MAPBOX_TOKEN;
const geocoder = mbxGeocoding ({ accessToken: mapBoxToken });
const { cloudinary } = require("../cloudinary");

module.exports.index = async (req, res) => {
    const campgrnd = await campground.find({ });
    res.render('campgrounds/index', { campgrnd });
};

module.exports.renderNewForm = (req, res) => {
    res.render('campgrounds/new');
};

module.exports.createCampground = async (req, res, next) => {
    // if(!req.body.Campground) throw new ExpressError('Invalid Campground Data', 400);
    const geoData = await geocoder.forwardGeocode ({
        query: req.body.campground.location,
        limit: 1
    }).send()
    const Campground = new campground(req.body.campground);
    Campground.geometry = geoData.body.features[0].geometry;
    Campground.images = req.files.map(f => ({ url: f.path, filename: f.filename }));
    Campground.author = req.user._id;
    await Campground.save();
    // console.log(Campground);
    req.flash('success','Successfully made a new campground!');
    res.redirect(`/campgrounds/${Campground._id}`);
}

module.exports.showCampground = async (req, res) => {
    const campgrnd = await campground.findById(req.params.id).populate({
        path: 'reviews',
        populate: {
            path: 'author'
        }
    }).populate('author');
    // console.log(campgrnd);
    // http://localhost:3000/campgrounds/60ff72d39af3c74c44ee6564
    if(!campgrnd) {
        req.flash('error', 'Cannot find that campground');
        return res.redirect('/campgrounds');
    }
    res.render('campgrounds/show', { campgrnd });
}

module.exports.renderEditForm = async (req, res) => {
    const {id} = req.params;
    const campgrnd = await campground.findById(id);
    if(!campgrnd) {
        req.flash('error', 'Cannot find that campground!');
        return res.redirect('/campgrounds');
    }
    // second argument is a key value pair that can be passed on to an ejs template
    res.render('campgrounds/edit', { campgrnd });
}

module.exports.updateCampground = async (req, res) => {
    const { id } = req.params;
    // console.log(req.body);
    const Campground = await campground.findByIdAndUpdate(id, { ...req.body.campground });
    const imgs = req.files.map(f => ({ url: f.path, filename: f.filename }));
    Campground.images.push(...imgs);
    await Campground.save();
    if (req.body.deleteImages) {
        for (let filename of req.body.deleteImages) {
            await cloudinary.uploader.destroy(filename);
        }
        await Campground.updateOne({ $pull: { images: { filename: { $in: req.body.deleteImages } } } })
    }
    req.flash('success','Successfully updated!');
    res.redirect(`/campgrounds/${Campground._id}`);
}

module.exports.destroyCampground = async (req, res) => {
    const { id } = req.params;
    await campground.findByIdAndDelete(id);
    req.flash('success','Successfully deleted campground!');
    res.redirect('/campgrounds');
}