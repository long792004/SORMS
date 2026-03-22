import { Button } from "@/components/ui/Button";

interface InvoiceCardProps {
  id: string;
  amount: string;
  status: string;
  onPay?: () => void;
}

export function InvoiceCard({ id, amount, status, onPay }: InvoiceCardProps) {
  return (
    <article className="glass-card rounded-xl p-4">
      <p className="text-xs text-slate-500 dark:text-slate-400">Invoice #{id}</p>
      <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">{amount}</p>
      <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">Status: {status}</p>
      {onPay ? <Button className="mt-3 w-full" onClick={onPay}>Pay now</Button> : null}
    </article>
  );
}
