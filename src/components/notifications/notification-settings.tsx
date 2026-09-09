"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { notificationPreferencesSchema, type NotificationPreferencesInput } from "@/lib/validators";
import type { Notification } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { formatDateShort } from "@/lib/utils";

export function NotificationSettings() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<NotificationPreferencesInput>({
    resolver: zodResolver(notificationPreferencesSchema),
    defaultValues: {
      budget_alert_enabled: true,
      budget_alert_threshold: 80,
      recurring_reminder_enabled: true,
      debt_due_enabled: true,
      goal_milestone_enabled: true,
      monthly_summary_enabled: true,
      unusual_spending_enabled: true,
      push_enabled: true,
      email_enabled: false,
    },
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    const supabase = createClient();

    const [notifRes, prefsRes] = await Promise.all([
      supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user?.id)
        .single(),
    ]);

    if (notifRes.data) setNotifications(notifRes.data);
    if (prefsRes.data) {
      setValue("budget_alert_enabled", prefsRes.data.budget_alert_enabled);
      setValue("budget_alert_threshold", prefsRes.data.budget_alert_threshold);
      setValue("recurring_reminder_enabled", prefsRes.data.recurring_reminder_enabled);
      setValue("debt_due_enabled", prefsRes.data.debt_due_enabled);
      setValue("goal_milestone_enabled", prefsRes.data.goal_milestone_enabled);
      setValue("monthly_summary_enabled", prefsRes.data.monthly_summary_enabled);
      setValue("unusual_spending_enabled", prefsRes.data.unusual_spending_enabled);
      setValue("push_enabled", prefsRes.data.push_enabled);
      setValue("email_enabled", prefsRes.data.email_enabled);
    }
    setIsLoading(false);
  };

  const onSubmit = async (data: NotificationPreferencesInput) => {
    setIsSaving(true);
    const supabase = createClient();

    const { error } = await supabase
      .from("notification_preferences")
      .upsert({
        user_id: user?.id,
        ...data,
        updated_at: new Date().toISOString(),
      });

    setIsSaving(false);
  };

  const markAsRead = async (id: string) => {
    const supabase = createClient();
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);

    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Notifikasi</h1>
        <p className="text-muted-foreground">Kelola notifikasi dan preferensi Anda</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Preferensi Notifikasi</CardTitle>
            <CardDescription>Atur notifikasi mana yang ingin Anda terima</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Alert Anggaran</Label>
                  <p className="text-xs text-muted-foreground">
                    Dapatkan notifikasi saat anggaran hampir habis
                  </p>
                </div>
                <Switch
                  checked={watch("budget_alert_enabled")}
                  onCheckedChange={(checked) => setValue("budget_alert_enabled", checked)}
                />
              </div>

              {watch("budget_alert_enabled") && (
                <div className="space-y-2 pl-4 border-l-2">
                  <Label htmlFor="threshold">Threshold (%)</Label>
                  <Input
                    id="threshold"
                    type="number"
                    min={1}
                    max={100}
                    {...register("budget_alert_threshold", { valueAsNumber: true })}
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Pengingat Transaksi Berulang</Label>
                  <p className="text-xs text-muted-foreground">
                    Pengingat sebelum transaksi berulang terjadi
                  </p>
                </div>
                <Switch
                  checked={watch("recurring_reminder_enabled")}
                  onCheckedChange={(checked) => setValue("recurring_reminder_enabled", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Jatuh Tempo Hutang</Label>
                  <p className="text-xs text-muted-foreground">
                    Notifikasi saat cicilan hampir jatuh tempo
                  </p>
                </div>
                <Switch
                  checked={watch("debt_due_enabled")}
                  onCheckedChange={(checked) => setValue("debt_due_enabled", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Milestone Tujuan</Label>
                  <p className="text-xs text-muted-foreground">
                    Rayakan saat Anda mencapai milestone tabungan
                  </p>
                </div>
                <Switch
                  checked={watch("goal_milestone_enabled")}
                  onCheckedChange={(checked) => setValue("goal_milestone_enabled", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Ringkasan Bulanan</Label>
                  <p className="text-xs text-muted-foreground">
                    Ringkasan keuangan di akhir bulan
                  </p>
                </div>
                <Switch
                  checked={watch("monthly_summary_enabled")}
                  onCheckedChange={(checked) => setValue("monthly_summary_enabled", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Pengeluaran Tidak Biasa</Label>
                  <p className="text-xs text-muted-foreground">
                    Notifikasi jika pengeluaran Anda tidak biasa
                  </p>
                </div>
                <Switch
                  checked={watch("unusual_spending_enabled")}
                  onCheckedChange={(checked) => setValue("unusual_spending_enabled", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Push Notification</Label>
                  <p className="text-xs text-muted-foreground">
                    Terima notifikasi langsung di browser
                  </p>
                </div>
                <Switch
                  checked={watch("push_enabled")}
                  onCheckedChange={(checked) => setValue("push_enabled", checked)}
                />
              </div>

              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Simpan Preferensi
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Notifikasi Terbaru
              {unreadCount > 0 && (
                <Badge className="bg-red-100 text-red-700">
                  {unreadCount} baru
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {notifications.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                Belum ada notifikasi
              </p>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      notification.is_read
                        ? "bg-background"
                        : "bg-muted/50 hover:bg-muted"
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-3">
                      <Bell className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{notification.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDateShort(notification.created_at)}
                        </p>
                      </div>
                      {!notification.is_read && (
                        <div className="h-2 w-2 rounded-full bg-blue-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
