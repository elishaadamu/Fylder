import React, { useState, useEffect } from "react";
import base64 from "base64-encode-file";
import {
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  message,
  Steps,
  Upload,
} from "antd";
import {
  InboxOutlined,
  LoadingOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import Swal from "sweetalert2";
import { config } from "../../config/config";
import CryptoJS from "crypto-js";
import moment from "moment";
import axios from "axios";

const MAX_FILE_SIZE = 50 * 1024; // 50KB in bytes
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/jpg", "image/png"];

const REGISTRATION_TYPES = [
  { value: "Business Name (BN)", label: "Business Name (BN)", price: 2 },
  {
    value: "Limited Liability Company (RC)",
    label: "Limited Liability Company (RC)",
    price: 60000,
  },
  {
    value: "NGO/Club/Association",
    label: "NGO, Club & Association",
    price: 150000,
  },
];

const customUploadStyle = `
  .full-width-uploader .ant-upload-select {
    width: 100% !important;
    height: 150px !important;
  }
  .full-width-uploader .ant-upload-list-item-container {
    width: 150px !important;
    height: 150px !important;
  }
  .full-width-uploader .ant-upload-list-item,
  .full-width-uploader .ant-upload-list-item-info,
  .full-width-uploader .ant-upload-list-item-info .ant-image,
  .full-width-uploader .ant-upload-list-item-info img {
    width: 100% !important;
    height: 100% !important;
    object-fit: cover;
  }
`;

function CAC() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [states, setStates] = useState([]);
  const [lgas, setLgas] = useState([]);
  // fileList may hold File objects when selected in-session.
  const [fileList, setFileList] = useState({
    passport: null,
    idCard: null,
    signature: null,
    ninUpload: null,
  });
  // base64Files stores data URLs (data:image/..;base64,...) so previews and submission
  // can survive a reload. previewUrls used for image src (can be object URL or data URL)
  const [base64Files, setBase64Files] = useState({
    passport: null,
    idCard: null,
    signature: null,
    ninUpload: null,
  });
  const [previewUrls, setPreviewUrls] = useState({
    passport: null,
    idCard: null,
    signature: null,
    ninUpload: null,
  });
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedState, setSelectedState] = useState("");
  const [stateOptions, setStateOptions] = useState([]);
  const [lgaOptions, setLgaOptions] = useState([]);
  // Add this state to store form data
  const [formData, setFormData] = useState({}); // Stores accumulated form data across steps

  // Initialize with the first registration type's details
  const DEFAULT_REGISTRATION_TYPE = REGISTRATION_TYPES[0];
  const [registrationAmount, setRegistrationAmount] = useState(
    DEFAULT_REGISTRATION_TYPE.price
  );
  const [selectedCategoryLabel, setSelectedCategoryLabel] = useState(
    DEFAULT_REGISTRATION_TYPE.label
  );

  const steps = [
    {
      title: "Personal Details",
      description: "Proprietor information",
    },
    {
      title: "Home Address",
      description: "Your residential address",
    },
    {
      title: "Business Details",
      description: "Name, nature, and address",
    },
    {
      title: "Document Upload",
      description: "Upload required documents",
    },
  ];

  useEffect(() => {
    fetch("https://nga-states-lga.onrender.com/fetch")
      .then((res) => res.json())
      .then((data) => setStateOptions(data))
      .catch((error) => {
        setStateOptions([]);
      });
  }, []);

  const handleStateChange = async (value, type) => {
    try {
      const response = await fetch(
        `https://nga-states-lga.onrender.com/?state=${value}`
      );
      const lgas = await response.json();

      if (type === "business") {
        setLgaOptions(lgas);
        form.setFieldValue("LGAofBusiness", ""); // Reset LGA when state changes
      } else if (type === "origin") {
        setLgaOptions(lgas);
        form.setFieldValue("lgaOfOrigin", ""); // Reset LGA when state changes
      }
    } catch (error) {
      setLgaOptions([]);
    }
  };

  const handleRegistrationTypeChange = (value) => {
    const selectedType = REGISTRATION_TYPES.find(
      (type) => type.value === value
    );
    if (selectedType) {
      setRegistrationAmount(selectedType.price);
      setSelectedCategoryLabel(selectedType.label);
      form.setFieldsValue({ amount: selectedType.price });
    }
  };

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

  // Update the nextStep function
  const nextStep = async () => {
    try {
      // Validate current step fields
      await form.validateFields();

      // Get current form values and merge with existing data
      const currentValues = form.getFieldsValue();
      setFormData((prevData) => {
        const merged = {
          ...prevData,
          ...currentValues,
        };
        // save on moving forward
        saveToLocal({ formData: merged });
        return merged;
      });

      const next = currentStep + 1;
      setCurrentStep(next);
      saveToLocal({ currentStep: next });
    } catch (error) {
      message.error("Please fill in all required fields");
    }
  };

  const onFinish = async (values) => {
    try {
      setLoading(true);

      // Merge final step data with accumulated data
      const allFormData = {
        ...formData,
        ...values,
      };

      // Check for required files
      // allow relying on stored base64Files if File objects not present
      if (
        !fileList.passport ||
        !fileList.signature ||
        !fileList.idCard ||
        !fileList.ninUpload
      ) {
        throw new Error("Please upload passport, ID card and signature");
      }

      // Get user ID
      const userStr = localStorage.getItem("user");
      if (!userStr) {
        throw new Error("User not found. Please login again.");
      }
      const userObj = decryptData(userStr);
      const userId = userObj?._id || userObj?.id;

      const payload = new FormData();
      payload.append("userId", userId);
      payload.append("registrationType", allFormData.registrationType);
      payload.append("amount", allFormData.amount);
      // Step 1: Business Info
      payload.append("businessName1", allFormData.businessName1);
      payload.append("businessName2", allFormData.businessName2 || "");
      payload.append("businessName3", allFormData.businessName3 || "");
      payload.append(
        "dateOfCommencement",
        allFormData.dateOfCommencement
          ? moment(allFormData.dateOfCommencement).format("YYYY-MM-DD")
          : ""
      );
      payload.append("natureOfBusiness1", allFormData.natureOfBusiness1);
      payload.append("natureOfBusiness2", allFormData.natureOfBusiness2 || "");

      // Step 2: Business Location
      payload.append("businessAddress", allFormData.AddressofBusiness);
      payload.append(
        "businessAddressDescription",
        allFormData.businessAddressDescription
      );
      payload.append("businessCity", allFormData.BusinessCity);
      payload.append("businessLGA", allFormData.LGAofBusiness);
      payload.append("businessState", allFormData.businessState);
      payload.append("branchAddress", allFormData.branchAddress || "");
      payload.append("postalCode", allFormData.postalCode || "");
      // Step 3: Personal Details
      payload.append("surname", allFormData.surname);
      payload.append("firstName", allFormData.firstName);
      payload.append("otherName", allFormData.otherName || "");
      payload.append("formerName", allFormData.formerName || "");
      payload.append("nationality", allFormData.nationality);
      payload.append("formerNationality", allFormData.formerNationality || "");
      payload.append("occupation", allFormData.occupation);
      payload.append("gender", allFormData.gender);
      payload.append("phoneNumber", allFormData.phone);
      payload.append("email", allFormData.email);
      payload.append("homeAddress", allFormData.homeAddress);
      payload.append(
        "homeAddressDescription",
        allFormData.homeAddressDescription
      );
      payload.append("cityOfOrigin", allFormData.cityOfOrigin);
      payload.append("stateOfOrigin", allFormData.stateOfOrigin);
      payload.append("lgaOfOrigin", allFormData.lgaOfOrigin);

      // Step 4: Identity Verification
      payload.append("pin", allFormData.pin);
      payload.append("identityType", allFormData.identityType);
      payload.append("identityNumber", allFormData.identityNumber);
      payload.append(
        "dateOfBirth",
        allFormData.dateOfBirth
          ? moment(allFormData.dateOfBirth).format("YYYY-MM-DD")
          : ""
      );

      // Append files
      payload.append("passport", fileList.passport);
      payload.append("idCard", fileList.idCard);
      payload.append("signature", fileList.signature);
      payload.append("ninUpload", fileList.ninUpload);

      // Validate required dates before submission

      const response = await axios.post(
        `${config.apiBaseUrl}${config.endpoints.cacRegistration}`,
        payload,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          withCredentials: true,
        }
      );

      await Swal.fire({
        icon: "success",
        title: "Registration Successful!",
        text:
          response.data.message ||
          "Your business registration has been submitted successfully.",
        confirmButtonColor: "#f59e0b",
      });

      // Reset everything
      form.resetFields();
      setFileList({
        passport: null,
        idCard: null,
        signature: null,
        ninUpload: null,
      });
      setPreviewUrls({
        passport: null,
        idCard: null,
        signature: null,
        ninUpload: null,
      });
      setFormData({}); // Clear accumulated form data
      setCurrentStep(0);
      setBase64Files({
        passport: null,
        idCard: null,
        signature: null,
        ninUpload: null,
      });
      // clear saved state
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Registration Failed",
        text:
          error.response?.data?.message ||
          error.message ||
          "Something went wrong",
        confirmButtonColor: "#f59e0b",
      });
    } finally {
      setLoading(false);
    }
  };

  // Function to handle step changes
  const prevStep = () => {
    // Save current step data before going back
    const currentValues = form.getFieldsValue();
    setFormData((prevData) => {
      const merged = {
        ...prevData,
        ...currentValues,
      };
      saveToLocal({ formData: merged });
      return merged;
    });

    const prev = currentStep - 1;
    setCurrentStep(prev);
    saveToLocal({ currentStep: prev });
  };

  // Add file upload handler
  const handleFileChange = async (e, type) => {
    const file = e.target.files[0];
    if (file) {
      try {
        // Validate file type
        if (!ALLOWED_FILE_TYPES.includes(file.type)) {
          message.error("Only JPG, JPEG and PNG files are allowed");
          return;
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
          message.error("File size must be less than 50KB");
          return;
        }

        // Create preview URL
        // get data URL for preview and storage
        const dataUrl = await base64(file); // this returns 'data:image/...;base64,...'
        // create object URL for immediate display if you prefer, otherwise use dataUrl
        const preview = dataUrl;
        setPreviewUrls((prev) => ({
          ...prev,
          [type]: preview,
        }));

        // store base64 dataURL so we can restore after reload
        setBase64Files((prev) => ({
          ...prev,
          [type]: dataUrl,
        }));

        // Also keep the actual File in memory (for current session submission)
        setFileList((prev) => ({
          ...prev,
          [type]: file,
        }));

        // persist to localStorage
        saveToLocal({
          base64Files: {
            ...base64Files,
            [type]: dataUrl,
          },
          previewUrls: {
            ...previewUrls,
            [type]: preview,
          },
        });
      } catch (error) {
        message.error(`Failed to upload ${type}`);
      }
    }
  };

  // First, add a handleRemoveFile function after the handleFileChange function
  const handleRemoveFile = (type) => {
    setFileList((prev) => ({
      ...prev,
      [type]: null,
    }));
    setPreviewUrls((prev) => ({
      ...prev,
      [type]: null,
    }));
    setBase64Files((prev) => ({
      ...prev,
      [type]: null,
    }));
    saveToLocal({
      base64Files: {
        ...base64Files,
        [type]: null,
      },
      previewUrls: {
        ...previewUrls,
        [type]: null,
      },
    });
  };

  // localStorage key & 24h expiration helper
  const STORAGE_KEY = "cacFormSaved";
  const HOURS_24 = 24 * 60 * 60 * 1000;
  const DATE_KEYS = ["dateOfBirth", "dateOfCommencement"];

  const saveToLocal = (override = {}) => {
    try {
      // Ensure date fields are saved as ISO strings (so they serialize/restore reliably)
      const fvRaw = form.getFieldsValue();
      const fv = { ...fvRaw };
      DATE_KEYS.forEach((k) => {
        if (fv[k]) {
          fv[k] = moment.isMoment(fv[k]) ? fv[k].toISOString() : fv[k];
        }
      });

      const payload = {
        timestamp: Date.now(),
        currentStep,
        formValues: fv,
        base64Files,
        previewUrls,
        formData,
        ...override,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {}
  };

  // Load saved state on mount (if not expired)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (!saved || !saved.timestamp) return;
      if (Date.now() - saved.timestamp > HOURS_24) {
        localStorage.removeItem(STORAGE_KEY);
        return;
      }

      // Restore form values
      if (saved.formValues) {
        // convert known date strings back to moment objects
        const restored = { ...saved.formValues };
        DATE_KEYS.forEach((k) => {
          if (restored[k]) {
            // If it's already a moment keep it, otherwise try to parse
            restored[k] = moment.isMoment(restored[k])
              ? restored[k]
              : moment(restored[k]);
          }
        });
        form.setFieldsValue(restored);
      }

      // Restore base64 previews and previewUrls
      if (saved.base64Files) {
        setBase64Files(saved.base64Files);
        // prefer data url for preview if available
        setPreviewUrls((prev) => ({
          passport: saved.base64Files.passport || prev.passport,
          idCard: saved.base64Files.idCard || prev.idCard,
          signature: saved.base64Files.signature || prev.signature,
          ninUpload: saved.base64Files.ninUpload || prev.ninUpload,
        }));
      } else if (saved.previewUrls) {
        setPreviewUrls(saved.previewUrls);
      }

      // restore other accumulative data and step
      if (saved.formData) setFormData(saved.formData);
      if (typeof saved.currentStep === "number")
        setCurrentStep(saved.currentStep);
    } catch (e) {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="p-5 bg-white shadow rounded">
      <style>{customUploadStyle}</style>
      <h2 className="text-2xl  font-semibold text-center mb-10 text-sky-500">
        Business Registration Form
      </h2>
      <Steps current={currentStep} items={steps} className="mb-8" />

      {/* Save form values to localStorage on every change */}
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        onValuesChange={() => {
          // persist incremental changes
          saveToLocal();
        }}
        className="mt-8"
        initialValues={{
          // Set initial values for the form fields
          registrationType: DEFAULT_REGISTRATION_TYPE.value,
          amount: DEFAULT_REGISTRATION_TYPE.price,
          nationality: "Nigerian", // Keep existing default
          // ... any other initial values you might have
        }}
      >
        {currentStep === 0 && (
          <>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Proprietor's Details</h3>
              {registrationAmount > 0 && (
                <div className="p-2 mt-5 bg-gray-100 rounded-md text-right">
                  <p className="text-sm font-semibold text-gray-700">
                    {selectedCategoryLabel}
                  </p>
                  <p className="text-lg font-bold text-sky-600">
                    ₦{registrationAmount.toLocaleString()}
                  </p>
                </div>
              )}
            </div>

            <Form.Item
              name="registrationType"
              label="Category"
              rules={[{ required: true }]}
            >
              <Select
                placeholder="Select a registration category"
                onChange={handleRegistrationTypeChange}
              >
                {REGISTRATION_TYPES.map((type) => (
                  <Select.Option key={type.value} value={type.value}>
                    {type.label}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Form.Item
                name="businessName1"
                label="Business Name 1"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
              <Form.Item name="businessName2" label="Business Name 2">
                <Input />
              </Form.Item>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Form.Item
                name="surname"
                label="Surname"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="firstName"
                label="First Name"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Form.Item name="otherName" label="Other Name">
                <Input />
              </Form.Item>
              <Form.Item
                name="nationality"
                label="Nationality"
                rules={[{ required: true }]}
              >
                <Input defaultValue="Nigerian" />
              </Form.Item>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Form.Item
                name="dateOfBirth"
                label="Date of Birth"
                rules={[{ required: true }]}
              >
                <DatePicker className="w-full" />
              </Form.Item>
              <Form.Item
                name="gender"
                label="Gender"
                rules={[{ required: true }]}
              >
                <Select>
                  <Select.Option value="male">Male</Select.Option>
                  <Select.Option value="female">Female</Select.Option>
                </Select>
              </Form.Item>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Form.Item
                name="phone"
                label="Phone Number"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="email"
                label="Email"
                rules={[{ required: true, type: "email" }]}
              >
                <Input />
              </Form.Item>
            </div>
          </>
        )}

        {/* This hidden Form.Item ensures the amount is part of the form data */}
        <Form.Item name="amount" hidden>
          <Input type="number" />
        </Form.Item>

        {/* The navigation buttons are outside the conditional rendering of steps */}
        {/* to ensure they are always present and handle step transitions */}
        {/* Navigation Buttons */}

        {currentStep === 1 && (
          <>
            <h3 className="text-lg font-semibold mb-4">
              Proprietor's Home Address
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Form.Item
                name="homeAddress"
                label="Home Address (House No & Street)"
                rules={[{ required: true }]}
              >
                <Input placeholder="House Number & Street Name" />
              </Form.Item>
              <Form.Item
                name="homeAddressDescription"
                label="Home Address Description"
                rules={[
                  { required: true, message: "Please describe the address" },
                ]}
              >
                <Input.TextArea placeholder="e.g., Nearest bus stop, popular road, etc." />
              </Form.Item>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Form.Item name="cityOfOrigin" label="City of Origin">
                <Input placeholder="City/Town/Village" />
              </Form.Item>
              <Form.Item
                name="stateOfOrigin"
                label="State of Origin"
                rules={[{ required: true }]}
              >
                <Select
                  onChange={(value) => handleStateChange(value, "origin")}
                >
                  {stateOptions.map((state) => (
                    <Select.Option key={state} value={state}>
                      {state}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Form.Item
                name="lgaOfOrigin"
                label="LGA of Origin"
                rules={[{ required: true }]}
              >
                <Select disabled={!form.getFieldValue("stateOfOrigin")}>
                  {lgaOptions.map((lga) => (
                    <Select.Option key={lga} value={lga}>
                      {lga}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </div>
          </>
        )}

        {currentStep === 2 && (
          <>
            <h3 className="text-lg font-semibold mb-4">Business Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Form.Item
                name="natureOfBusiness1"
                label="Nature of Business 1"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
              <Form.Item name="natureOfBusiness2" label="Nature of Business 2">
                <Input />
              </Form.Item>
            </div>
            <h3 className="text-lg font-semibold mt-6 mb-4">
              Principal Place of Business
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Form.Item
                name="AddressofBusiness"
                label="Business Address (House No & Street)"
                rules={[{ required: true }]}
              >
                <Input placeholder="House Number & Street Name" />
              </Form.Item>
              <Form.Item
                name="businessAddressDescription"
                label="Address Description"
                rules={[
                  { required: true, message: "Please describe the address" },
                ]}
              >
                <Input.TextArea placeholder="e.g., Nearest bus stop, popular road, etc." />
              </Form.Item>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Form.Item
                name="BusinessCity"
                label="Business City/Town/Village"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="businessState"
                label="Business State"
                rules={[{ required: true }]}
              >
                <Select
                  onChange={(value) => handleStateChange(value, "business")}
                >
                  {stateOptions.map((state) => (
                    <Select.Option key={state} value={state}>
                      {state}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Form.Item
                name="LGAofBusiness"
                label="Business LGA"
                rules={[{ required: true }]}
              >
                <Select disabled={!form.getFieldValue("businessState")}>
                  {lgaOptions.map((lga) => (
                    <Select.Option key={lga} value={lga}>
                      {lga}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item name="branchAddress" label="Branch Address (if any)">
                <Input placeholder="Enter branch address" />
              </Form.Item>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Form.Item name="postalCode" label="Postal Code">
                <Input placeholder="Enter postal code" />
              </Form.Item>
              <Form.Item
                name="dateOfCommencement"
                label="Date of Commencement"
                rules={[{ required: true }]}
              >
                <DatePicker className="w-full" />
              </Form.Item>
            </div>
          </>
        )}

        {currentStep === 3 && (
          <>
            <h3 className="text-lg font-semibold mb-4">Supporting Documents</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Form.Item
                name="identityType"
                label="Identity Type"
                rules={[
                  {
                    required: true,
                    message: "Please select an identity type",
                  },
                ]}
              >
                <Select placeholder="Select identity type">
                  <Select.Option value="Drivers Licence">
                    Driver's Licence
                  </Select.Option>
                  <Select.Option value="NIN">
                    National Identity Number
                  </Select.Option>
                  <Select.Option value="International Passport">
                    International Passport
                  </Select.Option>
                  <Select.Option value="Voters Card">
                    Voter's Card
                  </Select.Option>
                  <Select.Option value="ID Card">
                    ID Card (Generic)
                  </Select.Option>
                </Select>
              </Form.Item>
              <Form.Item
                name="identityNumber"
                label="Identity Number"
                rules={[
                  {
                    required: true,
                    message: "Please enter your identity number",
                  },
                  {
                    validator: (_, value) => {
                      if (!value) return Promise.resolve();
                      const type = form.getFieldValue("identityType");
                      if (type === "nin" && !/^\d{11}$/.test(value)) {
                        return Promise.reject("NIN must be 11 digits");
                      }
                      if (
                        type === "driversLicence" &&
                        !/^[A-Z]{3}(-|\s)?[0-9]{6,8}$/.test(value)
                      ) {
                        return Promise.reject(
                          "Invalid Driver's Licence format"
                        );
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <Input placeholder="Enter your identity number" />
              </Form.Item>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {/* Passport Upload */}
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
                  className="full-width-uploader"
                  showUploadList={false}
                  customRequest={({ file }) =>
                    handleFileChange({ target: { files: [file] } }, "passport")
                  }
                >
                  {previewUrls.passport ? (
                    <div className="relative group">
                      <img
                        src={previewUrls.passport}
                        alt="Passport"
                        style={{
                          width: 150,
                          height: 150,
                          objectFit: "cover",
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveFile("passport");
                          }}
                          className="bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center">
                      <div className=" text-[12px] text-gray-500">
                        Upload Passport
                      </div>
                      <div className="mt-1 text-xs text-gray-400">
                        JPG/PNG (max: 50KB)
                      </div>
                    </div>
                  )}
                </Upload>
              </Form.Item>
              <Form.Item name="idCard" label="ID Card">
                {/* This is a placeholder for the ID card upload if you decide to add it as a separate field */}
                <Upload
                  listType="picture-card"
                  className="full-width-uploader"
                  showUploadList={false}
                  customRequest={({ file }) =>
                    handleFileChange({ target: { files: [file] } }, "idCard")
                  }
                >
                  {previewUrls.idCard ? (
                    <div className="relative group">
                      <img
                        src={previewUrls.idCard}
                        alt="ID Card"
                        style={{
                          width: 150,
                          height: 150,
                          objectFit: "cover",
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center  bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveFile("idCard");
                          }}
                          className="bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center">
                      <div className=" text-[12px] text-gray-500">
                        Upload ID Card
                      </div>
                      <div className="mt-1 text-xs text-gray-400">
                        JPG/PNG (max: 50KB)
                      </div>
                    </div>
                  )}
                </Upload>
              </Form.Item>

              {/* Signature Upload */}
              <Form.Item
                name="signature"
                label="Signature"
                rules={[
                  { required: true, message: "Please upload your signature" },
                ]}
              >
                <Upload
                  listType="picture-card"
                  className="full-width-uploader"
                  showUploadList={false}
                  customRequest={({ file }) =>
                    handleFileChange({ target: { files: [file] } }, "signature")
                  }
                >
                  {previewUrls.signature ? (
                    <div className="relative group">
                      <img
                        src={previewUrls.signature}
                        alt="Signature"
                        style={{
                          width: 150,
                          height: 150,
                          objectFit: "contain",
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center  bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveFile("signature");
                          }}
                          className="bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center">
                      <div className=" text-[12px] text-gray-500">
                        Upload Signature
                      </div>
                      <div className="mt-1 text-xs text-gray-400">
                        JPG/PNG (max: 50KB)
                      </div>
                    </div>
                  )}
                </Upload>
              </Form.Item>

              {/* NIN Upload */}
              <Form.Item
                name="ninUpload"
                label="NIN Slip"
                rules={[
                  { required: true, message: "Please upload your NIN slip" },
                ]}
              >
                <Upload
                  listType="picture-card"
                  className="full-width-uploader"
                  showUploadList={false}
                  customRequest={({ file }) =>
                    handleFileChange({ target: { files: [file] } }, "ninUpload")
                  }
                >
                  {previewUrls.ninUpload ? (
                    <div className="relative group">
                      <img
                        src={previewUrls.ninUpload}
                        alt="NIN Slip"
                        style={{
                          width: 150,
                          height: 150,
                          objectFit: "contain",
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveFile("ninUpload");
                          }}
                          className="bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center">
                      <div className=" text-[12px] text-gray-500">
                        Upload NIN Slip
                      </div>
                      <div className="mt-1 text-xs text-gray-400">
                        JPG/PNG (max: 50KB)
                      </div>
                    </div>
                  )}
                </Upload>
              </Form.Item>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Form.Item
                name="pin"
                label="Transaction PIN"
                rules={[
                  { required: true, message: "Please enter your 4-digit PIN" },
                  { pattern: /^\d{4}$/, message: "PIN must be 4 digits" },
                ]}
              >
                <Input.Password
                  maxLength={4}
                  placeholder="Enter your 4-digit transaction PIN"
                />
              </Form.Item>
            </div>
          </>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          {currentStep > 0 && <Button onClick={prevStep}>Previous</Button>}
          {currentStep === 0 && (
            <Button
              type="primary"
              onClick={nextStep}
              className="bg-sky-500 ml-auto"
            >
              Next
            </Button>
          )}
          {currentStep > 0 && currentStep < steps.length - 1 && (
            <Button type="primary" onClick={nextStep} className="bg-sky-500">
              Next
            </Button>
          )}
          {currentStep === steps.length - 1 && (
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              className="bg-sky-500"
            >
              Submit
            </Button>
          )}
        </div>
      </Form>
    </div>
  );
}

export default CAC;
