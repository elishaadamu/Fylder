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

export default function PersonalisationHistory() {
  const encryptedUser = localStorage.getItem("user");
  const user = decryptData(encryptedUser);
  const userId = user?._id || user?.id;

  const apiLink = `${config.apiBaseUrl}${config.endpoints.personalisationHistory}${userId}`;

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
  const [isMobile, setIsMobile] = React.useState(false);

  // Detect mobile screen size
  React.useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

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

      let personalisationData = response.data?.personalizationRes;
      if (personalisationData && !Array.isArray(personalisationData)) {
        personalisationData = [personalisationData];
      }
      setApiData(Array.isArray(personalisationData) ? personalisationData : []);
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
      transaction.verifyWith?.toLowerCase().includes(searchStr) ||
      transaction.trackingId?.toLowerCase().includes(searchStr) ||
      transaction.slipLayout?.toLowerCase().includes(searchStr) ||
      transaction.phone?.toLowerCase().includes(searchStr) ||
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
          <span className="text-sm font-medium">{label}</span>
          <span className="ml-2">{icon}</span>
        </div>
      </th>
    );
  };

  const getStatusClass = (status) => {
    const lowerStatus = status?.toLowerCase();
    if (lowerStatus === "successfully") {
      return "bg-green-100 text-green-800";
    }
    if (lowerStatus === "pending") {
      return "bg-blue-100 text-blue-800";
    }
    if (lowerStatus === "rejected") {
      return "bg-red-100 text-red-800";
    }
    return "bg-gray-100 text-gray-800";
  };

  const showModal = (transaction) => {
    setSelectedTransaction(transaction);
    setIsModalVisible(true);
  };

  const handleDownloadSlip = (url, filename) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = `slip-${filename}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  // Mobile Card View Component
  const MobileCard = ({ transaction }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-3 shadow-sm hover:shadow-md transition-shadow">
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="space-y-2">
          <div>
            <span className="font-medium text-gray-500">Date:</span>
            <p className="text-gray-900 font-mono text-xs">
              {format(new Date(transaction.createdAt), "dd/MM/yyyy HH:mm")}
            </p>
          </div>
          <div>
            <span className="font-medium text-gray-500">Tracking ID:</span>
            <p className="text-gray-900 font-mono text-xs break-all">
              {transaction.trackingId}
            </p>
          </div>
        </div>
        <div className="space-y-2">
          <div>
            <span className="font-medium text-gray-500">Status:</span>
            <span
              className={`mt-1 px-2 py-1 text-xs font-semibold rounded-full ${getStatusClass(
                transaction.status
              )}`}
            >
              {transaction.status}
            </span>
          </div>
          <div>
            <span className="font-medium text-gray-500">Phone:</span>
            <p className="text-gray-900 text-xs">
              {transaction.phone || "N/A"}
            </p>
          </div>
        </div>
      </div>
      <button
        onClick={() => showModal(transaction)}
        className="mt-3 w-full py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors text-sm font-medium flex items-center justify-center gap-2"
      >
        <EyeOutlined />
        View Details
      </button>
    </div>
  );

  return (
    <div className="p-4 w-full">
      <h2 className="text-[clamp(1.2rem,2vw,2rem)] font-bold mb-4">
        Personalisation History
      </h2>

      {/* Filters Section */}
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-2">
          <input
            type="text"
            placeholder="Search by tracking ID, phone, status..."
            className="p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <DatePicker
          selected={startDate}
          onChange={(date) => setStartDate(date)}
          placeholderText="Start Date"
          className="p-2 border rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          dateFormat="dd/MM/yyyy"
          isClearable
        />
        <DatePicker
          selected={endDate}
          onChange={(date) => setEndDate(date)}
          placeholderText="End Date"
          className="p-2 border rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          dateFormat="dd/MM/yyyy"
          isClearable
        />
      </div>

      {/* Results Count */}
      {!loading && sortedTransactions.length > 0 && (
        <div className="mb-4 text-sm text-gray-600">
          Showing {paginatedData.length} of {sortedTransactions.length} records
        </div>
      )}

      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      )}

      {!loading && sortedTransactions.length > 0 ? (
        <>
          {/* Mobile Card View */}
          {isMobile ? (
            <div className="space-y-3">
              {paginatedData.map((transaction) => (
                <MobileCard key={transaction._id} transaction={transaction} />
              ))}
            </div>
          ) : (
            /* Desktop Table View */
            <div className="relative overflow-hidden rounded-lg border border-gray-200 shadow">
              <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                <table className="w-full table-auto divide-y divide-gray-200 min-w-[600px]">
                  <thead className="bg-gray-50">
                    <tr>
                      <TableHeader
                        label="Date"
                        sortKey="createdAt"
                        className="px-4 py-3 text-left"
                      />
                      <TableHeader
                        label="Tracking ID"
                        sortKey="trackingId"
                        className="px-4 py-3 text-left"
                      />
                      <TableHeader
                        label="ReplyNote"
                        sortKey="replyNote"
                        className="px-4 py-3 text-left"
                      />
                      {/* <TableHeader
                        label="Verified With"
                        sortKey="verifyWith"
                        className="px-4 py-3 text-left"
                      /> */}
                      <TableHeader
                        label="Status"
                        sortKey="status"
                        className="px-4 py-3 text-left"
                      />
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                        Download
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedData.map((transaction) => (
                      <tr
                        key={transaction._id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          {format(
                            new Date(transaction.createdAt),
                            "dd/MM/yyyy HH:mm"
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm font-mono">
                          <div
                            className="max-w-[200px] truncate"
                            title={transaction.trackingId}
                          >
                            {transaction.trackingId}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {transaction.replyNote || "N/A"}
                        </td>
                        {/* <td className="px-4 py-3 text-sm">
                          {transaction.verifyWith || "N/A"}
                        </td> */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`px-3 py-1 uppercase inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(
                              transaction.status
                            )}`}
                          >
                            {transaction.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {transaction.slip ? (
                            <button
                              onClick={() =>
                                handleDownloadSlip(
                                  transaction.slip,
                                  transaction._id || transaction.id
                                )
                              }
                              className="text-blue-600 pointer-coarse hover:text-blue-800 font-medium text-sm flex items-center gap-1"
                            >
                              <ArrowDownIcon className="w-4 h-4" />
                              Download
                            </button>
                          ) : (
                            <span className="text-gray-400 text-sm">
                              No slip
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4">
              <div className="flex items-center gap-2 text-sm">
                <span>Show:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="border rounded px-2 py-1 text-sm"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
                <span>entries</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>

                <span className="text-sm px-3">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      ) : !loading ? (
        <div className="flex flex-col items-center justify-center p-8">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={<span>No Personalisation history records found.</span>}
          />
        </div>
      ) : null}

      {/* Modal */}
      <Modal
        title="Personalisation Details"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={800}
        className="responsive-modal"
      >
        {selectedTransaction && (
          <div className="space-y-6 p-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Slip Image */}
              <div className="flex flex-col">
                <h4 className="text-sm font-medium text-gray-500 mb-2">
                  Slip Image
                </h4>
                {selectedTransaction.slip ? (
                  <div className="flex-1 border rounded-lg overflow-hidden bg-gray-50">
                    <img
                      src={selectedTransaction.slip}
                      alt="Personalisation Slip"
                      className="w-full h-auto max-h-64 object-contain"
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-48 bg-gray-100 rounded-lg border">
                    <p className="text-gray-500 text-sm">
                      No slip image available
                    </p>
                  </div>
                )}
              </div>

              {/* Transaction Details */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-500 mb-2">
                  Transaction Details
                </h4>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Date & Time
                      </p>
                      <p className="text-sm text-gray-900 mt-1">
                        {format(
                          new Date(selectedTransaction.createdAt),
                          "PPpp"
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Status
                      </p>
                      <span
                        className={`mt-1 px-3 py-1 text-xs font-semibold rounded-full ${getStatusClass(
                          selectedTransaction.status
                        )}`}
                      >
                        {selectedTransaction.status}
                      </span>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Tracking ID
                    </p>
                    <p className="text-sm text-gray-900 font-mono mt-1 bg-gray-50 p-2 rounded">
                      {selectedTransaction.trackingId || "N/A"}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Phone</p>
                      <p className="text-sm text-gray-900 mt-1">
                        {selectedTransaction.phone || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Verified With
                      </p>
                      <p className="text-sm text-gray-900 mt-1">
                        {selectedTransaction.verifyWith || "N/A"}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Slip Layout
                    </p>
                    <p className="text-sm text-gray-900 mt-1">
                      {selectedTransaction.slipLayout || "N/A"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Reply Note
                    </p>
                    <p className="text-sm text-gray-900 mt-1 bg-gray-50 p-3 rounded min-h-[60px]">
                      {selectedTransaction.replyNote || "No notes available"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
