import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UserPlus, Trash2, Mail, Loader2, Shield } from "lucide-react";
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
        title: "Email Admin Ditambahkan ✓",
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
        title: "Email Dihapus ✓",
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
    <div className="space-y-8">
      {/* Add Admin Card */}
      <Card className="p-8 shadow-xl border-2 border-primary/20 bg-card/80 backdrop-blur-md hover:shadow-2xl transition-all duration-500">
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10">
            <UserPlus className="w-6 h-6 text-primary" />
          </div>
          Daftarkan Email Admin Baru
        </h2>
        <p className="text-muted-foreground mb-6">
          Email yang didaftarkan dapat login menggunakan Google OAuth secara otomatis.
        </p>
        <form onSubmit={handleAddEmail} className="space-y-4">
          <div className="space-y-3">
            <Label htmlFor="email" className="text-base">Email Admin</Label>
            <div className="flex gap-3">
              <Input
                id="email"
                type="email"
                placeholder="admin@gmail.com"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                required
                className="flex-1 py-6 text-base border-2 focus:border-primary transition-all"
              />
              <Button
                type="submit"
                disabled={addEmailMutation.isPending}
                className="px-8 py-6 bg-gradient-to-r from-primary to-accent text-white hover:opacity-90 transition-all hover:scale-105"
              >
                {addEmailMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Tambah"
                )}
              </Button>
            </div>
          </div>
        </form>
      </Card>

      {/* Admin List Card */}
      <Card className="p-8 shadow-xl border-2 border-accent/20 bg-card/80 backdrop-blur-md hover:shadow-2xl transition-all duration-500">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-accent/10">
            <Mail className="w-6 h-6 text-accent" />
          </div>
          Daftar Email Admin Terdaftar
        </h2>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : adminEmails && adminEmails.length > 0 ? (
          <div className="space-y-3">
            {adminEmails.map((admin, index) => (
              <div
                key={admin.id}
                className="flex items-center justify-between p-4 md:p-5 bg-muted/50 rounded-xl border-2 border-border/50 hover:border-primary/30 hover:shadow-lg transition-all duration-300 animate-fade-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Shield className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-base">{admin.email}</p>
                    <p className="text-sm text-muted-foreground">
                      Ditambahkan: {new Date(admin.created_at).toLocaleDateString("id-ID", {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => removeEmailMutation.mutate(admin.id)}
                  disabled={removeEmailMutation.isPending}
                  className="border-2 border-destructive/50 text-destructive hover:bg-destructive hover:text-white hover:border-destructive transition-all duration-300 hover:scale-110"
                >
                  {removeEmailMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-lg">
              Belum ada email admin yang terdaftar.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Tambahkan email di atas untuk memberikan akses admin.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
};
