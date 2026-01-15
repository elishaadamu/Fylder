import React, { useState, useEffect } from "react";
import { MdOutlineSendToMobile } from "react-icons/md";
import {
  AiOutlineLoading3Quarters,
  AiOutlineEye,
  AiOutlineEyeInvisible,
} from "react-icons/ai";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import { config } from "../../config/config.jsx";
import CryptoJS from "crypto-js";
import Swal from "sweetalert2";

function NIN() {
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const response = await axios.get(
          `${config.apiBaseUrl}${config.endpoints.currentapipricing}`,
          { withCredentials: true }
        );
      } catch (error) {
        toast.error("Failed to fetch current prices");
      }
    };
    fetchPrices();
  }, []);

  const [selectedValidationType, setSelectedValidationType] = useState(""); // ✅ new state
  const [formData, setFormData] = useState({
    nin: "",
    pin: "",
  });
  const [loading, setLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [showPin, setShowPin] = useState(false);

  const SECRET_KEY = import.meta.env.VITE_APP_SECRET_KEY;

  function decryptData(ciphertext) {
    if (!ciphertext) return null;
    try {
      const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      return JSON.parse(decrypted);
    } catch {
      return null;
    }
  }

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedValidationType) {
      toast.error("Please select a validation type");
      return;
    }
    if (!formData.pin || formData.pin.length !== 4) {
      toast.error("Please enter a valid 4-digit PIN");
      return;
    }

    const result = await Swal.fire({
      title: "Confirm Verification",
      text: "Are you sure you want to proceed with this verification?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#f59e0b",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, verify",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    let userId = null;
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const userObj = decryptData(userStr);
        userId = userObj?._id || userObj?.id;
      }
    } catch {}

    setLoading(true);
    const payload = {
      nin: formData.nin,
      amount: parseInt(10),
      userId,
      pin: formData.pin,
      validationType: selectedValidationType, // ✅ added to payload
    };

    try {
      const response = await axios.post(
        `${config.apiBaseUrl}${config.endpoints.ninvalidation}`,
        payload,
        { withCredentials: true }
      );

      setVerificationResult(response.data);

      await Swal.fire({
        title: "Verification Successful!",
        text: "Your NIN has been successfully verified.",
        icon: "success",
        confirmButtonColor: "#f59e0b",
      });

      toast.success("NIN verified successfully!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="w-full rounded-2xl mb-10 bg-white p-5 shadow-lg">
      <p className="text-[18px] text-gray-500">NIN Verification</p>
      <form onSubmit={handleSubmit}>
        {/* Step 1: Validation Type */}
        <p className="mt-7 text-[14px] text-gray-500">1. Validation Type</p>
        <hr className="my-7 border-gray-200" />
        <select
          className="w-full h-[50px] border border-gray-200 rounded pl-3"
          value={selectedValidationType}
          onChange={(e) => setSelectedValidationType(e.target.value)}
          required
        >
          <option value="">Select Validation Type</option>
          <option value="No Record Found">No Record Found</option>
          <option value="Photograph Error">Photograph Error</option>
          <option value="Modification Validation">
            Modification Validation
          </option>
          <option value="Bank Validation">Bank Validation</option>
          <option value="Sim Validation">Sim Validation</option>
        </select>

        {/* Step 2: NIN Number */}
        <p className="mt-7 text-[14px] text-gray-500">2. Supply ID Number</p>
        <hr className="my-7 border-gray-200" />
        <input
          type="text"
          className="pl-5 py-2 border border-gray-200 rounded w-full h-[50px]"
          placeholder="NIN NUMBER"
          required
          name="nin"
          value={formData.nin}
          onChange={handleInputChange}
          inputMode="numeric"
          maxLength="11"
          pattern="\d{11}"
          autoComplete="off"
        />

        {/* Step 3: PIN */}
        <p className="mt-7 text-[14px] text-gray-500">
          3. Enter your Transaction PIN
        </p>
        <hr className="my-7 border-gray-200" />
        <div className="relative">
          <input
            type={showPin ? "text" : "password"}
            className="pl-5 py-2 border border-gray-200 rounded w-full h-[50px]"
            placeholder="Enter 4-digit Transaction PIN"
            required
            name="pin"
            value={formData.pin}
            onChange={handleInputChange}
            inputMode="numeric"
            maxLength="4"
            pattern="\d{4}"
          />
          <button
            type="button"
            onClick={() => setShowPin(!showPin)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
          >
            {showPin ? (
              <AiOutlineEyeInvisible size={20} />
            ) : (
              <AiOutlineEye size={20} />
            )}
          </button>
        </div>

        {/* Checkbox */}
        <label className="flex items-start mt-8 space-x-3 cursor-pointer">
          <input
            type="checkbox"
            className="h-5 w-5 border border-gray-400 rounded-sm"
            required
          />
          <span className="text-sm text-gray-600">
            By checking this box, you agree that the owner of the ID has granted
            you consent.
          </span>
        </label>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className={`flex items-center justify-center gap-2 text-xl mt-10 mb-8 w-full h-[50px] text-white font-medium rounded-xl ${
            loading ? "bg-gray-400" : "bg-sky-500 hover:bg-sky-600"
          }`}
        >
          {loading ? (
            <AiOutlineLoading3Quarters className="animate-spin" />
          ) : (
            <MdOutlineSendToMobile />
          )}
          {loading ? "Verifying..." : "Verify"}
        </button>
      </form>
      <ToastContainer />
    </div>
  );
}

export default NIN;
