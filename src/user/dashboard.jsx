import React, { useState, useEffect } from "react";
import { Dropdown, Space, Modal } from "antd";
import {
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  HomeOutlined,
} from "@ant-design/icons";
import { useNavigate, NavLink, useLocation } from "react-router-dom";
import Sidebar from "./Components/Sidebar";
import "./assets/css/style.css";
import Logo from "../assets/images/Logo.png";
import RoutesConfig from "./Components/RoutesConfig";
import CustomerCare from "./Components/CustomerCare";
import axios from "axios";
import { config } from "../config/config"; // Adjust the path as necessary
import CryptoJS from "crypto-js";

const ONE_HOUR = 60 * 60 * 1000; // 3 600 000 ms
const SECRET_KEY = import.meta.env.VITE_APP_SECRET_KEY;
const PIN_CHECK_DISABLED_KEY = "pinCheckDisabled";

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

function UserDashBoard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isPinModalVisible, setIsPinModalVisible] = useState(false);
  const [isPinCheckEnabled, setIsPinCheckEnabled] = useState(true);
  const [introStatus, setIntroStatus] = useState([]);

  useEffect(() => {
    // Only show modal if just logged in
    if (localStorage.getItem("showWelcomeModal") === "true") {
      setShowModal(true);
      localStorage.removeItem("showWelcomeModal");
    }
  }, []);

  // Get user data using decryption
  const user = decryptData(localStorage.getItem("user"));
  const userId = user?._id || user?.id;

  useEffect(() => {
    // Disable PIN check if we're on the setpin page
    if (location.pathname === "/dashboard/setpin") {
      setIsPinCheckEnabled(false);
      localStorage.setItem(PIN_CHECK_DISABLED_KEY, "true");
    } else {
      const isDisabled = localStorage.getItem(PIN_CHECK_DISABLED_KEY);
      setIsPinCheckEnabled(!isDisabled);
    }
  }, [location.pathname]);

  useEffect(() => {
    const checkPin = async () => {
      // Don't check if disabled or no userId
      if (!isPinCheckEnabled || !userId) return;

      try {
        const response = await axios.get(
          `${config.apiBaseUrl}${config.endpoints.walletBalance}${userId}`,
          {
            // Add retry configuration
            retry: 3,
            retryDelay: 2000,
            timeout: 5000,
          }
        );

        if (!response.data?.wallet?.pin) {
          setIsPinModalVisible(true);
        }
      } catch (error) {
        // Ignore 429 errors but log other errors
        if (error.response?.status !== 429) {
          console.error("Error checking PIN:", error);
        }
        // Continue showing modal if we had previously determined PIN was needed
        if (isPinModalVisible) {
          setIsPinModalVisible(true);
        }
      }
    };

    // Only set up interval if checks are enabled
    if (isPinCheckEnabled) {
      checkPin();
      const interval = setInterval(checkPin, 120000);
      return () => clearInterval(interval);
    }
  }, [userId, isPinCheckEnabled]);

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleSetupPin = () => {
    setIsPinModalVisible(false);
    setIsPinCheckEnabled(false);
    localStorage.setItem(PIN_CHECK_DISABLED_KEY, "true");
    navigate("/dashboard/setpin");
  };

  // Add cleanup when user sets PIN successfully
  useEffect(() => {
    const cleanupPinCheck = () => {
      localStorage.removeItem(PIN_CHECK_DISABLED_KEY);
      setIsPinCheckEnabled(true);
    };

    window.addEventListener("pinSetSuccess", cleanupPinCheck);
    return () => window.removeEventListener("pinSetSuccess", cleanupPinCheck);
  }, []);

  const items = [
    {
      key: "1",
      label: "Home",
      icon: <HomeOutlined />,
      onClick: () => navigate("/dashboard"),
    },
    {
      key: "2",
      label: "Settings",
      icon: <SettingOutlined />,
      onClick: () => navigate("/dashboard/fundinghistory"),
    },
    {
      type: "divider",
    },
    {
      key: "3",
      label: "Logout",
      icon: <LogoutOutlined />,
      onClick: handleLogout,
      danger: true,
    },
  ];

  const fetchIntro = async () => {
    try {
      const response = await axios.get(
        `${config.apiBaseUrl}/${config.endpoints.userIntro}`,
        { withCredentials: true }
      );
      console.log("Intro status response:", response.data);
      setIntroStatus(response.data?.data || []);
    } catch (error) {
      console.error("Error fetching intro status:", error);
      return false;
    }
  };
  useEffect(() => {
    fetchIntro();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-100 text-gray-800 dark:text-gray-900">
      {/* ───── Modal ───── */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <img src={Logo} alt="Logo" className="mx-auto mb-4 w-32" />
            <h2 className="text-2xl font-bold text-center mb-2 text-sky-700">
              Welcome to Fylder!
            </h2>
            <p
              className="mb-6 text-gray-600"
              dangerouslySetInnerHTML={{ __html: introStatus[0]?.message }}
            ></p>
            <button
              onClick={handleCloseModal}
              className="bg-sky-500 hover:bg-sky-600 text-white font-semibold px-6 py-2 rounded transition"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* ───── Rest of layout ───── */}
      <div className="flex justify-between items-center p-4  border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          {/* Mobile menu button */}
          <div className="md:hidden mr-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-700 dark:text-gray-200 focus:outline-none"
            >
              {sidebarOpen ? (
                <svg
                  className="w-6 h-6 text-black"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="w-6 h-6 text-sky-900"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
        {/* User dropdown */}
        <a onClick={(e) => e.preventDefault()} className="cursor-pointer">
          <Dropdown
            menu={{ items }}
            trigger={["click"]}
            placement="bottomRight"
          >
            <Space className="w-10 h-10  flex items-center justify-center rounded-full  bg-sky-500 text-white hover:bg-sky-600 transition-colors">
              <UserOutlined className="text-xl" />
            </Space>
          </Dropdown>
        </a>
      </div>

      <div className="flex flex-1 md:mt-[-40px]">
        {/* Sidebar */}
        <Sidebar
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />

        {/* Main Content */}
        <div
          className={`
            flex-1 transition-all duration-300
            ${collapsed ? "md:ml-[-100px]" : "md:ml-10"}
          `}
        >
          <RoutesConfig />
        </div>
      </div>

      {/* Customer Care Component */}
      <CustomerCare />

      {/* Add PIN Setup Modal */}
      <Modal
        title="Transaction PIN Required"
        open={isPinModalVisible}
        onOk={handleSetupPin}
        onCancel={() => setIsPinModalVisible(false)}
        okText="Setup PIN Now"
        cancelText="Remind Me Later"
        okButtonProps={{
          style: { backgroundColor: "#f59e0b" },
        }}
      >
        <div className="py-4">
          <p className="text-gray-600 mb-2">
            You haven't set up your transaction PIN yet. This is required for
            making transactions on our platform.
          </p>
          <p className="text-gray-600">
            Please set up your PIN to continue using our services securely.
          </p>
        </div>
      </Modal>
    </div>
  );
}

export default UserDashBoard;
