import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';

export function Label({ children, htmlFor }: { children: ReactNode; htmlFor: string }) {
  return (
    <label htmlFor={htmlFor} className="microlabel mb-1.5 block">
      {children}
    </label>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="rule w-full rounded border bg-ink px-3 py-2 text-sm text-bone placeholder:text-bone/30 focus:border-teal/50"
    />
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="rule w-full rounded border bg-ink px-3 py-2 text-sm text-bone focus:border-teal/50"
    />
  );
}

export function Button({
  children,
  kind = 'primary',
  ...rest
}: { children: ReactNode; kind?: 'primary' | 'quiet' } & InputHTMLAttributes<HTMLButtonElement> & {
    type?: 'submit' | 'button';
    disabled?: boolean;
    onClick?: () => void;
  }) {
  const styles =
    kind === 'primary'
      ? 'bg-blue text-bone hover:brightness-110 disabled:opacity-50'
      : 'rule border text-bone/70 hover:border-bone/30 hover:text-bone';
  return (
    <button
      {...rest}
      className={`rounded px-4 py-2 text-sm font-medium transition-all active:scale-[0.98] ${styles}`}
    >
      {children}
    </button>
  );
}

export function ErrorNote({ message }: { message: string | null }) {
  if (!message) return null;
  return <p className="mt-3 text-sm text-teal">{message}</p>;
}
