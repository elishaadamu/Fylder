import React, { useState, useEffect } from "react";
import {
  Form,
  Input,
  Select,
  DatePicker,
  Upload,
  Button,
  message,
  Row,
  Col,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import Swal from "sweetalert2";
import { ToastContainer, toast } from "react-toastify";
import { config } from "../../config/config";
import CryptoJS from "crypto-js";

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

function BankAgency() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [banks, setBanks] = useState([]); // Add this state
  const [states, setStates] = useState([]);
  const [lgas, setLgas] = useState([]);
  const [passportPreview, setPassportPreview] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [fileError, setFileError] = useState("");
  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
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

  // Add this effect to fetch banks
  useEffect(() => {
    fetch("https://api.paystack.co/bank", {})
      .then((res) => res.json())
      .then((response) => {
        if (response.status && response.data) {
          const banksList = response.data.map((bank) => ({
            name: bank.name,
            value: bank.name,
          }));
          setBanks(banksList);
        }
      })
      .catch((error) => {
        message.error("Failed to load banks");
      });
  }, []);

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

  const handleStateChange = async (value) => {
    setLocationLoading(true);
    try {
      const response = await fetch(
        `https://nga-states-lga.onrender.com/?state=${value}`
      );
      const data = await response.json();
      setLgas(data);

      // Clear the LGA field when state changes
      form.setFieldsValue({ lga: undefined, agentLocation: "" });
    } catch (error) {
      setLgas([]);
      message.error("Failed to load LGAs");
    } finally {
      setLocationLoading(false);
    }
  };

  const handleLGAChange = (lga) => {
    const state = form.getFieldValue("stateOfResidence");
    if (state && lga) {
      const location = `${lga}, ${state} State, Nigeria`;
      form.setFieldsValue({ agentLocation: location });
    }
  };

  const validateFile = (file) => {
    // Check file type
    const validTypes = ["image/jpeg", "image/png", "application/pdf"];
    if (!validTypes.includes(file.type)) {
      setFileError("Please upload only JPG, PNG or PDF files");
      message.error("Please upload only JPG, PNG or PDF files");
      toast("Please upload only JPG, PNG or PDF files", {
        type: "error",
        position: "top-right",
      });
      return false;
    }

    // Check file size (50KB = 51200 bytes)
    if (file.size > 51200) {
      setFileError("File size must be less than 50KB");
      toast("File size must be less than 50KB", {
        type: "error",
        position: "top-right",
      });
      return false;
    }

    setFileError("");
    return true;
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (validateFile(file)) {
      setSelectedFile(file);

      // Create preview for images
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewUrl(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setPreviewUrl(null);
      }
    } else {
      e.target.value = ""; // Reset file input
      setSelectedFile(null);
      setPreviewUrl(null);
    }
  };

  const convertToBase64 = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result.split(",")[1];
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      // Get userId from encrypted localStorage
      let userId = null;
      try {
        const userStr = localStorage.getItem("user");
        if (userStr) {
          const userObj = decryptData(userStr);
          userId = userObj?._id || userObj?.id;
        }
      } catch (error) {
        throw new Error("User authentication failed");
      }

      if (!userId) {
        throw new Error("User ID not found");
      }

      let passportBase64 = null;
      if (selectedFile) {
        passportBase64 = await convertToBase64(selectedFile);
      }

      // Construct payload with userId
      const payload = {
        userId, // Add userId here
        bankName: values.bankName,
        stateOfResidence: values.stateOfResidence,
        lga: values.lga,
        agentLocation: values.agentLocation,
        bvn: values.bvn,
        accountNumber: values.accountNumber,
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        alternativeEmail: values.alternativeEmail,
        phone: values.phone,
        alternativePhone: values.alternativePhone,
        address: values.address,
        dob: values.dob.format("YYYY-MM-DD"),
        geoPoliticalZone: values.geoPoliticalZone,
        passport: passportBase64,
      };

      const response = await fetch(
        `${config.apiBaseUrl}${config.endpoints.bankAgentRegistration}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (response.status === 200) {
        await Swal.fire({
          icon: "success",
          title: "Registration Successful!",
          text: "Your agent registration has been submitted successfully.",
          confirmButtonColor: "#f59e0b",
        });

        // Reset form and previews
        form.resetFields();
        setPassportPreview(null);
        setPreviewUrl(null);
        setSelectedFile(null);
      } else {
        throw new Error(data.message || "Registration failed");
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Registration Failed",
        text:
          error.message || "Failed to submit registration. Please try again.",
        confirmButtonColor: "#f59e0b",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full rounded-2xl mb-5 bg-white p-5 shadow-lg">
      <ToastContainer />
      <h2 className="text-3xl font-semibold mb-4 text-center text-sky-500">
        Bank Agency Registration Form
      </h2>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        requiredMark={true}
      >
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

        <Form.Item name="lga" label="LGA" rules={[{ required: true }]}>
          <Select
            size="large"
            onChange={handleLGAChange}
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

        <Form.Item
          name="agentLocation"
          label="Agent Location"
          rules={[{ required: true }]}
        >
          <Input.TextArea
            size="large"
            disabled
            placeholder="Location will be auto-generated based on State and LGA selection"
          />
        </Form.Item>

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

        <Form.Item
          name="alternativeEmail"
          label="Alternative Email"
          rules={[{ type: "email", message: "Please enter a valid email" }]}
        >
          <Input size="large" />
        </Form.Item>

        <Form.Item
          name="phone"
          label="Phone Number"
          rules={[
            { required: true },
            { pattern: /^\d{11}$/, message: "Phone number must be 11 digits" },
          ]}
        >
          <Input size="large" />
        </Form.Item>

        <Form.Item
          name="alternativePhone"
          label="Alternative Phone Number"
          rules={[
            { pattern: /^\d{11}$/, message: "Phone number must be 11 digits" },
          ]}
        >
          <Input size="large" />
        </Form.Item>

        <Form.Item name="address" label="Address" rules={[{ required: true }]}>
          <Input.TextArea size="large" />
        </Form.Item>

        <Form.Item
          name="dob"
          label="Date of Birth"
          size="large"
          rules={[{ required: true }]}
        >
          <DatePicker className="w-full" size="large" />
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

        <Form.Item
          name="passport"
          label="Passport Photograph"
          className="my-5"
          rules={[
            {
              required: true,
              validator: (_, value) => {
                if (!selectedFile) {
                  return Promise.reject("Please upload a passport photograph");
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <div className="space-y-2">
            <div className="flex items-center justify-center w-full">
              <label className="w-full mt-5 flex flex-col items-center px-4 py-6 bg-white rounded-lg border-2 border-dashed border-gray-300 cursor-pointer hover:bg-gray-50">
                <div className="space-y-1 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                    aria-hidden="true"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={handleFileChange}
                />
              </label>
            </div>

            {fileError && (
              <p className="mt-1 text-sm text-red-600">{fileError}</p>
            )}

            {previewUrl && (
              <div className="mt-5 relative">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="max-w-[100px] max-h-[100px] object-contain rounded border border-gray-200"
                />
              </div>
            )}

            <div className="text-xs text-gray-500 mt-2">
              File requirements:
              <ul className="list-disc ml-4 mt-1">
                <li>Maximum file size: 50KB</li>
                <li>Allowed file types: JPG, JPEG, PNG, PDF</li>
                <li>Recent passport photograph with white background</li>
              </ul>
            </div>
          </div>
        </Form.Item>

        <Form.Item className="">
          <Button
            type="primary"
            size="large"
            htmlType="submit"
            className="w-full flex items-center bg-sky-500 mt-[-5px]"
            loading={loading}
          >
            Submit Registration
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}

export default BankAgency;
