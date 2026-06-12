import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ManageSubscriptionButton } from "@/components/payments/manage-subscription-button";
import { Check } from "lucide-react";

interface SubscriptionStatusProps {
  plan: string;
  status: string;
  currentPeriodEnd?: Date;
  provider?: string;
}

export function SubscriptionStatus({
  plan,
  status,
  currentPeriodEnd,
  provider,
}: SubscriptionStatusProps) {
  const getPlanColor = (plan: string) => {
    switch (plan) {
      case "basic":
        return "bg-blue-500";
      case "pro":
        return "bg-purple-500";
      case "enterprise":
        return "bg-amber-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "trialing":
        return "bg-blue-500";
      case "past_due":
        return "bg-yellow-500";
      case "canceled":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold">Subscription</h3>
          <div className="mt-4 flex items-center gap-2">
            <Badge className={getPlanColor(plan)}>
              {plan.charAt(0).toUpperCase() + plan.slice(1)} Plan
            </Badge>
            <Badge variant="outline" className={getStatusColor(status)}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
          </div>
          {currentPeriodEnd && (
            <p className="mt-2 text-sm text-muted-foreground">
              Renews on {new Intl.DateTimeFormat('en-US', { dateStyle: 'long' }).format(currentPeriodEnd)}
            </p>
          )}
          <div className="mt-4">
            <ManageSubscriptionButton provider={provider} />
          </div>
        </div>
        <div className="rounded-full bg-primary/10 p-2">
          <Check className="h-6 w-6 text-primary" />
        </div>
      </div>
    </Card>
  );
}
