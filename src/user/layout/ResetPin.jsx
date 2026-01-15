import React, { useState } from "react";
import { Form, Input, Button, Card, Typography } from "antd";
import { toast, ToastContainer } from "react-toastify";
import axios from "axios";
import { config } from "../../config/config";
import CryptoJS from "crypto-js";

const { Title, Text } = Typography;

function ResetPin() {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

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

  const onFinish = async (values) => {
    if (values.newPin !== values.confirmNewPin) {
      toast.error("New PINs do not match!");
      return;
    }

    setLoading(true);
    try {
      const userData = decryptData(localStorage.getItem("user"));
      if (!userData) {
        toast.error("Please login to continue");
        return;
      }
      const UserId = userData.id;

      const payLoad = {
        userId: UserId,
        oldPin: values.oldPin,
        newPin: values.newPin,
      };
      const response = await axios.post(
        `${config.apiBaseUrl}${config.endpoints.ResetPin}${UserId}`,
        payLoad,
        { withCredentials: true }
      );

      if (response.status === 200) {
        toast.success("Transaction PIN reset successfully!");
        form.resetFields();
      } else {
        toast.error(response.data.message || "Failed to reset PIN");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to reset PIN");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md shadow-lg">
        <Title level={3} className="text-center mb-6">
          Reset Transaction PIN
        </Title>
        <Text className="block text-center mb-6">
          Enter your old PIN and set a new one
        </Text>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
        >
          <Form.Item
            name="oldPin"
            label="Current PIN"
            rules={[
              { required: true, message: "Please enter your current PIN" },
              { len: 4, message: "PIN must be 4 digits" },
            ]}
          >
            <Input.Password
              maxLength={4}
              placeholder="Enter current PIN"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="newPin"
            label="New PIN"
            rules={[
              { required: true, message: "Please enter your new PIN" },
              { len: 4, message: "PIN must be 4 digits" },
            ]}
          >
            <Input.Password
              maxLength={4}
              placeholder="Enter new PIN"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="confirmNewPin"
            label="Confirm New PIN"
            rules={[
              { required: true, message: "Please confirm your new PIN" },
              { len: 4, message: "PIN must be 4 digits" },
            ]}
          >
            <Input.Password
              maxLength={4}
              placeholder="Confirm new PIN"
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
              Reset PIN
            </Button>
          </Form.Item>
        </Form>
      </Card>
      <ToastContainer />
    </div>
  );
}

export default ResetPin;
