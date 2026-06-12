import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getUserSubscription, getUserPayments } from "@/lib/db/queries";
import { ManageSubscriptionButton } from "@/components/payments/manage-subscription-button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDistanceToNow } from "date-fns";
import { getTranslations } from 'next-intl/server';
import type { Metadata } from "next";

type Props = {
  params: Promise<{ locale: string }>;
};

export const metadata: Metadata = {
  title: 'Settings',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function SettingsPage({ params }: Props) {
  const { locale } = await params;

  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const t = await getTranslations('settingsPage');
  const subscription = await getUserSubscription(session.user.id);
  const payments = await getUserPayments(session.user.id, 10);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">
          {t('title', { defaultValue: 'Settings' })}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {t('subtitle', { defaultValue: 'Manage your account settings and subscription' })}
        </p>
      </div>

      {/* Profile Settings */}
      <Card className="p-6 md:p-8 border-border/50">
        <h2 className="text-xl font-semibold">
          {t('profile.title', { defaultValue: 'Profile' })}
        </h2>
        <form>
          <div className="mt-6 space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20 ring-2 ring-primary/10 ring-offset-2 ring-offset-background">
                <AvatarImage src={session.user.image || ""} />
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-lg">
                  {session.user.name?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{session.user.name || t('profile.user', { defaultValue: 'User' })}</p>
                <p className="text-sm text-muted-foreground">
                  {session.user.email}
                </p>
              </div>
            </div>

            <div className="space-y-4 max-w-md">
              <div className="space-y-2">
                <Label htmlFor="name">
                  {t('profile.name', { defaultValue: 'Name' })}
                </Label>
                <Input
                  id="name"
                  name="name"
                  autoComplete="name"
                  defaultValue={session.user.name || ""}
                  placeholder={t('profile.namePlaceholder', { defaultValue: 'Your name' })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">
                  {t('profile.email', { defaultValue: 'Email' })}
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  defaultValue={session.user.email || ""}
                  disabled
                />
                <p className="text-sm text-muted-foreground">
                  {t('profile.emailNote', { defaultValue: 'Email cannot be changed' })}
                </p>
              </div>
              <Button className="active:scale-95 transition-transform shadow-md hover:shadow-lg">
                {t('profile.save', { defaultValue: 'Save Changes' })}
              </Button>
            </div>
          </div>
        </form>
      </Card>

      {/* Subscription */}
      <Card className="p-6 md:p-8 border-border/50">
        <h2 className="text-xl font-semibold">
          {t('subscription.title', { defaultValue: 'Subscription' })}
        </h2>
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
            <div>
              <p className="font-medium">
                {t('subscription.currentPlan', { defaultValue: 'Current Plan' })}
              </p>
              <p className="text-sm text-muted-foreground">
                {subscription?.plan || t('subscription.free', { defaultValue: 'Free' })}
              </p>
            </div>
            <Badge variant={subscription?.status === "active" ? "default" : "secondary"}>
              {subscription?.status || t('subscription.active', { defaultValue: 'Active' })}
            </Badge>
          </div>
          {subscription?.currentPeriodEnd && (
            <p className="text-sm text-muted-foreground">
              {t('subscription.renewsOn', { defaultValue: 'Renews on' })}{" "}
              {new Intl.DateTimeFormat('en-US', { dateStyle: 'long' }).format(subscription.currentPeriodEnd)}
            </p>
          )}
          <ManageSubscriptionButton />
        </div>
      </Card>

      {/* Payment History */}
      {payments.length > 0 && (
        <Card className="p-6 md:p-8 border-border/50">
          <h2 className="text-xl font-semibold">
            {t('payments.title', { defaultValue: 'Payment History' })}
          </h2>
          <div className="mt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('payments.date', { defaultValue: 'Date' })}</TableHead>
                  <TableHead>{t('payments.amount', { defaultValue: 'Amount' })}</TableHead>
                  <TableHead>{t('payments.status', { defaultValue: 'Status' })}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      {formatDistanceToNow(payment.createdAt, { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      ${(payment.amount / 100).toFixed(2)} {payment.currency.toUpperCase()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={payment.status === "succeeded" ? "default" : "secondary"}>
                        {payment.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
}
