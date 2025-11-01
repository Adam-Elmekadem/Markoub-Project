import { useState } from 'react';
import { User, Mail, Lock, Eye, EyeOff, Github, Phone, MapPin, Building2, Calendar, IdCard, Car, Hash, ChevronRight, ChevronLeft } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from './Toast';
import { Spinner } from './Spinner';

export const SignIn = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register } = useAuth();
  const { showToast } = useToast();
  const [isSignUp, setIsSignUp] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    birthday: '',
    gender: '',
    address: '',
    city: '',
    email: '',
    password: '',
    confirmPassword: '',
    isDriver: false,
    licenseNumber: '',
    vehicleModel: '',
    vehicleNumber: '',
    vehicleColor: '',
    vehicleYear: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const patterns = {
    vehicleNumber: /^[A-Z0-9]{4,12}$/i,
    vehicleModel: /^[a-zA-Z0-9\s]{2,50}$/,
    licenseNumber: /^[A-Za-z0-9-]{5,20}$/,
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsSubmitting(true);
      await login({ email: 'user@gmail.com', password: 'oauth', name: 'Google User' });
      showToast('Successfully signed in with Google!', 'success');
      const redirectTo = location.state?.from || '/';
      navigate(redirectTo, { replace: true });
    } catch (e) {
      showToast('Failed to sign in with Google', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGithubSignIn = async () => {
    try {
      setIsSubmitting(true);
      await login({ email: 'user@github.com', password: 'oauth', name: 'GitHub User' });
      showToast('Successfully signed in with GitHub!', 'success');
      const redirectTo = location.state?.from || '/';
      navigate(redirectTo, { replace: true });
    } catch (e) {
      showToast('Failed to sign in with GitHub', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleDriverToggle = (e) => {
    const checked = e.target.checked;
    setFormData(prev => ({
      ...prev,
      isDriver: checked,
      ...(checked ? {} : { licenseNumber: '', vehicleModel: '', vehicleNumber: '', vehicleColor: '' })
    }));
    setErrors(prev => ({ ...prev, licenseNumber: '', vehicleModel: '', vehicleNumber: '', vehicleColor: '' }));
  };

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.firstName.trim()) {
        newErrors.firstName = 'First name is required';
      } else if (formData.firstName.trim().length < 2) {
        newErrors.firstName = 'First name must be at least 2 characters';
      } else if (!/^[a-zA-Z\s]+$/.test(formData.firstName)) {
        newErrors.firstName = 'First name can only contain letters';
      }

      if (!formData.lastName.trim()) {
        newErrors.lastName = 'Last name is required';
      } else if (formData.lastName.trim().length < 2) {
        newErrors.lastName = 'Last name must be at least 2 characters';
      } else if (!/^[a-zA-Z\s]+$/.test(formData.lastName)) {
        newErrors.lastName = 'Last name can only contain letters';
      }

      if (!formData.phone.trim()) {
        newErrors.phone = 'Phone number is required';
      } else if (!/^\+?[\d\s\-()]{10,}$/.test(formData.phone)) {
        newErrors.phone = 'Please enter a valid phone number';
      }

      if (!formData.birthday) {
        newErrors.birthday = 'Birthday is required';
      } else {
        const birthDate = new Date(formData.birthday);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        const isOver18 = age > 18 || (age === 18 && monthDiff >= 0);
        
        if (!isOver18) {
          newErrors.birthday = 'You must be at least 18 years old';
        }
      }

      // Optional gender validation
      if (formData.gender && !['male','female','other'].includes(formData.gender)) {
        newErrors.gender = 'Please select a valid gender option';
      }

      if (!formData.address.trim()) {
        newErrors.address = 'Address is required';
      } else if (formData.address.trim().length < 5) {
        newErrors.address = 'Please enter a complete address';
      }

      if (!formData.city.trim()) {
        newErrors.city = 'City is required';
      } else if (formData.city.trim().length < 2) {
        newErrors.city = 'Please enter a valid city name';
      } else if (!/^[a-zA-Z\s]+$/.test(formData.city)) {
        newErrors.city = 'City name can only contain letters';
      }

      if (!formData.email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }

      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
        newErrors.password = 'Password must contain uppercase, lowercase, and number';
      }

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    if (step === 2 && formData.isDriver) {
      if (!formData.licenseNumber.trim()) {
        newErrors.licenseNumber = 'License number is required for drivers';
      } else if (!patterns.licenseNumber.test(formData.licenseNumber)) {
        newErrors.licenseNumber = 'Invalid license format (5-20 alphanumeric)';
      }

      if (!formData.vehicleModel.trim()) {
        newErrors.vehicleModel = 'Vehicle model is required for drivers';
      } else if (!patterns.vehicleModel.test(formData.vehicleModel)) {
        newErrors.vehicleModel = 'Invalid vehicle model (2-50 characters)';
      }

      if (!formData.vehicleNumber.trim()) {
        newErrors.vehicleNumber = 'Vehicle number is required for drivers';
      } else if (!patterns.vehicleNumber.test(formData.vehicleNumber)) {
        newErrors.vehicleNumber = 'Invalid vehicle number (e.g., PB10XX1234)';
      }

      if (!formData.vehicleColor.trim()) {
        newErrors.vehicleColor = 'Vehicle color is required for drivers';
      } else if (!/^[a-zA-Z\s]{3,30}$/.test(formData.vehicleColor)) {
        newErrors.vehicleColor = 'Enter a valid color name (letters only)';
      }

      // Vehicle year validation: 4 digits, reasonable range
      if (!formData.vehicleYear.trim()) {
        newErrors.vehicleYear = 'Vehicle year is required for drivers';
      } else if (!/^[0-9]{4}$/.test(formData.vehicleYear)) {
        newErrors.vehicleYear = 'Enter a valid 4-digit year';
      } else {
        const year = parseInt(formData.vehicleYear, 10);
        const current = new Date().getFullYear();
        if (year < 1900 || year > current + 1) {
          newErrors.vehicleYear = `Enter a realistic year between 1900 and ${current + 1}`;
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (validateStep(currentStep)) {
      if (formData.isDriver && currentStep === 1) {
        setCurrentStep(2);
      } else {
        handleFinalSubmit();
      }
    } else {
      showToast('Please fill in all required fields correctly', 'error');
    }
  };

  const handleBack = () => {
    setCurrentStep(1);
    setErrors({});
  };

  const handleFinalSubmit = async () => {
    try {
      setIsSubmitting(true);
      await register(formData);

      setFormData({
        firstName: '',
        lastName: '',
        phone: '',
        birthday: '',
        gender: '',
        address: '',
        city: '',
        email: '',
        password: '',
        confirmPassword: '',
        isDriver: false,
        licenseNumber: '',
        vehicleModel: '',
        vehicleNumber: '',
        vehicleColor: '',
        vehicleYear: ''
      });
      setErrors({});
      setCurrentStep(1);

      showToast('Account created successfully!', 'success');

      const redirectTo = location.state?.from || '/';
      navigate(redirectTo, { replace: true });
    } catch (err) {
      showToast(err?.message || 'Registration failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateLoginForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSignUp) {
      handleContinue();
      return;
    }

    if (!validateLoginForm()) return;

    try {
      setIsSubmitting(true);
      await login({ email: formData.email, password: formData.password });

      setFormData({
        firstName: '',
        lastName: '',
        phone: '',
        birthday: '',
        gender: '',
        address: '',
        city: '',
        email: '',
        password: '',
        confirmPassword: '',
        isDriver: false,
        licenseNumber: '',
        vehicleModel: '',
        vehicleNumber: '',
        vehicleColor: '',
        vehicleYear: ''
      });
      setErrors({});

      showToast('Welcome back!', 'success');

      const redirectTo = location.state?.from || '/';
      navigate(redirectTo, { replace: true });
    } catch (err) {
      showToast(err?.message || 'Authentication failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="signin" className="py-16 md:py-24 bg-gray-50 min-h-screen flex items-center">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-6 items-start">
          <div className="rounded-2xl bg-linear-to-br from-blue-700 to-blue-600 text-white p-6 md:p-8 shadow-xl border border-blue-600">
            <h2 className="text-2xl md:text-3xl font-extrabold mb-3">Welcome to MARKOUB</h2>
            <p className="text-blue-100 text-sm md:text-base mb-4">Fast, safe, and affordable rides. Join our community and start your journey today.</p>
            <ul className="space-y-2 text-sm md:text-base text-blue-50">
              <li className="flex items-start gap-2"><span className="mt-0.5">•</span> Find and offer rides with ease</li>
              <li className="flex items-start gap-2"><span className="mt-0.5">•</span> Verified drivers and ratings</li>
              <li className="flex items-start gap-2"><span className="mt-0.5">•</span> Real-time filters and preferences</li>
            </ul>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 md:p-8">
            <div className="mb-6">
              <h1 className="text-2xl md:text-3xl font-bold text-blue-700">
                {isSignUp ? 'Create Account' : 'Welcome Back'}
              </h1>
              <p className="text-slate-600 text-sm mt-1">
                {isSignUp ? 'Join MARKOUB to start your journey' : 'Sign in to continue your journey'}
              </p>
            </div>

            <div className="space-y-3 mb-6">
              <button
                type="button"
                onClick={handleGoogleSignIn}
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
                onClick={handleGithubSignIn}
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
              {isSignUp && formData.isDriver && (
                <div className="flex items-center justify-center gap-2 mb-6">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep >= 1 ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-500'} font-semibold text-sm`}>
                    1
                  </div>
                  <div className={`h-1 w-12 ${currentStep >= 2 ? 'bg-blue-700' : 'bg-slate-200'}`}></div>
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep >= 2 ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-500'} font-semibold text-sm`}>
                    2
                  </div>
                </div>
              )}

              {isSignUp && currentStep === 1 && (
                <>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">First Name *</label>
                      <div className="relative">
                        <User className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          placeholder="Enter first name"
                          className={`w-full pl-10 pr-3 py-3 rounded-lg bg-white text-slate-900 placeholder-slate-400 border ${errors.firstName ? 'border-red-500' : 'border-slate-300'} focus:outline-none focus:ring-2 ${errors.firstName ? 'focus:ring-red-500' : 'focus:ring-blue-500'}`}
                        />
                      </div>
                      {errors.firstName && <p className="mt-1 text-xs text-red-600">{errors.firstName}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Last Name *</label>
                      <div className="relative">
                        <User className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          placeholder="Enter last name"
                          className={`w-full pl-10 pr-3 py-3 rounded-lg bg-white text-slate-900 placeholder-slate-400 border ${errors.lastName ? 'border-red-500' : 'border-slate-300'} focus:outline-none focus:ring-2 ${errors.lastName ? 'focus:ring-red-500' : 'focus:ring-blue-500'}`}
                        />
                      </div>
                      {errors.lastName && <p className="mt-1 text-xs text-red-600">{errors.lastName}</p>}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number *</label>
                      <div className="relative">
                        <Phone className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="Enter phone number"
                          className={`w-full pl-10 pr-3 py-3 rounded-lg bg-white text-slate-900 placeholder-slate-400 border ${errors.phone ? 'border-red-500' : 'border-slate-300'} focus:outline-none focus:ring-2 ${errors.phone ? 'focus:ring-red-500' : 'focus:ring-blue-500'}`}
                        />
                      </div>
                      {errors.phone ? <p className="mt-1 text-xs text-red-600">{errors.phone}</p> : <p className="mt-1 text-xs text-slate-500">Include country code.</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Birthday *</label>
                      <div className="relative">
                        <Calendar className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="date"
                          name="birthday"
                          value={formData.birthday}
                          onChange={handleInputChange}
                          className={`w-full pl-10 pr-3 py-3 rounded-lg bg-white text-slate-900 placeholder-slate-400 border ${errors.birthday ? 'border-red-500' : 'border-slate-300'} focus:outline-none focus:ring-2 ${errors.birthday ? 'focus:ring-red-500' : 'focus:ring-blue-500'}`}
                        />
                      </div>
                      {errors.birthday ? <p className="mt-1 text-xs text-red-600">{errors.birthday}</p> : <p className="mt-1 text-xs text-slate-500">You must be 18+ to register.</p>}
                    </div>
                  </div>

                  {/* Gender (optional) */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Gender (optional)</label>
                    <div className="relative">
                      <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleInputChange}
                        className={`w-full pr-3 pl-3 py-3 rounded-lg bg-white text-slate-900 border ${errors.gender ? 'border-red-500' : 'border-slate-300'} focus:outline-none focus:ring-2 ${errors.gender ? 'focus:ring-red-500' : 'focus:ring-blue-500'}`}
                      >
                        <option value="">Select gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    {errors.gender && <p className="mt-1 text-xs text-red-600">{errors.gender}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Address *</label>
                    <div className="relative">
                      <MapPin className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        placeholder="Enter your address"
                        className={`w-full pl-10 pr-3 py-3 rounded-lg bg-white text-slate-900 placeholder-slate-400 border ${errors.address ? 'border-red-500' : 'border-slate-300'} focus:outline-none focus:ring-2 ${errors.address ? 'focus:ring-red-500' : 'focus:ring-blue-500'}`}
                      />
                    </div>
                    {errors.address ? <p className="mt-1 text-xs text-red-600">{errors.address}</p> : <p className="mt-1 text-xs text-slate-500">Street address or area.</p>}
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">City *</label>
                      <div className="relative">
                        <Building2 className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          placeholder="Enter your city"
                          className={`w-full pl-10 pr-3 py-3 rounded-lg bg-white text-slate-900 placeholder-slate-400 border ${errors.city ? 'border-red-500' : 'border-slate-300'} focus:outline-none focus:ring-2 ${errors.city ? 'focus:ring-red-500' : 'focus:ring-blue-500'}`}
                        />
                      </div>
                      {errors.city ? <p className="mt-1 text-xs text-red-600">{errors.city}</p> : <p className="mt-1 text-xs text-slate-500">Your current city.</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
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
                      {errors.email ? <p className="mt-1 text-xs text-red-600">{errors.email}</p> : <p className="mt-1 text-xs text-slate-500">We'll send verification here.</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Password *</label>
                    <div className="relative">
                      <Lock className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPwd ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="Create a password"
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
                    {errors.password ? (
                      <p className="mt-1 text-xs text-red-600">{errors.password}</p>
                    ) : (
                      <p className="mt-1 text-xs text-slate-500">At least 8 characters with uppercase, lowercase, and number.</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password *</label>
                    <div className="relative">
                      <Lock className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type={showConfirmPwd ? 'text' : 'password'}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        placeholder="Confirm your password"
                        className={`w-full pl-10 pr-10 py-3 rounded-lg bg-white text-slate-900 placeholder-slate-400 border ${errors.confirmPassword ? 'border-red-500' : 'border-slate-300'} focus:outline-none focus:ring-2 ${errors.confirmPassword ? 'focus:ring-red-500' : 'focus:ring-blue-500'}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                        className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600"
                      >
                        {showConfirmPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {errors.confirmPassword ? (
                      <p className="mt-1 text-xs text-red-600">{errors.confirmPassword}</p>
                    ) : (
                      <p className="mt-1 text-xs text-slate-500">Must match the password above.</p>
                    )}
                  </div>

                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                    <label className="flex items-center gap-3 text-slate-700 font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isDriver}
                        onChange={handleDriverToggle}
                        className="w-5 h-5 rounded border-slate-300 text-blue-700 focus:ring-blue-500"
                      />
                      <span>I'm a driver (register to offer rides)</span>
                    </label>
                    {formData.isDriver && (
                      <p className="mt-2 text-xs text-slate-600 ml-8">
                        You'll need to provide vehicle and license details in the next step.
                      </p>
                    )}
                  </div>

                  <label className="flex items-start gap-3 text-sm text-slate-600">
                    <input type="checkbox" className="mt-1 w-4 h-4 rounded border-slate-300 bg-white text-blue-700 focus:ring-blue-500" required />
                    <span>
                      I agree to the{' '}
                      <a href="#" className="text-orange-600 hover:underline">Terms of Service</a>{' '}and{' '}
                      <a href="#" className="text-orange-600 hover:underline">Privacy Policy</a>
                    </span>
                  </label>
                </>
              )}

              {isSignUp && currentStep === 2 && formData.isDriver && (
                <>
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-blue-700 mb-1">Vehicle & License Information</h3>
                    <p className="text-sm text-slate-600">Complete your driver profile to start offering rides.</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Driving License Number *</label>
                    <div className="relative">
                      <IdCard className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        name="licenseNumber"
                        value={formData.licenseNumber}
                        onChange={handleInputChange}
                        placeholder="Enter license number"
                        className={`w-full pl-10 pr-3 py-3 rounded-lg bg-white text-slate-900 placeholder-slate-400 border ${errors.licenseNumber ? 'border-red-500' : 'border-slate-300'} focus:outline-none focus:ring-2 ${errors.licenseNumber ? 'focus:ring-red-500' : 'focus:ring-blue-500'}`}
                      />
                    </div>
                    {errors.licenseNumber ? (
                      <p className="mt-1 text-xs text-red-600">{errors.licenseNumber}</p>
                    ) : (
                      <p className="mt-1 text-xs text-slate-500">As printed on your license (5-20 characters).</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Vehicle Model *</label>
                    <div className="relative">
                      <Car className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        name="vehicleModel"
                        value={formData.vehicleModel}
                        onChange={handleInputChange}
                        placeholder="e.g., Honda City 2020"
                        className={`w-full pl-10 pr-3 py-3 rounded-lg bg-white text-slate-900 placeholder-slate-400 border ${errors.vehicleModel ? 'border-red-500' : 'border-slate-300'} focus:outline-none focus:ring-2 ${errors.vehicleModel ? 'focus:ring-red-500' : 'focus:ring-blue-500'}`}
                      />
                    </div>
                    {errors.vehicleModel ? (
                      <p className="mt-1 text-xs text-red-600">{errors.vehicleModel}</p>
                    ) : (
                      <p className="mt-1 text-xs text-slate-500">Make and model of your vehicle.</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Vehicle Color *</label>
                    <div className="relative">
                      <div className="w-5 h-5 rounded-full border border-slate-300 absolute left-3 top-1/2 -translate-y-1/2 bg-white" style={{ backgroundColor: formData.vehicleColor?.toLowerCase() || 'white' }} />
                      <input
                        type="text"
                        name="vehicleColor"
                        value={formData.vehicleColor}
                        onChange={(e) => handleInputChange({ target: { name: 'vehicleColor', value: e.target.value } })}
                        placeholder="e.g., Black, White, Red"
                        className={`w-full pl-10 pr-3 py-3 rounded-lg bg-white text-slate-900 placeholder-slate-400 border ${errors.vehicleColor ? 'border-red-500' : 'border-slate-300'} focus:outline-none focus:ring-2 ${errors.vehicleColor ? 'focus:ring-red-500' : 'focus:ring-blue-500'}`}
                      />
                    </div>
                    {errors.vehicleColor ? (
                      <p className="mt-1 text-xs text-red-600">{errors.vehicleColor}</p>
                    ) : (
                      <p className="mt-1 text-xs text-slate-500">Primary exterior color of your vehicle.</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Vehicle Year *</label>
                    <div className="relative">
                      <input
                        type="text"
                        name="vehicleYear"
                        value={formData.vehicleYear}
                        onChange={(e) => handleInputChange({ target: { name: 'vehicleYear', value: e.target.value } })}
                        placeholder="e.g., 2020"
                        className={`w-full pl-3 pr-3 py-3 rounded-lg bg-white text-slate-900 placeholder-slate-400 border ${errors.vehicleYear ? 'border-red-500' : 'border-slate-300'} focus:outline-none focus:ring-2 ${errors.vehicleYear ? 'focus:ring-red-500' : 'focus:ring-blue-500'}`}
                      />
                    </div>
                    {errors.vehicleYear ? (
                      <p className="mt-1 text-xs text-red-600">{errors.vehicleYear}</p>
                    ) : (
                      <p className="mt-1 text-xs text-slate-500">Year of manufacture (4 digits).</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Vehicle Number *</label>
                    <div className="relative">
                      <Hash className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        name="vehicleNumber"
                        value={formData.vehicleNumber}
                        onChange={(e) => handleInputChange({ target: { name: 'vehicleNumber', value: e.target.value.toUpperCase() } })}
                        placeholder="e.g., PB10XX1234"
                        className={`w-full pl-10 pr-3 py-3 rounded-lg bg-white text-slate-900 placeholder-slate-400 border ${errors.vehicleNumber ? 'border-red-500' : 'border-slate-300'} focus:outline-none focus:ring-2 ${errors.vehicleNumber ? 'focus:ring-red-500' : 'focus:ring-blue-500'}`}
                      />
                    </div>
                    {errors.vehicleNumber ? (
                      <p className="mt-1 text-xs text-red-600">{errors.vehicleNumber}</p>
                    ) : (
                      <p className="mt-1 text-xs text-slate-500">License plate number (4-12 alphanumeric).</p>
                    )}
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleBack}
                      className="flex-1 flex items-center justify-center gap-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold py-3 rounded-lg transition-colors"
                      disabled={isSubmitting}
                    >
                      <ChevronLeft className="w-5 h-5" />
                      Back
                    </button>
                    <button
                      type="submit"
                      className="flex-1 flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 rounded-lg transition-colors"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Spinner className="w-4 h-4" />
                          <span>Creating...</span>
                        </>
                      ) : (
                        <>
                          Create Account
                          <ChevronRight className="w-5 h-5" />
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}

              {!isSignUp && (
                <>
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
                    {errors.password ? (
                      <p className="mt-1 text-xs text-red-600">{errors.password}</p>
                    ) : (
                      <div className="text-right mt-1">
                        <a href="#" className="text-sm text-blue-700 hover:underline">Forgot password?</a>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 rounded-lg shadow-md transition-colors"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Spinner className="w-4 h-4" />
                        <span>Signing in...</span>
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </button>
                </>
              )}

              {isSignUp && currentStep === 1 && (
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 rounded-lg shadow-md transition-colors"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Spinner className="w-4 h-4" />
                      <span>{formData.isDriver ? 'Continuing...' : 'Creating...'}</span>
                    </>
                  ) : (
                    formData.isDriver ? (
                      <>
                        Continue to Vehicle Details
                        <ChevronRight className="w-5 h-5" />
                      </>
                    ) : (
                      'Create Account'
                    )
                  )}
                </button>
              )}
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-slate-600">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setCurrentStep(1);
                    setErrors({});
                  }}
                  className="text-blue-700 font-semibold hover:underline"
                >
                  {isSignUp ? 'Sign In' : 'Sign Up'}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
