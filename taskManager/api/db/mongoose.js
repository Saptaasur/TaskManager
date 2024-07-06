const mongoose = require('mongoose');
require('colors')

mongoose.Promise = global.Promise;
mongoose.connect('mongodb+srv://ricky:ricky@cluster1.u0hkygx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster1').then(() => {
    console.log("Connected to MongoDB successfully :)".inverse.white);
}).catch((e) => {
    console.log("Error while attempting to connect to MongoDB");
    console.log(e);
});





module.exports = {
    mongoose
};