import { Card } from "@/components/ui/card";
import { MessageSquare, MessageCircle, Clock, TrendingUp } from "lucide-react";

interface AspirationStatsProps {
  aspirations: Array<{
    id: string;
    comments: any[];
    created_at: string;
  }>;
}

const AspirationStats = ({ aspirations }: AspirationStatsProps) => {
  const totalAspirations = aspirations.length;
  const totalComments = aspirations.reduce(
    (sum, asp) => sum + asp.comments.length,
    0
  );
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayAspirations = aspirations.filter(
    (asp) => new Date(asp.created_at) >= today
  ).length;

  // Calculate weekly trend
  const lastWeek = new Date();
  lastWeek.setDate(lastWeek.getDate() - 7);
  const weeklyAspirations = aspirations.filter(
    (asp) => new Date(asp.created_at) >= lastWeek
  ).length;

  const stats = [
    {
      label: "Total Aspirasi",
      value: totalAspirations,
      icon: MessageSquare,
      color: "text-primary",
      bgColor: "bg-primary/10",
      borderColor: "border-primary/20",
    },
    {
      label: "Total Komentar",
      value: totalComments,
      icon: MessageCircle,
      color: "text-accent",
      bgColor: "bg-accent/10",
      borderColor: "border-accent/20",
    },
    {
      label: "Aspirasi Hari Ini",
      value: todayAspirations,
      icon: Clock,
      color: "text-secondary",
      bgColor: "bg-secondary/10",
      borderColor: "border-secondary/20",
    },
    {
      label: "Minggu Ini",
      value: weeklyAspirations,
      icon: TrendingUp,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card
            key={stat.label}
            className={`p-6 md:p-8 animate-fade-in shadow-xl border-2 ${stat.borderColor} bg-card/80 backdrop-blur-sm hover:scale-105 hover:shadow-2xl transition-all duration-500 group`}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
              <div className={`${stat.bgColor} p-3 md:p-4 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <Icon className={`h-6 w-6 md:h-8 md:w-8 ${stat.color}`} />
              </div>
              <div className="flex-1">
                <p className="text-xs md:text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                  {stat.label}
                </p>
                <p className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
                  {stat.value}
                </p>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default AspirationStats;
