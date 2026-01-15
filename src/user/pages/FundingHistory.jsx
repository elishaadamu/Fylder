import * as React from "react";
import axios from "axios";
import { config } from "../../config/config.jsx";
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

// Secret key
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
  const encryptedUser = localStorage.getItem("user");
  const user = decryptData(encryptedUser);
  const userId = user?._id || user?.id;

  const apiLink = `${config.apiBaseUrl}${config.endpoints.VerificationHistory}${userId}`;

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

  const fetchVerificationHistory = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const response = await axios.get(apiLink, {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      });
      setApiData(response.data?.transactions || []);
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchVerificationHistory();
  }, [userId]);

  const filteredTransactions = apiData.filter((tx) => {
    const search = searchTerm.toLowerCase();
    const date = new Date(tx.createdAt);

    return (
      tx.type === "credit" &&
      (!startDate || date >= startDate) &&
      (!endDate || date <= endDate) &&
      (tx.transactionReference?.toLowerCase().includes(search) ||
        tx.status?.toLowerCase().includes(search) ||
        tx.description?.toLowerCase().includes(search))
    );
  });

  const sortData = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    if (sortConfig.key === "createdAt") {
      return sortConfig.direction === "asc"
        ? new Date(a.createdAt) - new Date(b.createdAt)
        : new Date(b.createdAt) - new Date(a.createdAt);
    }
    return sortConfig.direction === "asc"
      ? a[sortConfig.key] > b[sortConfig.key]
        ? 1
        : -1
      : a[sortConfig.key] < b[sortConfig.key]
      ? 1
      : -1;
  });

  const TableHeader = ({ label, sortKey }) => {
    const active = sortConfig.key === sortKey;
    const icon = active ? (
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
        onClick={() => sortKey && sortData(sortKey)}
        className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer whitespace-nowrap"
      >
        <div className="flex items-center justify-between">
          {label}
          {icon}
        </div>
      </th>
    );
  };

  return (
    <div className="p-4 w-full max-w-full overflow-x-hidden">
      <h2 className="text-lg font-bold mb-4">Funding History</h2>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <input
          type="text"
          placeholder="Search..."
          className="p-2 border rounded-lg"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <DatePicker
          selected={startDate}
          onChange={setStartDate}
          placeholderText="Start Date"
          className="p-2 border rounded-lg w-full"
          dateFormat="dd/MM/yyyy"
          isClearable
        />
        <DatePicker
          selected={endDate}
          onChange={setEndDate}
          placeholderText="End Date"
          className="p-2 border rounded-lg w-full"
          dateFormat="dd/MM/yyyy"
          isClearable
        />
      </div>

      {!loading && sortedTransactions.length > 0 ? (
        <div className="rounded-lg border border-gray-200 shadow overflow-x-auto overscroll-x-contain">
          <table className="min-w-[700px] w-full table-auto divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <TableHeader label="Date" sortKey="createdAt" />
                <TableHeader
                  label="Transaction Ref"
                  sortKey="transactionReference"
                />
                <TableHeader label="Amount" sortKey="amount" />
                <TableHeader label="Status" sortKey="status" />
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {sortedTransactions.map((tx, i) => (
                <tr key={tx._id || i} className="hover:bg-gray-50">
                  <td className="px-3 py-3 whitespace-nowrap text-sm">
                    {format(new Date(tx.createdAt), "dd/MM/yyyy HH:mm")}
                  </td>
                  <td className="px-3 py-3 max-w-[220px] truncate text-sm">
                    {tx.transactionReference}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm">
                    ₦{tx.amount.toLocaleString()}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium capitalize
                      ${
                        tx.status === "success"
                          ? "bg-green-100 text-green-800"
                          : tx.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty description="No Funding Records" />
      )}

      <Modal
        title="Transaction Details"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        {selectedTransaction && JSON.stringify(selectedTransaction, null, 2)}
      </Modal>
    </div>
  );
}
