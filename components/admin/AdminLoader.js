export default function AdminLoader({ text = "Loading..." }) {
  return (
    <div className="flex min-h-[250px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 text-center">
      <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />
      <p className="text-sm text-slate-500">{text}</p>
    </div>
  );
}