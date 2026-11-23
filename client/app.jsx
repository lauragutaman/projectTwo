const helper = require('./helper.js');
const React = require('react');
const { useState, useEffect } = React;
const { createRoot } = require('react-dom/client');

// client/app.jsx
const React = require('react');
const { useState, useEffect } = React;
const { createRoot } = require('react-dom/client');

// Shown when the user hasn't connected Spotify yet (server returns 401)
const ConnectSpotify = () => (
    <div className="connect-spotify">
        <h2>Connect your Spotify</h2>
        <p>See the songs you couldn't stop playing this week.</p>
        <a className="btn btn-spotify" href="/spotify/login">Connect Spotify</a>
    </div>
);

// "Your week in music" headline, built from the #1 song
const WeekHeadline = ({ topTrack }) => {
    if (!topTrack) {
        return (
            <header className="week-headline">
                <h1>Your week in music</h1>
                <p>No plays yet this week. Go listen to something and check back!</p>
            </header>
        );
    }

    const times = topTrack.plays === 1 ? 'time' : 'times';

    return (
        <header className="week-headline">
            <h1>Your week in music</h1>
            <p>
                You played <strong>{topTrack.name}</strong> by {topTrack.artists}{' '}
                <strong>{topTrack.plays} {times}</strong> this week.
            </p>
        </header>
    );
};

// One song in the list
const TrackCard = ({ track, rank }) => (
    <li className="track-card">
        <span className="track-rank">{rank}</span>
        {track.album.image && (
            <img
                className="track-art"
                src={track.album.image}
                alt={`${track.album.name} album cover`}
            />
        )}
        <div className="track-info">
            <a className="track-name" href={track.url} target="_blank" rel="noreferrer">
                {track.name}
            </a>
            <span className="track-artist">{track.artists}</span>
            <span className="track-album">{track.album.name}</span>
        </div>
        <span className="track-plays">
            {track.plays} {track.plays === 1 ? 'play' : 'plays'}
        </span>
    </li>
);

// The top 5 list
const TopTracks = ({ tracks }) => {
    if (tracks.length === 0) return null;

    return (
        <section className="top-tracks">
            <h2>Your top {tracks.length} this week</h2>
            <ol className="track-list">
                {tracks.map((track, i) => (
                    <TrackCard key={track.id} track={track} rank={i + 1} />
                ))}
            </ol>
        </section>
    );
};

// Main component: loads the data and decides what to show
const WeekInMusic = () => {
    const [tracks, setTracks] = useState([]);
    const [status, setStatus] = useState('loading'); // loading | ready | disconnected | error

    useEffect(() => {
        const loadTracks = async () => {
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
            } catch (err) {
                setStatus('error');
            }
        };
        loadTracks();
    }, []);

    if (status === 'loading') {
        return <p className="status-message">Loading your week in music...</p>;
    }
    if (status === 'disconnected') {
        return <ConnectSpotify />;
    }
    if (status === 'error') {
        return <p className="status-message">Something went wrong loading your songs. Try refreshing.</p>;
    }

    return (
        <div className="week-in-music">
            <WeekHeadline topTrack={tracks[0]} />
            <TopTracks tracks={tracks} />
        </div>
    );
};

const init = () => {
    const root = createRoot(document.getElementById('app'));
    root.render(<WeekInMusic />);
};

window.onload = init;