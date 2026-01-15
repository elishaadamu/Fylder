// src/pages/Home.jsx
import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Logo from "../assets/images/Logo.png";
import Svg from "../assets/images/bg.svg";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { TbEye, TbEyeOff } from "react-icons/tb";

// Import config
import { config } from "../config/config.jsx";

const ResetPassword = () => {
  const [form, setForm] = useState({
    password: "",
    repeatPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [invalidFields, setInvalidFields] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const email = localStorage.getItem("email");
    if (!email) {
      navigate("/login");
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    setInvalidFields((prev) => ({ ...prev, [name]: false }));
  };

  const validateForm = () => {
    const newInvalid = {};
    if (!form.password || form.password.length < 8) newInvalid.password = true;
    if (!form.repeatPassword || form.repeatPassword.length < 8)
      newInvalid.repeatPassword = true;
    if (form.password !== form.repeatPassword) newInvalid.repeatPassword = true;
    setInvalidFields(newInvalid);
    return Object.keys(newInvalid).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!validateForm()) {
      if (form.password !== form.repeatPassword) {
        setError("Passwords do not match.");
      } else {
        setError("Please correct the highlighted fields.");
      }
      setLoading(false);
      return;
    }

    const email = localStorage.getItem("email");
    if (!email) {
      setError("No email found for password reset.");
      setLoading(false);
      return;
    }

    const formData = {
      email: email,
      password: form.password,
    };

    try {
      const response = await axios.post(
        `${config.apiBaseUrl}${config.endpoints.setPassword}`,
        formData,
        {
          withCredentials: true,
        }
      );

      toast.success("Password reset successful! Please login.");
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      const apiMessage =
        err.response?.data?.message || "Reset failed. Please try again.";
      setError(apiMessage);
    }
    setLoading(false);
  };

  return (
    <>
      <ToastContainer />
      <motion.div
        className="min-h-screen flex items-center justify-center relative bg-gray-100  px-4"
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -100 }}
        transition={{ duration: 0.5 }}
      >
        <div className="bg-form-1 z-2 absolute">
          <img src={Svg} alt="Bg" />
        </div>
        <div className="bg-white my-8 z-10 p-8  rounded shadow-md w-full max-w-md">
          <div className=" my-5 mx-auto w-40 max-w-full">
            <NavLink
              exact="true"
              to="/"
              className="text-black font-bold text-4xl"
            >
              <img src={Logo} alt="Logo" />
            </NavLink>
          </div>
          <div>
            <h3 className="text-gray-500 mb-4 text-xl font-semibold">
              Set New Password
            </h3>
            <p className="mb-5 text-gray-500">Enter your new password below.</p>
          </div>
          <form onSubmit={handleSubmit} className="w-full">
            <div className="relative mb-4"></div>

            <p className="mt-5 mb-3">
              <label htmlFor="Password" className="text-gray-500 text-[12px]">
                NEW PASSWORD
              </label>
            </p>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className={`pl-5 py-2 text-black border rounded w-full h-[50px] ${
                  invalidFields.password
                    ? "border-red-500"
                    : form.password
                    ? "border-green-500"
                    : "border-gray-500"
                }`}
                placeholder="New Password"
                required
                name="password"
                id="Password"
                value={form.password}
                onChange={handleChange}
              />
              <span
                className="absolute right-3 top-4 cursor-pointer"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? (
                  <TbEyeOff className="text-gray-500" />
                ) : (
                  <TbEye className="text-gray-500" />
                )}
              </span>
            </div>

            <p className="mt-5 mb-3">
              <label
                htmlFor="RepeatPassword"
                className="text-gray-500 text-[12px]"
              >
                REPEAT PASSWORD
              </label>
            </p>
            <div className="relative">
              <input
                type={showRepeatPassword ? "text" : "password"}
                className={`pl-5 py-2 text-black border rounded w-full h-[50px] ${
                  invalidFields.repeatPassword
                    ? "border-red-500"
                    : form.repeatPassword
                    ? "border-green-500"
                    : "border-gray-500"
                }`}
                placeholder="Repeat Password"
                required
                name="repeatPassword"
                id="RepeatPassword"
                value={form.repeatPassword}
                onChange={handleChange}
              />
              <span
                className="absolute right-3 top-4 cursor-pointer"
                onClick={() => setShowRepeatPassword((prev) => !prev)}
              >
                {showRepeatPassword ? (
                  <TbEyeOff className="text-gray-500" />
                ) : (
                  <TbEye className="text-gray-500" />
                )}
              </span>
            </div>

            {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
            <button
              type="submit"
              disabled={loading}
              className="submit bg-sky-600 h-[50px] text-white py-2 mt-5 rounded w-full cursor-pointer flex items-center justify-center"
            >
              {loading && (
                <svg
                  className="animate-spin h-5 w-5 mr-2 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8z"
                  ></path>
                </svg>
              )}
              {loading ? "Saving..." : "Set New Password"}
            </button>
          </form>
        </div>
        <div className="bg-form-2 absolute">
          <img src={Svg} alt="Bg" className="w-full" />
        </div>
      </motion.div>
    </>
  );
};

export default ResetPassword;
