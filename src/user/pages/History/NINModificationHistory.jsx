import * as React from "react";
import axios from "axios";
import { config } from "../../../config/config.jsx";
import CryptoJS from "crypto-js";
import { format } from "date-fns";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  ArrowsUpDownIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from "@heroicons/react/24/solid";
import { Empty, Modal } from "antd";
import { EyeOutlined } from "@ant-design/icons";

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

export default function NINModificationHistory() {
  const encryptedUser = localStorage.getItem("user");
  const user = decryptData(encryptedUser);
  const userId = user?._id || user?.id;

  const apiLink = `${config.apiBaseUrl}${config.endpoints.modificationHistory}${userId}`;

  const [loading, setLoading] = React.useState(false);
  const [apiData, setApiData] = React.useState([]);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [startDate, setStartDate] = React.useState(null);
  const [endDate, setEndDate] = React.useState(null);
  const [sortConfig, setSortConfig] = React.useState({
    key: "createdAt",
    direction: "desc",
  });
  const [isModalVisible, setIsModalVisible] = React.useState(false);
  const [selectedTransaction, setSelectedTransaction] = React.useState(null);
  const [pageSize, setPageSize] = React.useState(10);
  const [currentPage, setCurrentPage] = React.useState(1);

  const fetchHistory = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const response = await axios.get(apiLink, {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
        },
      });

      let modificationData = response.data?.modify;
      if (modificationData && !Array.isArray(modificationData)) {
        // If it's a single object, wrap it in an array
        modificationData = [modificationData];
      }
      // Ensure we always set an array
      setApiData(Array.isArray(modificationData) ? modificationData : []);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = apiData.filter((transaction) => {
    const searchStr = searchTerm.toLowerCase();
    const transactionDate = new Date(transaction.createdAt);

    const passesDateFilter =
      (!startDate || transactionDate >= startDate) &&
      (!endDate || transactionDate <= endDate);

    const passesSearchFilter =
      transaction.modificationType?.toLowerCase().includes(searchStr) ||
      transaction.firstName?.toLowerCase().includes(searchStr) ||
      transaction.surName?.toLowerCase().includes(searchStr) ||
      transaction.status?.toLowerCase().includes(searchStr);

    return passesDateFilter && passesSearchFilter;
  });

  const sortData = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const getSortedData = (data) => {
    if (!sortConfig.key) return data;

    return [...data].sort((a, b) => {
      if (sortConfig.key === "createdAt") {
        const dateA = new Date(a[sortConfig.key]);
        const dateB = new Date(b[sortConfig.key]);
        return sortConfig.direction === "asc" ? dateA - dateB : dateB - dateA;
      }

      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });
  };

  const TableHeader = ({ label, sortKey, className }) => {
    const isSorted = sortConfig.key === sortKey;
    const icon = isSorted ? (
      sortConfig.direction === "asc" ? (
        <ArrowUpIcon className="w-4 h-4 text-blue-600" />
      ) : (
        <ArrowDownIcon className="w-4 h-4 text-blue-600" />
      )
    ) : (
      <ArrowsUpDownIcon className="w-4 h-4 text-gray-400" />
    );

    return (
      <th
        scope="col"
        className={`${className} cursor-pointer hover:bg-gray-50`}
        onClick={() => sortKey && sortData(sortKey)}
      >
        <div className="flex items-center justify-between">
          <span>{label}</span>
          <span className="ml-2">{icon}</span>
        </div>
      </th>
    );
  };

  const showModal = (transaction) => {
    setSelectedTransaction(transaction);
    setIsModalVisible(true);
  };

  React.useEffect(() => {
    fetchHistory();
  }, [userId]);

  const sortedTransactions = getSortedData(filteredTransactions);

  const paginatedData = sortedTransactions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const totalPages = Math.ceil(sortedTransactions.length / pageSize);

  return (
    <div className="p-4 w-full">
      <h2 className="text-[clamp(1.2rem,2vw,2rem)] font-bold mb-4">
        NIN Modification History
      </h2>

      <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <input
          type="text"
          placeholder="Search registrations..."
          className="p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <DatePicker
          selected={startDate}
          onChange={(date) => setStartDate(date)}
          placeholderText="Start Date"
          className="p-2 border rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          dateFormat="dd/MM/yyyy"
          isClearable
        />
        <DatePicker
          selected={endDate}
          onChange={(date) => setEndDate(date)}
          placeholderText="End Date"
          className="p-2 border rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          dateFormat="dd/MM/yyyy"
          isClearable
        />
      </div>

      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      )}

      {!loading && sortedTransactions.length > 0 ? (
        <div className="relative overflow-hidden rounded-lg border border-gray-200 shadow">
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <table className="w-full table-auto divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <TableHeader
                    label="Date"
                    sortKey="createdAt"
                    className="w-1/6 px-4 py-2 text-left"
                  />
                  <TableHeader
                    label="Modification Type"
                    sortKey="modificationType"
                    className="w-1/3 px-4 py-2 text-left"
                  />
                  <TableHeader
                    label="Name"
                    sortKey="surName"
                    className="w-1/4 px-4 py-2 text-left"
                  />

                  <th scope="col" className="w-1/6 px-4 py-2 text-left">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedData.map((transaction) => (
                  <tr key={transaction._id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 whitespace-nowrap">
                      {format(
                        new Date(transaction.createdAt),
                        "dd/MM/yyyy HH:mm"
                      )}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {transaction.modificationType}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {`${transaction.firstName} ${transaction.surName}`}
                    </td>

                    <td className="px-4 py-2 whitespace-nowrap">
                      <button
                        onClick={() => showModal(transaction)}
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        <EyeOutlined className="text-lg" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : !loading ? (
        <div className="flex flex-col items-center justify-center p-8">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <span>No NIN Modification history records found.</span>
            }
          />
        </div>
      ) : null}

      <Modal
        title="Modification Details"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={600}
      >
        {selectedTransaction && (
          <div className="flex flex-col md:flex-row gap-6 p-4">
            {/* Left side: Passport Photo and Name */}
            <div className="flex-shrink-0 w-full md:w-1/3 flex flex-col items-center text-center">
              {selectedTransaction.passport ? (
                <img
                  src={selectedTransaction.passport}
                  alt="Passport"
                  className="w-32 h-32 object-cover rounded-full border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
                  No Photo
                </div>
              )}
              <h3 className="text-lg font-semibold mt-4 text-gray-800">
                {`${selectedTransaction.firstName} ${selectedTransaction.surName}`}
              </h3>
              <p className="text-sm text-gray-500 capitalize">
                {selectedTransaction.modificationType}
              </p>
            </div>

            {/* Right side: Details */}
            <div className="flex-grow space-y-3 border-t md:border-t-0 md:border-l border-gray-200 pt-4 md:pt-0 md:pl-6">
              {Object.entries(selectedTransaction)
                .filter(
                  ([key]) =>
                    ![
                      "_id",
                      "userId",
                      "updatedAt",
                      "createdAt",
                      "__v",
                      "passport",
                      "firstName",
                      "surName",
                      "modificationType",
                    ].includes(key)
                )
                .map(([key, value]) => (
                  <div key={key} className="grid grid-cols-2 gap-2">
                    <p className="text-sm font-medium text-gray-500 capitalize">
                      {key.replace(/([A-Z])/g, " $1")}:
                    </p>
                    <p className="text-sm text-gray-800 break-words">
                      {key === "dob"
                        ? format(new Date(value), "MMMM d, yyyy")
                        : String(value)}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
