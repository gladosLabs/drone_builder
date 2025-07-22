export function Card({ className = "", children, ...props }) {
  return (
    <div className={`border border-gray-200 rounded-xl shadow-sm bg-white ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardContent({ className = "", children, ...props }) {
  return (
    <div className={`p-6 ${className}`} {...props}>
      {children}
    </div>
  );
}
