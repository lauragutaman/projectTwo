const React = require('react');
const { useState, useEffect } = React;
const { createRoot } = require('react-dom/client');

const ConnectSpotify = () => (
    <div className="connect-spotify">
        <h2>Connect your Spotify</h2>
        <p>Log in to see your most played songs this week.</p>
        <a className="btn btn-spotify" href="/spotify/login">Connect Spotify</a>
    </div>
);

const TrackCard = ({ track, rank }) => (
    <li className="track-card">
        <span className="track-rank">{rank}</span>
        {track.album.image && (
            <img className="track-art" src={track.album.image} alt={`${track.album.name} cover`} width="64" />
        )}
        <div className="track-info">
            <a className="track-name" href={track.url} target="_blank" rel="noreferrer">{track.name}</a>
            <span className="track-artist"> — {track.artists}</span>
        </div>
        <span className="track-plays">
            {track.plays} {track.plays === 1 ? 'play' : 'plays'}
        </span>
    </li>
);

const WeekInMusic = () => {
    // checking | disconnected | idle | loading | ready | error
    const [status, setStatus] = useState('checking');
    const [tracks, setTracks] = useState([]);

    // On page load, only check whether Spotify is connected
    useEffect(() => {
        fetch('/spotify/status')
            .then((res) => res.json())
            .then((data) => setStatus(data.connected ? 'idle' : 'disconnected'))
            .catch(() => setStatus('error'));
    }, []);

    // Runs when the button is clicked
    const loadTopTracks = async () => {
        setStatus('loading');
        try {
            const response = await fetch('/api/top-tracks?range=week');
            if (response.status === 401) {
                setStatus('disconnected');
                return;
            }
            if (!response.ok) {
                setStatus('error');
                return;
            }
            const data = await response.json();
            setTracks(data.tracks);
            setStatus('ready');
        } catch {
            setStatus('error');
        }
    };

    if (status === 'checking') return <p>Loading...</p>;
    if (status === 'disconnected') return <ConnectSpotify />;

    return (
        <div className="week-in-music">
            <h1>Your week in music</h1>
            <button type="button" onClick={loadTopTracks} disabled={status === 'loading'}>
                {status === 'loading' ? 'Loading...' : 'Show me my top 5 songs this week'}
            </button>

            {status === 'error' && <p>Something went wrong. Try again.</p>}

            {status === 'ready' && tracks.length === 0 && (
                <p>No plays found in the past week. Go listen to something!</p>
            )}

            {status === 'ready' && tracks.length > 0 && (
                <section className="top-tracks">
                    <p className="note">Based on your last 50 plays from the past 7 days.</p>
                    <ol className="track-list">
                        {tracks.map((track, i) => (
                            <TrackCard key={track.id} track={track} rank={i + 1} />
                        ))}
                    </ol>
                </section>
            )}
        </div>
    );
};

const init = () => {
    createRoot(document.getElementById('app')).render(<WeekInMusic />);
};

window.onload = init;