import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, onSnapshot } from "firebase/firestore";
import logo from "../assets/Clanopia.png";

const initialState = { email: "", password: "" };

const backgroundImages = [
  "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1556761175-4b46a572b786?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&h=600&fit=crop",
];

const Login = () => {
  const [input, setInput] = useState(initialState);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [themeMode, setThemeMode] = useState(() => {
    const savedTheme = localStorage.getItem("themeMode");
    return savedTheme || "light";
  });
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [isResetLoading, setIsResetLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % backgroundImages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      const savedTheme = localStorage.getItem("themeMode");
      if (savedTheme) {
        setThemeMode(savedTheme);
      }
      return;
    }

    const settingsRef = doc(db, "users", currentUser.uid, "settings", "data");
    const unsubscribe = onSnapshot(settingsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.theme && data.theme.mode) {
          localStorage.setItem("themeMode", data.theme.mode);
          setThemeMode(data.theme.mode);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const getBgColor = () => themeMode === "light" ? "bg-gray-50" : "bg-[#1e1e1f]";
  const getCardBg = () => themeMode === "light" ? "bg-white" : "bg-[#222223]";
  const getCardBgAlt = () => themeMode === "light" ? "bg-gray-100" : "bg-[#252527]";
  const getBorderColor = () => themeMode === "light" ? "border-gray-200" : "border-[#2c2d2e]";
  const getTextColor = () => themeMode === "light" ? "text-gray-900" : "text-white";
  const getSecondaryTextColor = () => themeMode === "light" ? "text-gray-600" : "text-gray-400";
  const getInputBg = () => themeMode === "light" ? "bg-gray-100" : "bg-[#252527]";
  const getInputBorder = () => themeMode === "light" ? "border-gray-300" : "border-[#2c2d2e]";
  const getInputFocus = () => themeMode === "light" 
    ? "focus:ring-blue-500 focus:border-blue-500" 
    : "focus:ring-blue-500 focus:border-blue-500";
  const getGradientBg = () => themeMode === "light"
    ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
    : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700";
  const getErrorBg = () => themeMode === "light"
    ? "bg-red-50 text-red-600 border-red-200"
    : "bg-red-900/30 text-red-200 border-red-800/50";
  const getSuccessBg = () => themeMode === "light"
    ? "bg-green-50 text-green-600 border-green-200"
    : "bg-green-900/30 text-green-200 border-green-800/50";
  const getGoogleBtnBg = () => themeMode === "light"
    ? "bg-white hover:bg-gray-50 text-gray-800 border-gray-300"
    : "bg-white hover:bg-gray-100 text-gray-800 border-gray-300";

  const toggleTheme = () => {
    const newTheme = themeMode === "light" ? "dark" : "light";
    setThemeMode(newTheme);
    localStorage.setItem("themeMode", newTheme);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInput((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!input.email || !input.password) {
      setError("Please fill in all fields.");
      setIsLoading(false);
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, input.email, input.password);
      navigate("/Home");
    } catch (err) {
      setError("Failed to log in. Please check your credentials.");
      console.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setIsLoading(true);
    
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      navigate("/Home");
    } catch (err) {
      setError("Failed to sign in with Google. Please try again.");
      console.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ دالة إعادة تعيين كلمة المرور
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetMessage("");
    setError("");

    if (!resetEmail) {
      setResetMessage("Please enter your email address.");
      return;
    }

    setIsResetLoading(true);

    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetMessage("✅ Password reset email has been sent! Please check your inbox.");
      setResetEmail("");
      
      // إغلاق المودال بعد 3 ثواني
      setTimeout(() => {
        setShowResetModal(false);
        setResetMessage("");
      }, 3000);
    } catch (err) {
      console.error("Reset error:", err);
      if (err.code === 'auth/user-not-found') {
        setResetMessage("❌ No account found with this email address.");
      } else if (err.code === 'auth/too-many-requests') {
        setResetMessage("❌ Too many requests. Please try again later.");
      } else {
        setResetMessage("❌ Failed to send reset email. Please try again.");
      }
    } finally {
      setIsResetLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex ${getBgColor()} transition-colors duration-300`}>
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 lg:p-8">
        <div className="w-full max-w-md">
          <div className={`${getCardBg()} rounded-2xl shadow-2xl overflow-hidden border ${getBorderColor()} transition-colors duration-300`}>
            <div className="p-8">
              <div className="flex justify-end mb-4">
                <button
                  onClick={toggleTheme}
                  className={`p-2 rounded-full transition-all duration-300 ${
                    themeMode === "light"
                      ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      : "bg-[#252527] text-yellow-400 hover:bg-[#2c2d2e]"
                  }`}
                  aria-label="Toggle theme"
                >
                  {themeMode === "light" ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  )}
                </button>
              </div>

              <div className="text-center mb-8">
                <img src={logo} alt="Clanopia" className="w-32 mx-auto mb-4" />
                <h1 className={`text-3xl font-bold ${getTextColor()} mb-2 transition-colors duration-300`}>
                  Welcome Back
                </h1>
                <p className={`${getSecondaryTextColor()} transition-colors duration-300`}>
                  Sign in to continue to your account
                </p>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className={`block text-sm font-medium ${getSecondaryTextColor()} mb-2 transition-colors duration-300`}>
                    Email Address
                  </label>
                  <input
                    className={`w-full px-4 py-3 ${getInputBg()} border ${getInputBorder()} rounded-xl focus:outline-none focus:ring-2 ${getInputFocus()} ${getTextColor()} placeholder-gray-400 transition-all duration-300`}
                    type="email"
                    placeholder="Enter your email"
                    value={input.email}
                    autoComplete="off"
                    onChange={handleChange}
                    name="email"
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium ${getSecondaryTextColor()} mb-2 transition-colors duration-300`}>
                    Password
                  </label>
                  <input
                    className={`w-full px-4 py-3 ${getInputBg()} border ${getInputBorder()} rounded-xl focus:outline-none focus:ring-2 ${getInputFocus()} ${getTextColor()} placeholder-gray-400 transition-all duration-300`}
                    type="password"
                    placeholder="Enter your password"
                    value={input.password}
                    autoComplete="off"
                    onChange={handleChange}
                    name="password"
                  />
                </div>
                
                {error && (
                  <div className={`${getErrorBg()} p-3 rounded-xl text-sm border flex items-center transition-colors duration-300`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                  </div>
                )}
                
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full ${getGradientBg()} text-white font-semibold py-3.5 rounded-xl transition-all duration-200 shadow-lg hover:shadow-blue-500/20 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed`}
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </button>
              </form>
              
              {/* ✅ رابط "Forgot Password" */}
              <div className="text-right mt-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowResetModal(true);
                    setResetMessage("");
                    setResetEmail("");
                  }}
                  className={`text-sm ${getSecondaryTextColor()} hover:text-blue-400 transition-colors duration-200`}
                >
                  Forgot Password?
                </button>
              </div>
              
              <div className="relative my-7">
                <div className="absolute inset-0 flex items-center">
                  <div className={`w-full border-t ${getBorderColor()}`}></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className={`px-3 ${getCardBg()} ${getSecondaryTextColor()} transition-colors duration-300`}>
                    Or continue with
                  </span>
                </div>
              </div>
              
              <button
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className={`w-full ${getGoogleBtnBg()} font-medium py-3.5 rounded-xl transition-all duration-200 shadow-md border flex items-center justify-center`}
              >
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" width="24" height="24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign in with Google
              </button>
              
              <div className="mt-7 text-center text-sm">
                <span className={getSecondaryTextColor()}>
                  Don't have an account?{" "}
                </span>
                <a href="/signup" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                  Sign up now
                </a>
              </div>
            </div>
            
            <div className={`${getCardBgAlt()} p-6 text-center border-t ${getBorderColor()} transition-colors duration-300`}>
              <h2 className={`text-lg font-semibold ${getTextColor()} mb-1`}>Clanopia</h2>
              <p className={`${getSecondaryTextColor()} text-sm`}>The largest team building platform</p>
            </div>
          </div>
        </div>
      </div>

      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 to-indigo-900/80 z-10"></div>
        
        {backgroundImages.map((img, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentImageIndex ? "opacity-100" : "opacity-0"
            }`}
          >
            <img
              src={img}
              alt={`Slide ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
        
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-white p-12 text-center">
          <div className="max-w-lg">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h2 className="text-4xl font-bold mb-4">Welcome to Clanopia</h2>
            <p className="text-lg text-white/80 mb-8">
              The ultimate platform for building teams, joining communities, and collaborating on projects.
            </p>
            <div className="flex gap-2 justify-center">
              {backgroundImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentImageIndex ? "w-8 bg-white" : "w-2 bg-white/40 hover:bg-white/60"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ✅ مودال إعادة تعيين كلمة المرور */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`${getCardBg()} rounded-2xl max-w-md w-full p-8 border ${getBorderColor()} shadow-2xl transition-colors duration-300`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-2xl font-bold ${getTextColor()}`}>
                Reset Password
              </h2>
              <button
                onClick={() => {
                  setShowResetModal(false);
                  setResetMessage("");
                  setResetEmail("");
                }}
                className={`p-2 rounded-full hover:${getCardBgAlt()} transition-colors duration-200`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className={`${getSecondaryTextColor()} text-sm mb-6`}>
              Enter your email address and we'll send you a link to reset your password.
            </p>

            <form onSubmit={handleResetPassword}>
              <div className="mb-6">
                <label className={`block text-sm font-medium ${getSecondaryTextColor()} mb-2`}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className={`w-full px-4 py-3 ${getInputBg()} border ${getInputBorder()} rounded-xl focus:outline-none focus:ring-2 ${getInputFocus()} ${getTextColor()} placeholder-gray-400 transition-all duration-300`}
                  placeholder="Enter your email address"
                  autoFocus
                />
              </div>

              {resetMessage && (
                <div className={`p-3 rounded-xl text-sm border mb-4 flex items-center ${
                  resetMessage.includes('✅') 
                    ? getSuccessBg() 
                    : getErrorBg()
                }`}>
                  <span>{resetMessage}</span>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowResetModal(false);
                    setResetMessage("");
                    setResetEmail("");
                  }}
                  className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all duration-200 border ${getBorderColor()} ${getSecondaryTextColor()} hover:${getCardBgAlt()}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isResetLoading}
                  className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all duration-200 ${getGradientBg()} text-white shadow-lg hover:shadow-blue-500/20 disabled:opacity-70 disabled:cursor-not-allowed`}
                >
                  {isResetLoading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending...
                    </span>
                  ) : (
                    "Send Reset Link"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;