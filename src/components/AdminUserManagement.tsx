import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UserPlus, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export const AdminUserManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newAdmin, setNewAdmin] = useState({
    email: "",
    password: "",
    fullName: "",
    username: "",
  });

  const { data: admins, isLoading } = useQuery({
    queryKey: ["admins"],
    queryFn: async () => {
      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");
      
      if (rolesError) throw rolesError;
      
      const adminIds = rolesData?.map(r => r.user_id) || [];
      
      if (adminIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .in("id", adminIds);
      
      if (error) throw error;
      return data || [];
    },
  });

  const createAdminMutation = useMutation({
    mutationFn: async () => {
      // Use regular signup
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: newAdmin.email,
        password: newAdmin.password,
        options: {
          data: {
            full_name: newAdmin.fullName,
            username: newAdmin.username,
          },
        },
      });

      if (signUpError) throw signUpError;
      if (!signUpData.user) throw new Error("Failed to create user");

      // Add admin role
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({
          user_id: signUpData.user.id,
          role: "admin",
        });

      if (roleError) throw roleError;
      return signUpData;
    },
    onSuccess: () => {
      toast({
        title: "Admin Berhasil Dibuat",
        description: "Admin baru telah ditambahkan. Mereka perlu verifikasi email untuk login pertama kali.",
      });
      setNewAdmin({ email: "", password: "", fullName: "", username: "" });
      queryClient.invalidateQueries({ queryKey: ["admins"] });
    },
    onError: (error: any) => {
      toast({
        title: "Gagal Membuat Admin",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteAdminMutation = useMutation({
    mutationFn: async (userId: string) => {
      // First remove the role
      const { error: roleError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId);
      
      if (roleError) throw roleError;

      // Note: We can't delete the auth user from client side
      // The user will just lose admin access
    },
    onSuccess: () => {
      toast({
        title: "Admin Dihapus",
        description: "Admin telah kehilangan akses.",
      });
      queryClient.invalidateQueries({ queryKey: ["admins"] });
    },
    onError: (error: any) => {
      toast({
        title: "Gagal Menghapus Admin",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    createAdminMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <UserPlus className="w-5 h-5" />
          Buat Admin Baru
        </h2>
        <form onSubmit={handleCreateAdmin} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newAdmin.email}
                onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={newAdmin.password}
                onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={newAdmin.username}
                onChange={(e) => setNewAdmin({ ...newAdmin, username: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fullName">Nama Lengkap</Label>
              <Input
                id="fullName"
                value={newAdmin.fullName}
                onChange={(e) => setNewAdmin({ ...newAdmin, fullName: e.target.value })}
                required
              />
            </div>
          </div>
          <Button
            type="submit"
            disabled={createAdminMutation.isPending}
            className="w-full"
          >
            {createAdminMutation.isPending ? "Membuat..." : "Buat Admin"}
          </Button>
        </form>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Daftar Admin</h2>
        {isLoading ? (
          <p>Memuat...</p>
        ) : (
          <div className="space-y-2">
            {admins?.map((admin: any) => (
              <div
                key={admin.id}
                className="flex items-center justify-between p-3 bg-muted rounded-lg"
              >
                <div>
                  <p className="font-semibold">{admin.full_name}</p>
                  <p className="text-sm text-muted-foreground">@{admin.username}</p>
                </div>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => deleteAdminMutation.mutate(admin.id)}
                  disabled={deleteAdminMutation.isPending}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
