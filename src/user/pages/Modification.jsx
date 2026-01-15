import React, { useState, useEffect } from "react";
import {
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  Row,
  Col,
  Upload,
  message,
} from "antd";
import { ToastContainer, toast } from "react-toastify";
import Swal from "sweetalert2";
import axios from "axios";
import { config } from "../../config/config";
import CryptoJS from "crypto-js";
import { motion, AnimatePresence } from "framer-motion";
import base64 from "base64-encode-file";

const MODIFICATION_TYPES = [
  { value: "name", label: "Change of Name", price: 6000 },
  { value: "dob", label: "Date of Birth", price: 40000 },
  { value: "address", label: "Address", price: 6000 },
  { value: "phone", label: "Phone Number", price: 6000 },
];

const MAX_FILE_SIZE = 50 * 1024; // 50KB in bytes
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/jpg", "image/png"];

const customUploadStyle = `
  .full-width-uploader .ant-upload-select {
    width: 100% !important;
    height: 150px !important;
  }
`;

function Modification() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [states, setStates] = useState([]);
  const [lgas, setLgas] = useState([]);
  const [locationLoading, setLocationLoading] = useState(false);
  const [isStateOpen, setIsStateOpen] = useState(false);
  const [isLgaOpen, setIsLgaOpen] = useState(false);
  const [selectedModification, setSelectedModification] = useState(null);
  const [passportBase64, setPassportBase64] = useState(null);
  const [passportPreview, setPassportPreview] = useState(null);

  // Fetch states effect
  useEffect(() => {
    fetch("https://nga-states-lga.onrender.com/fetch")
      .then((res) => res.json())
      .then((data) => setStates(data))
      .catch(() => setStates([]));
  }, []);

  const handleStateChange = async (value) => {
    setLocationLoading(true);
    try {
      const response = await fetch(
        `https://nga-states-lga.onrender.com/?state=${value}`
      );
      const data = await response.json();
      setLgas(data);
      form.setFieldsValue({ lga: undefined });
    } catch (error) {
      setLgas([]);
      toast.error("Failed to load LGAs");
    } finally {
      setLocationLoading(false);
    }
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
      const selectedType = MODIFICATION_TYPES.find(
        (type) => type.value === values.modificationType
      );
      if (!selectedType) {
        throw new Error("Invalid modification type selected.");
      }
      if (!passportBase64) {
        throw new Error("Please upload a passport photograph.");
      }

      const basePayload = {
        userId: userId,
        modificationType: selectedType.label,
        modificationAmount: selectedType.price,
        gender: values.gender,
        surName: values.newSurname,
        firstName: values.newFirstName,
        middleName: values.newMiddleName || "",
        phone: values.phone || "",
        ninNumber: values.ninNumber,
        address: values.address || "",
        localGovernment: values.localGovernment,
        stateOfOrigin: values.stateOfOrigin,
        email: values.email,
        password: values.password,
        pin: values.pin,
        passport: passportBase64,
      };

      const modificationSpecificPayload = {
        dob: { newDob: values.newDob?.format("YYYY-MM-DD") },
        name: {}, // name fields are already in base payload
        phone: { newPhoneNo: values.newPhoneNo },
        address: { newAddress: values.newAddress },
      };

      const payload = {
        ...basePayload,
        ...modificationSpecificPayload[values.modificationType],
      };

      const response = await axios.post(
        `${config.apiBaseUrl}${config.endpoints.Modification}`,
        payload
      );

      await Swal.fire({
        icon: "success",
        title: "Modification Request Submitted!",
        text: "Your modification request has been submitted successfully.",
        confirmButtonColor: "#f59e0b",
      });
      form.resetFields();
      setPassportBase64(null);
      setPassportPreview(null);
      setSelectedModification(null);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Submission Failed",
        text:
          error.response?.data?.error ||
          error.message ||
          "Failed to submit request. Please try again.",
        confirmButtonColor: "#d10",
      });
    } finally {
      setLoading(false);
    }
  };

  // handle body scroll
  useEffect(() => {
    if (isStateOpen || isLgaOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isStateOpen, isLgaOpen]);

  const handleModificationTypeChange = (value) => {
    setSelectedModification(value);
    const selected = MODIFICATION_TYPES.find((type) => type.value === value);
    form.setFieldsValue({ modificationAmount: selected ? selected.price : 0 });
  };

  const handleFileChange = async (e) => {
    const file = e.file.originFileObj || e.file;
    if (file) {
      try {
        if (!ALLOWED_FILE_TYPES.includes(file.type)) {
          message.error("Only JPG, JPEG and PNG files are allowed");
          return;
        }

        if (file.size > MAX_FILE_SIZE) {
          message.error("File size must be less than 50KB");
          return;
        }

        const dataUrl = await base64(file);
        setPassportPreview(dataUrl);
        setPassportBase64(dataUrl);

        // Manually trigger validation for the Form.Item
        form.setFieldsValue({ passport: dataUrl });
        form.validateFields(["passport"]);
      } catch (error) {
        message.error("Failed to upload passport");
      }
    }
  };

  const handleRemoveFile = () => {
    setPassportBase64(null);
    setPassportPreview(null);
    form.setFieldsValue({ passport: null });
  };

  return (
    <div className="w-full rounded-2xl mb-5 bg-white p-5 shadow-lg">
      <style>{customUploadStyle}</style>
      <ToastContainer />
      <h2 className="text-3xl font-semibold mb-4 text-center text-sky-500">
        Modification Form
      </h2>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        requiredMark={true}
      >
        <Form.Item
          label="Select Modification Type"
          name="modificationType"
          rules={[
            { required: true, message: "Please select modification type" },
          ]}
        >
          <Select
            size="large"
            placeholder="Select modification type"
            onChange={handleModificationTypeChange}
          >
            {MODIFICATION_TYPES.map((type) => (
              <Select.Option key={type.value} value={type.value}>
                {`${type.label} @ ₦${type.price.toLocaleString()}`}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <AnimatePresence>
          {selectedModification && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Form.Item
                name="newSurname"
                label={
                  selectedModification === "name" ? "New Surname" : "Surname"
                }
                rules={[{ required: true }]}
              >
                <Input
                  size="large"
                  placeholder={
                    selectedModification === "name"
                      ? "Enter New Surname"
                      : "Enter Surname"
                  }
                />
              </Form.Item>
              <Form.Item
                name="newFirstName"
                label={
                  selectedModification === "name"
                    ? "New First Name"
                    : "First Name"
                }
                rules={[{ required: true }]}
              >
                <Input
                  size="large"
                  placeholder={
                    selectedModification === "name"
                      ? "Enter New First Name"
                      : "Enter First Name"
                  }
                />
              </Form.Item>
              <Form.Item
                name="newMiddleName"
                label={
                  selectedModification === "name"
                    ? "New Middle Name"
                    : "Middle Name"
                }
              >
                <Input
                  size="large"
                  placeholder={
                    selectedModification === "name"
                      ? "Enter New Middle Name"
                      : "Enter Middle Name"
                  }
                />
              </Form.Item>
            </motion.div>
          )}

          {selectedModification === "dob" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Form.Item
                name="newDob"
                label="New Date of Birth"
                rules={[{ required: true }]}
              >
                <DatePicker className="w-full" size="large" />
              </Form.Item>
            </motion.div>
          )}

          {selectedModification === "address" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Form.Item
                name="newAddress"
                label="New Address"
                rules={[{ required: true }]}
              >
                <Input.TextArea size="large" placeholder="Enter new address" />
              </Form.Item>
            </motion.div>
          )}

          {selectedModification === "phone" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Form.Item
                name="newPhoneNo"
                label="New Phone Number"
                rules={[
                  { required: true },
                  {
                    pattern: /^\d{11}$/,
                    message: "Phone number must be 11 digits",
                  },
                ]}
              >
                <Input
                  size="large"
                  placeholder="Enter new phone number"
                  maxLength={11}
                />
              </Form.Item>
            </motion.div>
          )}
        </AnimatePresence>

        <Form.Item
          name="gender"
          label="Gender"
          rules={[{ required: true, message: "Please select gender" }]}
        >
          <Select size="large" placeholder="-- Select Gender --">
            <Select.Option value="male">Male</Select.Option>
            <Select.Option value="female">Female</Select.Option>
          </Select>
        </Form.Item>

        {selectedModification && selectedModification !== "phone" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Form.Item
              name="phone"
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
                maxLength={11}
              />
            </Form.Item>
          </motion.div>
        )}
        <Form.Item
          name="ninNumber"
          label="NIN Number"
          rules={[{ required: true, message: "Please enter NIN number" }]}
        >
          <Input size="large" placeholder="NIN" />
        </Form.Item>

        {selectedModification && selectedModification !== "address" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Form.Item
              name="address"
              label="Address"
              rules={[{ required: true, message: "Please enter NIN address" }]}
            >
              <Input.TextArea size="large" placeholder="NIN Address" />
            </Form.Item>
          </motion.div>
        )}

        <Form.Item
          name="passport"
          label="Passport Photograph"
          rules={[
            {
              required: true,
              message: "Please upload your passport photograph",
            },
          ]}
        >
          <Upload
            listType="picture-card"
            showUploadList={false}
            customRequest={handleFileChange}
            className="full-width-uploader"
            accept={ALLOWED_FILE_TYPES.join(",")}
          >
            {passportPreview ? (
              <div className="relative group">
                <img
                  src={passportPreview}
                  alt="Passport"
                  style={{ width: "100%", objectFit: "cover" }}
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFile();
                    }}
                    className="bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="text-gray-500">Upload Passport</div>
                <div className="mt-1 text-xs text-gray-400">
                  JPG/PNG (max: 50KB)
                </div>
              </div>
            )}
          </Upload>
        </Form.Item>

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="stateOfOrigin"
              label="State Of Origin"
              rules={[{ required: true }]}
            >
              <Select
                size="large"
                placeholder="NIN State Of Origin"
                onChange={handleStateChange}
                loading={locationLoading}
                onOpenChange={(open) => setIsStateOpen(open)}
                getPopupContainer={(trigger) => trigger.parentNode}
                dropdownStyle={{
                  maxHeight: "200px",
                  position: "fixed",
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
            <Form.Item
              name="localGovernment"
              label="Local Government"
              rules={[{ required: true }]}
            >
              <Select
                size="large"
                placeholder="NIN Local Government"
                loading={locationLoading}
                disabled={!form.getFieldValue("stateOfOrigin")}
                onOpenChange={(open) => setIsLgaOpen(open)}
                getPopupContainer={(trigger) => trigger.parentNode}
                dropdownStyle={{
                  maxHeight: "200px",
                  position: "fixed",
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

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: "Please enter your email" },
                { type: "email", message: "Please enter a valid email" },
              ]}
            >
              <Input size="large" placeholder="Enter your email" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              name="password"
              label="Email Password"
              rules={[
                { required: true, message: "Please enter your password" },
              ]}
            >
              <Input.Password
                size="large"
                placeholder="Enter your email password"
              />
            </Form.Item>
          </Col>
        </Row>

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

        <Form.Item name="modificationAmount" hidden>
          <Input type="number" />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            className="w-full flex items-center bg-sky-500"
            loading={loading}
          >
            Submit Modification
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}

export default Modification;
