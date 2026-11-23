const spotifyGet = async (req, path) => {
    const r = await fetch(`https://api.spotify.com/v1${path}`, {
        headers: { Authorization: `Breaer ${req.session.spotify.accessToken}` },
    });
    if (!r.ok) throw new Error(`Spotify ${r.status}`);
    return r.json();
};

const simplify = (t) => ({
    id: t.id,
    name: t.name,
    artists: t.artists.map((a) => a.name).join(', '),
    album: { id: t.album.id, name: t.album.name, image: t.album.images[0]?.url },
});

const getTopTracks = async (req, res) => {
    if (!req.session.spotify) return res.status(401).json({ error: 'Spotify not connected' });
    try {
        if (req.query.range === 'week') {
            const after = Date.now() - 7 * 24 * 60 * 60 * 1000;
            const data = await spotifyGet(req, '/me/player/recently-played?limit=50');
            const counts = {};
            data.items
                .filter((i) => new Date(i.played_at).getTime() >= after)
                .forEach(({ track }) => {
                    counts[track.id] = counts[track.id] || { ...simplify(track), plays: 0 };
                    counts[track.id].plays += 1;
                });
            const top = Object.values(counts).sort((a, b) => b.plays - a.plays).slice(0, 5);
            return res.json({ tracks: top });
        }
        const data = await spotifyGet(req, '/me/top/tracks?time_range=short_term&limit=5');
        return res.json({ tracks: data.items.map(simplify) });
    } catch (err) {
        return res.status(500).json({ error: 'Could not load tracks' });
    }
};
