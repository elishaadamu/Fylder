import React, { useState, useEffect } from "react";
import { Form, Input, Button, Card } from "antd";
import { LockOutlined } from "@ant-design/icons";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import CryptoJS from "crypto-js";
import { config } from "../../config/config.jsx";
import { useNavigate, useLocation } from "react-router-dom";

// Get the secret key from environment variables
const SECRET_KEY = import.meta.env.VITE_APP_SECRET_KEY;

// Decryption function
function decryptData(encryptedData) {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
    const decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    return decryptedData;
  } catch (error) {
    return null;
  }
}

function SetPin() {
  const navigate = useNavigate();
  const location = useLocation();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const returnPath = location.state?.returnPath || "/dashboard/";

  const onFinish = async (values) => {
    setLoading(true);

    try {
      const encryptedUser = localStorage.getItem("user");
      if (!encryptedUser) {
        toast.error("User not found! Is an Account Created?");
        navigate("/login");
        return;
      }

      const decryptedUser = decryptData(encryptedUser);
      const userId = decryptedUser?.id;
      if (values.pin !== values.confirmPin) {
        toast.error("PINs do not match!");
        return;
      }

      const pinLoad = {
        newPin: values.pin,
      };
      const response = await axios.post(
        `${config.apiBaseUrl}${config.endpoints.setPin}${userId}`,
        pinLoad,
        { withCredentials: true }
      );

      if (response.data) {
        // Update user object in localStorage
        const updatedUser = {
          ...decryptedUser,
          hasPin: true,
        };
        const encryptedUpdatedUser = CryptoJS.AES.encrypt(
          JSON.stringify(updatedUser),
          SECRET_KEY
        ).toString();
        localStorage.setItem("user", encryptedUpdatedUser);

        // Dispatch event to notify dashboard
        window.dispatchEvent(new Event("pinSetSuccess"));

        // Show success toast and navigate
        toast.success("PIN set successfully!", {
          position: "top-right",
          autoClose: 2000,
          onClose: () => {
            navigate(returnPath);
          },
        });
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to set PIN. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <ToastContainer />
      <Card title="Set Your PIN" className="w-full max-w-md shadow-lg">
        <Form
          form={form}
          name="set_pin"
          onFinish={onFinish}
          layout="vertical"
          autoComplete="off"
        >
          <Form.Item
            name="pin"
            label="Enter PIN"
            rules={[
              { required: true, message: "Please input your PIN!" },
              { len: 4, message: "PIN must be 4 digits" },
              { pattern: /^\d+$/, message: "PIN must contain only numbers" },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Enter 4-digit PIN"
              maxLength={4}
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="confirmPin"
            label="Confirm PIN"
            rules={[
              { required: true, message: "Please confirm your PIN!" },
              { len: 4, message: "PIN must be 4 digits" },
              { pattern: /^\d+$/, message: "PIN must contain only numbers" },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Confirm 4-digit PIN"
              maxLength={4}
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
            >
              Set PIN
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

export default SetPin;
