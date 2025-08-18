export default function Footer() {
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
      <div className="bg-gray-100 border-t border-gray-200">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              Cookies are used to collect anonymous site visitation data to improve website performance. For more info,
              read Privacy Notice
            </span>
            <div className="flex items-center space-x-2">
              <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">Allow</button>
              <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">Decline</button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
