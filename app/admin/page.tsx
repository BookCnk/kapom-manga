import { BarChart3, Users, FileText, DollarSign } from "lucide-react";

const stats = [
  {
    label: "ผลงานทั้งหมด",
    value: "12",
    icon: FileText,
    color: "text-blue-500",
  },
  {
    label: "คอมมิชชั่น",
    value: "8",
    icon: DollarSign,
    color: "text-green-500",
  },
  { label: "ผู้ใช้", value: "256", icon: Users, color: "text-purple-500" },
  {
    label: "ยอดเข้าชม",
    value: "1.2k",
    icon: BarChart3,
    color: "text-orange-500",
  },
];

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-medium text-foreground">ภาพรวม</h1>
        <p className="text-sm text-muted-foreground mt-1">
          สถิติและข้อมูลสำคัญ
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="p-5 rounded-xl bg-card border border-border shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-semibold text-foreground mt-1">
                  {stat.value}
                </p>
              </div>
              <div className={`p-2.5 rounded-lg bg-accent ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <a
          href="/admin/manga"
          className="p-6 rounded-xl bg-card border border-border shadow-sm hover:border-orange-500/30 hover:shadow-md transition-all group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <FileText className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <h3 className="font-medium text-foreground group-hover:text-orange-600 transition-colors">
                จัดการมังงะ
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                เพิ่ม แก้ไข หรือลบมังงะ
              </p>
            </div>
          </div>
        </a>

        <a
          href="/admin/portfolio"
          className="p-6 rounded-xl bg-card border border-border shadow-sm hover:border-orange-500/30 hover:shadow-md transition-all group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h3 className="font-medium text-foreground group-hover:text-blue-600 transition-colors">
                ผลงานของฉัน
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                จัดการผลงานของคุณ
              </p>
            </div>
          </div>
        </a>

        <a
          href="/admin/commission"
          className="p-6 rounded-xl bg-card border border-border shadow-sm hover:border-green-500/30 hover:shadow-md transition-all group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <h3 className="font-medium text-foreground group-hover:text-green-600 transition-colors">
                คอมมิชชั่น
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                จัดการรายการคอมมิชชั่น
              </p>
            </div>
          </div>
        </a>
      </div>
    </div>
  );
}
