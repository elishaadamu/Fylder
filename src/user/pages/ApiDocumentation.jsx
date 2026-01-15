import { useState, useEffect } from "react";
import axios from "axios";
import { config } from "../../config/config";
import CryptoJS from "crypto-js";
import { Modal, Button, Spin } from "antd";
import { CopyOutlined, LoadingOutlined } from "@ant-design/icons";
import { toast } from "react-toastify";

const ApiDocumentation = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [activeEndpoint, setActiveEndpoint] = useState("nin-verification");
  const [selectedLanguage, setSelectedLanguage] = useState("javascript");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiToken, setApiToken] = useState(null);

  const SECRET_KEY = import.meta.env.VITE_APP_SECRET_KEY;

  const decryptData = (ciphertext) => {
    if (!ciphertext) return null;
    try {
      const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      return JSON.parse(decrypted);
    } catch {
      return null;
    }
  };

  const codeExamples = {
    javascript: {
      "nin-verification": `// NIN Verification Example
const response = await fetch('https://api.yourwebsite.com/api/v1/verify/nin', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'your-api-key',
    'x-api-secret': 'your-api-secret'
  },
  body: JSON.stringify({
    nin: '12345678901'
  })
});

const data = await response.json();`,
      "bvn-verification": `// BVN Verification Example
const response = await fetch('https://api.yourwebsite.com/api/v1/verify/bvn', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'your-api-key',
    'x-api-secret': 'your-api-secret'
  },
  body: JSON.stringify({
    bvn: '12345678901'
  })
});

const data = await response.json();`,
      airtime: `// Airtime Purchase Example
const response = await fetch('https://api.yourwebsite.com/api/v1/vtu/airtime', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'your-api-key',
    'x-api-secret': 'your-api-secret'
  },
  body: JSON.stringify({
    network: '1', // 1=MTN, 2=GLO, 3=9MOBILE, 4=AIRTEL
    phone: '08012345678',
    amount: 1000,
    plan_type: 'VTU'
  })
});

const data = await response.json();`,
      "ipe-verification": `// IPE Verification Example
const response = await fetch('https://api.yourwebsite.com/api/v1/verify/ipe', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'your-api-key',
    'x-api-secret': 'your-api-secret'
  },
  body: JSON.stringify({
    tracking_id: 'IPE123456789'
  })
});

const data = await response.json();`,
      demographic: `// Demographic Search Example
const response = await fetch('https://api.yourwebsite.com/api/v1/verify/demographic', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'your-api-key',
    'x-api-secret': 'your-api-secret'
  },
  body: JSON.stringify({
    first_name: 'John',
    last_name: 'Doe',
    date_of_birth: '1990-01-01',
    state_of_origin: 'Lagos'
  })
});

const data = await response.json();`,
      personalization: `// Personalization Verification Example
const response = await fetch('https://api.yourwebsite.com/api/v1/verify/personalization', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'your-api-key',
    'x-api-secret': 'your-api-secret'
  },
  body: JSON.stringify({
    nin: '12345678901',
    verification_type: 'premium'
  })
});

const data = await response.json();`,
    },
    python: {
      "nin-verification": `# NIN Verification Example
import requests

url = "https://api.yourwebsite.com/api/v1/verify/nin"
headers = {
    "Content-Type": "application/json",
    "x-api-key": "your-api-key",
    "x-api-secret": "your-api-secret"
}
data = {
    "nin": "12345678901"
}

response = requests.post(url, headers=headers, json=data)
result = response.json()
print(result)`,
      "bvn-verification": `# BVN Verification Example
import requests

url = "https://api.yourwebsite.com/api/v1/verify/bvn"
headers = {
    "Content-Type": "application/json",
    "x-api-key": "your-api-key",
    "x-api-secret": "your-api-secret"
}
data = {
    "bvn": "12345678901"
}

response = requests.post(url, headers=headers, json=data)
result = response.json()`,
      airtime: `# Airtime Purchase Example
import requests

url = "https://api.yourwebsite.com/api/v1/vtu/airtime"
headers = {
    "Content-Type": "application/json",
    "x-api-key": "your-api-key",
    "x-api-secret": "your-api-secret"
}
data = {
    "network": "1",  # 1=MTN, 2=GLO, 3=9MOBILE, 4=AIRTEL
    "phone": "08012345678",
    "amount": 1000,
    "plan_type": "VTU"
}

response = requests.post(url, headers=headers, json=data)`,
    },
    php: {
      "nin-verification": `<?php
// NIN Verification Example
$url = 'https://api.yourwebsite.com/api/v1/verify/nin';
$headers = [
    'Content-Type: application/json',
    'x-api-key: your-api-key',
    'x-api-secret: your-api-secret'
];
$data = json_encode([
    'nin' => '12345678901'
]);

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
$result = json_decode($response, true);
curl_close($ch);

print_r($result);
?>`,
      "bvn-verification": `<?php
// BVN Verification Example
$url = 'https://api.yourwebsite.com/api/v1/verify/bvn';
$headers = [
    'Content-Type: application/json',
    'x-api-key: your-api-key',
    'x-api-secret: your-api-secret'
];
$data = json_encode([
    'bvn' => '12345678901'
]);

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
$result = json_decode($response, true);
?>`,
      airtime: `<?php
// Airtime Purchase Example
$url = 'https://api.yourwebsite.com/api/v1/vtu/airtime';
$headers = [
    'Content-Type: application/json',
    'x-api-key: your-api-key',
    'x-api-secret: your-api-secret'
];
$data = json_encode([
    'network' => '1', // 1=MTN, 2=GLO, 3=9MOBILE, 4=AIRTEL
    'phone' => '08012345678',
    'amount' => 1000,
    'plan_type' => 'VTU'
]);

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
?>`,
    },
  };

  const endpoints = [
    {
      id: "nin-verification",
      name: "NIN Verification",
      method: "POST",
      path: "/api/v1/verify/nin",
      description:
        "Verify National Identification Number and retrieve personal information",
      category: "Identity Verification",
    },
    {
      id: "bvn-verification",
      name: "BVN Verification",
      method: "POST",
      path: "/api/v1/verify/bvn",
      description:
        "Verify Bank Verification Number and retrieve banking information",
      category: "Identity Verification",
    },
    {
      id: "ipe-verification",
      name: "IPE Verification",
      method: "POST",
      path: "/api/v1/verify/ipe",
      description: "Verify IPE tracking ID and get status information",
      category: "Identity Verification",
    },
    {
      id: "airtime",
      name: "Airtime Purchase",
      method: "POST",
      path: "/api/v1/vtu/airtime",
      description: "Purchase airtime for all Nigerian networks",
      category: "VTU Services",
    },
    {
      id: "data",
      name: "Data Purchase",
      method: "POST",
      path: "/api/v1/vtu/data",
      description: "Purchase data bundles for all Nigerian networks",
      category: "VTU Services",
    },
    {
      id: "demographic",
      name: "Demographic Search",
      method: "POST",
      path: "/api/v1/verify/demographic",
      description: "Search for demographic information using personal details",
      category: "Identity Verification",
    },
    {
      id: "personalization",
      name: "Personalization Verification",
      method: "POST",
      path: "/api/v1/verify/personalization",
      description:
        "Verify NIN and retrieve personalized information based on verification type",
      category: "Identity Verification",
    },
  ];

  const errorCodes = [
    {
      code: "MISSING_REQUIRED_FIELD",
      status: 400,
      description: "A required field is missing from the request",
    },
    {
      code: "INVALID_NIN_FORMAT",
      status: 400,
      description: "NIN must be exactly 11 digits",
    },
    {
      code: "INVALID_BVN_FORMAT",
      status: 400,
      description: "BVN must be exactly 11 digits",
    },
    {
      code: "INVALID_PHONE_FORMAT",
      status: 400,
      description: "Phone number format is invalid",
    },
    {
      code: "VALIDATION_ERROR",
      status: 400,
      description: "One or more fields contain invalid data",
    },
    {
      code: "UNAUTHORIZED",
      status: 401,
      description: "Invalid API credentials",
    },
    {
      code: "INSUFFICIENT_BALANCE",
      status: 402,
      description: "Account balance is insufficient",
    },
    {
      code: "FORBIDDEN",
      status: 403,
      description: "API key lacks required permissions",
    },
    {
      code: "RATE_LIMIT_EXCEEDED",
      status: 429,
      description: "Too many requests, rate limit exceeded",
    },
    {
      code: "VERIFICATION_FAILED",
      status: 422,
      description: "Verification could not be completed",
    },
    {
      code: "PURCHASE_FAILED",
      status: 422,
      description: "Purchase transaction failed",
    },
    {
      code: "INTERNAL_SERVER_ERROR",
      status: 500,
      description: "An unexpected server error occurred",
    },
    {
      code: "GATEWAY_TIMEOUT",
      status: 504,
      description: "Request timeout from upstream service",
    },
  ];

  const handleGetApiKey = async () => {
    setLoading(true);
    try {
      // Get userId from encrypted localStorage
      const userStr = localStorage.getItem("user");
      if (!userStr) {
        toast.error("Please login to generate API key");
        return;
      }

      const userObj = decryptData(userStr);
      const userId = userObj?._id || userObj?.id;

      if (!userId) {
        toast.error("User ID not found");
        return;
      }

      const response = await axios.post(
        `${config.apiBaseUrl}${config.endpoints.apitoken}`,
        { userId },
        { withCredentials: true }
      );

      if (response.data) {
        setApiToken(response.data.token);
        setIsModalVisible(true);
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to generate API key"
      );
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${type} copied successfully!`, {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } catch (error) {
      toast.error("Failed to copy to clipboard", {
        position: "top-right",
        autoClose: 2000,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-1 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3 md:py-6">
            <div className="flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden mr-4 p-1 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  {isMobileMenuOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </button>
              <div className="flex-shrink-0">
                <h1 className="text-lg md:text-2xl font-bold text-gray-900">
                  API Documentation
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                v1.0.0
              </span>
              <button
                onClick={handleGetApiKey}
                className="bg-blue-600 hover:bg-blue-700 text-white px-2 md:px-4 py-2 rounded-md text-sm font-medium flex items-center"
                disabled={loading}
              >
                {loading ? <LoadingOutlined className="mr-2" /> : null}
                Get API Key
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8 relative">
          {isMobileMenuOpen && (
            <div className="lg:hidden fixed inset-0 z-50 flex">
              {/* Backdrop */}
              <div
                className="fixed inset-0 bg-black bg-opacity-50"
                onClick={() => setIsMobileMenuOpen(false)}
              ></div>

              {/* Sidebar */}
              <div className="relative flex flex-col w-80 max-w-xs bg-white shadow-xl">
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Navigation
                  </h2>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                  >
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                  <nav className="space-y-1">
                    <div className="pb-4">
                      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                        Navigation
                      </h3>
                      <div className="mt-2 space-y-1">
                        {[
                          "overview",
                          "authentication",
                          "endpoints",
                          "errors",
                          "rate-limits",
                          "webhooks",
                          "sdks",
                        ].map((tab) => (
                          <button
                            key={tab}
                            onClick={() => {
                              setActiveTab(tab);
                              setIsMobileMenuOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-sm rounded-md capitalize ${
                              activeTab === tab
                                ? "bg-blue-100 text-blue-700 font-medium"
                                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                            }`}
                          >
                            {tab.replace("-", " ")}
                          </button>
                        ))}
                      </div>
                    </div>

                    {activeTab === "endpoints" && (
                      <div className="pt-4 border-t border-gray-200">
                        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                          Endpoints
                        </h3>
                        <div className="mt-2 space-y-1">
                          {endpoints.map((endpoint) => (
                            <button
                              key={endpoint.id}
                              onClick={() => {
                                setActiveEndpoint(endpoint.id);
                                setIsMobileMenuOpen(false);
                              }}
                              className={`w-full text-left px-3 py-2 text-sm rounded-md ${
                                activeEndpoint === endpoint.id
                                  ? "bg-green-100 text-green-700 font-medium"
                                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="truncate">
                                  {endpoint.name}
                                </span>
                                <span
                                  className={`ml-2 px-2 py-0.5 text-xs rounded flex-shrink-0 ${
                                    endpoint.method === "POST"
                                      ? "bg-orange-100 text-orange-800"
                                      : "bg-blue-100 text-blue-800"
                                  }`}
                                >
                                  {endpoint.method}
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </nav>
                </div>
              </div>
            </div>
          )}

          {/* Desktop Sidebar */}
          <div className="hidden lg:block lg:w-1/4">
            <nav className="space-y-1 sticky top-8">
              <div className="pb-4">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                  Navigation
                </h3>
                <div className="mt-2 space-y-1">
                  {[
                    "overview",
                    "authentication",
                    "endpoints",
                    "errors",
                    "rate-limits",
                    "webhooks",
                  ].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`w-full text-left px-3 py-2 text-sm rounded-md capitalize ${
                        activeTab === tab
                          ? "bg-blue-100 text-blue-700 font-medium"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      }`}
                    >
                      {tab.replace("-", " ")}
                    </button>
                  ))}
                </div>
              </div>

              {activeTab === "endpoints" && (
                <div className="pt-4 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                    Endpoints
                  </h3>
                  <div className="mt-2 space-y-1">
                    {endpoints.map((endpoint) => (
                      <button
                        key={endpoint.id}
                        onClick={() => setActiveEndpoint(endpoint.id)}
                        className={`w-full text-left px-3 py-2 text-sm rounded-md ${
                          activeEndpoint === endpoint.id
                            ? "bg-green-100 text-green-700 font-medium"
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{endpoint.name}</span>
                          <span
                            className={`px-2 py-0.5 text-xs rounded ${
                              endpoint.method === "POST"
                                ? "bg-orange-100 text-orange-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {endpoint.method}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 lg:w-3/4">
            {activeTab === "overview" && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    Welcome to Our API
                  </h2>
                  <p className="text-lg text-gray-600 mb-6">
                    Our comprehensive API provides access to identity
                    verification services and VTU (Virtual Top-Up) services
                    across Nigeria. Built for developers, by developers.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                      <svg
                        className="w-6 h-6 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Identity Verification
                    </h3>
                    <p className="text-gray-600">
                      Verify NIN, BVN, and other identity documents with
                      real-time data from official sources.
                    </p>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                      <svg
                        className="w-6 h-6 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      VTU Services
                    </h3>
                    <p className="text-gray-600">
                      Purchase airtime and data for all major Nigerian networks
                      with instant delivery.
                    </p>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                      <svg
                        className="w-6 h-6 text-purple-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Real-time Processing
                    </h3>
                    <p className="text-gray-600">
                      All requests are processed in real-time with comprehensive
                      response data and error handling.
                    </p>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    Quick Start
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                        1
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">
                          Get API Credentials
                        </h4>
                        <p className="text-gray-600">
                          Sign up for an account and generate your API key and
                          secret from the dashboard.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                        2
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">
                          Fund Your Account
                        </h4>
                        <p className="text-gray-600">
                          Add funds to your wallet to start using our
                          pay-per-use services.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                        3
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">
                          Make Your First Request
                        </h4>
                        <p className="text-gray-600">
                          Use our comprehensive API to start verifying
                          identities or purchasing VTU services.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <div className="flex items-start space-x-3">
                    <svg
                      className="w-6 h-6 text-blue-600 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <div>
                      <h4 className="font-medium text-blue-900">Base URL</h4>
                      <p className="text-blue-700 font-mono text-sm mt-1">
                        https://api.ayverify.com.ng/api/v1
                      </p>
                      <p className="text-blue-600 text-sm mt-2">
                        All API requests should be made to this base URL with
                        the appropriate endpoint path.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "authentication" && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    Authentication
                  </h2>
                  <p className="text-lg text-gray-600 mb-6">
                    Our API uses API key and secret authentication. You need to
                    include both in your request headers.
                  </p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    Required Headers
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">
                        x-api-key
                      </h4>
                      <p className="text-gray-600 mb-2">
                        Your public API key (starts with pk_)
                      </p>
                      <div className="bg-gray-50 p-3 rounded-md font-mono text-sm">
                        x-api-key: pk_1234567890abcdef1234567890abcdef
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">
                        x-api-secret
                      </h4>
                      <p className="text-gray-600 mb-2">
                        Your private API secret (starts with sk_)
                      </p>
                      <div className="bg-gray-50 p-3 rounded-md font-mono text-sm">
                        x-api-secret:
                        sk_abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    Example Request
                  </h3>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                    <pre className="whitespace-pre-wrap break-words lg:whitespace-pre lg:break-normal">
                      <code>
                        {`curl -X POST https://api.yourwebsite.com/api/v1/verify/nin \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: pk_1234567890abcdef1234567890abcdef" \\
  -H "x-api-secret: sk_abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890" \\
  -d '{"nin": "12345678901"}'`}
                      </code>
                    </pre>
                  </div>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                  <div className="flex items-start space-x-3">
                    <svg
                      className="w-6 h-6 text-red-600 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                    <div>
                      <h4 className="font-medium text-red-900">
                        Security Notice
                      </h4>
                      <p className="text-red-700 text-sm mt-1">
                        Never expose your API secret in client-side code. Always
                        make API calls from your server-side application. Store
                        your credentials securely using environment variables.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "endpoints" && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    API Endpoints
                  </h2>
                  <p className="text-lg text-gray-600 mb-6">
                    Comprehensive documentation for all available API endpoints
                    with examples and response formats.
                  </p>
                </div>

                {/* Endpoint Details */}
                {endpoints
                  .filter((e) => e.id === activeEndpoint)
                  .map((endpoint) => (
                    <div key={endpoint.id} className="space-y-6">
                      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-2xl font-semibold text-gray-900">
                            {endpoint.name}
                          </h3>
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                            {endpoint.category}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-4">
                          {endpoint.description}
                        </p>

                        <div className="flex items-center space-x-4 mb-6">
                          <span
                            className={`px-3 py-1 rounded text-sm font-medium ${
                              endpoint.method === "POST"
                                ? "bg-orange-100 text-orange-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {endpoint.method}
                          </span>
                          <code className="bg-gray-100 px-3 py-1 rounded text-sm font-mono">
                            {endpoint.path}
                          </code>
                        </div>

                        {/* Request Parameters */}
                        <div className="mb-6">
                          <h4 className="text-lg font-semibold text-gray-900 mb-3">
                            Request Parameters
                          </h4>
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Parameter
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Type
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Required
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Description
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {endpoint.id === "nin-verification" && (
                                  <tr>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                      nin
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      string
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                                      Yes
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                      11-digit National Identification Number
                                    </td>
                                  </tr>
                                )}
                                {endpoint.id === "bvn-verification" && (
                                  <tr>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                      bvn
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      string
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                                      Yes
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                      11-digit Bank Verification Number
                                    </td>
                                  </tr>
                                )}
                                {endpoint.id === "airtime" && (
                                  <>
                                    <tr>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        network
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        string
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                                        Yes
                                      </td>
                                      <td className="px-6 py-4 text-sm text-gray-500">
                                        Network code (1=MTN, 2=GLO, 3=9MOBILE,
                                        4=AIRTEL)
                                      </td>
                                    </tr>
                                    <tr>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        phone
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        string
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                                        Yes
                                      </td>
                                      <td className="px-6 py-4 text-sm text-gray-500">
                                        Nigerian phone number (e.g.,
                                        08012345678)
                                      </td>
                                    </tr>
                                    <tr>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        amount
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        number
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                                        Yes
                                      </td>
                                      <td className="px-6 py-4 text-sm text-gray-500">
                                        Amount in Naira (minimum: 50, maximum:
                                        50000)
                                      </td>
                                    </tr>
                                    <tr>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        plan_type
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        string
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        No
                                      </td>
                                      <td className="px-6 py-4 text-sm text-gray-500">
                                        VTU or SHARE (default: VTU)
                                      </td>
                                    </tr>
                                  </>
                                )}
                                {endpoint.id === "ipe-verification" && (
                                  <tr>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                      tracking_id
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      string
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                                      Yes
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                      IPE tracking ID (5-50 characters)
                                    </td>
                                  </tr>
                                )}
                                {endpoint.id === "demographic" && (
                                  <>
                                    <tr>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        first_name
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        string
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                                        Yes
                                      </td>
                                      <td className="px-6 py-4 text-sm text-gray-500">
                                        First name (2-50 characters)
                                      </td>
                                    </tr>
                                    <tr>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        last_name
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        string
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                                        Yes
                                      </td>
                                      <td className="px-6 py-4 text-sm text-gray-500">
                                        Last name (2-50 characters)
                                      </td>
                                    </tr>
                                    <tr>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        date_of_birth
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        string
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        No
                                      </td>
                                      <td className="px-6 py-4 text-sm text-gray-500">
                                        Date in YYYY-MM-DD format
                                      </td>
                                    </tr>
                                    <tr>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        state_of_origin
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        string
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        No
                                      </td>
                                      <td className="px-6 py-4 text-sm text-gray-500">
                                        Nigerian state name
                                      </td>
                                    </tr>
                                  </>
                                )}
                                {endpoint.id === "personalization" && (
                                  <>
                                    <tr>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        nin
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        string
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                                        Yes
                                      </td>
                                      <td className="px-6 py-4 text-sm text-gray-500">
                                        11-digit National Identification Number
                                      </td>
                                    </tr>
                                    <tr>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        verification_type
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        string
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        No
                                      </td>
                                      <td className="px-6 py-4 text-sm text-gray-500">
                                        regular, premium, or basic (default:
                                        regular)
                                      </td>
                                    </tr>
                                  </>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Code Examples */}
                        <div className="mb-6">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-lg font-semibold text-gray-900">
                              Code Examples
                            </h4>
                            <div className="flex space-x-2">
                              {["javascript", "python", "php"].map((lang) => (
                                <button
                                  key={lang}
                                  onClick={() => setSelectedLanguage(lang)}
                                  className={`px-3 py-1 text-sm rounded ${
                                    selectedLanguage === lang
                                      ? "bg-blue-600 text-white"
                                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                  }`}
                                >
                                  {lang.charAt(0).toUpperCase() + lang.slice(1)}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                            <pre className="whitespace-pre-wrap break-words lg:whitespace-pre lg:break-normal">
                              <code>
                                {codeExamples[selectedLanguage][endpoint.id]}
                              </code>
                            </pre>
                          </div>
                        </div>

                        {/* Response Example */}
                        <div className="mb-6">
                          <h4 className="text-lg font-semibold text-gray-900 mb-3">
                            Success Response
                          </h4>
                          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                            <pre className="whitespace-pre-wrap break-words lg:whitespace-pre lg:break-normal">
                              <code>
                                {endpoint.id === "nin-verification" &&
                                  `{
                                  "success": true,
                                  "message": "NIN verification completed successfully",
                                  "data": {
                                    "nin": "12345678901",
                                    "verification_status": "VERIFIED",
                                    "personal_information": {
                                      "first_name": "John",
                                      "middle_name": "Doe",
                                      "last_name": "Smith",
                                      "full_name": "John Doe Smith",
                                      "date_of_birth": "1990-01-01",
                                      "gender": "Male",
                                      "phone_number": "08012345678",
                                      "email_address": "john@example.com",
                                      "state_of_origin": "Lagos",
                                      "nationality": "Nigerian"
                                    },
                                    "verification_details": {
                                      "verified_at": "2024-01-15T10:30:00Z",
                                      "verification_method": "National Identity Database",
                                      "confidence_score": "HIGH",
                                      "data_source": "NIMC (National Identity Management Commission)"
                                    }
                                  },
                                  "billing": {
                                    "amount_charged": 120,
                                    "currency": "NGN",
                                    "remaining_balance": 8750,
                                    "transaction_reference": "TXN_nin_1705312200_abc123",
                                    "billing_cycle": "Pay-per-use"
                                  },
                                  "meta": {
                                    "request_id": "nin_1705312200_abc123",
                                    "timestamp": "2024-01-15T10:30:00Z",
                                    "response_time": "1250ms",
                                    "api_version": "v1.0.0",
                                    "provider": "Prembly Identity Pass"
                                  }
                                }`}
                                {endpoint.id === "bvn-verification" &&
                                  `{
                                  "success": true,
                                  "message": "BVN verification completed successfully",
                                  "data": {
                                    "bvn": "12345678901",
                                    "verification_status": "VERIFIED",
                                    "personal_information": {
                                      "first_name": "John",
                                      "middle_name": "Doe",
                                      "last_name": "Smith",
                                      "full_name": "John Doe Smith",
                                      "date_of_birth": "1990-01-01",
                                      "gender": "Male",
                                      "phone_number": "08012345678",
                                      "email_address": "john@example.com"
                                    },
                                    "banking_information": {
                                      "enrollment_bank": "First Bank of Nigeria",
                                      "enrollment_branch": "Victoria Island",
                                      "registration_date": "2015-03-20",
                                      "level_of_account": "Level 3",
                                      "account_status": "Active"
                                    }
                                  },
                                  "billing": {
                                    "amount_charged": 120,
                                    "currency": "NGN",
                                    "remaining_balance": 8630
                                  }
                                }`}
                                {endpoint.id === "airtime" &&
                                  `{
                                  "success": true,
                                  "message": "Airtime purchase completed successfully",
                                  "data": {
                                    "transaction_id": "HSM_1705312200_xyz789",
                                    "network": {
                                      "name": "MTN",
                                      "code": "MTN",
                                      "network_id": "1"
                                    },
                                    "recipient": {
                                      "phone_number": "08012345678",
                                      "formatted_phone": "+2348012345678"
                                    },
                                    "purchase_details": {
                                      "amount": 1000,
                                      "currency": "NGN",
                                      "plan_type": "VTU",
                                      "status": "SUCCESSFUL",
                                      "completed_at": "2024-01-15T10:30:00Z"
                                    },
                                    "delivery_info": {
                                      "delivery_status": "DELIVERED",
                                      "delivery_method": "INSTANT",
                                      "estimated_delivery": "Immediate"
                                    }
                                  },
                                  "billing": {
                                    "base_amount": 1000,
                                    "service_fee": 20,
                                    "total_charged": 1020,
                                    "currency": "NGN",
                                    "remaining_balance": 7610
                                  }
                                }`}
                              </code>
                            </pre>
                          </div>
                        </div>

                        {/* Pricing */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <h4 className="font-medium text-blue-900 mb-2">
                            Pricing
                          </h4>
                          <p className="text-blue-700 text-sm">
                            {endpoint.id === "nin-verification" &&
                              "₦120 per successful verification"}
                            {endpoint.id === "bvn-verification" &&
                              "₦120 per successful verification"}
                            {endpoint.id === "airtime" &&
                              "2% service fee on purchase amount (minimum ₦1)"}
                            {endpoint.id === "data" &&
                              "3% service fee on purchase amount (minimum ₦2)"}
                            {endpoint.id === "ipe-verification" &&
                              "₦80 per successful verification"}
                            {endpoint.id === "demographic" &&
                              "₦150 per successful search"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {activeTab === "errors" && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    Error Handling
                  </h2>
                  <p className="text-lg text-gray-600 mb-6">
                    Our API uses conventional HTTP response codes and provides
                    detailed error information to help you debug issues quickly.
                  </p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    Error Response Format
                  </h3>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm mb-4">
                    <pre className="whitespace-pre-wrap break-words lg:whitespace-pre lg:break-normal">
                      <code>
                        {`{
                        "success": false,
                        "message": "Human-readable error message",
                        "error": {
                          "code": "ERROR_CODE",
                          "description": "Detailed error description",
                          "field": "field_name", // if applicable
                          "validation_errors": [...] // for validation errors
                        },
                        "data": null,
                        "meta": {
                          "request_id": "unique_request_id",
                          "timestamp": "2024-01-15T10:30:00Z",
                          "response_time": "150ms",
                          "api_version": "v1.0.0"
                        }
                      }`}
                      </code>
                    </pre>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    HTTP Status Codes
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          200
                        </span>
                        <span className="text-sm text-gray-600">
                          OK - Request successful
                        </span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          400
                        </span>
                        <span className="text-sm text-gray-600">
                          Bad Request - Invalid parameters
                        </span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          401
                        </span>
                        <span className="text-sm text-gray-600">
                          Unauthorized - Invalid credentials
                        </span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          402
                        </span>
                        <span className="text-sm text-gray-600">
                          Payment Required - Insufficient balance
                        </span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          403
                        </span>
                        <span className="text-sm text-gray-600">
                          Forbidden - Insufficient permissions
                        </span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          422
                        </span>
                        <span className="text-sm text-gray-600">
                          Unprocessable Entity - Verification failed
                        </span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          429
                        </span>
                        <span className="text-sm text-gray-600">
                          Too Many Requests - Rate limit exceeded
                        </span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          500
                        </span>
                        <span className="text-sm text-gray-600">
                          Internal Server Error
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    Error Codes Reference
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Error Code
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            HTTP Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Description
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {errorCodes.map((error, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                              {error.code}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  error.status < 400
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {error.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {error.description}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                  <div className="flex items-start space-x-3">
                    <svg
                      className="w-6 h-6 text-yellow-600 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                    <div>
                      <h4 className="font-medium text-yellow-900">
                        Best Practices
                      </h4>
                      <ul className="text-yellow-700 text-sm mt-2 space-y-1">
                        <li>
                          • Always check the success field in the response
                        </li>
                        <li>• Use the request_id for support inquiries</li>
                        <li>
                          • Implement proper error handling for all status codes
                        </li>
                        <li>• Log error responses for debugging purposes</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "rate-limits" && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    Rate Limits
                  </h2>
                  <p className="text-lg text-gray-600 mb-6">
                    To ensure fair usage and system stability, our API
                    implements rate limiting on all endpoints.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Per Minute
                    </h3>
                    <p className="text-3xl font-bold text-blue-600 mb-2">60</p>
                    <p className="text-gray-600 text-sm">requests per minute</p>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Per Hour
                    </h3>
                    <p className="text-3xl font-bold text-green-600 mb-2">
                      1,000
                    </p>
                    <p className="text-gray-600 text-sm">requests per hour</p>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Per Day
                    </h3>
                    <p className="text-3xl font-bold text-purple-600 mb-2">
                      10,000
                    </p>
                    <p className="text-gray-600 text-sm">requests per day</p>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    Rate Limit Headers
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Every API response includes rate limit information in the
                    headers:
                  </p>
                  <div className="bg-gray-50 p-4 rounded-lg font-mono text-sm space-y-1">
                    <div>X-RateLimit-Limit: 60</div>
                    <div>X-RateLimit-Remaining: 45</div>
                    <div>X-RateLimit-Reset: 1705312800</div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    Custom Rate Limits
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Enterprise customers can request custom rate limits based on
                    their usage requirements. Contact our sales team for more
                    information.
                  </p>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                    Contact Sales
                  </button>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                  <div className="flex items-start space-x-3">
                    <svg
                      className="w-6 h-6 text-red-600 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                    <div>
                      <h4 className="font-medium text-red-900">
                        Rate Limit Exceeded
                      </h4>
                      <p className="text-red-700 text-sm mt-1">
                        When you exceed the rate limit, you'll receive a 429
                        status code. Wait for the reset time before making
                        additional requests.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "webhooks" && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    Webhooks
                  </h2>
                  <p className="text-lg text-gray-600 mb-6">
                    Receive real-time notifications about your API transactions
                    and account events.
                  </p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    Webhook Events
                  </h3>
                  <div className="space-y-4">
                    <div className="border-l-4 border-blue-500 pl-4">
                      <h4 className="font-medium text-gray-900">
                        transaction.completed
                      </h4>
                      <p className="text-gray-600 text-sm">
                        Sent when a verification or VTU transaction is completed
                        successfully
                      </p>
                    </div>
                    <div className="border-l-4 border-red-500 pl-4">
                      <h4 className="font-medium text-gray-900">
                        transaction.failed
                      </h4>
                      <p className="text-gray-600 text-sm">
                        Sent when a transaction fails for any reason
                      </p>
                    </div>
                    <div className="border-l-4 border-yellow-500 pl-4">
                      <h4 className="font-medium text-gray-900">balance.low</h4>
                      <p className="text-gray-600 text-sm">
                        Sent when your account balance falls below a threshold
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    Webhook Payload Example
                  </h3>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                    <pre className="whitespace-pre-wrap break-words lg:whitespace-pre lg:break-normal">
                      <code>
                        {`{
                          "event": "transaction.completed",
                          "data": {
                            "transaction_id": "txn_1705312200_abc123",
                            "service": "nin_verification",
                            "status": "completed",
                            "amount_charged": 120,
                            "currency": "NGN",
                            "completed_at": "2024-01-15T10:30:00Z",
                            "request_data": {
                              "nin": "12345678901"
                            },
                            "response_data": {
                              "verification_status": "VERIFIED",
                              "personal_information": {...}
                            }
                          },
                          "api_key": "pk_1234567890abcdef",
                          "timestamp": "2024-01-15T10:30:00Z",
                          "signature": "webhook_signature_hash"
                        }`}
                      </code>
                    </pre>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <div className="flex items-start space-x-3">
                    <svg
                      className="w-6 h-6 text-blue-600 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <div>
                      <h4 className="font-medium text-blue-900">
                        Webhook Security
                      </h4>
                      <p className="text-blue-700 text-sm mt-1">
                        All webhook payloads are signed with your webhook
                        secret. Always verify the signature to ensure the
                        webhook is from our servers.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal
        title="Your API Credentials"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsModalVisible(false)}>
            Close
          </Button>,
        ]}
      >
        {apiToken ? (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-500">
                  API Key
                </span>
                <Button
                  icon={<CopyOutlined />}
                  size="small"
                  onClick={() => copyToClipboard(apiToken.apiKey)}
                >
                  Copy
                </Button>
              </div>
              <p className="font-mono text-sm break-all">{apiToken.apiKey}</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-500">
                  API Secret
                </span>
                <Button
                  icon={<CopyOutlined />}
                  size="small"
                  onClick={() => copyToClipboard(apiToken.secretKey)}
                >
                  Copy
                </Button>
              </div>
              <p className="font-mono text-sm break-all">
                {apiToken.secretKey}
              </p>
            </div>

            <div className="mt-4">
              <h4 className="text-sm font-medium text-red-600 mb-2">
                Important:
              </h4>
              <ul className="text-sm text-gray-600 list-disc pl-4 space-y-1">
                <li>Store these credentials securely</li>
                <li>Never share your API secret</li>
                <li>Use environment variables in production</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="flex justify-center items-center h-32">
            <Spin />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ApiDocumentation;
