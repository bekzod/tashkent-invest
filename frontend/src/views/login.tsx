'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/shared/api/client';
import { writeSession, type Session } from '@/shared/auth/session';
import { useLanguage } from '@/shared/i18n/language-provider';

export function LoginView() { const { locale, t } = useLanguage(); const router = useRouter(); const [error, setError] = useState(false); const [pending, setPending] = useState(false); async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const data = new FormData(event.currentTarget); setPending(true); setError(false); try { const session = await api<Session>('/auth/login', { method: 'POST', body: JSON.stringify({ email: data.get('email'), password: data.get('password') }) }, locale); writeSession(session); router.replace('/profile'); } catch { setError(true); } finally { setPending(false); } } return <main className="auth-page"><form className="auth-card" onSubmit={submit}><h1>{t('loginTitle')}</h1><p className="demo-hint">{t('demoHint')}</p>{error && <p className="error">{t('loginFailed')}</p>}<label>{t('email')}<input name="email" type="email" required defaultValue="investor@demo.uz" /></label><label>{t('password')}<input name="password" type="password" required defaultValue="invest2026" /></label><button className="button primary" disabled={pending}>{t('login')}</button></form></main>; }

