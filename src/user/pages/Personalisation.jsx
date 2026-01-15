import React, { useState, useEffect } from "react";
import RegularImg from "../assets/images/regular.png";
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

function Personalisation() {
  const navigate = useNavigate();

  /* ---------------------------------- data --------------------------------- */
  const cardVerify = [{ label: "TRACKING ID", value: "trackingId" }];

  // Add state for API prices
  const [apiPrices, setApiPrices] = useState(null);
  const [personalisationPrice, setPersonalisationPrice] = useState(0); // Default price

  // Add useEffect to fetch prices when component mounts
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const response = await axios.get(
          `${config.apiBaseUrl}${config.endpoints.currentapipricing}`,
          { withCredentials: true }
        );

        // Find personalisation pricing
        const personalisationPricing = response.data.find(
          (item) => item.key === "personalisation"
        );

        if (personalisationPricing) {
          setPersonalisationPrice(personalisationPricing.prices.agent);
        }
      } catch (error) {
        toast.error("Failed to fetch current prices");
      }
    };

    fetchPrices();
  }, []);

  const cardSlip = [
    {
      label: "Regular Slip",
      value: "regular",
      image: RegularImg,
      price: personalisationPrice,
    },
  ];

  /* ---------------------------- component state ---------------------------- */
  const [selectedVerify, setSelectedVerify] = useState("trackingId");
  const [selectedSlip, setSelectedSlip] = useState("regular");
  const [formData, setFormData] = useState({
    trackingId: "",
    pin: "",
    phoneNumber: "",
  });
  const [loading, setLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [showPin, setShowPin] = useState(false);

  // Add your secret key for decryption
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

  let userId = null;
  let userPhone = "";
  try {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const userObj = decryptData(userStr);
      userId = userObj?._id || userObj?.id;
      userPhone = userObj?.phone || userObj?.phoneNumber;
    }
  } catch (error) {}

  useEffect(() => {
    if (userPhone) {
      setFormData((prev) => ({ ...prev, phoneNumber: userPhone }));
    }
  }, [userPhone]);

  /* --------------------------------- render -------------------------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedVerify || !selectedSlip) {
      toast.error("Please select both verification type and slip layout");
      return;
    }

    if (!formData.pin || formData.pin.length !== 4) {
      toast.error("Please enter a valid 4-digit PIN");
      return;
    }

    // Show confirmation dialog
    const result = await Swal.fire({
      title: "Confirm Verification",
      text: `Are you sure you want to proceed with this verification? Amount: ₦${personalisationPrice}`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#f59e0b",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, verify",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) {
      return;
    }

    setLoading(true);
    const payload = {
      verifyWith: "trackingID",
      slipLayout: "Regular",
      trackingId: formData.trackingId,
      amount: personalisationPrice,
      userId,
      phone: formData.phoneNumber,
      pin: formData.pin,
    };

    try {
      const response = await axios.post(
        `${config.apiBaseUrl}${config.endpoints.Personalisation}`,
        payload,
        {
          withCredentials: true,
        }
      );
      setVerificationResult(response.data);

      // Show success alert
      await Swal.fire({
        title: " Successful!",
        text: "Your details has been submitted.",
        icon: "success",
        confirmButtonColor: "#f59e0b",
      });
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

  return (
    <div className="w-full rounded-2xl mb-10 bg-white p-5 shadow-lg">
      <p className="text-[18px] text-gray-500">Personalisation</p>
      <form onSubmit={handleSubmit}>
        {/* ------------------------------- Step #1 ------------------------------- */}
        <p className="mt-7 text-[14px] text-gray-500">1. Verify With</p>
        <hr className="my-5 border-gray-200" />

        <div className="grid gap-6 p-4 sm:grid-cols-1 md:grid-cols-1">
          {cardVerify.map(({ label, value }) => (
            <label
              key={value}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border p-6 text-center transition
            ${
              selectedVerify === value
                ? "border-sky-400 ring-2 ring-sky-300 shadow-lg"
                : "border-gray-200 shadow-md hover:shadow-lg"
            }`}
            >
              <input
                type="radio"
                name="verifyWith"
                value={value}
                checked={selectedVerify === value}
                onChange={() => setSelectedVerify(value)}
                className="hidden"
                required
              />

              <h3 className="mb-4 text-lg font-semibold text-gray-600">
                {label}
              </h3>

              {/* visual radio indicator */}
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                  selectedVerify === value
                    ? "border-sky-400"
                    : "border-gray-300"
                }`}
              >
                {selectedVerify === value && (
                  <span className="h-2.5 w-2.5 rounded-full bg-sky-500"></span>
                )}
              </span>
            </label>
          ))}
        </div>

        {/* ------------------------------- Step #2 ------------------------------- */}
        <p className="mt-7 text-[14px] text-gray-500">2. Slip Layout</p>
        <hr className="my-5 border-gray-200" />

        <div className="grid gap-6 p-4 sm:grid-cols-1 md:grid-cols-1">
          {cardSlip.map(({ label, value, image, price }) => (
            <label
              key={value}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border p-6 text-center transition
            ${
              selectedSlip === value
                ? "border-sky-400 ring-2 ring-sky-300 shadow-lg"
                : "border-gray-200 shadow-md hover:shadow-lg"
            }`}
            >
              <input
                type="radio"
                name="slipLayout"
                value={value}
                checked={selectedSlip === value}
                onChange={() => setSelectedSlip(value)}
                className="hidden"
                required
              />

              {/* price */}
              <p className="mb-4 text-3xl font-bold tracking-wide text-slate-700">
                ₦{personalisationPrice}.00
              </p>

              {/* preview image */}
              <img
                src={image}
                alt={label}
                loading="lazy"
                className="mb-4 h-24 w-full object-contain"
              />

              {/* label */}
              <h4 className="mb-4 text-base font-semibold text-gray-600">
                {label}
              </h4>

              {/* visual radio indicator */}
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                  selectedSlip === value ? "border-sky-400" : "border-gray-300"
                }`}
              >
                {selectedSlip === value && (
                  <span className="h-2.5 w-2.5 rounded-full bg-sky-500"></span>
                )}
              </span>
            </label>
          ))}
        </div>
        {/* ------------------------------- Step #3 ------------------------------- */}
        <div>
          <p className="mt-7 text-[14px] text-gray-500">3. Supply ID Number</p>
          <hr className="my-7 border-gray-200" />
          <input
            type="text"
            className="pl-5 py-2 border border-gray-200 focus:border-gray-200 rounded w-full h-[50px]"
            placeholder="TRACKING ID"
            required
            name="trackingId"
            value={formData.trackingId || ""}
            onChange={handleInputChange}
            inputMode="text"
            autoComplete="off"
            title="Insert your Tracking ID"
          />
          <div className="mt-7">
            <label
              htmlFor="phoneNumber"
              className="text-sm text-gray-600 mb-1 block"
            >
              4. Phone Number
            </label>
            <hr className="my-7 border-gray-200" />
            <input
              type="tel"
              id="phoneNumber"
              className={`pl-5 py-2 border border-gray-200 focus:border-gray-200 rounded w-full h-[50px] ${
                userPhone ? "bg-gray-100 cursor-not-allowed" : ""
              }`}
              placeholder="Phone Number"
              required
              name="phoneNumber"
              value={formData.phoneNumber || ""}
              onChange={handleInputChange}
              inputMode="tel"
              autoComplete="tel"
              title="Enter a valid phone number"
              pattern="[0-9]{11}"
              maxLength="11"
              readOnly={!!userPhone}
            />
          </div>

          {/* Add this after the NIN input */}
          <div className="mt-4">
            <p className="mt-7 text-[14px] text-gray-500">
              5. Enter your Transaction PIN
            </p>
            <hr className="my-7 border-gray-200" />
            <div className="relative">
              <input
                type={showPin ? "text" : "password"}
                className="pl-5 py-2 border border-gray-200 focus:border-gray-200 rounded w-full h-[50px]"
                placeholder="Enter 4-digit Transaction PIN"
                required
                name="pin"
                value={formData.pin || ""}
                onChange={handleInputChange}
                inputMode="numeric"
                maxLength="4"
                pattern="\d{4}"
                autoComplete="pin"
                title="PIN must be exactly 4 digits"
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPin ? (
                  <AiOutlineEyeInvisible size={20} />
                ) : (
                  <AiOutlineEye size={20} />
                )}
              </button>
            </div>
          </div>

          <p className="text-gray-400 text-[12px] mt-2 ">
            We'll never share your details with anyone else.
          </p>
          <label className="flex items-start mt-8 space-x-3 cursor-pointer">
            <span className="relative">
              <input
                type="checkbox"
                className="peer shrink-0 appearance-none h-5 w-5 border border-gray-400 rounded-sm bg-white checked:bg-blue-600 checked:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                required
                title="Required"
              />
              <svg
                className="absolute w-4 h-4 text-white left-0.5 top-0.5 pointer-events-none hidden peer-checked:block"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414L8.414 15l-4.121-4.121a1 1 0 011.414-1.414L8.414 12.586l7.879-7.879a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              By checking this box, you agree that the owner of the ID has
              granted you consent to verify his/her identity.
            </span>
          </label>

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
              <MdOutlineSendToMobile className="" />
            )}
            {loading ? "Verifying..." : "Verify"}
          </button>
        </div>
      </form>
      <ToastContainer />
    </div>
  );
}

export default Personalisation;
