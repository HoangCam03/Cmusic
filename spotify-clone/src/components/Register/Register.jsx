import React, { useState } from 'react';
import { assets } from '../../assets/assets';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import { userRegisterService } from '../../services/UserSignUp/UserSignUp';
import { useNavigate } from 'react-router-dom';

// Giả định bạn có file assets chứa logo Spotify
// import spotifyLogo from '../../assets/spotify-logo.png'; // Điều chỉnh đường dẫn nếu cần

const Register = () => {
  const [step, setStep] = useState(1); // State để theo dõi bước hiện tại
  const [email, setEmail] = useState('');
  const [isEmailValid, setIsEmailValid] = useState(true);
  const [emailErrorMessage, setEmailErrorMessage] = useState('This email is invalid. Make sure it\'s written like example@email.com');

  const [password, setPassword] = useState('');
  // States for password validation criteria (example)
  const [hasLetter, setHasLetter] = useState(false);
  const [hasNumberOrSpecial, setHasNumberOrSpecial] = useState(false);
  const [isLongEnough, setIsLongEnough] = useState(false); // For 10 characters

  const [name, setName] = useState('');
  const [dobDay, setDobDay] = useState('');
  const [dobMonth, setDobMonth] = useState('');
  const [dobYear, setDobYear] = useState('');
  const [gender, setGender] = useState('');

  const [loading, setLoading] = useState(false); // State cho trạng thái loading
  const [error, setError] = useState(null); // State cho thông báo lỗi

  const navigate = useNavigate(); // Hook để điều hướng

  const handleEmailChange = (e) => {
    const inputEmail = e.target.value;
    setEmail(inputEmail);
    const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
    const isValid = emailRegex.test(inputEmail);
    setIsEmailValid(isValid);
    if (!isValid && inputEmail) {
      setEmailErrorMessage('This email is invalid. Make sure it\'s written like example@email.com');
    } else {
      setEmailErrorMessage(''); // Clear error message if valid or empty
    }
  };

  const handlePasswordChange = (e) => {
    const inputPassword = e.target.value;
    setPassword(inputPassword);
    // Update password validation states
    setHasLetter(/[a-zA-Z]/.test(inputPassword));
    setHasNumberOrSpecial(/[0-9!@#$%^&*()_+{}\[\]:;"'<>,.?/~`-]/.test(inputPassword));
    setIsLongEnough(inputPassword.length >= 10);
  };

  const handleNextClickEmail = () => {
    if (isEmailValid && email) { // Check if email is valid and not empty
      // TODO: Add logic to check if email is already registered on the backend
      // For now, just move to the next step
      setStep(2); // Move to password step
      console.log("Valid email, moving to step 2:", email);
    } else {
      // Error message is already handled by isEmailValid state and conditional rendering
      console.log("Invalid or empty email.");
    }
  };

  const handleNextClickPassword = () => {
    // Check password strength here if needed before proceeding
    if (hasLetter && hasNumberOrSpecial && isLongEnough) {
      setStep(3); // Move to profile step
      console.log("Valid password, moving to step 3");
    } else {
      console.log("Password does not meet criteria");
      // You might want to display a general password error message here
    }
  };

  const handleNextClickProfile = async () => {
    setError(null); // Clear previous errors
    setLoading(true); // Set loading to true

    // Kiểm tra lại các trường bắt buộc ở frontend trước khi gửi
    if (!name || !dobDay || !dobMonth || !dobYear || !gender) {
      setError('Please fill in all required fields.');
      setLoading(false);
      return; // Dừng hàm nếu thiếu trường
    }

    try {
      const userData = {
        email,
        password,
        username: name, // <-- Gán giá trị của state 'name' cho trường 'username'
        dateOfBirth: {
          day: parseInt(dobDay, 10), // Ensure these are numbers
          month: parseInt(dobMonth, 10), // Adjust if month is 0-indexed from select
          year: parseInt(dobYear, 10),
        },
        gender,
        // Backend của bạn cũng có trường displayName, nhưng frontend hiện tại
        // chỉ có một input cho tên. Nếu backend cần cả hai, bạn cần thêm input riêng.
        // Nếu bạn muốn displayName giống username, bạn có thể thêm displayName: name ở đây,
        // nhưng service backend hiện tại không dùng displayName từ payload.
        // Tạm thời chỉ gửi username theo yêu cầu của service backend.
      };

      const result = await userRegisterService(userData);
      console.log("Registration successful:", result);

      // Redirect to login page after successful registration
      navigate('/login');

    } catch (err) {
      console.error("Registration failed:", err);
      setError(err.message || 'Đăng ký thất bại'); // Set error message
    } finally {
      setLoading(false); // Set loading to false
    }
  };

  const handleBackClick = () => {
    setStep(prevStep => prevStep - 1);
    setError(null); // Clear error when going back
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="max-w-md w-full space-y-6 mt-8">
            <h2 className="mt-3 text-center text-5xl font-extrabold text-white ">
              Sign up to start listening
            </h2>

            {/* Email Input Section */}
            <div>
              <label
                htmlFor="email-address"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className={`h-12 appearance-none rounded-md relative block w-full px-3 py-2 border ${isEmailValid ? "border-gray-200" : "border-red-500"
                  } placeholder-gray-400 text-white bg-[#121212] focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm`}
                placeholder="name@domain.com"
                value={email}
                onChange={handleEmailChange}
              />
              {!isEmailValid &&
                email && ( // Chỉ hiển thị lỗi nếu email không hợp lệ và input không rỗng
                  <p className="mt-2 text-sm text-red-500">
                    <svg
                      className="inline w-4 h-4 mr-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                    {emailErrorMessage}
                  </p>
                )}
              {/* Link to use phone number - placeholder */}
              {isEmailValid && ( // Chỉ hiển thị nếu email hợp lệ
                <div className="mt-2 text-sm">
                  <a
                    href="#"
                    className="font-medium text-green-500 hover:text-green-400"
                  >
                    Use phone number instead.
                  </a>
                </div>
              )}
            </div>

            {/* Error Message for Step 1 (if any) */}
            {error && step === 1 && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}

            {/* Next Button */}
            <div>
              <button
                type="button"
                onClick={handleNextClickEmail}
                disabled={!email || !isEmailValid || loading} // Disable during loading
                className=" h-12 group relative w-full flex justify-center items-center py-2 px-4 border border-transparent text-sm font-medium rounded-full text-black bg-green-600 hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? 'Loading...' : 'Next'} {/* Show loading text */}
              </button>
            </div>

            {/* Divider */}
            <div className="flex items-center justify-between my-6">
              <div className="flex-grow border-t border-gray-600 "></div>
              <span className="flex-shrink mx-4 text-gray-400">or</span>
              <div className="flex-grow border-t border-gray-600"></div>
            </div>

            {/* Social Sign-up Options */}
            <div className="mt-6 space-y-3">
              {/* Google */}
              <button
                type="button"
                className="w-full flex justify-center items-center gap-x-4 py-2 px-4 border border-gray-600 rounded-full shadow-sm text-sm font-medium text-white bg-black hover:shadow-lg hover:ring-[0.5px] hover:ring-white focus:outline-none focus:ring-[0.5px] focus:ring-white transition-all duration-100 cursor-pointer"
                onClick={() => console.log('Google sign up')}
              >
                <img src={assets.google} alt="Google" className="w-6 h-6" />
                <span className="text-sm leading-none">Sign up with Google</span>
              </button>

              {/* Facebook */}
              <button
                type="button"
                className="w-full flex justify-center items-center gap-x-4 py-2 px-4 border border-gray-600 rounded-full shadow-sm text-sm font-medium text-white bg-black hover:shadow-lg hover:ring-[0.5px] hover:ring-white focus:outline-none focus:ring-[0.5px] focus:ring-white transition-all duration-100 cursor-pointer"
                onClick={() => console.log('Facebook sign up')}
              >
                <img src={assets.fb} alt="Facebook" className="w-6 h-6" />
                <span className="text-sm leading-none">Sign up with Facebook</span>
              </button>

              {/* Apple */}
              <button
                type="button"
                className="w-full flex justify-center items-center gap-x-4 py-2 px-4 border border-gray-600 rounded-full shadow-sm text-sm font-medium text-white bg-black hover:shadow-lg hover:ring-[0.5px] hover:ring-white focus:outline-none focus:ring-[0.5px] focus:ring-white transition-all duration-100 cursor-pointer"
                onClick={() => console.log('Apple sign up')}
              >
                <img src={assets.apple} alt="Apple" className="w-6 h-6" />
                <span className="text-sm leading-none">Sign up with Apple</span>
              </button>

            </div>
          </div>
        );

      case 2:
        return (
          <div className="max-w-md w-full space-y-6 mt-8">
            <div className="flex items-center justify-between">
              <button
                onClick={handleBackClick}
                className="text-gray-400 hover:text-white cursor-pointer"
              >
                <FontAwesomeIcon icon={faChevronLeft} className="w-5 h-5" />
              </button>
              <p className="text-sm text-gray-400">Step 2 of 3</p>
              <div>{/* Placeholder for alignment */}</div>
            </div>
            <h2 className="mt-6 text-center text-3xl font-bold text-white">
              Create a password
            </h2>

            {/* Password Input */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="h-12 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-200 placeholder-gray-400 text-white bg-[#121212] focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm pr-10"
                  placeholder="Password"
                  value={password}
                  onChange={handlePasswordChange}
                />
                {/* Password visibility toggle icon - Placeholder */}
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5">
                  {/* Icon here */} {/* TODO: Add eye icon */}
                </div>
              </div>

              {/* Password criteria checklist */}
              <div className="mt-4 space-y-2 text-sm ">
                <p className={hasLetter ? 'text-green-500 flex items-center' : 'text-gray-400 flex items-center'}>
                  <span className={`w-5 h-5 mr-2 rounded-full flex items-center justify-center ${hasLetter ? 'bg-green-500 text-black' : 'border border-gray-400 text-gray-400'}`}>
                    <FontAwesomeIcon icon={faCheck} className="w-3 h-3" />
                  </span>
                  <span>1 letter</span>
                </p>
                <p className={hasNumberOrSpecial ? 'text-green-500 flex items-center' : 'text-gray-400 flex items-center'}>
                  <span className={`w-5 h-5 mr-2 rounded-full flex items-center justify-center ${hasNumberOrSpecial ? 'bg-green-500 text-black' : 'border border-gray-400 text-gray-400'}`}>
                    <FontAwesomeIcon icon={faCheck} className="w-3 h-3" />
                  </span>
                  <span>1 number or special character (example: #?!&)</span>
                </p>
                <p className={isLongEnough ? 'text-green-500 flex items-center' : 'text-gray-400 flex items-center'}>
                  <span className={`w-5 h-5 mr-2 rounded-full flex items-center justify-center ${isLongEnough ? 'bg-green-500 text-black' : 'border border-gray-400 text-gray-400'}`}>
                    <FontAwesomeIcon icon={faCheck} className="w-3 h-3" />
                  </span>
                  <span>10 characters</span>
                </p>
              </div>
            </div>

            {/* Error Message for Step 2 (if any) */}
            {error && step === 2 && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}

            {/* Next Button */}
            <div>
              <button
                type="button"
                onClick={handleNextClickPassword}
                disabled={!hasLetter || !hasNumberOrSpecial || !isLongEnough || loading} // Disable during loading
                className=" h-12 group relative w-full flex justify-center items-center py-2 px-4 border border-transparent text-sm font-medium rounded-full text-black bg-green-600 hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? 'Loading...' : 'Next'} {/* Show loading text */}
              </button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="max-w-md w-full space-y-6 mt-8">
            <div className="flex items-center justify-between">
              <button
                onClick={handleBackClick}
                className="text-gray-400 hover:text-white cursor-pointer"
              >
                <FontAwesomeIcon icon={faChevronLeft} className="w-5 h-5" />
              </button>
              <p className="text-sm text-gray-400">Step 3 of 3</p>
              <div>{/* Placeholder for alignment */}</div>
            </div>
            <h2 className="mt-6 text-center text-3xl font-bold text-white">
              Tell us about yourself
            </h2>

            {/* Name Input (giờ được gửi làm username) */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Name (will be your Username)
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="h-12 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-200 placeholder-gray-400 text-white bg-[#121212] focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <p className="mt-2 text-sm text-gray-400">
                This name will be used as your username and appear on your profile.
              </p>
            </div>

            {/* Date of Birth Input */}
            <div>
              <label
                htmlFor="dob"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Date of birth
              </label>
              <p className="mt-1 text-sm text-gray-400 mb-2">
                Why do we need your date of birth?{" "}
                <a href="#" className="text-green-500 hover:underline">
                  Learn more.
                </a>
              </p>
              <div className="flex gap-4">
                <input
                  type="text"
                  placeholder="DD"
                  className="h-12 appearance-none rounded-md w-1/4 px-3 py-2 border border-gray-200 bg-[#121212] text-white placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  value={dobDay}
                  onChange={(e) => setDobDay(e.target.value)}
                />
                <select
                  className="h-12 appearance-none rounded-md w-1/2 px-3 py-2 border border-gray-200 bg-[#121212] text-white placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  value={dobMonth}
                  onChange={(e) => setDobMonth(e.target.value)}
                >
                  <option value="">Month</option>
                  {/* Add month options here */}
                  <option value="1">January</option>
                  <option value="2">February</option>
                  <option value="3">March</option>
                  <option value="4">April</option>
                  <option value="5">May</option>
                  <option value="6">June</option>
                  <option value="7">July</option>
                  <option value="8">August</option>
                  <option value="9">September</option>
                  <option value="10">October</option>
                  <option value="11">November</option>
                  <option value="12">December</option>
                </select>
                <input
                  type="text"
                  placeholder="YYYY"
                  className="h-12 appearance-none rounded-md w-1/4 px-3 py-2 border border-gray-200 bg-[#121212] text-white placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  value={dobYear}
                  onChange={(e) => setDobYear(e.target.value)}
                />
              </div>
            </div>

            {/* Gender Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Gender
              </label>
              <p className="mt-1 text-sm text-gray-400 mb-2">
                We use your gender to help personalize our content
                recommendations and ads for you.
              </p>
              <div className="mt-2 space-y-2">
                {/* Man option */}
                <label className="inline-flex items-center cursor-pointer">
                  {/* Hidden radio input */}
                  <input
                    type="radio"
                    className="sr-only peer"
                    name="gender"
                    value="man"
                    checked={gender === "man"}
                    onChange={(e) => setGender(e.target.value)}
                  />
                  {/* Custom radio button */}
                  <span className="w-4 h-4 rounded-full border-2 border-gray-400 mr-2 peer-checked:border-green-500 peer-checked:border-5 flex items-center justify-center">
                    {/* Inner dot */}
                    <span className="w-3 h-3 rounded-full bg-green-500 scale-0 peer-checked:scale-100 transition-transform duration-100 ease-out"></span>
                  </span>
                  <span className="text-white text-sm">Man</span>
                </label>

                {/* Woman option */}
                <label className="inline-flex items-center ml-6 cursor-pointer">
                  <input
                    type="radio"
                    className="sr-only peer"
                    name="gender"
                    value="woman"
                    checked={gender === "woman"}
                    onChange={(e) => setGender(e.target.value)}
                  />
                  <span className="w-4 h-4 rounded-full border-2 border-gray-400 mr-2 peer-checked:border-green-500 peer-checked:border-4 flex items-center justify-center">
                    <span className="w-3 h-3 rounded-full bg-green-500 scale-0 peer-checked:scale-100 transition-transform duration-100 ease-out"></span>
                  </span>
                  <span className="text-white text-sm">Woman</span>
                </label>

                {/* Non-binary option */}
                <label className="inline-flex items-center ml-6 cursor-pointer">
                  <input
                    type="radio"
                    className="sr-only peer"
                    name="gender"
                    value="non-binary"
                    checked={gender === "non-binary"}
                    onChange={(e) => setGender(e.target.value)}
                  />
                  <span className="w-4 h-4 rounded-full border-2 border-gray-400 mr-2 peer-checked:border-green-500 peer-checked:border-4 flex items-center justify-center">
                    <span className="w-3 h-3 rounded-full bg-green-500 scale-0 peer-checked:scale-100 transition-transform duration-100 ease-out"></span>
                  </span>
                  <span className=" text-white text-sm">Non-binary</span>
                </label>

                {/* Something else option */}
                <label className="inline-flex items-center ml-6 cursor-pointer">
                  <input
                    type="radio"
                    className="sr-only peer"
                    name="gender"
                    value="something-else"
                    checked={gender === "something-else"}
                    onChange={(e) => setGender(e.target.value)}
                  />
                  <span className="w-4 h-4 rounded-full border-2 border-gray-400 mr-2 peer-checked:border-green-500 peer-checked:border-4 flex items-center justify-center">
                    <span className="w-3 h-3 rounded-full bg-green-500 scale-0 peer-checked:scale-100 transition-transform duration-100 ease-out"></span>
                  </span>
                  <span className=" text-white text-sm">Something else</span>
                </label>

                {/* Prefer not to say option */}
                <label className="inline-flex items-center  cursor-pointer">
                  <input
                    type="radio"
                    className="sr-only peer"
                    name="gender"
                    value="prefer-not-to-say"
                    checked={gender === "prefer-not-to-say"}
                    onChange={(e) => setGender(e.target.value)}
                  />
                  <span className="w-4 h-4 rounded-full border-2 border-gray-400 mr-2 peer-checked:border-green-500 peer-checked:border-4 flex items-center justify-center">
                    <span className="w-3 h-3 rounded-full bg-green-500 scale-0 peer-checked:scale-100 transition-transform duration-100 ease-out"></span>
                  </span>
                  <span className=" text-white text-sm">Prefer not to say</span>
                </label>
              </div>
            </div>

            {/* Error Message for Step 3 (if any) */}
            {error && step === 3 && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}

            {/* Next Button (Sign Up) */}
            <div>
              <button
                type="button"
                onClick={handleNextClickProfile}
                disabled={!name || !dobDay || !dobMonth || !dobYear || !gender || loading}
                className=" h-12 group relative w-full flex justify-center items-center py-2 px-4 border border-transparent text-sm font-medium rounded-full text-black bg-green-600 hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? 'Signing Up...' : 'Sign Up'} {/* Show loading text */}
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-black text-white py-8 px-4 sm:px-6 lg:px-8">
      {/* Spotify Logo */}
      <img className="w-10" src={assets.logoGreen} alt="Spotify Logo" />

      {/* Step Indicator */}
      {step > 0 && step <= 3 && (
        <div className="w-full max-w-md mt-4">
          <div className="w-full bg-gray-700 rounded-full h-1">
            <div className="bg-green-500 h-1 rounded-full" style={{ width: `${(step - 1) / 2 * 100}%` }}></div>
          </div>
        </div>
      )}

      {renderStep()}

      {/* Already have an account? */}
      {step === 1 && (
        <div className="text-center mt-8 w-full max-w-md">
          <p className="text-sm text-gray-400">
            Already have an account?{' '}
            <a href="/login" className="font-medium text-white hover:underline">
              Log in here.
            </a>
          </p>
        </div>
      )}

      {/* reCAPTCHA text */}
      {step === 1 && (
        <p className="mt-6 text-xs text-center text-gray-500 w-full max-w-md">
          This site is protected by reCAPTCHA and the Google
          <a href="#" className="text-gray-400 hover:underline"> Privacy Policy</a> and
          <a href="#" className="text-gray-400 hover:underline"> Terms of Service</a> apply.
        </p>
      )}
    </div>
  );
};

export default Register;