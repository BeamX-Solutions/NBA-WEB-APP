import { useId, type InputHTMLAttributes, type ReactNode } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  error?: string;
  hint?: string;
  icon?: ReactNode;
  inputClassName?: string;
  label: string;
  shortcut?: string;
};

export function Input({
  className = "",
  error,
  hint,
  icon,
  id,
  inputClassName = "",
  label,
  shortcut,
  ...props
}: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const helpId = `${inputId}-help`;

  return (
    <div className={`field ${className}`.trim()}>
      <label className={props.type === "search" ? "sr-only" : "field__label"} htmlFor={inputId}>
        {label}
      </label>
      <div className={`field__control ${error ? "field__control--error" : ""}`}>
        {icon ? <span className="field__icon">{icon}</span> : null}
        <input
          aria-describedby={error || hint ? helpId : undefined}
          aria-invalid={error ? true : undefined}
          className={`field__input ${inputClassName}`.trim()}
          id={inputId}
          {...props}
        />
        {shortcut ? <kbd className="field__shortcut">{shortcut}</kbd> : null}
      </div>
      {error || hint ? (
        <p className={`field__help ${error ? "field__help--error" : ""}`} id={helpId}>
          {error ?? hint}
        </p>
      ) : null}
    </div>
  );
}

