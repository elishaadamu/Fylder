import React, { useState, useEffect } from "react";
import { Form, Input, Select, DatePicker, Button } from "antd";
import { ToastContainer } from "react-toastify";
import Swal from "sweetalert2";
import axios from "axios";
import CryptoJS from "crypto-js";
import { config } from "../../config/config";
import banksData from "../json/banks.json";

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

const MODIFICATION_COSTS = {
  name: 25,
  dob: 20,
  phone: 15,
  address: 10,
};

function BVNModification() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [modificationType, setModificationType] = useState(null);
  const [states, setStates] = useState([]);
  const [lgas, setLgas] = useState([]);
  const [banks, setBanks] = useState([]);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const userStr = localStorage.getItem("user");
      const userObj = decryptData(userStr);
      const userId = userObj?._id || userObj?.id;

      if (!userId) {
        throw new Error("User authentication failed. Please log in again.");
      }

      const changeType = values.modificationType;

      // Base payload with fields common to all modification types
      let payload = {
        userId,
        changeType,
        bvn: values.bvn,
        nin: values.nin,
        pin: values.pin,
        institutionType: values.institutionType,
        amount: MODIFICATION_COSTS[changeType],
      };

      // Add fields specific to the modification type
      if (changeType === "name") {
        payload = {
          ...payload,
          firstName: values.firstName,
          lastName: values.lastName,
          middleName: values.middleName || "",
        };
      } else if (changeType === "dob") {
        payload = {
          ...payload,
          dob: values.dob ? values.dob.format("DD-MM-YYYY") : "",
        };
      } else if (changeType === "phone") {
        payload = { ...payload, phone: values.phone };
      } else if (changeType === "address") {
        payload = {
          ...payload,
          address: values.address1,
          state: values.state,
          localGovernment: values.lga,
        };
      }

      await axios.post(
        `${config.apiBaseUrl}${config.endpoints.BVNModification}`,
        payload,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      await Swal.fire({
        icon: "success",
        title: "Submission Successful!",
        text: "Your BVN modification request has been submitted.",
        confirmButtonColor: "#3b82f6", // sky-500
      });

      form.resetFields();
      setModificationType(null);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Submission Failed",
        text: error.response.data.error || error.response.data.message,
        confirmButtonColor: "#3b82f6",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleModificationTypeChange = (value) => {
    setModificationType(value);
    form.resetFields(); // Reset all fields when type changes
    form.setFieldsValue({ modificationType: value });
  };

  useEffect(() => {
    const getStatesFromApi = async () => {
      try {
        let response = await fetch("https://nga-states-lga.onrender.com/fetch");
        let json = await response.json();
        setStates(json);
      } catch (error) {}
    };
    getStatesFromApi();
    setBanks(banksData);
  }, []);

  const handleStateChange = async (value) => {
    form.setFieldsValue({ lga: undefined }); // Reset LGA
    let response = await fetch(
      `https://nga-states-lga.onrender.com/?state=${value}`
    );
    let json = await response.json();
    setLgas(json);
  };

  return (
    <div className="w-full rounded-2xl mb-5 bg-white p-5 shadow-lg">
      <ToastContainer />
      <p className="text-3xl text-center text-sky-500 font-semibold">
        BVN Modification
      </p>
      <div className="max-w-2xl mx-auto mt-5">
        {modificationType && (
          <div className="mb-4 p-3 rounded-md bg-green-100 text-green-800 text-center">
            <span className="font-semibold text-lg">
              Amount: ₦
              {MODIFICATION_COSTS[modificationType]?.toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>
        )}
        <Form form={form} onFinish={onFinish} layout="vertical">
          <Form.Item
            size="large"
            name="modificationType"
            label="Select Modification Type"
            rules={[{ required: true, message: "Please select a type" }]}
          >
            <Select
              placeholder="-- Select an Option --"
              onChange={handleModificationTypeChange}
            >
              <Select.Option value="name">Change of name</Select.Option>
              <Select.Option value="dob">Change of D.o.b</Select.Option>
              <Select.Option value="phone">Change of phone</Select.Option>
              <Select.Option value="address">Change of address</Select.Option>
            </Select>
          </Form.Item>

          {modificationType && (
            <>
              {modificationType === "name" && (
                <>
                  <Form.Item
                    name="institutionType"
                    label="Select Institution"
                    rules={[{ required: true }]}
                  >
                    <Select placeholder="-- Select Institution --">
                      {banks.map((bank) => (
                        <Select.Option key={bank.code} value={bank.name}>
                          {bank.name}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                  <Form.Item
                    name="bvn"
                    label="BVN"
                    rules={[{ required: true }]}
                  >
                    <Input placeholder="BVN" />
                  </Form.Item>
                  <Form.Item
                    name="nin"
                    label="NIN"
                    rules={[{ required: true }]}
                  >
                    <Input placeholder="NIN" />
                  </Form.Item>
                  <Form.Item
                    name="firstName"
                    label="First Name"
                    rules={[{ required: true }]}
                  >
                    <Input placeholder="First Name" />
                  </Form.Item>
                  <Form.Item
                    name="lastName"
                    label="Last name"
                    rules={[{ required: true }]}
                  >
                    <Input placeholder="Last name" />
                  </Form.Item>
                  <Form.Item name="middleName" label="Middle name">
                    <Input placeholder="Middle name" />
                  </Form.Item>
                </>
              )}
            </>
          )}

          {modificationType === "dob" && (
            <>
              <Form.Item
                name="institutionType"
                label="Select Institution"
                rules={[{ required: true }]}
              >
                <Select placeholder="-- Select Institution --">
                  {banks.map((bank) => (
                    <Select.Option key={bank.code} value={bank.name}>
                      {bank.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item name="bvn" label="BVN" rules={[{ required: true }]}>
                <Input placeholder="BVN" />
              </Form.Item>
              <Form.Item
                name="dob"
                label="Date of birth"
                rules={[{ required: true }]}
              >
                <DatePicker className="w-full" />
              </Form.Item>
              <Form.Item name="nin" label="NIN" rules={[{ required: true }]}>
                <Input placeholder="NIN" />
              </Form.Item>
            </>
          )}

          {modificationType === "phone" && (
            <>
              <Form.Item
                name="institutionType"
                label="Select Institution"
                rules={[{ required: true }]}
              >
                <Select placeholder="-- Select Institution --">
                  {banks.map((bank) => (
                    <Select.Option key={bank.code} value={bank.name}>
                      {bank.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item name="bvn" label="BVN" rules={[{ required: true }]}>
                <Input placeholder="BVN" />
              </Form.Item>
              <Form.Item
                name="phone"
                label="Phone Number"
                rules={[{ required: true }]}
              >
                <Input placeholder="Phone Number" />
              </Form.Item>
              <Form.Item name="nin" label="NIN" rules={[{ required: true }]}>
                <Input placeholder="NIN" />
              </Form.Item>
            </>
          )}

          {modificationType === "address" && (
            <>
              <Form.Item
                name="institutionType"
                label="Select Institution"
                rules={[{ required: true }]}
              >
                <Select placeholder="-- Select Institution --">
                  {banks.map((bank) => (
                    <Select.Option key={bank.code} value={bank.name}>
                      {bank.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item name="bvn" label="BVN" rules={[{ required: true }]}>
                <Input placeholder="BVN" />
              </Form.Item>
              <Form.Item
                name="address1"
                label="Address 1"
                rules={[{ required: true }]}
              >
                <Input placeholder="Address 1" />
              </Form.Item>
              <Form.Item
                name="state"
                label="State"
                rules={[{ required: true }]}
              >
                <Select
                  placeholder="-- Select State --"
                  onChange={handleStateChange}
                  showSearch
                >
                  {states.map((state) => (
                    <Select.Option key={state} value={state}>
                      {state}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item
                name="lga"
                label="Local Government"
                rules={[{ required: true }]}
              >
                <Select placeholder="-- Select Local Government --" showSearch>
                  {lgas.map((lga) => (
                    <Select.Option key={lga} value={lga}>
                      {lga}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item name="nin" label="NIN" rules={[{ required: true }]}>
                <Input placeholder="NIN" />
              </Form.Item>
            </>
          )}

          {modificationType && (
            <>
              <Form.Item name="pin" label="PIN" rules={[{ required: true }]}>
                <Input.Password placeholder="PIN" />
              </Form.Item>
            </>
          )}

          {modificationType && (
            <Form.Item>
              <Button
                type="primary"
                size="large"
                htmlType="submit"
                className="w-full bg-sky-500 hover:bg-sky-600"
                loading={loading}
              >
                Submit
              </Button>
            </Form.Item>
          )}
        </Form>
      </div>
    </div>
  );
}

export default BVNModification;
