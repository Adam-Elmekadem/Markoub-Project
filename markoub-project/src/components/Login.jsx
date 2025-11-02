import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Github } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from './Toast';
import { Spinner } from './Spinner';

export const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { showToast } = useToast();
  const [showPwd, setShowPwd] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [remember, setRemember] = useState(true);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!formData.email.trim()) {
      errs.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errs.email = 'Enter a valid email';
    }

    if (!formData.password) {
      errs.password = 'Password is required';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      setIsSubmitting(true);
      await login({ email: formData.email, password: formData.password, remember });
      showToast('Welcome back!', 'success');
      const redirectTo = location.state?.from || '/';
      navigate(redirectTo, { replace: true });
    } catch (err) {
      showToast(err?.message || 'Login failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    try {
      setIsSubmitting(true);
      await login({ email: 'user@gmail.com', password: 'oauth', name: 'Google User', remember });
      showToast('Successfully signed in with Google!', 'success');
      const redirectTo = location.state?.from || '/';
      navigate(redirectTo, { replace: true });
    } catch {
      showToast('Failed to sign in with Google', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGithub = async () => {
    try {
      setIsSubmitting(true);
      await login({ email: 'user@github.com', password: 'oauth', name: 'GitHub User', remember });
      showToast('Successfully signed in with GitHub!', 'success');
      const redirectTo = location.state?.from || '/';
      navigate(redirectTo, { replace: true });
    } catch {
      showToast('Failed to sign in with GitHub', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <section className="py-16 md:py-24 bg-gray-50 min-h-screen flex items-center">
      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-blue-700 mb-2">Login</h1>
            <p className="text-slate-600">Welcome back! Sign in to continue</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 md:p-8">
            <div className="space-y-3 mb-6">
              <button
                type="button"
                onClick={handleGoogle}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-slate-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-slate-700"
                disabled={isSubmitting}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>

              <button
                type="button"
                onClick={handleGithub}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-slate-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-slate-700"
                disabled={isSubmitting}
              >
                <Github className="w-5 h-5" />
                Continue with GitHub
              </button>
            </div>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-slate-500">Or continue with email</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <div className="relative">
                  <Mail className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email"
                    className={`w-full pl-10 pr-3 py-3 rounded-lg bg-white text-slate-900 placeholder-slate-400 border ${errors.email ? 'border-red-500' : 'border-slate-300'} focus:outline-none focus:ring-2 ${errors.email ? 'focus:ring-red-500' : 'focus:ring-blue-500'}`}
                  />
                </div>
                {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPwd ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter your password"
                    className={`w-full pl-10 pr-10 py-3 rounded-lg bg-white text-slate-900 placeholder-slate-400 border ${errors.password ? 'border-red-500' : 'border-slate-300'} focus:outline-none focus:ring-2 ${errors.password ? 'focus:ring-red-500' : 'focus:ring-blue-500'}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <div className="text-right mt-1">
                  <a href="#" className="text-sm text-blue-700 hover:underline">Forgot password?</a>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 rounded-lg shadow-md transition-colors flex justify-center items-center gap-3"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Spinner className="w-4 h-4" />
                    <span>Login...</span>
                  </>
                ) : (
                  'Log In'
                )}
              </button>

              <div className="flex items-center justify-between text-sm mt-3">
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" className="form-checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                  <span>Remember me</span>
                </label>
                <a href="#" className="text-blue-700 hover:underline">Forgot password?</a>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
    </>
  );
};
