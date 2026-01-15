import * as React from "react";
import axios from "axios";
import { config } from "../../config/config.jsx";
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
import { useBVNSlip } from "../../context/BVNSlipContext";

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
  const { viewSlip } = useBVNSlip();
  const navigate = useNavigate();

  // Get encrypted user data from localStorage
  const encryptedUser = localStorage.getItem("user");
  const user = decryptData(encryptedUser);
  const userId = user?.id;

  // Set the API link using the userId
  const apiLink = `${config.apiBaseUrl}${config.endpoints.DataHistory}${userId}`;

  const [loading, setLoading] = React.useState(false);
  const [apiData, setApiData] = React.useState([]);
  const [verificationType, setVerificationType] = React.useState("NIN-Slip");
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
      console.log("API Response:", response.data);

      setApiData(response.data?.findData || []);
    } catch (error) {
      console.error("Error fetching verification history:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter transactions based on verification type
  const filteredTransactions = apiData.filter((transaction) => {
    if (verificationType === "all") return true;
    return transaction.dataFor === verificationType;
  });

  // Get unique verification types from the data
  const verificationTypes = React.useMemo(() => {
    const types = [...new Set(apiData.map((item) => item.dataFor))].filter(
      Boolean
    );
    return types.sort();
  }, [apiData]);

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
    const dataFor = transaction.dataFor;
    console.log("Transaction Data:", transaction);

    // Handle NIN-Slip
    if (dataFor === "NIN-Slip") {
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
      }
    }
    // Handle BVN-Slip
    else if (dataFor === "BVN-Slip") {
      const apiData = transaction.data?.data;
      viewSlip(apiData, slipType);

      if (slipType === "Basic") {
        navigate("/dashboard/verifications/basicbvn");
      } else {
        navigate("/dashboard/verifications/advancedbvn");
      }
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
      {/* Filter Verifications */}
      <div className="mb-6">
        <p className="text-sm font-medium text-gray-700 mb-3">Filter:</p>
        <div className="flex flex-wrap gap-2">
          {verificationTypes.map((type) => {
            // Map internal type names to user-friendly labels
            const typeLabels = {
              "NIN-Slip": "NIN History",
              "BVN-Slip": "BVN History",
              "IPE-Slip": "IPE History",
            };
            const displayLabel = typeLabels[type] || type;

            return (
              <button
                key={type}
                onClick={() => {
                  setVerificationType(type);
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                  verificationType === type
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {displayLabel}
              </button>
            );
          })}
        </div>
      </div>

      {/* Loading Spinner */}
      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <p className="text-gray-500 text-sm">
              Loading transaction history...
            </p>
          </div>
        </div>
      )}

      {!loading && sortedTransactions.length > 0 ? (
        <div className="relative overflow-hidden rounded-lg border border-gray-200 shadow">
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            {/* NIN-Slip Table */}
            {verificationType === "NIN-Slip" && (
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
                      <td className="w-[clamp(120px,20vw,160px)] py-2 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[clamp(0.65rem,1vw,0.75rem)] font-medium capitalize">
                          {transaction.data?.user_data?.searchParameter ||
                            "N/A"}
                        </span>
                      </td>
                      <td className="py-2">
                        <span className="mt-1 text-[11px] font-medium px-2 py-0.5 rounded-full inline-block bg-blue-100 text-blue-800">
                          {transaction.data?.user_data?.transactionStatus ||
                            "N/A"}
                        </span>
                      </td>
                      <td className="w-[clamp(120px,20vw,160px)] px-2 py-2 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[clamp(0.65rem,1vw,0.75rem)] font-medium capitalize bg-blue-100 text-blue-800">
                          {transaction.dataFor} - {transaction.slipLayout}
                        </span>
                      </td>
                      <td className="w-[60px] px-2 py-2 whitespace-nowrap">
                        <button
                          onClick={() => handleViewSlip(transaction)}
                          className="text-green-600 hover:text-green-800 transition-colors"
                        >
                          <EyeOutlined className="text-lg" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* BVN-Slip Table */}
            {verificationType === "BVN-Slip" && (
              <table className="w-full table-auto divide-y divide-gray-200 transition-all duration-300 ease-in-out">
                <thead className="bg-gray-50">
                  <tr>
                    <TableHeader
                      label="Date"
                      sortKey="createdAt"
                      className="w-[clamp(80px,15vw,112px)] px-2 py-2 text-left text-[clamp(0.65rem,1vw,0.75rem)] font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200"
                    />
                    <th className="w-[60px] px-2 py-2 text-left text-[clamp(0.65rem,1vw,0.75rem)] font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                      BVN Number
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
                  {paginatedData
                    .filter((t) =>
                      verificationType === "all"
                        ? t.dataFor === "BVN-Slip"
                        : true
                    )
                    .map((transaction, index) => (
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
                        <td className="w-[clamp(120px,20vw,160px)] py-2 whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[clamp(0.65rem,1vw,0.75rem)] font-medium capitalize">
                            {transaction.data?.data?.bvn || "N/A"}
                          </span>
                        </td>
                        <td className="w-[clamp(120px,20vw,160px)] py-2 whitespace-nowrap">
                          <span className="mt-1 text-sm font-medium capitalize px-2 py-0.5 rounded-full inline-block bg-blue-100 text-blue-800">
                            {transaction.data?.verification?.status || "N/A"}
                          </span>
                        </td>
                        <td className="w-[clamp(120px,20vw,160px)] py-2 whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[clamp(0.65rem,1vw,0.75rem)] font-medium capitalize bg-blue-100 text-blue-800">
                            {transaction.dataFor}-{transaction.slipLayout}
                          </span>
                        </td>
                        <td className="w-[60px] px-2 py-2 whitespace-nowrap">
                          <button
                            onClick={() => handleViewSlip(transaction)}
                            className="text-green-600 hover:text-green-800 transition-colors"
                          >
                            <EyeOutlined className="text-lg" />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}

            {/* IPE-Slip Table */}
            {verificationType === "IPE-Slip" && (
              <table className="w-full table-auto divide-y divide-gray-200 transition-all duration-300 ease-in-out">
                <thead className="bg-gray-50">
                  <tr>
                    <TableHeader
                      label="Date"
                      sortKey="createdAt"
                      className="w-[clamp(80px,15vw,112px)] px-2 py-2 text-left text-[clamp(0.65rem,1vw,0.75rem)] font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200"
                    />
                    <TableHeader
                      label="Status"
                      sortKey="status"
                      className="w-[100px] px-2 py-2 text-left text-[clamp(0.65rem,1vw,0.75rem)] font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200"
                    />
                    <th className="w-[60px] px-2 py-2 text-left text-[clamp(0.65rem,1vw,0.75rem)] font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                      Tracking ID
                    </th>
                    <th className="w-[60px] px-2 py-2 text-left text-[clamp(0.65rem,1vw,0.75rem)] font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                      Details
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
                          "dd/MM/yyyy HH:mm:ss"
                        )}
                      </td>
                      <td className="w-[100px] py-2 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                            transaction?.status?.toLowerCase() === "pending"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {transaction?.status ||
                            transaction.data?.result?.data
                              ?.verification_status ||
                            "N/A"}
                        </span>
                      </td>
                      <td className="w-[60px] py-2 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium">
                          {transaction.data?.reply ||
                            transaction?.trackingId ||
                            transaction.data?.result?.data?.structured_summary
                              ?.new_tracking_id ||
                            "N/A"}
                        </span>
                      </td>
                      <td className="w-[60px] px-2 py-2 whitespace-nowrap">
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
            )}
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
                    {selectedTransaction.dataFor}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Verification Type
                  </p>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedTransaction.verifyWith} -{" "}
                    {selectedTransaction.slipLayout}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <span className="mt-1 text-sm font-medium capitalize px-2 py-0.5 rounded-full inline-block bg-blue-100 text-blue-800">
                    {selectedTransaction.data?.verification?.status ||
                      selectedTransaction?.data?.user_data
                        ?.verificationStatus ||
                      "N/A"}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Reference</p>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedTransaction.data?.verification?.reference ||
                      selectedTransaction?.data?.user_data
                        ?.transactionReference ||
                      "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Endpoint</p>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedTransaction.data?.endpoint_name || "N/A"}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm font-medium text-gray-500">
                    Response Detail
                  </p>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedTransaction.data?.detail ||
                      selectedTransaction?.data?.message ||
                      "N/A"}
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
