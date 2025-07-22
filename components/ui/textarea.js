export function Textarea({ className = "", ...props }) {
  return (
    <textarea 
      className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 backdrop-blur-sm transition-all duration-200 hover:border-gray-400 shadow-sm resize-vertical ${className}`}
      {...props}
    />
  );
}
