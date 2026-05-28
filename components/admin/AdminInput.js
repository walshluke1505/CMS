export default function AdminInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}) {
  return (
    <div>
      {label && (
        <label className="mb-2 block text-sm font-bold text-[#101820]">
          {label}
        </label>
      )}

      <input
        required={required}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={onChange}
        className="w-full rounded-xl border border-slate-300 px-4 py-3"
      />
    </div>
  );
}