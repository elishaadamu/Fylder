import React, { useState, useEffect } from "react";
import { Form, Input, Select, DatePicker, Button, Row, Col } from "antd";
import Swal from "sweetalert2";
import { config } from "../../config/config";
import CryptoJS from "crypto-js";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import axios from "axios";
import { toast } from "react-toastify";

function DemographicSearch() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [isBankOpen, setIsBankOpen] = useState(false);
  const [isStateOpen, setIsStateOpen] = useState(false);
  const [isLgaOpen, setIsLgaOpen] = useState(false);
  // Add state for PIN visibility
  const [showPin, setShowPin] = useState(false);

  // Add state for API prices
  const [demographicPrices, setDemographicPrices] = useState({
    premium: 0,
    standard: 0,
    digital: 0,
  });
  const [priceLoading, setPriceLoading] = useState(true);

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

  // Add useEffect to fetch prices when component mounts
  useEffect(() => {
    const fetchPrices = async () => {
      setPriceLoading(true);
      try {
        const response = await axios.get(
          `${config.apiBaseUrl}${config.endpoints.currentapipricing}`,
          { withCredentials: true }
        );
        // Find demographic search pricing
        const demographicPricingData = response.data.find(
          (item) => item.key === "demographic"
        );

        if (demographicPricingData && demographicPricingData.prices) {
          setDemographicPrices({
            premium: demographicPricingData.prices.agent || 0,
            standard: demographicPricingData.prices.agent || 0,
            digital: demographicPricingData.prices.agent || 0,
          });
        }
      } catch (error) {
        toast.error("Failed to fetch current prices");
      } finally {
        setPriceLoading(false);
      }
    };

    fetchPrices();
  }, []);

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

  const onFinish = async (values) => {
    const amount = demographicPrices[values.slipType];
    // Show confirmation dialog first
    const result = await Swal.fire({
      title: "Confirm Search",
      text: `Are you sure you want to proceed with this demographic search? Amount: ₦${amount}`,
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
        amount: amount,
        firstName: values.firstName,
        lastName: values.lastName,
        dob: values.dob.format("DD-MM-YYYY"),
        phone: values.phoneNumber,
        gender: values.gender,
        pin: values.pin,
      };

      const response = await axios.post(
        `${config.apiBaseUrl}${config.endpoints.DemographicSearch}`,
        payload,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      await Swal.fire({
        icon: "success",
        title: "Success",
        text: "Demographic search completed successfully.",
        confirmButtonColor: "#f59e0b",
      });

      form.resetFields();
    } catch (error) {
      // Handle axios error responses
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to perform demographic search. Please try again.";

      Swal.fire({
        icon: "error",
        title: "Search Failed",
        text: errorMessage,
        confirmButtonColor: "#f59e0b",
      });
    } finally {
      setLoading(false);
    }
  };

  // effect to handle body scroll
  useEffect(() => {
    if (isBankOpen || isStateOpen || isLgaOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isBankOpen, isStateOpen, isLgaOpen]);

  return (
    <div className="w-full rounded-2xl mb-5 bg-white p-5 shadow-lg">
      <h2 className="text-3xl text-center text-sky-500 font-semibold mb-4">
        Demographic Search
      </h2>

      {/* Cost Display */}
      <div className="mb-6 my-5 bg-gray-50 rounded-lg"></div>

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        requiredMark={true}
      >
        {/* Slip Selection - Fixed with unique keys */}
        <Form.Item
          name="slipType"
          label="Select Slip"
          rules={[{ required: true, message: "Please select slip type" }]}
        >
          <Select
            size="large"
            placeholder="Select slip type"
            loading={priceLoading}
          >
            <Select.Option key="premium" value="premium">
              Premium Slip = ₦{demographicPrices.premium}
            </Select.Option>
            <Select.Option key="standard" value="standard">
              Standard Slip = ₦{demographicPrices.standard}
            </Select.Option>
            <Select.Option key="digital" value="digital">
              Digital Slip = ₦{demographicPrices.digital}
            </Select.Option>
          </Select>
        </Form.Item>

        {/* Rest of your existing form fields... */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="firstName"
              label="First Name"
              rules={[{ required: true, message: "Please enter first name" }]}
            >
              <Input size="large" placeholder="Enter first name" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="lastName"
              label="Last Name"
              rules={[{ required: true, message: "Please enter last name" }]}
            >
              <Input size="large" placeholder="Enter last name" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="gender"
              label="Gender"
              rules={[{ required: true, message: "Please select gender" }]}
            >
              <Select size="large" placeholder="Select gender">
                <Select.Option value="male">Male</Select.Option>
                <Select.Option value="female">Female</Select.Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="dob"
              label="Date of Birth"
              rules={[{ required: true }]}
            >
              <DatePicker className="w-full" size="large" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="phoneNumber"
          label="Phone Number"
          rules={[
            { required: true, message: "Please enter phone number" },
            {
              pattern: /^\d{11}$/,
              message: "Phone number must be 11 digits",
            },
          ]}
        >
          <Input
            size="large"
            placeholder="Enter 11-digit phone number"
            readOnly={!!userPhone}
            className={userPhone ? "bg-gray-100 cursor-not-allowed" : ""}
          />
        </Form.Item>

        <Form.Item
          name="pin"
          label="Transaction PIN"
          rules={[
            { required: true, message: "Please enter your 4-digit PIN" },
            { pattern: /^\d{4}$/, message: "PIN must be exactly 4 digits" },
          ]}
        >
          <Input.Password
            size="large"
            maxLength={4}
            placeholder="Enter 4-digit PIN"
            autoComplete="current-password"
            iconRender={(visible) => (
              <span
                onClick={() => setShowPin(!visible)}
                className="cursor-pointer"
              >
                {visible ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
              </span>
            )}
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
            Demographic Search
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}

export default DemographicSearch;
