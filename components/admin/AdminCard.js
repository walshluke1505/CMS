export default function AdminCard({ children, className = "" }) {
  return (
    <div className={`rounded-3xl bg-white p-6 shadow-sm ${className}`}>
      {children}
    </div>
  );
}