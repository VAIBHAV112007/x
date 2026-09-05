import React, { useState } from 'react';
import { Building2, Mail, Lock, UserPlus, LogIn, AlertCircle } from 'lucide-react';
import axios from 'axios';

export default function Auth({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);

  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [orgName, setOrgName] = useState('');
  const [orgType, setOrgType] = useState('Gov/Defense');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // PROTOTYPE BYPASS: Directly pass authentication
    if (isLogin) {
      onAuthSuccess({ email: email || 'demo@organization.gov', orgName: 'Demo Organization' });
    } else {
      onAuthSuccess({ email: email || 'demo@organization.gov', orgName: orgName || 'Demo Organization', orgType });
    }

    /*
    // --- Original Backend Auth Logic ---
    setErrorMsg('');
    setLoading(true);

    try {
      if (isLogin) {
        const res = await axios.post('https://x-u3ku.onrender.com/api/login', {
          email,
          password
        });
        if (res.data.status === 'success') {
          onAuthSuccess(res.data.user);
        }
      } else {
        const res = await axios.post('https://x-u3ku.onrender.com/api/register', {
          email,
          password,
          orgName,
          orgType
        });
        if (res.data.status === 'success') {
          onAuthSuccess({ email, orgName, orgType });
        }
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setErrorMsg(err.response.data.message);
      } else {
        setErrorMsg('Unable to connect to the server. Please try again.');
      }
    } finally {
      setLoading(false);
    }
    */
  };

  return (
    <div className="flex h-screen w-screen bg-slate-50 items-center justify-center font-sans">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-200/50 p-8 m-4">

        {/* Header */}
        <div className="flex flex-col items-center gap-4 mb-8">
          <div className="p-2 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100">
            <img src="/logo.png" alt="SagarDrishti Logo" className="w-24 h-24 object-contain mix-blend-multiply" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Sagar<span className="text-blue-600">Drishti</span>
            </h1>
            <p className="text-slate-500 font-medium text-xs tracking-wide uppercase mt-1">
              Organization Portal
            </p>
          </div>
        </div>

        {/* Toggle between Login and Register */}
        <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
          <button
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${isLogin ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => setIsLogin(true)}
            type="button"
          >
            Sign In
          </button>
          <button
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${!isLogin ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => setIsLogin(false)}
            type="button"
          >
            Register Org
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          {errorMsg && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {!isLogin && (
            <>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Organization Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building2 className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="e.g. Indian Navy, Port Authority"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Organization Type</label>
                <select
                  value={orgType}
                  onChange={(e) => setOrgType(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                >
                  <option>Gov/Defense</option>
                  <option>Commercial Port</option>
                  <option>Research Institute</option>
                  <option>Private Contractor</option>
                </select>
              </div>
            </>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Official Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="admin@organization.gov"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-2.5 rounded-lg shadow-md mt-2 flex items-center justify-center gap-2 transition-colors"
          >
            {loading ? (
              <span>Processing...</span>
            ) : isLogin ? (
              <><LogIn className="w-4 h-4" /> Secure Sign In</>
            ) : (
              <><UserPlus className="w-4 h-4" /> Register Organization</>
            )}
          </button>
        </form>

        {isLogin && (
          <div className="mt-6 text-center">
            <a href="#" className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors">
              Forgot your credentials?
            </a>
          </div>
        )}

      </div>
    </div>
  );
}
