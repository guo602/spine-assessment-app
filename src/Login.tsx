import React, { useState } from 'react';
import { Stethoscope, UserCheck, Smartphone, KeyRound, AlertCircle, Loader2, ChevronLeft } from 'lucide-react';
import { auth } from './cloudbase';

const errText = (e: any) => e?.message || e?.msg || e?.error_description || '未知错误';

const inputCls =
  'w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white';
const primaryBtnCls =
  'w-full py-2.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 transition flex items-center justify-center gap-2';

export default function Login({ onSignedIn }: { onSignedIn: () => void }) {
  // 扫码进来的链接默认是患者登录；医生从同一网址切换
  const [mode, setMode] = useState<'patient' | 'doctor'>(
    new URLSearchParams(window.location.search).get('role') === 'doctor' ? 'doctor' : 'patient'
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // 医生：用户名 + 密码
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // 患者：手机号 + 短信验证码
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [otp, setOtp] = useState<null | ((p: { token: string }) => Promise<any>)>(null);
  const [cooldown, setCooldown] = useState(0);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError('');
    try {
      await fn();
    } catch (e) {
      setError(errText(e));
    } finally {
      setBusy(false);
    }
  };

  const handleDoctorLogin = (e: React.FormEvent) => {
    e.preventDefault();
    run(async () => {
      const { error } = await auth.signInWithPassword({ username: username.trim(), password });
      if (error) throw new Error(error.message === 'not_found' || error.message === 'invalid_password' ? '用户名或密码错误' : errText(error));
      onSignedIn();
    });
  };

  const handleSendCode = () => {
    const digits = phone.replace(/\D/g, '');
    if (!/^1\d{10}$/.test(digits)) {
      setError('请输入正确的 11 位手机号');
      return;
    }
    run(async () => {
      const { data, error } = await auth.signInWithOtp({ phone: `+86${digits}`, options: { shouldCreateUser: true } });
      if (error || !data?.verifyOtp) throw new Error(error ? errText(error) : '验证码发送失败');
      setOtp(() => data.verifyOtp);
      setCooldown(60);
      const timer = setInterval(() => {
        setCooldown((s) => {
          if (s <= 1) clearInterval(timer);
          return s - 1;
        });
      }, 1000);
    });
  };

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return;
    run(async () => {
      const { error } = await otp({ token: code.trim() });
      if (error) throw new Error('验证码错误或已过期，请重新获取');
      onSignedIn();
    });
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
            <p className="text-xs text-slate-500">{mode === 'doctor' ? '医生登录' : '患者登录：用建档时登记的手机号'}</p>
          </div>
        </div>

        {mode === 'patient' ? (
          <form onSubmit={handleVerifyCode} className="space-y-3">
            <label className="block text-xs font-bold text-slate-700">手机号</label>
            <div className="flex gap-2">
              <input
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="11 位手机号"
                className={inputCls}
              />
              <button
                type="button"
                onClick={handleSendCode}
                disabled={busy || cooldown > 0}
                className="shrink-0 px-3 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 disabled:opacity-60"
              >
                {cooldown > 0 ? `${cooldown}s` : otp ? '重新发送' : '获取验证码'}
              </button>
            </div>
            {otp && (
              <>
                <label className="block text-xs font-bold text-slate-700">短信验证码</label>
                <input
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="6 位验证码"
                  className={inputCls}
                />
                <p className="text-[11px] text-slate-400">验证码已发送至 {phone.trim()}，如未收到请稍后重试。</p>
              </>
            )}
            <button type="submit" disabled={busy || !otp || !code.trim()} className={primaryBtnCls}>
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Smartphone className="w-4 h-4" />}
              登录
            </button>
          </form>
        ) : (
          <form onSubmit={handleDoctorLogin} className="space-y-3">
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
        )}

        {error && (
          <p className="text-xs text-rose-600 font-semibold flex items-start gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-px" />
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={() => {
            setMode(mode === 'doctor' ? 'patient' : 'doctor');
            setError('');
          }}
          className="w-full text-xs text-slate-500 hover:text-indigo-600 flex items-center justify-center gap-1"
        >
          {mode === 'doctor' ? (
            <>
              <ChevronLeft className="w-3.5 h-3.5" />
              我是患者，用手机号登录
            </>
          ) : (
            <>
              <UserCheck className="w-3.5 h-3.5" />
              医生登录
            </>
          )}
        </button>
      </div>
    </div>
  );
}
