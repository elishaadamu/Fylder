import React, { useState, useEffect } from "react";
import { Form, Input, Select, Button } from "antd";
import Swal from "sweetalert2";
import { config } from "../../config/config";
import axios from "axios";
import CryptoJS from "crypto-js";
import { toast } from "react-toastify";

function Validation() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [states, setStates] = useState([]);
  const [lgas, setLgas] = useState([]);
  const [banks, setBanks] = useState([]);
  const [locationLoading, setLocationLoading] = useState(false);
  const [banksLoading, setBanksLoading] = useState(false);
  const [validationPrice, setValidationPrice] = useState(0);
  const [selectedValidationType, setSelectedValidationType] = useState(null);
  const [priceLoading, setPriceLoading] = useState(false);
  const [validationPrices, setValidationPrices] = useState({
    "No Record Found": 1000,
    "Modification Validation": 2500,
  });

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

  // Get userId from encrypted localStorage
  let userId = null;
  let userPhone = "";
  try {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const userObj = decryptData(userStr);
      userId = userObj?._id || userObj?.id;
      userPhone = userObj?.phone || userObj?.phoneNumber;
    }
  } catch (error) {
  }

  useEffect(() => {
    if (userPhone) {
      form.setFieldsValue({ phoneNumber: userPhone });
    }
  }, [userPhone, form]);

  // Fetch validation prices from API
  useEffect(() => {
    const fetchPrices = async () => {
      setPriceLoading(true);
      try {
        const response = await axios.get(
          `${config.apiBaseUrl}${config.endpoints.currentapipricing}`,
          { withCredentials: true }
        );

        // Find validation pricing
        const validationPricingData = Array.isArray(response.data)
          ? response.data.find((item) => item.key === "validation")
          : response.data;

        const validationPricing =
          validationPricingData?.key === "validation"
            ? validationPricingData
            : null;

        if (validationPricing && validationPricing.prices) {
          // Update validationPrices with agent price for "No Record Found"
          setValidationPrices((prev) => ({
            ...prev,
            "No Record Found": validationPricing.prices.agent,
          }));
        }
      } catch (error) {
        toast.error("Failed to fetch current prices");
      } finally {
        setPriceLoading(false);
      }
    };

    fetchPrices();
  }, []);

  const onFinish = async (values) => {
    const price = validationPrices[values.validationType] || 0;

    // Show confirmation dialog first
    const result = await Swal.fire({
      title: "Confirm Search",
      text: `Are you sure you want to proceed with this Validation Service? Amount: ₦${price}`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#f59e0b",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, proceed",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) {
      return;
    }

    setLoading(true);
    try {
      // Simplified payload to match new requirements
      const payload = {
        userId: userId,
        amount: price,
        validationType: values.validationType,
        nin: values.nin,
        phone: values.phoneNumber,
        pin: values.pin,
      };
      const response = await axios.post(
        `${config.apiBaseUrl}${config.endpoints.Validation}`,
        payload
      );
      

      await Swal.fire({
        icon: "success",
        title: "Registration Successful!",
        text: " ",
        confirmButtonColor: "#f59e0b",
      });

      form.resetFields();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Registration Failed",
        text:
          error.response?.data?.error ||
          error.message ||
          "Failed to submit request. Please try again.",
        confirmButtonColor: "#f59e0b",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleValidationTypeChange = (value) => {
    setSelectedValidationType(value);
    const price = validationPrices[value] || 0;
    setValidationPrice(price);
  };

  return (
    <div className="w-full rounded-2xl mb-5 bg-white p-5 shadow-lg">
      <h2 className="text-3xl text-center text-sky-500 font-semibold mb-4">
        Validation Services
      </h2>

      {/* Cost Display */}
      <div className="mb-6 my-5 bg-gray-50 rounded-lg">
        {selectedValidationType && (
          <p className="text-lg font-medium">
            This service will cost you ={" "}
            <span className="p-1 text-lg bg-green-100 text-green-900 rounded">
              ₦{validationPrice.toLocaleString()}.00
            </span>
          </p>
        )}
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        requiredMark={true}
      >
        {/* Slip Selection */}
        <Form.Item
          name="validationType"
          label="Select Slip"
          rules={[{ required: true, message: "Please select slip type" }]}
        >
          <Select
            size="large"
            placeholder="Select  Validation type"
            onChange={handleValidationTypeChange}
          >
            <Select.Option value="No Record Found">
              No Record Found
            </Select.Option>

            <Select.Option value="Modification Validation">
              Modification Validation
            </Select.Option>
          </Select>
        </Form.Item>

        {/* NIN Field */}
        <Form.Item
          name="nin"
          label="NIN"
          rules={[
            { required: true, message: "Please enter your NIN" },
            { pattern: /^\d{11}$/, message: "NIN must be exactly 11 digits" },
          ]}
        >
          <Input size="large" placeholder="Enter your NIN" autoComplete="off" />
        </Form.Item>

        {/* Phone Number Field */}
        <Form.Item
          name="phoneNumber"
          label="Phone Number"
          rules={[
            { required: true, message: "Please enter your phone number" },
            {
              pattern: /^\d{11}$/,
              message: "Phone number must be 11 digits",
            },
          ]}
        >
          <Input
            size="large"
            placeholder="Enter your phone number"
            readOnly={!!userPhone}
            className={userPhone ? "bg-gray-100 cursor-not-allowed" : ""}
          />
        </Form.Item>

        {/* PIN Field */}
        <Form.Item
          name="pin"
          label="Transaction PIN"
          rules={[
            { required: true, message: "Please enter your 4-digit PIN" },
            { pattern: /^\d{4}$/, message: "PIN must be exactly 4 digits" },
          ]}
        >
          <Input.Password
            maxLength={4}
            placeholder="Enter 4-digit PIN"
            size="large"
          />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            className="w-full justify-center flex items-center bg-sky-500 mt-[-5px]"
            loading={loading}
          >
            Submit
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}

export default Validation;
