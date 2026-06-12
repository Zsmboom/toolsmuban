"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Loader2, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ManageSubscriptionButtonProps {
  provider?: string;
}

export function ManageSubscriptionButton({ provider }: ManageSubscriptionButtonProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleManage = async () => {
    try {
      setLoading(true);

      // Route to the correct portal based on provider
      let endpoint: string;

      switch (provider) {
        case 'creem':
          endpoint = '/api/creem/portal';
          break;
        case 'stripe':
        default:
          endpoint = '/api/stripe/portal';
          break;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to open customer portal');
      }

      // Redirect to customer portal
      window.location.href = data.url;
    } catch (error) {
      console.error('Portal error:', error);
      toast({
        variant: "destructive",
        title: "Failed to Open Portal",
        description: error instanceof Error ? error.message : "Failed to open subscription management. Please try again.",
      });
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleManage}
      disabled={loading}
      variant="outline"
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading...
        </>
      ) : (
        <>
          Manage Subscription
          <ExternalLink className="ml-2 h-4 w-4" />
        </>
      )}
    </Button>
  );
}
