import React, { useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { format } from "date-fns";
import BVNlogo from "../assets/images/BVN-logo.png";
import Avatar from "../assets/images/1.png";
import Fingerprint from "../assets/images/finger-print.png";
import { BsFillHandIndexThumbFill } from "react-icons/bs";
import { useBVNSlip } from "../../context/BVNSlipContext";
import { useNavigate } from "react-router-dom";

function AdvancedBVNSlip() {
  const { slipData, clearSlip } = useBVNSlip();
  const navigate = useNavigate();

  useEffect(() => {
    if (!slipData) {
      navigate("/dashboard/bvnhistory");
      return;
    }

    toast.success("BVN verified successfully!");

    return () => clearSlip(); // Clean up when component unmounts
  }, []);

  const user = slipData || {};

  // Use base64 image if available, else fallback
  const avatarSrc = user.base64Image
    ? `data:image/jpeg;base64,${user.base64Image}`
    : Avatar;

  const handlePrint = () => {
    toast.info("Printing BVN Slip...", { autoClose: 2000 });
    const prevTitle = document.title;
    document.title = "Advanced BVN Slip";
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        document.title = prevTitle;
      }, 1000);
    }, 1200);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <ToastContainer />
      {/* Print button */}
      <button
        onClick={handlePrint}
        className="mb-4 px-4 py-2 bg-green-600 text-white flex justify-start rounded hover:bg-green-700 no-print"
      >
        Print BVN Slip
      </button>

      {/* Print styles */}

      <div className="w-full max-w-2xl bg-white border shadow-lg rounded-lg px-12 py-7 print-slip relative">
        <div className="flex items-center mb-4">
          <img src={BVNlogo} alt="BVN Logo" className="w-70 h-40 mr-4" />
        </div>

        <div className="flex items-center mb-4">
          <img src={avatarSrc} alt="User Avatar" className="w-40 h-auto mr-4" />
          <div className="flex flex-col">
            <div>
              <p className="text-gray-400 text-[17px] font-semibold">SURNAME</p>
              <p className="text-gray-900 text-[18px] font-semibold">
                {user?.lastName || "-"}
              </p>
            </div>
            <div className="mt-3">
              <p className="text-gray-400 text-[17px] font-semibold">
                FIRST NAME/ OTHER NAME
              </p>
              <p className="text-gray-900 text-[18px] font-semibold">
                {`${user?.firstName || "-"} ${user?.middleName || ""}`}
              </p>
            </div>
            <div className="flex flex-row gap-10 mt-3">
              <div>
                <p className="text-gray-400 text-[16px] font-semibold">
                  DATE OF BIRTH
                </p>
                <p className="text-gray-900 text-[18px] font-semibold">
                  {user?.dateOfBirth || "-"}
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-[16px] font-semibold">
                  GENDER
                </p>
                <p className="text-gray-900 text-[18px] font-semibold">
                  {user?.gender || "-"}
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-[16px] font-semibold">
                  ISSUED DATE
                </p>
                <p className="text-gray-900 text-[18px] font-semibold">
                  {user?.verification_details?.verified_at
                    ? format(
                        new Date(user.verification_details.verified_at),
                        "dd/MM/yyyy"
                      )
                    : "-"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 justify-center mt-4 text-center">
          <p className="text-gray-400 text-[18px] font-semibold">
            Bank Verification Number (BVN)
          </p>
          <p className="text-gray-900 text-3xl font-semibold">
            {user.bvn || "-"}
          </p>
        </div>

        <div className="absolute top-0 right-0 gap-6 mt-12 flex items-center justify-center">
          <BsFillHandIndexThumbFill className="w-20 h-24 text-blue-500" />
          <div>
            <img
              src={Fingerprint}
              alt="Fingerprint"
              className="w-42 h-65 mr-4"
            />
            <p className="text-green-600 text-[20px] ml-[-20px] text-center font-semibold">
              NGA
            </p>
          </div>
        </div>
      </div>
      <style>
        {`
          @media print {
            @page {
              size: auto;
              margin: 0;
            }
            body * {
              visibility: hidden !important;
            }
            .print-slip, .print-slip * {
              visibility: visible !important;
            }
            .print-slip {
              position: absolute !important;
              left: 50%;
              top: 50%;
              transform: translate(-50%, -50%);
              margin: 0 !important;
              box-shadow: none !important;
              background: white !important;
              border: 1px solid #ccc !important;
            }
            .no-print {
              display: none !important;
            }
          }
        `}
      </style>
    </div>
  );
}

export default AdvancedBVNSlip;
