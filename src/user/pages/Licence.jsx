import React, { useState, useEffect } from "react";
import {
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  Row,
  Col,
  message,
} from "antd";
import Swal from "sweetalert2";
import { config } from "../../config/config";
import CryptoJS from "crypto-js";

function BVNLicence() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [states, setStates] = useState([]);
  const [lgas, setLgas] = useState([]);
  const [banks, setBanks] = useState([]);
  const [locationLoading, setLocationLoading] = useState(false);
  const [banksLoading, setBanksLoading] = useState(false);
  const [isBankOpen, setIsBankOpen] = useState(false);
  const [isStateOpen, setIsStateOpen] = useState(false);
  const [isLgaOpen, setIsLgaOpen] = useState(false);

  // Fetch states effect
  useEffect(() => {
    fetch("https://nga-states-lga.onrender.com/fetch")
      .then((res) => res.json())
      .then((data) => setStates(data))
      .catch(() => setStates([]));
  }, []);

  // Fetch LGAs effect
  const handleStateChange = (value) => {
    setLocationLoading(true);
    fetch(`https://nga-states-lga.onrender.com/?state=${value}`)
      .then((res) => res.json())
      .then((data) => setLgas(data))
      .catch(() => setLgas([]))
      .finally(() => setLocationLoading(false));
  };

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
  try {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const userObj = decryptData(userStr);
      userId = userObj?._id || userObj?.id;
    }
  } catch (error) {}

  const onFinish = async (values) => {
    setLoading(true);

    try {
      const payload = {
        userId: userId,
        licenseType: values.licenseType,
        bankName: values.bankName,
        bvn: values.bvn,
        accountNumber: values.accountNumber,
        firstName: values.firstName,
        lastName: values.lastName,
        otherName: values.otherName || "",
        email: values.email,
        alternativeEmail: values.alternativeEmail || "",
        phone: values.phone,
        alternativePhone: values.alternativePhone || "",
        address: values.address,
        dateOfBirth: values.dob.format("YYYY-MM-DD"),
        stateOfResidence: values.stateOfResidence,
        lga: values.lga,
        geoPoliticalZone: values.geoPoliticalZone,
      };

      const response = await fetch(
        `${config.apiBaseUrl}${config.endpoints.bvnLicenceRegistration}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (response.status === 200) {
        await Swal.fire({
          icon: "success",
          title: "Registration Successful!",
          text: "Your BVN license registration has been submitted successfully.",
          confirmButtonColor: "#f59e0b",
        });

        form.resetFields();
      } else {
        throw new Error(data.message || "Registration failed");
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Registration Failed",
        text: "Failed to submit registration. Please try again.",
        confirmButtonColor: "#f59e0b",
      });
    } finally {
      setLoading(false);
    }
  };

  // Add this effect to fetch banks
  useEffect(() => {
    setBanksLoading(true);
    fetch("https://api.paystack.co/bank", {
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((res) => res.json())
      .then((response) => {
        if (response.status && response.data) {
          const banksList = response.data.map((bank) => ({
            id: bank.id,
            code: bank.code,
            name: bank.name,
          }));
          setBanks(banksList);
        }
      })
      .catch((error) => {
        message.error("Failed to load banks");
      })
      .finally(() => setBanksLoading(false));
  }, []);

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
      <h2 className="text-3xl font-semibold mb-4 text-center text-amber-500">
        BVN License Registration
      </h2>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        requiredMark={true}
      >
        <Form.Item
          name="licenseType"
          label="License Type"
          rules={[{ required: true, message: "Please select license type" }]}
        >
          <Select size="large">
            <Select.Option value="ANDROID">ANDROID BVN LICENCE</Select.Option>
            <Select.Option value="WINDOWS">WINDOWS BVN LICENCE</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="bankName"
          label="Bank Name"
          rules={[{ required: true }]}
        >
          <Select
            size="large"
            placeholder="Select a bank"
            showSearch
            onOpenChange={(open) => setIsBankOpen(open)}
            getPopupContainer={(trigger) => trigger.parentNode}
            dropdownStyle={{
              maxHeight: "200px",
              position: "fixed",
            }}
            filterOption={(input, option) =>
              option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
            }
          >
            {banks.map((bank, index) => (
              <Select.Option key={index} value={bank.value}>
                {bank.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="agentLocation"
          label="Agent Location"
          rules={[{ required: true }]}
        >
          <Input.TextArea size="large" />
        </Form.Item>

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="bvn"
              label="Agent BVN"
              rules={[
                { required: true },
                { pattern: /^\d{11}$/, message: "BVN must be 11 digits" },
              ]}
            >
              <Input size="large" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              name="accountNumber"
              label="Account Number"
              rules={[
                { required: true },
                {
                  pattern: /^\d{10}$/,
                  message: "Account number must be 10 digits",
                },
              ]}
            >
              <Input size="large" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="firstName"
              label="First Name"
              rules={[{ required: true }]}
            >
              <Input size="large" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              name="lastName"
              label="Last Name"
              rules={[{ required: true }]}
            >
              <Input size="large" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item name="otherName" label="Other Name">
              <Input size="large" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              name="dob"
              label="Date of Birth"
              rules={[{ required: true }]}
            >
              <DatePicker className="w-full" size="large" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true },
                { type: "email", message: "Please enter a valid email" },
              ]}
            >
              <Input size="large" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              name="alternativeEmail"
              label="Alternative Email"
              rules={[{ type: "email", message: "Please enter a valid email" }]}
            >
              <Input size="large" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="phone"
              label="Phone Number"
              rules={[
                { required: true },
                {
                  pattern: /^\d{11}$/,
                  message: "Phone number must be 11 digits",
                },
              ]}
            >
              <Input size="large" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              name="alternativePhone"
              label="Alternative Phone Number"
              rules={[
                {
                  pattern: /^\d{11}$/,
                  message: "Phone number must be 11 digits",
                },
              ]}
            >
              <Input size="large" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="stateOfResidence"
              label="State of Residence"
              rules={[{ required: true }]}
            >
              <Select
                size="large"
                onChange={handleStateChange}
                loading={locationLoading}
                placeholder="Select state"
                onOpenChange={(open) => setIsStateOpen(open)}
                getPopupContainer={(trigger) => trigger.parentNode}
                styles={{
                  popup: {
                    root: {
                      maxHeight: "50vh",
                    },
                  },
                }}
              >
                {states.map((state, idx) => (
                  <Select.Option key={idx} value={state}>
                    {state}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="lga" label="LGA" rules={[{ required: true }]}>
              <Select
                size="large"
                loading={locationLoading}
                placeholder="Select LGA"
                disabled={!form.getFieldValue("stateOfResidence")}
                onOpenChange={(open) => setIsLgaOpen(open)}
                getPopupContainer={(trigger) => trigger.parentNode}
                styles={{
                  popup: {
                    root: {
                      maxHeight: "50vh",
                    },
                  },
                }}
              >
                {lgas.map((lga, idx) => (
                  <Select.Option key={idx} value={lga}>
                    {lga}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="address" label="Address" rules={[{ required: true }]}>
          <Input.TextArea size="large" />
        </Form.Item>
        <Form.Item
          name="geoPoliticalZone"
          label="Geo Political Zone"
          rules={[{ required: true }]}
        >
          <Select size="large">
            <Select.Option value="NC">North Central</Select.Option>
            <Select.Option value="NE">North East</Select.Option>
            <Select.Option value="NW">North West</Select.Option>
            <Select.Option value="SE">South East</Select.Option>
            <Select.Option value="SS">South South</Select.Option>
            <Select.Option value="SW">South West</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            className="w-full flex items-center bg-amber-500 mt-[-5px]"
            loading={loading}
          >
            Submit Registration
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}

export default BVNLicence;
