import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, LogIn } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";

const SUPERADMIN_EMAIL = "kenxfear@gmail.com";

const AdminLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if already logged in
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Check if user has admin or superadmin role
        const { data: roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id);

        if (roles && roles.length > 0) {
          navigate("/admin/dashboard");
        }
      }
    };

    checkSession();

    // Listen for auth changes (after Google redirect)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session?.user) {
          await handlePostLogin(session.user);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handlePostLogin = async (user: any) => {
    try {
      // Check if user email is superadmin
      if (user.email === SUPERADMIN_EMAIL) {
        // Check if superadmin role exists
        const { data: existingRole } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "superadmin")
          .single();

        if (!existingRole) {
          // Add superadmin role
          await supabase.from("user_roles").insert({
            user_id: user.id,
            role: "superadmin" as const,
          });
        }

        toast({
          title: "Login Berhasil",
          description: "Selamat datang Superadmin!",
        });
        navigate("/admin/dashboard");
        return;
      }

      // For regular admins, check if their email is registered using raw query
      const { data: adminEmails, error: adminError } = await supabase
        .from("admin_emails" as any)
        .select("email")
        .eq("email", user.email)
        .single();

      if (adminError || !adminEmails) {
        // Not an authorized admin
        await supabase.auth.signOut();
        toast({
          title: "Akses Ditolak",
          description: "Email Anda tidak terdaftar sebagai admin.",
          variant: "destructive",
        });
        return;
      }

      // Check if admin role exists
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .single();

      if (!existingRole) {
        // Add admin role
        await supabase.from("user_roles").insert({
          user_id: user.id,
          role: "admin" as const,
        });
      }

      toast({
        title: "Login Berhasil",
        description: "Selamat datang di panel admin!",
      });
      navigate("/admin/dashboard");
    } catch (error: any) {
      console.error("Post-login error:", error);
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat memproses login.",
        variant: "destructive",
      });
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/admin/login`,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Login Gagal",
        description: error.message || "Tidak dapat login dengan Google.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary/5 via-background to-accent/5 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-64 h-64 bg-secondary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <ThemeToggle />

      <div className="w-full max-w-md relative z-10">
        <Button
          variant="ghost"
          className="mb-6 hover:bg-muted"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali
        </Button>

        <Card className="p-8 animate-fade-in shadow-2xl border-2">
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-secondary to-accent mx-auto mb-4 flex items-center justify-center shadow-lg animate-pulse">
              <LogIn className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent">
              Admin Login
            </h1>
            <p className="text-muted-foreground">
              Login dengan akun Google yang terdaftar
            </p>
          </div>

          <div className="space-y-6">
            <Button
              onClick={handleGoogleLogin}
              className="w-full bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 font-medium py-6"
              disabled={isLoading}
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {isLoading ? "Memproses..." : "Login dengan Google"}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              <p>Hanya email yang terdaftar oleh superadmin yang dapat login.</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminLogin;
