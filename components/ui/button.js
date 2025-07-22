export function Button({ className = "", children, ...props }) {
  return (
    <button 
      className={`bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
