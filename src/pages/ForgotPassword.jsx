// src/pages/Home.jsx
import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Logo from "../assets/images/Logo.png";
import Svg from "../assets/images/bg.svg";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Import config
import { config } from "../config/config.jsx";

const ForgotPassword = () => {
  const [form, setForm] = useState({
    email: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [invalidFields, setInvalidFields] = useState({});
  const navigate = useNavigate();

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
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email))
      newInvalid.email = true;
    setInvalidFields(newInvalid);
    return Object.keys(newInvalid).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!validateForm()) {
      setError("Please correct the highlighted fields.");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(
        `${config.apiBaseUrl}${config.endpoints.forgotPassword}`,
        {
          email: form.email,
        },
        {
          withCredentials: true,
        }
      );

      // Just log the response
      console.log("Backend responses:", response.data);

      // Store email in localStorage
      localStorage.setItem("email", form.email);

      toast.success("A reset link has been sent to your Email Inbox.");
      setTimeout(() => {
        navigate("/otp");
      }, 2000);
    } catch (err) {
      console.error(
        "Forgot password error:",
        err.response ? err.response.data : err.message
      );
      setError("Request failed. Please try again.");
      toast.error("Request failed. Please try again.");
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
              Reset Your Password
            </h3>
            <p className="mb-5 text-gray-500">
              Enter your email to receive a password reset link.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="w-full">
            <div className="relative mb-4"></div>

            <p className="mt-5 mb-3">
              <label htmlFor="Email" className="text-gray-500  text-[12px]  ">
                EMAIL
              </label>
            </p>

            <input
              type="email"
              className={`pl-5 py-2 text-black border rounded w-full h-[50px] ${
                invalidFields.email
                  ? "border-red-500"
                  : form.email
                  ? "border-green-500"
                  : "border-gray-500"
              }`}
              placeholder="Email Address"
              required
              name="email"
              id="Email"
              value={form.email}
              onChange={handleChange}
            />

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
              {loading ? "Sending..." : "Send Reset Email"}
            </button>
          </form>

          <p className="mt-5 text-center">
            <span className="text-gray-400 text-[16px]">
              New on our platform?
            </span>{" "}
            <NavLink
              to="/signup"
              className="text-sky-600 text-[16px] font-bold"
            >
              Signup
            </NavLink>
          </p>
        </div>
        <div className="bg-form-2 absolute">
          <img src={Svg} alt="Bg" className="w-full" />
        </div>
      </motion.div>
    </>
  );
};

export default ForgotPassword;
