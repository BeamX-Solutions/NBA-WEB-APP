import { RouteLoading } from "@/components/mobile/route-loading";

export default function Loading() {
  return <RouteLoading label="Loading the invoice" subtitle="Your client pays this into the branch account. Upload their payment slip once they have paid." title="Invoice"/>;
}
