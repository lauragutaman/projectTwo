const React = require('react');
const { useState } = React;
const { createRoot } = require('react-dom/client');

const AuthForm = () => {
    const [mode, setMode] = useState('login'); 
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const form = e.target;
        const data = {
            username: form.username.value,
            pass: form.pass.value,
        };
        if (mode === 'signup') data.pass2 = form.pass2.value;

        const response = await fetch(`/${mode}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        const result = await response.json();

        if (result.redirect) window.location = result.redirect;
        if (result.error) setError(result.error);
    };

    return (
        <div>
            <h1>{mode === 'login' ? 'Log in' : 'Sign up'}</h1>
            <form onSubmit={handleSubmit}>
                <input name="username" placeholder="Username" required />
                <input name="pass" type="password" placeholder="Password" required />
                {mode === 'signup' && (
                    <input name="pass2" type="password" placeholder="Confirm password" required />
                )}
                <button type="submit">{mode === 'login' ? 'Log in' : 'Sign up'}</button>
            </form>

            {error && <p style={{ color: 'red' }}>{error}</p>}

            <button type="button" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}>
                {mode === 'login' ? 'Need an account? Sign up' : 'Have an account? Log in'}
            </button>
        </div>
    );
};

window.onload = () => {
    createRoot(document.getElementById('content')).render(<AuthForm />);
};