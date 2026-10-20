import { PaymentsList } from "@/components/payments/payments-list";
import { loadPayments } from "@/lib/payments/live-payments";

export default async function PaymentsPage() {
  return <PaymentsList load={await loadPayments()}/>;
}
