export default function AdminTextarea({
  label,
  value,
  onChange,
  placeholder,
  rows = 5,
}) {
  return (
    <div>
      {label && (
        <label className="mb-2 block text-sm font-bold text-[#101820]">
          {label}
        </label>
      )}

      <textarea
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={onChange}
        className="w-full rounded-xl border border-slate-300 px-4 py-3"
      />
    </div>
  );
}