import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, setAuthToken } from '../api/client.js';

export function Login() {
  const navigate = useNavigate();
  const containerRef = useRef(null);

  useEffect(() => {
    window.onTelegramAuth = async (user) => {
      try {
        const { data } = await api.post('/auth/telegram-web', user);
        localStorage.setItem('ref_token', data.token);
        setAuthToken(data.token);
        navigate('/dashboard');
      } catch (e) {
        console.log(e?.response?.data || e?.message);
        alert('Login failed');
      }
    };
    const bot = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || '';
    if (!bot || !containerRef.current) return undefined;
    const s = document.createElement('script');
    s.src = 'https://telegram.org/js/telegram-widget.js?22';
    s.async = true;
    s.setAttribute('data-telegram-login', bot);
    s.setAttribute('data-size', 'large');
    s.setAttribute('data-onauth', 'onTelegramAuth(user)');
    s.setAttribute('data-request-access', 'write');
    containerRef.current.appendChild(s);
    return () => {
      delete window.onTelegramAuth;
      containerRef.current?.replaceChildren();
    };
  }, [navigate]);

  return (
    <div style={{ padding: 24, color: '#fff', maxWidth: 420 }}>
      <h1>GG Arena Referee</h1>
      <p style={{ color: '#888' }}>Sign in with Telegram (referee or admin account).</p>
      <div ref={containerRef} />
    </div>
  );
}
