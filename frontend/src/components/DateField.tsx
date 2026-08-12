"use client";

interface DateFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export default function DateField({ label, value, onChange, disabled = false }: DateFieldProps) {
  return (
    <label className="block space-y-1">
      <span className="text-[11px] font-medium uppercase tracking-wide text-stone-500">{label}</span>
      <input
        type="date"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        onPointerDown={(event) => event.stopPropagation()}
        className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 disabled:bg-stone-100 disabled:text-stone-500"
      />
    </label>
  );
}
