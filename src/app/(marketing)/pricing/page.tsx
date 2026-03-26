import { Badge, Card } from "@/components/ui";

const plans = [
  { name: "Starter", amount: "GBP 19/mo", detail: "Entry-level plan for occasional members." },
  { name: "Standard", amount: "GBP 29/mo", detail: "Balanced plan used by most active members." },
  { name: "Plus", amount: "GBP 49/mo", detail: "Higher contribution tier with larger draw pool impact." },
];

export default function PricingPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Plans</h1>
        <p className="mt-1 text-sm text-zinc-600">Reference plan tiers used by subscriptions in the app.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.name}>
            <Badge>{plan.name}</Badge>
            <p className="mt-3 text-2xl font-semibold tracking-tight text-zinc-900">{plan.amount}</p>
            <p className="mt-2 text-sm text-zinc-600">{plan.detail}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
