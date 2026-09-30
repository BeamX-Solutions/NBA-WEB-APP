import { CalculatorFlow } from "@/components/calculator/calculator-flow";
import { AppShell } from "@/components/mobile/app-shell";
import { loadCalculatorContext } from "@/lib/calculator/data";

export default async function Home() {
  const context = await loadCalculatorContext();
  return <AppShell tabs><CalculatorFlow context={context}/></AppShell>;
}
