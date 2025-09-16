import React, { useState } from 'react';
import { assets } from '../../assets/assets';
import { userLoginService } from '../../services/UserLogin/UserLoginService';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [emailOrUsername, setEmailOrUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const navigate = useNavigate();

    const handleLoginClick = async () => {
        setError(null);
        setLoading(true);
        try {
            const result = await userLoginService(emailOrUsername, password);
            console.log("Login successful:", result);

            // Save tokens and user data to localStorage
            localStorage.setItem('accessToken', result.accessToken);
            localStorage.setItem('refreshToken', result.refreshToken);
            localStorage.setItem('userLoggedIn', 'true');
            localStorage.setItem('userData', JSON.stringify(result.user)); // Save user data
            // Redirect to home page
            navigate('/');

        } catch (err) {
            console.error("Login failed:", err);
            setError(err.message || 'Đăng nhập thất bại');
        } finally {
            setLoading(false);
        }
    };

    // Placeholder functions for social/phone login
    const handleGoogleLogin = () => {
        console.log("Continue with Google clicked");
    };
    const handleFacebookLogin = () => {
        console.log("Continue with Facebook clicked");
    };
    const handleAppleLogin = () => {
        console.log("Continue with Apple clicked");
    };
    const handlePhoneLogin = () => {
        console.log("Continue with Phone clicked");
    };
    const handlePasswordChange = (e) => {
        setPassword(e.target.value);
    };

    return (
        <div className="flex flex-col items-center justify-start min-h-screen bg-black text-white py-8 px-4 sm:px-6 lg:px-8">
            {/* Spotify Logo */}
            <img className="w-10" src={assets.logoGreen} alt="Spotify Logo" />

            <div className="max-w-md w-full space-y-6 mt-8">
                <h2 className="text-center text-3xl font-bold text-white">
                    Đăng nhập vào Spotify
                </h2>

                {/* Social/Phone Login Options */}
                <div className="space-y-3">
                    {/* Google */}

                    {/* Apple */}
                    <button
                        type="button"
                        className="w-full flex items-center gap-25 py-2 px-4 border border-gray-600 rounded-full shadow-sm text-0.5xl font-extrabold text-gray-200 bg-black hover:shadow-lg hover:ring-[0.5px] hover:ring-white focus:outline-none focus:ring-[0.5px] focus:ring-white transition-all duration-100 cursor-pointer"
                    >
                        <img src={assets.google} alt="Apple" className="w-10 h-10" />
                        <span className=" font-extrabold text-gray-300 leading-none">Sign in with Apple</span>
                    </button>


                    {/* Apple */}
                    <button
                        type="button"
                        className="w-full flex items-center gap-25 py-2 px-4 border border-gray-600 rounded-full shadow-sm text-0.5xl font-extrabold text-gray-200 bg-black hover:shadow-lg hover:ring-[0.5px] hover:ring-white focus:outline-none focus:ring-[0.5px] focus:ring-white transition-all duration-100 cursor-pointer"
                    >
                        <img src={assets.fb} alt="Apple" className="w-10 h-10" />
                        <span className=" font-extrabold text-gray-300 leading-none">Sign in with Apple</span>
                    </button>

                    {/* Apple */}
                    <button
                        type="button"
                        className="w-full flex items-center gap-25 py-2 px-4 border border-gray-600 rounded-full shadow-sm text-0.5xl font-extrabold text-gray-200 bg-black hover:shadow-lg hover:ring-[0.5px] hover:ring-white focus:outline-none focus:ring-[0.5px] focus:ring-white transition-all duration-100 cursor-pointer"
                    >
                        <img src={assets.apple} alt="Apple" className="w-10 h-10" />
                        <span className=" font-extrabold text-gray-300 leading-none">Sign in with Apple</span>
                    </button>

                    {/* Phone Number */}
                    <button
                        type="button"
                        className="w-full flex items-center justify-center py-3 px-4 border border-gray-600 rounded-full shadow-sm text-0.5xl font-extrabold text-gray-300 bg-black hover:bg-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
                        onClick={handlePhoneLogin}
                    >
                        Sign in with Phone Number
                    </button>
                </div>

                {/* Divider */}
                <div className="flex items-center justify-between my-6">
                    <div className="flex-grow border-t border-gray-600"></div>
                    <span className="flex-shrink mx-4 text-gray-400 text-sm font-bold">hoặc</span>
                    <div className="flex-grow border-t border-gray-600"></div>
                </div>

                {/* Email/Username Login Form */}
                <div className="space-y-4">
                    <div>
                        <label htmlFor="email-or-username" className="block text-sm font-bold text-gray-300 mb-2">
                            Email hoặc tên người dùng
                        </label>
                        <input
                            id="email-or-username"
                            name="email-or-username"
                            type="text"
                            autoComplete="email" // or username depending on implementation
                            required
                            className="h-12 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-600 placeholder-gray-400 text-white bg-[#121212] focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                            placeholder="Email hoặc tên người dùng"
                            value={emailOrUsername}
                            onChange={(e) => setEmailOrUsername(e.target.value)}
                        />
                    </div>


                    <div className="relative">
                        <input
                            id="password"
                            name="password"
                            type="password"
                            required
                            className="h-12 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-600 placeholder-gray-400 text-white bg-[#121212] focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm pr-10"
                            placeholder="Password"
                            value={password}
                            onChange={handlePasswordChange}
                        />
                        {/* Password visibility toggle icon - Placeholder */}
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5">
                            {/* TODO: Add eye icon for password visibility toggle */}
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <p className="text-red-500 text-sm text-center">{error}</p>
                    )}

                    {/* Login Button */}
                    <div>
                        <button
                            type="button"
                            onClick={handleLoginClick}
                            disabled={!emailOrUsername || !password || loading}
                            className=" h-12 group relative w-full flex justify-center items-center py-2 px-4 border border-transparent text-sm font-bold rounded-full text-black bg-green-500 hover:bg-green-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors duration-200"
                        >
                            {loading ? 'Đang đăng nhập...' : 'Tiếp tục'}
                        </button>
                    </div>
                </div>

                {/* Divider for bottom link */}
                <div className="flex items-center justify-between mt-6 mb-4">
                    <div className="flex-grow border-t border-gray-700"></div>
                    <div className="flex-grow border-t border-gray-700"></div>
                </div>

                {/* Sign up Link */}
                <div className="text-center">
                    <p className="text-sm text-gray-400">
                        Bạn chưa có tài khoản?{' '}
                        {/* TODO: Replace # with actual signup route */}
                        <a href="/signup" className="font-large text-white hover:underline">
                            Đăng ký Spotify.
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;