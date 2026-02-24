import { Plus, Pencil, Trash2, ExternalLink } from "lucide-react";

const works = [
  { id: 1, title: "ตำนานเทพยุทธ์", category: "แฟนตาซี", status: "เผยแพร่", updated: "2 วันที่แล้ว" },
  { id: 2, title: "นางร้ายเกมจีบ", category: "โรแมนติก", status: "เผยแพร่", updated: "5 วันที่แล้ว" },
  { id: 3, title: "นักปราชญ์ตกอับ", category: "คอมเมดี้", status: "ฉบับร่าง", updated: "1 สัปดาห์ที่แล้ว" },
  { id: 4, title: "จอมเวทย์ไร้พ่าย", category: "แอคชั่น", status: "เผยแพร่", updated: "2 สัปดาห์ที่แล้ว" },
];

export default function PortfolioPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-foreground">ผลงาน</h1>
          <p className="text-sm text-muted-foreground mt-1">จัดการผลงานทั้งหมด</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors">
          <Plus className="w-4 h-4" />
          เพิ่มผลงาน
        </button>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  ชื่อเรื่อง
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  หมวดหมู่
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  สถานะ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  อัพเดทล่าสุด
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  จัดการ
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {works.map((work) => (
                <tr key={work.id} className="hover:bg-accent/30 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-medium text-foreground">{work.title}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-muted-foreground">{work.category}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${
                        work.status === "เผยแพร่"
                          ? "bg-green-500/10 text-green-600"
                          : "bg-yellow-500/10 text-yellow-600"
                      }`}>
                      {work.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{work.updated}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-2 hover:bg-accent rounded-lg text-muted-foreground hover:text-foreground transition-colors">
                        <ExternalLink className="w-4 h-4" />
                      </button>
                      <button className="p-2 hover:bg-accent rounded-lg text-muted-foreground hover:text-foreground transition-colors">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button className="p-2 hover:bg-red-500/10 rounded-lg text-muted-foreground hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
