import React, { useState } from 'react';
import { Stethoscope, KeyRound, AlertCircle, Loader2 } from 'lucide-react';
import { auth } from './cloudbase';

const errText = (e: any) => e?.message || e?.msg || e?.error_description || '未知错误';

const inputCls =
  'w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white';
const primaryBtnCls =
  'w-full py-2.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 transition flex items-center justify-center gap-2';

export default function Login({ onSignedIn }: { onSignedIn: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    (async () => {
      try {
        const { error } = await auth.signInWithPassword({ username: username.trim(), password });
        if (error) {
          throw new Error(
            error.message === 'not_found' || error.message === 'invalid_password' ? '用户名或密码错误' : errText(error)
          );
        }
        onSignedIn();
      } catch (e) {
        setError(errText(e));
      } finally {
        setBusy(false);
      }
    })();
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans text-slate-800">
      <div className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm shrink-0">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900">脊柱外科患者随访评估</h1>
            <p className="text-xs text-slate-500">医生登录</p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-3">
          <label className="block text-xs font-bold text-slate-700">用户名</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" className={inputCls} />
          <label className="block text-xs font-bold text-slate-700">密码</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            className={inputCls}
          />
          <button type="submit" disabled={busy || !username.trim() || !password} className={primaryBtnCls}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
            登录
          </button>
        </form>

        {error && (
          <p className="text-xs text-rose-600 font-semibold flex items-start gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-px" />
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
