import * as React from "react";
import axios from "axios";
import { config } from "../../../config/config.jsx";
import CryptoJS from "crypto-js";
import { format } from "date-fns"; // Add this import for date formatting
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  ArrowsUpDownIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from "@heroicons/react/24/solid";
import { Empty, Modal } from "antd";
import { InboxOutlined, EyeOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

// Add your secret key for decryption
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

export default function VerificationsHistoryTable() {
  const navigate = useNavigate();

  // Get encrypted user data from localStorage
  const encryptedUser = localStorage.getItem("user");
  const user = decryptData(encryptedUser);
  const userId = user?.id || user?._id;

  // Set the API link using the userId
  const apiLink = `${config.apiBaseUrl}${config.endpoints.DataHistory}${userId}`;

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

  const fetchVerificationHistory = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const response = await axios.get(apiLink, {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
        },
      });

      const details = response.data?.findData || [];
      setApiData(details || []);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  // Filter transactions based on search term and only show credit transactions
  // Modify the filteredTransactions to only show IPE-Slip data
  const filteredTransactions = apiData.filter((transaction) => {
    // First filter for IPE-Slip only
    if (transaction.dataFor !== "NIN-Slip") return false;

    const searchStr = searchTerm.toLowerCase();
    const transactionDate = new Date(transaction.createdAt);

    // Date filter
    const passesDateFilter =
      (!startDate || transactionDate >= startDate) &&
      (!endDate || transactionDate <= endDate);

    // Text search filter for BVN specific fields
    const passesSearchFilter =
      transaction.slipLayout?.toLowerCase().includes(searchStr) ||
      transaction.data?.reference?.toLowerCase().includes(searchStr) ||
      transaction.data?.status?.toLowerCase().includes(searchStr) ||
      transaction.data?.data?.firstName?.toLowerCase().includes(searchStr) ||
      transaction.data?.data?.lastName?.toLowerCase().includes(searchStr) ||
      transaction.data?.detail?.toLowerCase().includes(searchStr);

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

  // Create a reusable header component
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

  const handleViewSlip = (transaction) => {
    const slipType = transaction.slipLayout;
    const apiData = transaction;
    if (slipType === "premium") {
      navigate("/dashboard/verifications/premiumslip", {
        state: { responseData: transaction },
      });
    } else if (slipType === "regular") {
      navigate("/dashboard/verifications/regularslip", {
        state: { responseData: transaction },
      });
    } else if (slipType === "standard") {
      navigate("/dashboard/verifications/standardslip", {
        state: { responseData: transaction },
      });
    } else {
      navigate("/dashboard/ninhistory");
    }
  };

  React.useEffect(() => {
    fetchVerificationHistory();
  }, [userId]);

  const sortedTransactions = getSortedData(filteredTransactions);

  // Pagination logic
  const paginatedData = sortedTransactions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const totalPages = Math.ceil(sortedTransactions.length / pageSize);

  return (
    <div className="p-4 w-full">
      <h2 className="text-[clamp(1.2rem,2vw,2rem)] font-bold mb-4">
        NIN Verification History
      </h2>

      {/* Search and Date Filter Controls */}
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <input
          type="text"
          placeholder="Search transactions..."
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

      {/* Loading Spinner */}
      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <p className="text-gray-500 text-sm">
              Loading NIN verification history...
            </p>
          </div>
        </div>
      )}

      {!loading && sortedTransactions.length > 0 ? (
        <div className="relative overflow-hidden rounded-lg border border-gray-200 shadow">
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <table className="w-full table-auto divide-y divide-gray-200 transition-all duration-300 ease-in-out">
              <thead className="bg-gray-50">
                <tr>
                  <TableHeader
                    label="Date"
                    sortKey="createdAt"
                    className="w-[clamp(80px,15vw,112px)] px-2 py-2 text-left text-[clamp(0.65rem,1vw,0.75rem)] font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200"
                  />
                  <th className="w-[60px] px-2 py-2 text-left text-[clamp(0.65rem,1vw,0.75rem)] font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    NIN Number
                  </th>

                  <th className="w-[60px] px-2 py-2 text-left text-[clamp(0.65rem,1vw,0.75rem)] font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    STATUS
                  </th>
                  <TableHeader
                    label="Card Type"
                    sortKey="dataFor"
                    className="w-[clamp(120px,20vw,160px)] px-2 py-2 text-left text-[clamp(0.65rem,1vw,0.75rem)] font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200"
                  />
                  <th className="w-[60px] px-2 py-2 text-left text-[clamp(0.65rem,1vw,0.75rem)] font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Download slip
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedData.map((transaction, index) => (
                  <tr
                    key={transaction._id || index}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="w-[clamp(80px,15vw,112px)] px-2 py-2 whitespace-nowrap text-[clamp(0.8rem,1vw,0.75rem)] text-gray-900">
                      {format(
                        new Date(transaction.createdAt),
                        "dd/MM/yyyy HH:mm"
                      )}
                    </td>

                    <td className="w-[clamp(120px,20vw,160px)]  py-2 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[clamp(0.65rem,1vw,0.75rem)] font-medium capitalize ">
                        {transaction.data?.user_data?.searchParameter || "N/A"}
                      </span>
                    </td>
                    <span className="mt-1 text-[11px] font-medium  px-2 py-0.5 rounded-full inline-block bg-blue-100 text-blue-800">
                      {transaction.data.user_data?.transactionStatus || "N/A"}
                    </span>
                    <td className="w-[clamp(120px,20vw,160px)] px-2 py-2 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[clamp(0.65rem,1vw,0.75rem)] font-medium capitalize bg-blue-100 text-blue-800">
                        {transaction.dataFor} - {transaction.slipLayout}
                      </span>
                    </td>
                    <td className="w-[60px] px-2 py-2 whitespace-nowrap">
                      {transaction.dataFor !== "IPE-Slip" ? (
                        <button
                          onClick={() => handleViewSlip(transaction)}
                          className="text-green-600 hover:text-green-800 transition-colors"
                        >
                          <EyeOutlined className="text-lg" />
                        </button>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
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
            imageStyle={{ height: 60 }}
            description={
              <div className="text-center">
                <p className="text-gray-500 text-lg mb-2">
                  No Transaction Records Found
                </p>
                <p className="text-gray-400 text-sm">
                  Your transaction history will appear here
                </p>
              </div>
            }
          />
        </div>
      ) : null}

      {/* Pagination Controls - only show when not loading and has data */}
      {!loading && sortedTransactions.length > 0 && (
        <div className="mt-4 flex flex-col lg:flex-row gap-4 items-center justify-between">
          {/* Rows per page and showing entries */}
          <div className="flex flex-col sm:flex-row items-center gap-2 w-full lg:w-auto">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700 whitespace-nowrap">
                Rows per page:
              </span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="border rounded-md px-2 py-1 text-sm transition-colors duration-200 ease-in-out hover:border-blue-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <span className="text-sm text-gray-700 text-center sm:text-left">
              Showing {(currentPage - 1) * pageSize + 1} to{" "}
              {Math.min(currentPage * pageSize, sortedTransactions.length)} of{" "}
              {sortedTransactions.length} entries
            </span>
          </div>

          {/* Pagination buttons */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className={`px-3 py-1 rounded-md transition-all duration-200 ease-in-out transform hover:scale-105 min-w-[80px] ${
                currentPage === 1
                  ? "bg-gray-100 text-gray-400"
                  : "bg-blue-500 text-white hover:bg-blue-600"
              }`}
            >
              Previous
            </button>

            <div className="flex flex-wrap items-center gap-1 max-w-[calc(100vw-2rem)] overflow-x-auto">
              {totalPages <= 7 ? (
                // Show all pages if total pages are 7 or less
                [...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`px-3 py-1 rounded-md transition-all duration-200 ease-in-out transform hover:scale-105 ${
                      currentPage === i + 1
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 hover:bg-gray-200"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))
              ) : (
                // Show truncated pagination for more than 7 pages
                <>
                  {[...Array(Math.min(3, totalPages))].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`px-3 py-1 rounded-md transition-all duration-200 ease-in-out transform hover:scale-105 ${
                        currentPage === i + 1
                          ? "bg-blue-500 text-white"
                          : "bg-gray-100 hover:bg-gray-200"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  {currentPage > 4 && <span className="px-2">...</span>}
                  {currentPage > 3 && currentPage < totalPages - 2 && (
                    <button className="px-3 py-1 rounded-md bg-blue-500 text-white">
                      {currentPage}
                    </button>
                  )}
                  {currentPage < totalPages - 3 && (
                    <span className="px-2">...</span>
                  )}
                  {[...Array(Math.min(2, totalPages))].map((_, i) => (
                    <button
                      key={totalPages - 1 + i}
                      onClick={() => setCurrentPage(totalPages - 1 + i)}
                      className={`px-3 py-1 rounded-md transition-all duration-200 ease-in-out transform hover:scale-105 ${
                        currentPage === totalPages - 1 + i
                          ? "bg-blue-500 text-white"
                          : "bg-gray-100 hover:bg-gray-200"
                      }`}
                    >
                      {totalPages - 1 + i}
                    </button>
                  ))}
                </>
              )}
            </div>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className={`px-3 py-1 rounded-md transition-all duration-200 ease-in-out transform hover:scale-105 min-w-[80px] ${
                currentPage === totalPages
                  ? "bg-gray-100 text-gray-400"
                  : "bg-blue-500 text-white hover:bg-blue-600"
              }`}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Add Modal */}
      <Modal
        title="Verification Details"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={600}
      >
        {selectedTransaction && (
          <div className="space-y-4">
            {selectedTransaction.dataFor === "IPE-Slip" ? (
              // IPE-Slip specific details
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Date</p>
                  <p className="mt-1 text-sm text-gray-900">
                    {format(
                      new Date(selectedTransaction.createdAt),
                      "dd/MM/yyyy HH:mm:ss"
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <span className="mt-1 text-sm font-medium capitalize px-2 py-0.5 rounded-full inline-block bg-green-100 text-green-800">
                    {selectedTransaction.data?.transactionStatus || "N/A"}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Name</p>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedTransaction.data?.reply?.name || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Date of Birth
                  </p>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedTransaction.data?.reply?.dob || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">New NIN</p>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedTransaction.data?.newNIN || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    New Tracking ID
                  </p>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedTransaction.data?.newTracking_id || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Old Tracking ID
                  </p>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedTransaction.data?.old_tracking_id || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Verification Status
                  </p>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedTransaction.data?.verificationStatus || "N/A"}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm font-medium text-gray-500">Message</p>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedTransaction.data?.message || "N/A"}
                  </p>
                </div>
              </div>
            ) : (
              // Existing modal content for other verification types
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Date</p>
                  <p className="mt-1 text-sm text-gray-900">
                    {format(
                      new Date(selectedTransaction.createdAt),
                      "dd/MM/yyyy HH:mm:ss"
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Data For</p>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedTransaction.dataFor} -{" "}
                    {selectedTransaction.slipLayout}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Verification Type
                  </p>
                  <p className="mt-1 uppercase text-sm text-gray-900">
                    {selectedTransaction.verifyWith}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <span className="mt-1 text-sm font-medium capitalize px-2 py-0.5 rounded-full inline-block bg-blue-100 text-blue-800">
                    {selectedTransaction.data.user_data.transactionStatus ||
                      "N/A"}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Reference</p>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedTransaction.data?.user_data
                      ?.transactionReference || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Response Details
                  </p>
                  <p className="mt-1 text-sm text-gray-900">
                    <td className="mt-2">
                      {selectedTransaction.dataFor !== "IPE-Slip" ? (
                        <button
                          onClick={() => handleViewSlip(selectedTransaction)}
                          className="text-green-600 border p-1 rounded hover:text-green-800 transition-colors"
                        >
                          View Slip
                        </button>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm font-medium text-gray-500">
                    Response Message
                  </p>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedTransaction.data?.message || "N/A"}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
