export default function Header() {
    return (
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm border-b border-gray-800">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              OpenPulse
            </h1>
            <span className="text-xs text-gray-500 border border-gray-700 px-2 py-1 rounded">
              v0.1.0
            </span>
          </div>
          
          <nav className="flex items-center gap-6">
            <button className="text-sm text-gray-300 hover:text-white transition-colors">
              Load Graph
            </button>
            <button className="text-sm text-gray-300 hover:text-white transition-colors">
              Settings
            </button>
            <button className="text-sm bg-blue-600 hover:bg-blue-700 px-4 py-1.5 rounded transition-colors">
              Demo Data
            </button>
          </nav>
        </div>
      </header>
    );
  }