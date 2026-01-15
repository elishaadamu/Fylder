import React, { useEffect, useState } from "react";
import { useLocation, Navigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FiDownload, FiEye, FiArrowLeft, FiRefreshCw } from "react-icons/fi";
import { AiOutlineLoading3Quarters } from "react-icons/ai";

function PremiumSlip() {
  const location = useLocation();
  const responseData = location.state?.responseData;
  const slipType = location.state?.slipType || "premium";

  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pdfBlob, setPdfBlob] = useState(null);
  const [iframeError, setIframeError] = useState(false);

  // Redirect if no verification data
  if (!responseData) {
    return <Navigate to="/dashboard/verifications/nin" replace />;
  }

  useEffect(() => {
    const processPdfData = () => {
      try {
        // Debug: Log the entire response structure

        // Try to find PDF data in different possible locations
        let pdfBase64 = null;

        // Check various possible locations for the PDF data
        if (responseData.pdf_base64) {
          pdfBase64 = responseData.pdf_base64;
        } else if (responseData.data?.pdf_base64) {
          pdfBase64 = responseData.data.pdf_base64;
        } else if (responseData.data?.data?.pdf_base64) {
          pdfBase64 = responseData.data.data.pdf_base64;
        } else if (responseData.pdfBase64) {
          pdfBase64 = responseData.pdfBase64;
        } else if (responseData.data?.pdfBase64) {
          pdfBase64 = responseData.data.pdfBase64;
        }

        if (pdfBase64) {
          // Clean the base64 string (remove any whitespace or line breaks)
          let cleanBase64 = pdfBase64.replace(/\s/g, "");

          // Remove data URL prefix if present (data:application/pdf;base64,)
          if (cleanBase64.startsWith("data:")) {
            cleanBase64 = cleanBase64.split(",")[1];
          }

          // Validate that it's a valid base64 string
          if (!/^[A-Za-z0-9+/]*={0,2}$/.test(cleanBase64)) {
            throw new Error("Invalid base64 format");
          }

          // Check if base64 string is valid PDF (should start with PDF header when decoded)
          try {
            const testDecode = window.atob(cleanBase64.substring(0, 20));
            if (!testDecode.startsWith("%PDF")) {
            }
          } catch (testError) {
            throw new Error("Base64 string is not valid");
          }

          // Convert base64 to binary
          const binaryString = window.atob(cleanBase64);
          const bytes = new Uint8Array(binaryString.length);

          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }

          // Create blob from binary data
          const blob = new Blob([bytes], { type: "application/pdf" });
          setPdfBlob(blob); // Store the blob separately

          // Create URL for the blob
          const url = URL.createObjectURL(blob);

          setPdfUrl(url);
          setLoading(false);

          toast.success(`${slipType} slip loaded successfully!`, {
            position: "top-right",
            autoClose: 3000,
          });
        } else {
          throw new Error(
            "No PDF data found in response. Check console for complete response structure."
          );
        }
      } catch (err) {
        setError(`Failed to load PDF data: ${err.message}`);
        setLoading(false);
        toast.error(`Failed to load PDF data: ${err.message}`, {
          position: "top-right",
          autoClose: 5000,
        });
      }
    };

    processPdfData();

    // Cleanup function to revoke object URL
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [responseData, slipType]);

  const handleDownload = () => {
    if (!pdfUrl) {
      toast.error("PDF not ready for download");
      return;
    }

    try {
      const link = document.createElement("a");
      link.href = pdfUrl;
      link.download = `${slipType.toLowerCase()}-nin-slip-${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`${slipType} slip downloaded successfully!`, {
        position: "top-right",
        autoClose: 3000,
      });
    } catch (err) {
      toast.error("Failed to download PDF", {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  const handleViewInNewTab = () => {
    if (!pdfUrl) {
      toast.error("PDF not ready for viewing");
      return;
    }

    try {
      window.open(pdfUrl, "_blank");
      toast.info("Opening PDF in new tab...", {
        position: "top-right",
        autoClose: 2000,
      });
    } catch (err) {
      toast.error("Failed to open PDF", {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  const handleRefreshPreview = () => {
    if (pdfBlob) {
      // Revoke old URL and create new one
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
      const newUrl = URL.createObjectURL(pdfBlob);
      setPdfUrl(newUrl);
      setIframeError(false);
      toast.info("Preview refreshed", {
        position: "top-right",
        autoClose: 2000,
      });
    }
  };

  const handleGoBack = () => {
    window.history.back();
  };

  const handleIframeError = () => {
    setIframeError(true);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <ToastContainer />
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <AiOutlineLoading3Quarters className="animate-spin text-4xl text-sky-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            Processing {slipType} Slip
          </h2>
          <p className="text-gray-500">
            Please wait while we prepare your PDF document...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <ToastContainer />
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-lg w-full text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-red-600 mb-2">Error</h2>
          <p className="text-gray-600 mb-4 text-sm">{error}</p>

          {/* Debug Information */}
          <div className="bg-gray-50 p-4 rounded-lg mb-4 text-left">
            <h4 className="font-semibold text-gray-700 mb-2">
              Debug Information:
            </h4>
            <pre className="text-xs text-gray-600 overflow-auto max-h-32">
              {JSON.stringify(responseData, null, 2)}
            </pre>
          </div>

          <button
            onClick={handleGoBack}
            className="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors mx-auto"
          >
            <FiArrowLeft />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
      <ToastContainer />

      {/* Header Card */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6 max-w-2xl w-full">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Premium NIN Slip Ready
          </h1>
          <p className="text-gray-600">
            Your {slipType.toLowerCase()} verification slip has been generated
            successfully
          </p>

          {/* Response Info */}
          {responseData.message && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700 text-sm">
                ✅ {responseData.message}
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleDownload}
            className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors font-medium"
          >
            <FiDownload />
            Download PDF
          </button>

          <button
            onClick={handleViewInNewTab}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors font-medium"
          >
            <FiEye />
            View in New Tab
          </button>
        </div>
      </div>

      {/* PDF Preview Card */}
      <div className="bg-white rounded-xl shadow-lg p-6 max-w-4xl w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">PDF Preview</h3>
          {pdfUrl && (
            <button
              onClick={handleRefreshPreview}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
            >
              <FiRefreshCw />
              Refresh Preview
            </button>
          )}
        </div>

        {pdfUrl ? (
          <>
            {!iframeError ? (
              <div className="border rounded-lg overflow-hidden">
                <iframe
                  src={`${pdfUrl}#toolbar=1&navpanes=1&scrollbar=1`}
                  className="w-full h-96 border-0"
                  title={`${slipType} NIN Slip PDF`}
                  onError={handleIframeError}
                />
              </div>
            ) : (
              <div className="border rounded-lg p-8 bg-gray-50">
                <div className="text-center">
                  <div className="text-4xl mb-4">📄</div>
                  <h4 className="text-lg font-semibold text-gray-700 mb-2">
                    PDF Preview Not Available
                  </h4>
                  <p className="text-gray-600 mb-4">
                    The PDF preview couldn't load in the browser. You can still
                    download or view it in a new tab.
                  </p>
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={handleViewInNewTab}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
                    >
                      View in New Tab
                    </button>
                    <button
                      onClick={handleRefreshPreview}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
            <p className="text-gray-500">PDF preview not available</p>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-6 text-center text-gray-500 text-sm max-w-md">
        <p>
          📄 Your {slipType.toLowerCase()} slip contains detailed verification
          information. Keep this document safe for your records.
        </p>
        {pdfBlob && (
          <p className="mt-2">
            📊 PDF Size: {(pdfBlob.size / 1024).toFixed(2)} KB
          </p>
        )}
      </div>
    </div>
  );
}

export default PremiumSlip;
