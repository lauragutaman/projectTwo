const mongoose = require ('monogoose'); 

const AlbumSchema = new mongoose.Schema({

    spotifyID: {type: String, required: true}, 
    name: {type: String, required: true, trim: true},
    artists: {type: String, trim: true},
    image: {type: String}, 
    releaseDate: {type: String}, 
    owner: {type: mongoose.Schema.ObjectID, required: true, ref: 'Account'},
    createdDate: {type: Date, default: Date.now},


});

AlbumSchema.index({owner: 1, spotifyID: 1}, {unique: true}); 

const AlbumModel = mongoose.model('Album', AlbumSchema); 
module.exports = AlbumModel; 