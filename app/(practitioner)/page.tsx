import { CalculatorFlow } from "@/components/calculator/calculator-flow";
import { loadCalculatorContext } from "@/lib/calculator/data";

export default async function Home() {
  const context = await loadCalculatorContext();
  return <><CalculatorFlow context={context}/></>;
}
