import React, { useEffect, useState } from 'react';

export function CountdownTimer({ targetIso }) {
  const [left, setLeft] = useState('');

  useEffect(() => {
    const t = setInterval(() => {
      const end = new Date(targetIso).getTime();
      const s = Math.max(0, Math.floor((end - Date.now()) / 1000));
      const h = Math.floor(s / 3600);
      const m = Math.floor((s % 3600) / 60);
      const sec = s % 60;
      setLeft(`${h}h ${m}m ${sec}s`);
    }, 1000);
    return () => clearInterval(t);
  }, [targetIso]);

  return <span style={{ color: 'var(--gg-warning)', fontWeight: 700 }}>{left}</span>;
}
