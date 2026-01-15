import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { Modal } from "antd";
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
import { Link } from "react-router-dom";

function checkStatusipe() {
  const navigate = useNavigate();

  /* ---------------------------- component state ---------------------------- */
  const [formData, setFormData] = useState({
    trackingId: "",
    pin: "",
  });
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [amount, setAmount] = useState(1); // Default amount

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

  /* --------------------------------- render -------------------------------- */
  const showConfirmation = async () => {
    const result = await Swal.fire({
      title: "Confirm IPE Clearance",
      html: `
        <p class="mb-2 text-gray-500">Please confirm your details:</p>
        <p class="mb-2 text-gray-500">Tracking ID: ${formData.trackingId}</p>
        
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#f59e0b",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, proceed",
      cancelButtonText: "Cancel",
    });

    return result.isConfirmed;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Show confirmation dialog
    const confirmed = await showConfirmation();
    if (!confirmed) return;

    // Get user ID from localStorage
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
      trackingId: formData.trackingId,
      userId,
    };
    try {
      const response = await axios.post(
        `${config.apiBaseUrl}${config.endpoints.checkStatusipe}`,
        payload,
        { withCredentials: true }
      );

      setVerificationResult(response.data?.data);
      setIsSuccessModalVisible(true);
      toast.success("IPE Clearance verified successfully!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleViewStatus = () => {
    // Navigate to IPE clearance page
    navigate("/dashboard/ipe-history");
    toast.success("Navigating to IPE Clearance History", 1500);
    // Close the modal after navigation
    setIsSuccessModalVisible(false);
  };

  // Add useEffect to fetch IPE pricing
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const response = await axios.get(
          `${config.apiBaseUrl}${config.endpoints.currentapipricing}`,
          { withCredentials: true }
        );
        // Find IPE pricing
        const ipePricingData = Array.isArray(response.data)
          ? response.data.find((item) => item.key === "ipe")
          : response.data;

        const ipePricing =
          ipePricingData?.key === "ipe" ? ipePricingData : null;

        if (ipePricing && ipePricing.prices) {
          setAmount(ipePricing.prices.agent);
        }
      } catch (error) {
        toast.error("Failed to fetch current price");
      }
    };

    fetchPrices();
  }, []);

  return (
    <>
      <div className="w-full rounded-2xl mb-10 bg-white p-5 shadow-lg">
        <p className="text-3xl font-bold text-sky-500 mb-5 text-center ">
          Check IPE Status
        </p>
        <p className="text-[18px] text-black mt-2 ">
          This service is free
          {/* <span className="p-1 text-lg bg-green-100 text-green-900 rounded">
            ₦{amount}
          </span> */}
        </p>
        <form onSubmit={handleSubmit}>
          <div>
            <p className="mt-7 text-[14px] text-gray-500">Supply Tracking ID</p>
            <hr className="my-7 border-gray-200" />
            <input
              type="text"
              className="pl-5 py-2 border border-gray-200 focus:border-gray-200 rounded w-full h-[50px]"
              placeholder="Enter Tracking ID"
              required
              name="trackingId"
              value={formData.trackingId}
              onChange={handleInputChange}
              inputMode="text"
              title="Please enter a valid tracking ID"
            />

            <button
              type="submit"
              disabled={loading}
              className={`flex items-center text-xl mt-10 mb-8 cursor-pointer justify-center gap-2 ${
                loading ? "bg-gray-400" : "bg-sky-500 hover:bg-sky-600"
              } text-white font-medium py-2 px-4 rounded-xl w-full h-[50px] transition-colors`}
            >
              {loading ? (
                <AiOutlineLoading3Quarters className="animate-spin" />
              ) : (
                <MdOutlineSendToMobile />
              )}
              {loading ? "Verifying..." : "Verify"}
            </button>
          </div>
        </form>
        <ToastContainer />
      </div>

      <Modal
        open={isSuccessModalVisible}
        closable={true}
        maskClosable={false}
        onCancel={() => setIsSuccessModalVisible(false)}
        footer={[
          <button
            key="check-status"
            onClick={handleViewStatus}
            className="flex justify-center border border-black font-medium py-2 px-4 rounded-xl bg-sky-500 hover:bg-sky-600 cursor-pointer text-white transition-colors"
          >
            View Status
          </button>,
        ]}
      >
        <div className="py-4 text-center">
          <h1 className="text-3xl font-bold text-sky-500 mb-5">
            IPE Status Check
          </h1>

          <div className="text-gray-600 text-xl mb-4">
            Status check request submitted successfully!
          </div>
        </div>
      </Modal>
    </>
  );
}

export default checkStatusipe;
