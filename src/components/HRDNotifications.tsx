import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, Check, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export default function HRDNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    loadNotifications();
    
    // Subscribe to real-time notifications
    const channel = supabase
      .channel("hrd_notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "hrd_notifications",
        },
        () => {
          loadNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadNotifications = async () => {
    const { data } = await supabase
      .from("hrd_notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    if (data) {
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.is_read).length);
    }
  };

  const markAsRead = async (id: string) => {
    const { error } = await supabase
      .from("hrd_notifications")
      .update({ is_read: true })
      .eq("id", id);

    if (!error) {
      loadNotifications();
    }
  };

  const markAllAsRead = async () => {
    const { error } = await supabase
      .from("hrd_notifications")
      .update({ is_read: true })
      .eq("is_read", false);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Berhasil", description: "Semua notifikasi ditandai sudah dibaca" });
      loadNotifications();
    }
  };

  const deleteNotification = async (id: string) => {
    const { error } = await supabase
      .from("hrd_notifications")
      .delete()
      .eq("id", id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      loadNotifications();
    }
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      contract_expiry: "bg-orange-100 text-orange-800",
      leave_reminder: "bg-blue-100 text-blue-800",
      payroll: "bg-green-100 text-green-800",
      performance_review: "bg-purple-100 text-purple-800",
      general: "bg-gray-100 text-gray-800",
    };
    return colors[type] || colors.general;
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      contract_expiry: "Kontrak",
      leave_reminder: "Cuti",
      payroll: "Payroll",
      performance_review: "Kinerja",
      general: "Umum",
    };
    return labels[type] || type;
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifikasi</h3>
          {unreadCount > 0 && (
            <Button size="sm" variant="ghost" onClick={markAllAsRead}>
              <Check className="h-4 w-4 mr-2" />
              Tandai Semua
            </Button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Bell className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>Tidak ada notifikasi</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-4 border-b hover:bg-gray-50 transition-colors ${
                  !notif.is_read ? "bg-blue-50" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={getTypeColor(notif.type)}>
                        {getTypeLabel(notif.type)}
                      </Badge>
                      {!notif.is_read && (
                        <span className="h-2 w-2 bg-blue-500 rounded-full"></span>
                      )}
                    </div>
                    <h4 className="font-medium text-sm mb-1">{notif.title}</h4>
                    <p className="text-sm text-gray-600">{notif.message}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(notif.created_at).toLocaleString("id-ID")}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {!notif.is_read && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => markAsRead(notif.id)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteNotification(notif.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
