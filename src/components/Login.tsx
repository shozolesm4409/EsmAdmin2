import React, { useState } from 'react';
import { Lock, User, Loader2, Eye, EyeOff, LogIn } from 'lucide-react';

interface LoginProps {
  onLogin: (userId: string, pass: string) => Promise<void>;
}

export function Login({ onLogin }: LoginProps) {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await onLogin(userId, password);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-[460px] bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="p-8 bg-blue-600 text-white text-center">
          <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 overflow-hidden shadow-sm">
            <img src="https://play-lh.googleusercontent.com/IiCTqE_rB6y1nQlZ-AJIQA0_vyX2V0bjp0KyeSg0X12OVCE6odidw_yFf-YyYjUY0cye" alt="Logo" className="w-full h-full object-cover scale-[1.15]" referrerPolicy="no-referrer" />
          </div>
          <h1 className="text-2xl font-bold">Admin Login</h1>
          <p className="text-blue-100 mt-2">Access your dashboard securely</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded text-sm font-medium border border-red-100 text-center">
              {error}
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <label className="sm:w-[90px] shrink-0 text-sm font-bold text-slate-800">User Email</label>
            <div className="relative w-full">
              <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                required
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#f8f9fa] border border-slate-300 rounded focus:ring-2 focus:ring-[#428bca] focus:border-[#428bca] outline-none transition-all text-slate-700"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <label className="sm:w-[90px] shrink-0 text-sm font-bold text-slate-800">Password</label>
            <div className="relative w-full">
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-[#f8f9fa] border border-slate-300 rounded focus:ring-2 focus:ring-[#428bca] focus:border-[#428bca] outline-none transition-all text-slate-700"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 cursor-pointer"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="flex justify-center pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="px-8 py-2.5 bg-[#428bca] text-white font-bold rounded hover:bg-[#3071a9] transition-all flex items-center justify-center gap-2 disabled:opacity-70 w-fit cursor-pointer"
            >
              {isLoading ? <Loader2 className="animate-spin" size={18} /> : (
                <>
                  <LogIn size={18} />
                  Log in
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
