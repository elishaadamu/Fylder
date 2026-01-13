import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { CiWallet } from "react-icons/ci";
import { FaEllipsisVertical } from "react-icons/fa6";
import { FaCube } from "react-icons/fa6";
import { NavLink, useNavigate, Link } from "react-router-dom";
import NIMC from "../assets/images/nimc.png";
import NIBSS from "../assets/images/nibss.png";
import CAC from "../assets/images/cac.png";
import Airtime from "../assets/images/airtime.png";
import Bank from "../assets/images/bank.webp";
import Data from "../assets/images/data.png";
import { IoClose } from "react-icons/io5";
import { FaRegCopy } from "react-icons/fa";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "../assets/css/style.css";
import Logo from "../assets/images/Logo.png";
import Swal from "sweetalert2";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { config } from "../../config/config.jsx";
import CryptoJS from "crypto-js";

const SECRET_KEY = import.meta.env.VITE_APP_SECRET_KEY;

function encryptData(data) {
  return CryptoJS.AES.encrypt(JSON.stringify(data), SECRET_KEY).toString();
}

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

// DepositModal Component
function DepositModal({ open, onClose }) {
  const user = decryptData(localStorage.getItem("user"));
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("paystack");
  const [modalVisible, setModalVisible] = useState(false);

  // Add useEffect to handle animation
  useEffect(() => {
    if (open) {
      // Small delay to trigger animation
      setTimeout(() => setModalVisible(true), 10);
    } else {
      setModalVisible(false);
    }
  }, [open]);

  const handleClose = () => {
    setModalVisible(false);
    // Wait for animation to complete before closing
    setTimeout(() => onClose(), 300);
  };

  const handlePaystack = () => {
    if (!window.PaystackPop) {
      toast.error("Paystack is not loaded. Please refresh the page.");
      return;
    }

    const handler = window.PaystackPop.setup({
      key: import.meta.env.VITE_PAYSTACK_PUBLIC_URL,
      email: user?.email,
      amount: Number(amount) * 100,
      currency: "NGN",
      ref: `AY-${Date.now()}`,
      metadata: {
        userId: user?._id || user?.id,
        name: `${user?.firstName} ${user?.lastName}`,
      },
      callback: function (response) {
        toast.success("Payment successful. Processing...");
        // Handle successful payment here

        onClose();
      },
      onClose: function () {
        toast.error("Payment closed by user.");
      },
    });

    // Close the modal before opening the Paystack popup
    onClose();
    handler.openIframe();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || !paymentMethod) {
      toast.error("Please complete all fields");
      return;
    }
    if (Number(amount) < 100) {
      toast.error("Minimum deposit amount is ₦100");
      return;
    }
    if (paymentMethod === "paystack") {
      handlePaystack();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-center bg-black/50">
      <div
        className={`bg-white rounded-xl w-[450px] max-w-[90%] p-6 shadow-xl 
          transform transition-all duration-300 
          ${modalVisible ? "scale-100 opacity-100" : "scale-90 opacity-0"}`}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Make a Deposit</h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <IoClose size={24} />
          </button>
        </div>

        <p className="text-gray-600 mb-6">
          Add funds to your{" "}
          <span className="text-sky-700 font-bold">Fylder wallet.</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="amount"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Amount
            </label>
            <input
              id="amount"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              min="100"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            />
          </div>

          <div>
            <label
              htmlFor="payment"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            >
              <option value="paystack">Paystack</option>
            </select>
          </div>

          {amount && (
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Deposit Amount:</span>
                  <span>₦{Number(amount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Processing Fee:</span>
                  <span>₦0.00</span>
                </div>
                <hr className="my-2" />
                <div className="flex justify-between font-bold">
                  <span>Total:</span>
                  <span>₦{Number(amount).toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex space-x-3 mt-6">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-sky-500 text-white rounded-md hover:bg-sky-600"
            >
              Deposit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Dashboard() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false); // New state for deposit modal

  const [creatingAccount, setCreatingAccount] = useState(false);
  const [account, setAccount] = useState(null);
  const [loadingAccount, setLoadingAccount] = useState(true);

  const [modalVisible, setModalVisible] = useState(false);

  const user = decryptData(localStorage.getItem("user"));
  const firstName = user?.firstName || "User";
  const userId = user?._id || user?.id;

  // Detect if user is new or returning
  const [isReturning, setIsReturning] = useState(false);

  useEffect(() => {
    // Check localStorage for a flag
    const hasVisited = localStorage.getItem("hasVisitedAYCreative");
    if (hasVisited) {
      setIsReturning(true);
    } else {
      setIsReturning(false);
      localStorage.setItem("hasVisitedAYCreative", "true");
    }
  }, []);

  // Load Paystack script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v1/inline.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleCreateWallet = async () => {
    if (!userId) {
      toast.error("User not found. Please log in again.");
      return;
    }
    setCreatingAccount(true);
    try {
      const response = await axios.post(
        `${config.apiBaseUrl}${config.endpoints.initiateTopup}${userId}`
      );

      toast.success("Wallet created successfully!");
    } catch (error) {
      console.error("Wallet creation error:", error);
      toast.error(error.response?.data?.message || "Failed to create wallet.");
    } finally {
      setCreatingAccount(false);
    }
  };

  useEffect(() => {
    // Fetch account details on mount
    const fetchBalance = async () => {
      setLoadingAccount(true);
      try {
        const accountRes = await axios.get(
          `${config.apiBaseUrl}${config.endpoints.walletBalance}${userId}`
        );
        console.log("Account details fetched:", accountRes.data);
        setAccount(accountRes.data.wallet);
      } catch (err) {
        console.error("Fetch account error:", err);
        setAccount(null);
      } finally {
        setLoadingAccount(false);
      }
    };

    fetchBalance();
  }, [userId]);

  // navItems.js
  const navItems = [
    {
      id: 1,
      name: "NIN VERIFY",
      icon: NIMC,
      to: "/dashboard/verifications/nin",
    },

    {
      id: 3,
      name: "IPE CLEARANCE",
      icon: NIMC,
      to: "/dashboard/ipe-clearance",
    },
    {
      id: 4,
      name: "MODIFICATION",
      icon: NIMC,
      to: "/dashboard/modification",
    },
    {
      id: 5,
      name: "PERSONALIZATION",
      icon: NIMC,
      to: "/dashboard/personalisation",
    },
    {
      id: 6,
      name: "DEMOGRAPHIC SEARCH",
      icon: NIMC,
      to: "/dashboard/demographic-search",
    },
    {
      id: 7,
      name: "VALIDATION",
      icon: NIMC,
      to: "/dashboard/validation",
    },
    {
      id: 8,
      name: "BVN MODIFICATION",
      icon: NIMC,
      to: "/dashboard/bvn-modification",
    },
    {
      id: 9,
      name: "BVN VERIFY",
      icon: NIBSS,
      to: "/dashboard/verifications/bvn",
    },
    {
      id: 10,
      name: "AIRTIME SUBSCRIPTION",
      icon: Airtime,
      to: "/dashboard/airtime",
    },
    {
      id: 11,
      name: "DATA SUBSCRIPTION",
      icon: Data,
      to: "/dashboard/data",
    },
    {
      id: 12,
      name: "CAC REGISTRATION",
      icon: CAC,
      to: "/dashboard/cac",
    },
    {
      id: 13,
      name: "BVN LICENCES",
      icon: NIBSS,
      to: "/dashboard/bvn-licence",
    },
    {
      id: 14,
      name: "BANK AGENCY",
      icon: Bank,
      to: "/dashboard/bank-agency",
    },
  ];

  const openModal = () => {
    setIsOpen(true);
    setTimeout(() => setModalVisible(true), 10);
  };

  const closeModal = () => {
    setModalVisible(false);
    setTimeout(() => setIsOpen(false), 300);
  };

  const [showBalance, setShowBalance] = useState(true);
  const [verificationCount, setVerificationCount] = useState(0);
  const [loadingVerifications, setLoadingVerifications] = useState(true);

  // Update the useEffect for fetching verification counts
  useEffect(() => {
    const fetchVerificationCount = async () => {
      if (!userId) return;

      setLoadingVerifications(true);
      try {
        const response = await axios.get(
          `${config.apiBaseUrl}${config.endpoints.VerificationHistory}${userId}`,
          {
            withCredentials: true,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        const totalCount = response.data.count || 0;

        setVerificationCount(totalCount);
      } catch (error) {
        console.error("Error fetching verification count:", error);
        setVerificationCount(0);
      } finally {
        setLoadingVerifications(false);
      }
    };

    fetchVerificationCount();
  }, [userId]);

  return (
    <div className="max-w-[1500px] mx-auto">
      <div className="-mt-5 md:mt-0 mb-5 md:mb-10 text-2xl text-gray-500 font-bold">
        {isReturning
          ? `Welcome back, ${firstName} 🙂`
          : `Welcome to Fylder, ${firstName} 👋`}
      </div>
      <div className="flex justify-center  max-w-full flex-col md:flex-row  gap-10">
        <div className="flex-1/2 rounded-lg bg-white hover:shadow-lg shadow-md ring-2 ring-sky-50/2 w-full p-7">
          <>
            <p className="text-gray-500 text-[16px] font-light">
              Wallet Balance
            </p>
            <p className="text-gray-600 text-[30px] mb-10 font-bold font-sans flex items-center gap-2">
              {loadingAccount
                ? "Loading..."
                : showBalance && account
                ? `₦${account?.balance?.toLocaleString() || "0.00"}`
                : "₦***"}
              <button
                onClick={() => setShowBalance((prev) => !prev)}
                className="ml-2 focus:outline-none text-gray-400"
                title={showBalance ? "Hide Balance" : "Show Balance"}
                type="button"
              >
                {showBalance ? <FaEyeSlash /> : <FaEye />}
              </button>
            </p>

            <div className="flex flex-row items-center justify-center md:justify-start sm:flex-row gap-2">
              <button
                onClick={() => setIsDepositModalOpen(true)}
                disabled={!account || loadingAccount}
                className="w-[120px] md:w-[160px] h-[40px] text-white text-sm md:text-lg bg-sky-400 cursor-pointer hover:bg-sky-500 rounded-lg p-2 flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                title={!account ? "Create a wallet first" : "Fund your wallet"}
              >
                {/* <CiWallet className="text-xl none md:block text-white" /> */}
                <span>Card Payment</span>
              </button>
              {account?.accountNumber ? (
                <button
                  onClick={openModal}
                  className="w-[120px] md:w-[160px] h-[40px] text-sm md:text-lg text-white bg-purple-500 cursor-pointer hover:bg-purple-600 rounded-lg p-2 flex items-center justify-center gap-2"
                >
                  View Account
                </button>
              ) : (
                <button
                  onClick={handleCreateWallet}
                  className="w-[120px] md:w-[160px] h-[40px] text-white text-sm md:text-lg bg-green-500 cursor-pointer hover:bg-green-600 rounded-lg p-2 flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {creatingAccount ? "Creating..." : "Wallet Creation"}
                </button>
              )}
            </div>
          </>

          {/* Bank Transfer Modal */}
          {isOpen && (
            <div
              className={`fixed inset-0 z-50 flex justify-center items-center bg-black/50 transition-opacity duration-300 ${
                modalVisible ? "opacity-100" : "opacity-0"
              }`}
              onClick={closeModal}
            >
              <div
                className={`bg-white rounded-xl w-[450px] max-w-[90%] shadow-xl transform transition-all duration-300 ${
                  modalVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"
                } p-6`}
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-800">
                    Fund via Bank Transfer
                  </h2>
                  <button
                    onClick={closeModal}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <IoClose size={24} />
                  </button>
                </div>

                <p className="text-gray-600 mb-6">
                  Transfer funds to your dedicated Fylder account below.
                </p>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
                  {account ? (
                    <>
                      <div className="flex justify-between items-baseline">
                        <span className="text-sm text-gray-500">Bank Name</span>
                        <span className="font-semibold text-gray-800">
                          {account.bankName}
                        </span>
                      </div>
                      <div className="flex justify-between items-baseline">
                        <span className="text-sm text-gray-500">
                          Account Name
                        </span>
                        <span className="font-semibold text-gray-800">
                          Datapin-{account.accountName}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">
                          Account Number
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-lg text-sky-600">
                            {account.accountNumber}
                          </span>
                          <button
                            className="text-gray-500 hover:text-sky-500"
                            onClick={() => {
                              navigator.clipboard.writeText(
                                account.accountNumber
                              );
                              toast.success("Account number copied!");
                            }}
                            title="Copy account number"
                          >
                            <FaRegCopy size={18} />
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-red-500 text-center">
                      No account details available.
                    </p>
                  )}
                </div>

                <p className="text-xs text-gray-400 mt-4 text-center">
                  Funds will reflect in your wallet automatically after
                  transfer.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1/2 rounded-lg bg-white shadow-md hover:shadow-lg ring-2 ring-amber-50/2 w-full p-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <FaCube className="text-2xl text-purple-600" />
              </div>
            </div>
            <p className="text-gray-500 text-sm mt-4">Total Transactions</p>
            <p className="text-3xl font-bold text-gray-800 mt-1">
              {loadingVerifications ? (
                <span className="text-amber-400 text-lg">Loading...</span>
              ) : (
                <span>{verificationCount}</span>
              )}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <Link
              to="/dashboard/all-history"
              className="flex-1 text-center px-2 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              View Verification History
            </Link>
            <Link
              to="/dashboard/fundinghistory"
              className="flex-1 text-center px-2 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm font-medium flex items-center justify-center gap-2"
            >
              <CiWallet />
              View Funding
            </Link>
          </div>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 w-full py-4">
        {navItems.map((item) => (
          <NavLink
            to={item.to}
            key={item.id}
            className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 p-4 flex flex-col items-center text-center"
          >
            <img
              src={item.icon}
              alt={item.name}
              className="w-16 h-16 object-contain mb-3"
            />
            <span className=" text-[14px] text-gray-400">{item.name}</span>
          </NavLink>
        ))}
      </div>

      {/* Deposit Modal */}
      <DepositModal
        open={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
      />

      <ToastContainer />
    </div>
  );
}

export default Dashboard;
