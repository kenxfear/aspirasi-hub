import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { ThemeToggle } from "@/components/ThemeToggle";

const aspirationSchema = z.object({
  studentName: z.string().trim().max(100, "Nama terlalu panjang").optional(),
  studentClass: z.string().trim().max(50, "Kelas terlalu panjang").optional(),
  content: z.string().trim().min(10, "Aspirasi minimal 10 karakter").max(2000, "Aspirasi maksimal 2000 karakter"),
});

const SubmitAspiration = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    studentName: "",
    studentClass: "",
    content: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      const validated = aspirationSchema.parse(formData);
      setIsSubmitting(true);

      const { error } = await supabase.from("aspirations").insert({
        student_name: validated.studentName || "Anonim",
        student_class: validated.studentClass || null,
        content: validated.content,
      });

      if (error) throw error;

      toast({
        title: "Aspirasi Terkirim!",
        description: "Terima kasih telah menyampaikan aspirasi Anda.",
      });

      setFormData({ studentName: "", studentClass: "", content: "" });
      setTimeout(() => navigate("/"), 2000);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        toast({
          title: "Gagal Mengirim",
          description: "Terjadi kesalahan. Silakan coba lagi.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5 py-12 px-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 right-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-10 left-10 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-1/3 left-1/3 w-72 h-72 bg-secondary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '3s' }} />
      </div>

      <ThemeToggle />

      <div className="container max-w-3xl mx-auto relative z-10">
        <Button
          variant="ghost"
          className="mb-6 hover:bg-muted/80 backdrop-blur-sm border border-border/50"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali
        </Button>

        <Card className="p-8 md:p-10 animate-fade-in shadow-2xl border-2 backdrop-blur-sm bg-card/95">
          <div className="text-center mb-8">
            <div className="inline-block mb-4">
              <Sparkles className="w-12 h-12 text-primary animate-pulse mx-auto" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
              Kirim Aspirasi
            </h1>
            <p className="text-muted-foreground text-lg">
              Sampaikan pendapat, saran, atau keluhan Anda dengan jujur dan aman ✨
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Identitas Anda akan tetap terjaga kerahasiaannya
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="studentName">
                Nama (Opsional)
              </Label>
              <Input
                id="studentName"
                placeholder="Masukkan nama Anda"
                value={formData.studentName}
                onChange={(e) =>
                  setFormData({ ...formData, studentName: e.target.value })
                }
                className={errors.studentName ? "border-destructive" : ""}
              />
              {errors.studentName && (
                <p className="text-sm text-destructive">{errors.studentName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="studentClass">Kelas (Opsional)</Label>
              <Input
                id="studentClass"
                placeholder="Contoh: XII IPA 1"
                value={formData.studentClass}
                onChange={(e) =>
                  setFormData({ ...formData, studentClass: e.target.value })
                }
                className={errors.studentClass ? "border-destructive" : ""}
              />
              {errors.studentClass && (
                <p className="text-sm text-destructive">{errors.studentClass}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">
                Aspirasi <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="content"
                placeholder="Tuliskan aspirasi Anda di sini..."
                rows={8}
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                className={errors.content ? "border-destructive" : ""}
              />
              <p className="text-sm text-muted-foreground">
                {formData.content.length}/2000 karakter
              </p>
              {errors.content && (
                <p className="text-sm text-destructive">{errors.content}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-primary via-accent to-secondary hover:opacity-90 text-white font-semibold py-6 text-lg shadow-lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Mengirim...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Send className="h-5 w-5" />
                  Kirim Aspirasi Sekarang
                </span>
              )}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default SubmitAspiration;
