export default function PlatformIllustration() {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Main white card/container */}
      <div className="relative bg-white rounded-lg shadow-2xl p-6 transform -rotate-2 w-full max-w-md">
        {/* Top section with colored squares and chart */}
        <div className="flex items-center gap-2 mb-4">
          {/* Colored squares */}
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded bg-cyan-400"></div>
            <div className="w-3 h-3 rounded bg-green-400"></div>
            <div className="w-3 h-3 rounded bg-orange-400"></div>
            <div className="w-3 h-3 rounded bg-red-400"></div>
          </div>
          
          {/* Pie chart representation */}
          <div className="ml-auto flex items-center gap-1">
            <div className="w-8 h-8 rounded-full border-4 border-blue-500 border-t-transparent"></div>
            <div className="w-6 h-6 rounded-full bg-cyan-300"></div>
            <div className="w-4 h-4 rounded-full bg-green-400"></div>
          </div>
        </div>

        {/* Code lines simulation */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-16 h-2 bg-gray-300 rounded"></div>
            <div className="w-8 h-2 bg-gray-200 rounded"></div>
            <div className="w-12 h-2 bg-gray-300 rounded"></div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-12 h-2 bg-gray-200 rounded"></div>
            <div className="w-20 h-2 bg-gray-300 rounded"></div>
            <div className="w-6 h-2 bg-gray-200 rounded"></div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-2 bg-gray-300 rounded"></div>
            <div className="w-14 h-2 bg-gray-200 rounded"></div>
            <div className="w-8 h-2 bg-gray-300 rounded"></div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-16 h-2 bg-gray-200 rounded"></div>
            <div className="w-10 h-2 bg-gray-300 rounded"></div>
          </div>
        </div>

        {/* Status indicators on the right */}
        <div className="absolute right-4 top-12 flex flex-col gap-1">
          <div className="w-2 h-2 rounded-full bg-green-400"></div>
          <div className="w-2 h-2 rounded-full bg-red-400"></div>
          <div className="w-2 h-2 rounded-full bg-orange-400"></div>
          <div className="w-2 h-2 rounded-full bg-red-400"></div>
          <div className="w-2 h-2 rounded-full bg-green-400"></div>
        </div>
      </div>

      {/* Background shape */}
      <div className="absolute inset-0 bg-gray-200/20 rounded-lg transform rotate-6 -z-10"></div>
    </div>
  );
}
