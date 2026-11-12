import React, { useCallback, useEffect, useState } from 'react';
import { Loader2, AlertCircle, LogOut } from 'lucide-react';
import { auth } from './cloudbase';
import { getMe, type Me } from './api';
import Login from './Login';
import App from './App';

type State =
  | { status: 'loading' }
  | { status: 'signedOut' }
  | { status: 'error'; message: string }
  | { status: 'ready'; me: Me };

export default function Root() {
  const [state, setState] = useState<State>({ status: 'loading' });

  const resolve = useCallback(async () => {
    setState({ status: 'loading' });
    try {
      const { data } = await auth.getSession();
      if (!data?.session) {
        setState({ status: 'signedOut' });
        return;
      }
      setState({ status: 'ready', me: await getMe() });
    } catch (e: any) {
      setState({ status: 'error', message: e?.message || '连接云端失败' });
    }
  }, []);

  useEffect(() => {
    resolve();
  }, [resolve]);

  const signOut = useCallback(async () => {
    await auth.signOut();
    setState({ status: 'signedOut' });
  }, []);

  if (state.status === 'signedOut') return <Login onSignedIn={resolve} />;

  if (state.status === 'ready') {
    return <App role={state.me.isDoctor ? 'doctor' : 'patient'} me={state.me} onSignOut={signOut} />;
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans">
      {state.status === 'loading' ? (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          正在连接…
        </div>
      ) : (
        <div className="max-w-sm bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3 text-sm">
          <p className="text-rose-600 font-semibold flex items-start gap-1.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            {state.message}
          </p>
          <div className="flex gap-2">
            <button onClick={resolve} className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700">
              重试
            </button>
            <button
              onClick={signOut}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 flex items-center gap-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              退出登录
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
