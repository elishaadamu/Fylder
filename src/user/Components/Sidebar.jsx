import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom"; // <-- import useNavigate

import {
  FiHome,
  FiKey,
  FiLogOut,
  FiSettings,
  FiFileText,
  FiClock,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import {
  FaBuilding,
  FaCar,
  FaFlag,
  FaHistory,
  FaIdBadge,
  FaLeaf,
  FaPhone,
  FaSimCard,
  FaUserCheck,
} from "react-icons/fa";
import { FaListCheck, FaPersonCircleCheck } from "react-icons/fa6";
import { RiBankCardLine, RiPassportFill } from "react-icons/ri";
import {
  MdContactPhone,
  MdDataThresholding,
  MdHistory,
  MdLocationSearching,
  MdOutlineEdit,
  MdOutlineSubscriptions,
} from "react-icons/md";
import { IoEnterSharp } from "react-icons/io5";
import { GrValidate } from "react-icons/gr";
import { VscVerified } from "react-icons/vsc";
import { Menu, Dropdown } from "antd";
import { DownOutlined } from "@ant-design/icons";
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

const sidebarSections = [
  {
    section: "",
    links: [
      {
        to: "/dashboard",
        icon: <FiHome className="w-5 h-5" />,
        label: "Dashboard",
        end: true, // <-- add this property
      },
    ],
  },
  {
    section: "AUTOMATIC SERVICES",
    links: [
      {
        to: "/dashboard/verifications/nin",
        icon: <FaFlag className="w-5 h-5" />,
        label: "NIN Verification",
      },

      {
        to: "/dashboard/verifications/bvn",
        icon: <FaSimCard className="w-5 h-5" />,
        label: "BVN Verification",
      },

      {
        to: "/dashboard/ipe-clearance",
        icon: <FaPersonCircleCheck className="w-5 h-5" />,
        label: "IPE Clearance",
      },
      {
        to: "/dashboard/check-ipe-status",
        icon: <FaUserCheck className="w-5 h-5" />,
        label: "Check IPE Status",
      },
    ],
  },
  {
    section: "MANUAL SERVICES",
    links: [
      {
        to: "/dashboard/validation",
        icon: <GrValidate className="w-5 h-5" />,
        label: "Validation",
      },
      {
        to: "/dashboard/enrollment",
        icon: <IoEnterSharp className="w-5 h-5" />,
        label: "Enrollment",
      },
      {
        to: "/dashboard/modification",
        icon: <RiPassportFill className="w-5 h-5" />,
        label: "NIN Modification",
      },
      {
        to: "/dashboard/personalisation",
        icon: <FaLeaf className="w-5 h-5" />,
        label: "Personalisation",
      },
      {
        to: "/dashboard/demographic-search",
        icon: <MdLocationSearching className="w-5 h-5" />,
        label: "Demographic Search",
      },
      {
        to: "/dashboard/bvn-modification",
        icon: <MdOutlineEdit className="w-5 h-5" />,
        label: "BVN Modification",
      },

      {
        to: "/dashboard/bvn-licence",
        icon: <FaCar className="w-5 h-5" />,
        label: "BVN Licence",
      },
      {
        to: "/dashboard/cac",
        icon: <FaIdBadge className="w-5 h-5" />,
        label: "CAC Registration",
      },
      {
        to: "/dashboard/bank-agency",
        icon: <FaBuilding className="w-5 h-5" />,
        label: "Banking Agency",
      },
    ],
  },
  {
    section: "SUMMARY AND HISTORY",
    links: [
      {
        isDropdown: true,
        icon: <FiClock className="w-5 h-5" />,
        label: "History",
        items: [
          {
            key: "funding",
            to: "/dashboard/fundinghistory",
            icon: <FiFileText className="w-5 h-5" />,
            label: "Funding History",
          },
          {
            to: "/dashboard/demographic-history",
            icon: <MdLocationSearching className="w-5 h-5" />,
            label: "Demographic History",
          },
          {
            key: "bvn",
            to: "/dashboard/bvnhistory",
            icon: <VscVerified className="w-5 h-5" />,
            label: "BVN History",
          },
          {
            key: "nin",
            to: "/dashboard/ninhistory",
            icon: <MdHistory className="w-5 h-5" />,
            label: "NIN History",
          },

          {
            key: "ipe",
            to: "/dashboard/ipe-history",
            icon: <FaPersonCircleCheck className="w-5 h-5" />,
            label: "IPE Clearance History",
          },
          {
            to: "/dashboard/validation-history",
            icon: <GrValidate className="w-5 h-5" />,
            label: "Validation",
          },
          {
            to: "/dashboard/bvn-modification-history",
            icon: <RiBankCardLine className="w-5 h-5" />,
            label: "BVN Modification",
          },
          // {
          //   key: "cac",
          //   to: "/dashboard/cac-history",
          //   icon: <FaIdBadge className="w-5 h-5" />,
          //   label: "CAC History",
          // },
          {
            to: "/dashboard/personalisation-history",
            icon: <FaLeaf className="w-5 h-5" />,
            label: "Personalisation",
          },
          {
            to: "/dashboard/nin-modification-history",
            icon: <RiPassportFill className="w-5 h-5" />,
            label: "NIN Modification",
          },
          {
            to: "/dashboard/bvn-licence-history",
            icon: <FaCar className="w-5 h-5" />,
            label: "BVN Licence",
          },
          {
            key: "API Usage",
            to: "/dashboard/api-usage",
            icon: <FaListCheck className="w-5 h-5" />,
            label: "API Usage",
          },
        ],
      },
    ],
  },
  {
    section: "DEVELOPER AND SECURITY",
    links: [
      {
        to: "/dashboard/api-documentation",
        icon: <FiKey className="w-5 h-5" />,
        label: "Documentation",
      },
      {
        to: "/change-password",
        icon: <FiKey className="w-5 h-5" />,
        label: "Change Password",
      },
      {
        to: "/dashboard/reset-pin",
        icon: <FiSettings className="w-5 h-5" />,
        label: "Reset Pin",
      },
      {
        to: "/login",
        icon: <FiLogOut className="w-5 h-5 text-red-500" />,
        label: "Sign Out",
      },
    ],
  },
];

function Sidebar({ collapsed, setCollapsed, sidebarOpen, setSidebarOpen }) {
  const navigate = useNavigate();
  
  const user = decryptData(localStorage.getItem("user"));

  const handleNavLinkClick = () => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  const handleLogout = (e) => {
    e.preventDefault();
    localStorage.removeItem("user");
    navigate("/login");
  };

  const filteredSections = sidebarSections.filter(section => {
    // Hide specific sections for API users if they can't process verifications
    if (user?.isApiUser && !user?.canProcessVerification) {
      return section.section !== "AUTOMATIC SERVICES" && section.section !== "MANUAL SERVICES";
    }
    return true;
  });

  return (
    <>
      {/* Backdrop for mobile */}
      <div
        className={`fixed inset-0  z-20 md:hidden transition-opacity duration-300 ${
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      ></div>

      <div
        className={`sidebar custom-scrollbar fixed flex flex-col top-0 left-0 h-full shadow-lg text-blue-300 bg-gray-900 z-30
        transition-transform md:transition-all duration-300
        ${collapsed ? "w-20" : "w-64"} 
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0
      `}
      >
        {/* Collapse/Expand Button */}
        <button
          className="absolute cursor-pointer -right-3 top-6 z-40 hidden md:flex items-center justify-center w-7 h-7 rounded-full bg-gray-800 border border-gray-700 hover:bg-gray-700 transition-colors"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          type="button"
        >
          {collapsed ? <FiChevronRight /> : <FiChevronLeft />}
        </button>

        <div
          className="flex  items-center pl-[15px] md:pl-[30px] h-20 border-b border-gray-700 transition-all duration-300"
          onClick={handleNavLinkClick}
        >
          <NavLink to="/dashboard" className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="Logo"
              className={`transition-all duration-300 ${
                collapsed ? "w-10  ml-[-10px]" : "w-[60px] "
              } `}
            />
            <span
              className={`text-2xl font-bold ${
                collapsed ? "hidden" : "block ml-4"
              }`}
            >
              Fylder
            </span>
          </NavLink>
        </div>

        <div className="flex-1 overflow-y-auto mt-4">
          {filteredSections.map((section, i) => (
            <div key={i} className="mb-6">
              {!collapsed && section.section && (
                <p className="px-6 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  {section.section}
                </p>
              )}
              <div className="flex flex-col">
                {section.section === "VERIFICATIONS" ? (
                  <>
                    {section.links.map((link, j) => {
                      // Normal links
                      return (
                        <NavLink
                          to={link.to}
                          key={j}
                          end={link.end || false} // <-- add this line
                          onClick={handleNavLinkClick}
                          className={({ isActive }) =>
                            `flex items-center px-6 py-2 text-sm font-medium border-l-4 transition-colors duration-200
                          ${collapsed ? "justify-center px-0" : ""}
                          ${
                            isActive
                              ? "border-[#2ca4e2] text-blue-300 bg-gray-800"
                              : "border-transparent text-gray-300 hover:text-blue-300 hover:bg-gray-800"
                          }`
                          }
                          title={collapsed ? link.label : undefined}
                        >
                          {link.icon}
                          {!collapsed && (
                            <span className="ml-3">{link.label}</span>
                          )}
                        </NavLink>
                      );
                    })}
                  </>
                ) : section.section === "SUMMARY AND HISTORY" ? (
                  // Special handling for SUMMARY AND HISTORY section
                  section.links.map((link, j) => {
                    if (link.isDropdown) {
                      const menu = (
                        <Menu
                          items={link.items.map((item) => ({
                            key: item.key,
                            label: (
                              <NavLink
                                to={item.to}
                                className="flex items-center text-sm font-medium"
                                onClick={handleNavLinkClick}
                              >
                                {item.icon}
                                <span className="ml-3 hover:text-[#2ca4e2]">
                                  {item.label}
                                </span>
                              </NavLink>
                            ),
                          }))}
                          className="bg-gray-800 border border-gray-700"
                        />
                      );

                      return (
                        <Dropdown
                          key={j}
                          overlay={menu}
                          trigger={["click"]}
                          overlayClassName="history-dropdown"
                        >
                          <div
                            className={`flex items-center px-6 py-2 text-sm font-medium border-l-4 cursor-pointer
          ${collapsed ? "justify-center px-0" : ""}
          border-transparent text-gray-300 hover:text-blue-300 hover:bg-gray-800`}
                          >
                            {link.icon}
                            {!collapsed && (
                              <>
                                <span className="ml-3">{link.label}</span>
                                <DownOutlined className="ml-2" />
                              </>
                            )}
                          </div>
                        </Dropdown>
                      );
                    }
                    return null;
                  })
                ) : (
                  // All other sections
                  section.links.map((link, j) => {
                    // For the Sign Out link
                    if (link.label === "Sign Out") {
                      return (
                        <a
                          href="/login"
                          key={j}
                          onClick={handleLogout}
                          // onClick is already handled by handleLogout which navigates.
                          className={`flex items-center px-6 py-2 text-sm font-medium border-l-4 transition-colors duration-200
                        ${collapsed ? "justify-center px-0" : ""}
                        border-transparent text-gray-300 hover:text-blue-300 hover:bg-gray-800`}
                          title={collapsed ? link.label : undefined}
                        >
                          {link.icon}
                          {!collapsed && (
                            <span className="ml-3">{link.label}</span>
                          )}
                        </a>
                      );
                    }
                    // All other links
                    return (
                      <NavLink
                        to={link.to}
                        key={j}
                        end={link.end || false}
                        onClick={handleNavLinkClick}
                        className={({ isActive }) =>
                          `flex items-center px-6 py-2 text-sm font-medium border-l-4 transition-colors duration-200
                      ${collapsed ? "justify-center px-0" : ""}
                      ${
                        isActive
                          ? "border-[#2ca4e2] text-blue-300 bg-gray-800"
                          : "border-transparent text-gray-300 hover:text-blue-300 hover:bg-gray-800"
                      }`
                        }
                        title={collapsed ? link.label : undefined}
                      >
                        {link.icon}
                        {!collapsed && (
                          <span className="ml-3">{link.label}</span>
                        )}
                      </NavLink>
                    );
                  })
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default Sidebar;
