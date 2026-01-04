useEffect(() => {
  const finalizeLogin = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    const email = session.user.email?.toLowerCase();

    // 1. cek whitelist admin
    const { data: admin } = await supabase
      .from("admin_emails")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (!admin) {
      await supabase.auth.signOut();
      navigate("/");
      return;
    }

    // 2. pastikan role ADA
    const { data: role } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (!role) {
      await supabase.from("user_roles").insert({
        user_id: session.user.id,
        role: "admin"
      });
    }

    navigate("/admin/dashboard");
  };

  finalizeLogin();
}, []);
