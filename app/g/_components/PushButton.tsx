// app/g/_components/PushButton.tsx
'use client';

import { useEffect, useState } from 'react';
import { groupsFetch } from '@/lib/groups/client';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PushButton() {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setSupported(true);
      navigator.serviceWorker.register('/sw.js').then(reg => {
        reg.pushManager.getSubscription().then(sub => {
          setSubscribed(!!sub);
        });
      });
    }
  }, []);

  async function subscribe() {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''),
      });

      await groupsFetch('/api/groups/push/subscribe', { subscription: sub });
      setSubscribed(true);
      alert('تم تفعيل إشعارات الهاتف بنجاح! 🔔');
    } catch (err) {
      console.error(err);
      alert('فشل تفعيل الإشعارات. تأكد من السماح للمتصفح بالإشعارات.');
    } finally {
      setLoading(false);
    }
  }

  if (!supported) return null;

  return (
    <button
      onClick={subscribe}
      disabled={subscribed || loading}
      className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
        subscribed ? 'bg-teal/10 text-teal' : 'bg-ink/5 text-ink-soft hover:bg-ink/10'
      }`}
    >
      {loading ? '...' : subscribed ? '🔔 الإشعارات مفعلة' : '🔕 تفعيل إشعارات الهاتف'}
    </button>
  );
}