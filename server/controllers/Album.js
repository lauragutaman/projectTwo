const models = require('../models');

const { Album } = models;

// GET albums only the logged in user's albums
const getAlbums = async (req, res) => {
    try {
        const albums = await Album.find({ owner: req.session.account._id })
            .select('spotifyId name artists image releaseDate createdDate')
            .sort({ createdDate: -1 })
            .lean()
            .exec();
        return res.json({ albums });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: 'Could not load albums' });
    }
};

// POST albums save one album to the user's list
const saveAlbum = async (req, res) => {
    const {
        spotifyId, name, artists, image, releaseDate,
    } = req.body;

    if (!spotifyId || !name) {
        return res.status(400).json({ error: 'Album id and name are required' });
    }

    try {
        const album = await Album.create({
            spotifyId, name, artists, image, releaseDate,
            owner: req.session.account._id,
        });
        return res.status(201).json({ album });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ error: 'Album already in your list' });
        }
        console.log(err);
        return res.status(500).json({ error: 'Could not save album' });
    }
};

module.exports = { getAlbums, saveAlbum };