import { useRef, useState } from "react";

interface InputBarProps {
  placeholder?: string;
  onSubmit: (value: string) => void;
  disabled?: boolean;
}

export function InputBar({
  placeholder = "",
  onSubmit,
  disabled = false,
}: InputBarProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setValue("");
    inputRef.current?.focus();
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        style={{ fontSize: "16px" }}
      />
    </form>
  );
}
