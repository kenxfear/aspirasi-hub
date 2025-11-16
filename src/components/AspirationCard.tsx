import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Trash2,
  MessageCircle,
  Send,
  Download,
  Calendar,
  User,
  GraduationCap,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface AspirationCardProps {
  aspiration: {
    id: string;
    student_name: string;
    student_class: string | null;
    content: string;
    status: string;
    created_at: string;
    comments: Array<{
      id: string;
      comment_text: string;
      created_at: string;
    }>;
  };
  onUpdate: () => void;
  delay?: number;
}

const AspirationCard = ({ aspiration, onUpdate, delay = 0 }: AspirationCardProps) => {
  const { toast } = useToast();
  const [isCommenting, setIsCommenting] = useState(false);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from("aspirations")
        .delete()
        .eq("id", aspiration.id);

      if (error) throw error;

      toast({
        title: "Aspirasi Dihapus",
        description: "Aspirasi berhasil dihapus.",
      });
      onUpdate();
    } catch (error) {
      toast({
        title: "Gagal Menghapus",
        description: "Terjadi kesalahan saat menghapus aspirasi.",
        variant: "destructive",
      });
    }
  };

  const handleAddComment = async () => {
    if (!comment.trim()) return;

    try {
      setIsSubmitting(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase.from("comments").insert({
        aspiration_id: aspiration.id,
        admin_id: user.id,
        comment_text: comment.trim(),
      });

      if (error) throw error;

      toast({
        title: "Komentar Ditambahkan",
        description: "Komentar berhasil ditambahkan.",
      });
      setComment("");
      setIsCommenting(false);
      onUpdate();
    } catch (error) {
      toast({
        title: "Gagal Menambah Komentar",
        description: "Terjadi kesalahan saat menambahkan komentar.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadDesign = async () => {
    try {
      toast({
        title: "Membuat Design...",
        description: "Mohon tunggu, design sedang dibuat dengan AI...",
      });

      const response = await supabase.functions.invoke("generate-instagram-design", {
        body: { aspirationId: aspiration.id },
      });

      if (response.error) throw response.error;

      // Convert returned SVG to PNG client-side to ensure compatibility on all devices
      const svgText = typeof response.data === "string"
        ? response.data
        : new TextDecoder().decode(response.data as ArrayBuffer);

      const svgBlob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
      const svgUrl = window.URL.createObjectURL(svgBlob);

      await new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement("canvas");
            canvas.width = 1080;
            canvas.height = 1080;
            const ctx = canvas.getContext("2d");
            if (!ctx) throw new Error("Canvas tidak didukung");
            ctx.drawImage(img, 0, 0, 1080, 1080);
            canvas.toBlob((pngBlob) => {
              window.URL.revokeObjectURL(svgUrl);
              if (!pngBlob) return reject(new Error("Gagal membuat PNG"));

              const downloadUrl = window.URL.createObjectURL(pngBlob);
              const a = document.createElement("a");
              a.href = downloadUrl;
              a.download = `aspirasi-design-${new Date(aspiration.created_at).toISOString().split("T")[0]}.png`;
              a.click();
              window.URL.revokeObjectURL(downloadUrl);
              resolve();
            }, "image/png");
          } catch (e) {
            window.URL.revokeObjectURL(svgUrl);
            reject(e);
          }
        };
        img.onerror = () => {
          window.URL.revokeObjectURL(svgUrl);
          reject(new Error("Gagal memuat gambar SVG"));
        };
        img.src = svgUrl;
      });

      toast({
        title: "Download Berhasil! 🎨",
        description: "Design Instagram telah diunduh dan siap diposting!",
      });
    } catch (error) {
      toast({
        title: "Download Gagal",
        description: "Tidak dapat membuat design aspirasi.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Card 
      className="p-6 hover:shadow-lg transition-all animate-fade-in"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="space-y-4">
        <div className="flex justify-between items-start gap-4">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {aspiration.student_name}
              </Badge>
              {aspiration.student_class && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <GraduationCap className="h-3 w-3" />
                  {aspiration.student_class}
                </Badge>
              )}
              <Badge variant="outline" className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(aspiration.created_at)}
              </Badge>
            </div>
            <p className="text-sm md:text-base leading-relaxed">{aspiration.content}</p>
          </div>
        </div>

        {aspiration.comments.length > 0 && (
          <div className="space-y-2 border-t pt-4">
            <p className="text-sm font-medium text-muted-foreground">Komentar Admin:</p>
            {aspiration.comments.map((comment) => (
              <div key={comment.id} className="bg-muted/50 p-3 rounded-lg">
                <p className="text-sm">{comment.comment_text}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDate(comment.created_at)}
                </p>
              </div>
            ))}
          </div>
        )}

        {isCommenting && (
          <div className="space-y-2">
            <Textarea
              placeholder="Tulis komentar..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleAddComment}
                disabled={isSubmitting || !comment.trim()}
              >
                <Send className="mr-2 h-4 w-4" />
                Kirim
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setIsCommenting(false);
                  setComment("");
                }}
              >
                Batal
              </Button>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsCommenting(!isCommenting)}
            className="border-accent text-accent hover:bg-accent hover:text-white"
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            {isCommenting ? "Tutup" : "Komentar"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleDownloadDesign}
            className="border-primary text-primary hover:bg-primary hover:text-white"
          >
            <Download className="mr-2 h-4 w-4" />
            Download Design
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="border-destructive text-destructive hover:bg-destructive hover:text-white"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Hapus
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
                <AlertDialogDescription>
                  Apakah Anda yakin ingin menghapus aspirasi ini? Tindakan ini tidak dapat dibatalkan.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                  Hapus
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </Card>
  );
};

export default AspirationCard;
