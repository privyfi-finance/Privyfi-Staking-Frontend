import React, { useEffect, useState } from "react";

export default function Footer() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookieConsent");
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const handleConsent = (choice: "allow" | "decline") => {
    localStorage.setItem("cookieConsent", choice);
    setShowBanner(false);
  };

  if (!showBanner) return null;
  return (
    <footer className="bg-white border-t border-gray-200 mt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center space-x-4 mb-4 md:mb-0">
            <div className="flex items-center space-x-1 text-sm text-gray-500">
              <span>Terms of Use</span>
              <span>|</span>
              <span>Privacy Notice</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Powered by</span>
            <div className="flex items-center">
              <span className="text-lg font-bold text-slate-800">Privy</span>
              <span className="text-lg font-bold text-cyan-500">Fi</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cookie Notice */}
      <div className="bg-gray-100 border-t border-gray-200 fixed bottom-0 w-full z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-col md:flex-row items-center justify-between text-sm gap-3">
            <span className="text-gray-600 text-center md:text-left">
              Cookies are used to collect anonymous site visitation data to improve website performance. For more info, read{" "}
              <a href="/privacy-policy" target="_blank" className="underline text-blue-600">Privacy Notice</a>.
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleConsent("allow")}
                className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50"
              >
                Allow
              </button>
              <button
                onClick={() => handleConsent("decline")}
                className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50"
              >
                Decline
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
