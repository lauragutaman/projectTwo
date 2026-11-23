const controllers = require('./controllers');
const mid = require('./middleware');

const router = (app) => {
    app.get('/getDomos', mid.requiresLogin, controllers.Domo.getDomos);

    app.get('/login', mid.requiresSecure, mid.requiresLogout, controllers.Account.loginPage);
    app.post('/login', mid.requiresSecure, mid.requiresLogout, controllers.Account.login);

    // app.get('/signup', mid.requiresSecure, mid.requiresLogout, controllers.Account.signupPage);
    app.post('/signup', mid.requiresSecure, mid.requiresLogout, controllers.Account.signup);

    app.get('/logout', mid.requiresLogin, controllers.Account.logout);
    app.get('/', mid.requiresSecure, mid.requiresLogout, controllers.Account.loginPage);


    // Spotify
    app.get('/spotify/login', mid.requiresLogin, controllers.Spotify.login);
    app.get('/spotify/callback', mid.requiresLogin, controllers.Spotify.callback);
    app.get('/api/top-tracks', mid.requiresLogin, controllers.Spotify.getTopTracks);

    // Albums
    app.get('/albums', mid.requiresLogin, controllers.Album.getAlbums);
    app.post('/albums', mid.requiresLogin, controllers.Album.saveAlbum);


};

module.exports = router;