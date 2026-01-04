import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UserPlus, Trash2, Mail } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface AdminEmail {
  id: string;
  email: string;
  created_at: string;
}

export const AdminUserManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newAdminEmail, setNewAdminEmail] = useState("");

  // Fetch registered admin emails
  const { data: adminEmails, isLoading } = useQuery({
    queryKey: ["admin-emails"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_emails" as any)
        .select("*")
        .order("created_at", { ascending: false }) as unknown as { data: AdminEmail[] | null; error: any };

      if (error) throw error;
      return data || [];
    },
  });

  // Add admin email mutation
  const addEmailMutation = useMutation({
    mutationFn: async (email: string) => {
      const { error } = await supabase
        .from("admin_emails" as any)
        .insert({ email: email.toLowerCase().trim() } as any);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Email Admin Ditambahkan",
        description: "Email berhasil didaftarkan. Admin dapat login dengan Google menggunakan email tersebut.",
      });
      setNewAdminEmail("");
      queryClient.invalidateQueries({ queryKey: ["admin-emails"] });
    },
    onError: (error: any) => {
      toast({
        title: "Gagal Menambahkan Email",
        description: error.message?.includes("duplicate") 
          ? "Email sudah terdaftar." 
          : error.message,
        variant: "destructive",
      });
    },
  });

  // Remove admin email mutation
  const removeEmailMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("admin_emails" as any)
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Email Dihapus",
        description: "Email admin berhasil dihapus.",
      });
      queryClient.invalidateQueries({ queryKey: ["admin-emails"] });
    },
    onError: (error: any) => {
      toast({
        title: "Gagal Menghapus Email",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAddEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail.trim()) return;
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newAdminEmail)) {
      toast({
        title: "Email Tidak Valid",
        description: "Masukkan alamat email yang valid.",
        variant: "destructive",
      });
      return;
    }

    addEmailMutation.mutate(newAdminEmail);
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <UserPlus className="w-5 h-5" />
          Daftarkan Email Admin Baru
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Email yang didaftarkan dapat login menggunakan Google OAuth.
        </p>
        <form onSubmit={handleAddEmail} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Admin</Label>
            <div className="flex gap-2">
              <Input
                id="email"
                type="email"
                placeholder="admin@gmail.com"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                required
                className="flex-1"
              />
              <Button
                type="submit"
                disabled={addEmailMutation.isPending}
              >
                {addEmailMutation.isPending ? "Menambahkan..." : "Tambah"}
              </Button>
            </div>
          </div>
        </form>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Daftar Email Admin Terdaftar
        </h2>
        {isLoading ? (
          <p className="text-muted-foreground">Memuat...</p>
        ) : adminEmails && adminEmails.length > 0 ? (
          <div className="space-y-2">
            {adminEmails.map((admin) => (
              <div
                key={admin.id}
                className="flex items-center justify-between p-3 bg-muted rounded-lg"
              >
                <div>
                  <p className="font-medium">{admin.email}</p>
                  <p className="text-xs text-muted-foreground">
                    Ditambahkan: {new Date(admin.created_at).toLocaleDateString("id-ID")}
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => removeEmailMutation.mutate(admin.id)}
                  disabled={removeEmailMutation.isPending}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-4">
            Belum ada email admin yang terdaftar.
          </p>
        )}
      </Card>
    </div>
  );
};
