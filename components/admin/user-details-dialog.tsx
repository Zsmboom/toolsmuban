"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

interface User {
  id: string;
  email: string;
  name?: string | null;
  role: string;
  country?: string | null;
  createdAt: Date;
  lastLoginAt?: Date | null;
}

interface UserDetailsDialogProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserDetailsDialog({
  user,
  open,
  onOpenChange,
}: UserDetailsDialogProps) {
  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
          <DialogDescription>
            Detailed information about this user
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Name</p>
            <p className="mt-1 text-base">{user.name || "N/A"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Email</p>
            <p className="mt-1 text-base">{user.email}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Role</p>
            <Badge
              className="mt-1"
              variant={user.role === "admin" ? "default" : "outline"}
            >
              {user.role}
            </Badge>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Country</p>
            <p className="mt-1 text-base">{user.country || "N/A"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              User ID
            </p>
            <p className="mt-1 font-mono text-sm">{user.id}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Registered
            </p>
            <p className="mt-1 text-base">
              {formatDistanceToNow(user.createdAt, { addSuffix: true })} (
              {new Intl.DateTimeFormat('en-US', {
                dateStyle: 'medium',
                timeStyle: 'short'
              }).format(user.createdAt)})
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Last Login
            </p>
            <p className="mt-1 text-base">
              {user.lastLoginAt
                ? `${formatDistanceToNow(user.lastLoginAt, {
                    addSuffix: true,
                  })} (${new Intl.DateTimeFormat('en-US', {
                    dateStyle: 'medium',
                    timeStyle: 'short'
                  }).format(user.lastLoginAt)})`
                : "Never"}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
