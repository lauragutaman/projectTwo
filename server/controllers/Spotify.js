const crypto = require('crypto');

const SCOPES = 'user-top-read user-read-recently-played';
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

const basicAuth = () => Buffer.from(
    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`,
).toString('base64');

// Calls Spotify's token endpoint (used for both first login and refreshing)
const requestToken = async (params) => {
    const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            Authorization: `Basic ${basicAuth()}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(params),
    });

    if (!response.ok) {
        throw new Error(`Spotify token request failed: ${response.status}`);
    }

    return response.json();
};

// Sends the user to Spotify to approve access
const login = (req, res) => {
    const state = crypto.randomBytes(16).toString('hex');
    req.session.spotifyState = state;

    const params = new URLSearchParams({
        response_type: 'code',
        client_id: process.env.SPOTIFY_CLIENT_ID,
        scope: SCOPES,
        redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
        state,
    });

    return res.redirect(`https://accounts.spotify.com/authorize?${params}`);
};

// Spotify sends the user back here with a code we trade it for tokens
const callback = async (req, res) => {
    const { code, state, error } = req.query;

    // User clicked "Cancel" on Spotify's page
    if (error) {
        return res.redirect('/app');
    }

    if (!state || state !== req.session.spotifyState) {
        return res.status(400).send('Spotify login failed: state mismatch');
    }

    try {
        const tokens = await requestToken({
            grant_type: 'authorization_code',
            code,
            redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
        });

        req.session.spotify = {
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            expiresAt: Date.now() + tokens.expires_in * 1000,
        };
        delete req.session.spotifyState;

        return res.redirect('/app');
    } catch (err) {
        console.log(err);
        return res.status(500).send('Spotify login failed');
    }
};

// Returns a valid access token, refreshing it first if it has expired
const getAccessToken = async (req) => {
    const { spotify } = req.session;

    // Refresh a minute early so it doesn't expire mid-request
    if (Date.now() > spotify.expiresAt - 60 * 1000) {
        const tokens = await requestToken({
            grant_type: 'refresh_token',
            refresh_token: spotify.refreshToken,
        });

        spotify.accessToken = tokens.access_token;
        spotify.expiresAt = Date.now() + tokens.expires_in * 1000;
        // Spotify sometimes sends a new refresh token keep the old one if not 
        if (tokens.refresh_token) {
            spotify.refreshToken = tokens.refresh_token;
        }
    }

    return spotify.accessToken;
};

// Ge request the web spotify api 
const spotifyGet = async (req, path) => {
    const accessToken = await getAccessToken(req);

    const response = await fetch(`https://api.spotify.com/v1${path}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
        const err = new Error(`Spotify API error: ${response.status}`);
        err.status = response.status;
        throw err;
    }

    return response.json();
};

// Keeps only the track info the React side needs
const simplify = (track) => ({
    id: track.id,
    name: track.name,
    artists: track.artists.map((artist) => artist.name).join(', '),
    url: track.external_urls.spotify,
    album: {
        id: track.album.id,
        name: track.album.name,
        image: track.album.images[0] ? track.album.images[0].url : null,
        releaseDate: track.album.release_date,
    },
});

// Top 5 from the last 7 days, counted from recently played (max 10 plays)
const getWeeklyTop = async (req) => {
    const after = Date.now() - ONE_WEEK_MS;
    const data = await spotifyGet(req, '/me/player/recently-played?limit=10');

    const counts = {};
    data.items
        .filter((item) => new Date(item.played_at).getTime() >= after)
        .forEach(({ track }) => {
            if (!counts[track.id]) {
                counts[track.id] = { ...simplify(track), plays: 0 };
            }
            counts[track.id].plays += 1;
        });

    return Object.values(counts)
        .sort((a, b) => b.plays - a.plays)
        .slice(0, 5);
};

// Top 5 from Spotify's own ranking from about the last 4 weeks 
const getMonthlyTop = async (req) => {
    const data = await spotifyGet(req, '/me/top/tracks?time_range=short_term&limit=5');
    return data.items.map(simplify);
};


const getTopTracks = async (req, res) => {
    if (!req.session.spotify) {
        return res.status(401).json({ error: 'Spotify not connected' });
    }

    try {
        const range = req.query.range === 'month' ? 'month' : 'week';
        const tracks = range === 'week'
            ? await getWeeklyTop(req)
            : await getMonthlyTop(req);

        return res.json({ range, tracks });
    } catch (err) {
        console.log(err);

        // Token was revoked or user isn't on the app's User Management list
        if (err.status === 401 || err.status === 403) {
            delete req.session.spotify;
            return res.status(401).json({ error: 'Please reconnect Spotify' });
        }

        return res.status(500).json({ error: 'Could not load top tracks' });
    }
};

module.exports = { login, callback, getTopTracks };