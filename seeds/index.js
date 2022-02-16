const mongoose = require('mongoose');
const cities = require('./cities');
const { places, descriptors } = require('./seedHelpers');
const campground = require('../models/campground');

const dbUrl = 'mongodb+srv://firstdb:wpJjjloWvy5AfpDT@cluster0.6stqc.mongodb.net/myFirstDatabase?retryWrites=true&w=majority';

mongoose.connect(dbUrl, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;

db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});

// const sample = array => array[Math.floor(Math.random() * array.length)];


// const seedDB = async () => {
//     await Campground.deleteMany({});
//     for (let i = 0; i < 50; i++) {
//         const random1000 = Math.floor(Math.random() * 1000);
//         const camp = new Campground({
//             location: `${cities[random1000].city}, ${cities[random1000].state}`,
//             title: `${sample(descriptors)} ${sample(places)}`
//         })
//         await camp.save();
//     }
// }

// seedDB().then(() => {
//     mongoose.connection.close();
// })

// to pick a random descriptor and place from the array
const sample = array => array[Math.floor(Math.random() * array.length)];

const seedDB = async () => {
    // deletes everything and replaces it with new
    await campground.deleteMany({});
    // to reseed run node seeds/index.js
    for (let i=0; i<200; i++) {
        const random1000 = Math.floor(Math.random() * 1000);
        const price = Math.floor(Math.random() * 20) + 10;
        const camp = new campground({
            author: '620c17ff8b377f45d8d91d1c',
            location: `${cities[random1000].city}, ${cities[random1000].state}`,
            title: `${sample(descriptors)} ${sample(places)}`,
            // image: 'https://source.unsplash.com/collection/483251/1600x900',
            description: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Fuga dolores magnam sed doloremque ab aliquam recusandae explicabo at ex, maxime quisquam soluta. Alias quae similique cum rem quod quas aliquam.',
            price,
            geometry: { 
                type: 'Point', 
                coordinates: [
                    cities[random1000].longitude,
                    cities[random1000].latitude
                ] 
            },
            images: [
                {
                  url: 'https://source.unsplash.com/collection/483251/1600x900',
                  filename: 'YelpCamp/bpod2vdw92ndmibidwzl'
                }
              ],
        })
        await camp.save();
    }
}

// close database connection
seedDB().then(() => {
    mongoose.connection.close();
})