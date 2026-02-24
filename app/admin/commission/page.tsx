import { Plus, CheckCircle, Clock, XCircle, Pencil, Trash2 } from "lucide-react";

const commissions = [
  { id: 1, client: "คุณสมชาย", type: "ปกนิยาย", status: "กำลังทำ", price: "2,500", dueDate: "15 มี.ค. 68" },
  { id: 2, client: "คุณสมหญิง", type: "อวตาร", status: "รออนุมัติ", price: "800", dueDate: "20 มี.ค. 68" },
  { id: 3, client: "คุณมานี", type: "แฟนอาร์ต", status: "เสร็จสิ้น", price: "1,500", dueDate: "10 มี.ค. 68" },
  { id: 4, client: "คุณมานะ", type: "โลโก้", status: "ยกเลิก", price: "3,000", dueDate: "5 มี.ค. 68" },
];

const statusStyles: Record<string, string> = {
  "กำลังทำ": "bg-blue-500/10 text-blue-600",
  "รออนุมัติ": "bg-yellow-500/10 text-yellow-600",
  "เสร็จสิ้น": "bg-green-500/10 text-green-600",
  "ยกเลิก": "bg-red-500/10 text-red-600",
};

const statusIcons: Record<string, React.ElementType> = {
  "กำลังทำ": Clock,
  "รออนุมัติ": Clock,
  "เสร็จสิ้น": CheckCircle,
  "ยกเลิก": XCircle,
};

export default function CommissionPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-foreground">คอมมิชชั่น</h1>
          <p className="text-sm text-muted-foreground mt-1">จัดการรายการคอมมิชชั่น</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors">
          <Plus className="w-4 h-4" />
          เพิ่มรายการ
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-card border border-border">
          <p className="text-sm text-muted-foreground">ทั้งหมด</p>
          <p className="text-2xl font-semibold text-foreground mt-1">8</p>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <p className="text-sm text-muted-foreground">กำลังทำ</p>
          <p className="text-2xl font-semibold text-blue-600 mt-1">3</p>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <p className="text-sm text-muted-foreground">เสร็จสิ้น</p>
          <p className="text-2xl font-semibold text-green-600 mt-1">4</p>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <p className="text-sm text-muted-foreground">รายได้</p>
          <p className="text-2xl font-semibold text-orange-600 mt-1">฿12.5k</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  ลูกค้า
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  ประเภท
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  สถานะ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  ราคา
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  กำหนดส่ง
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  จัดการ
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {commissions.map((item) => {
                const StatusIcon = statusIcons[item.status];
                return (
                  <tr key={item.id} className="hover:bg-accent/30 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-medium text-foreground">{item.client}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{item.type}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${statusStyles[item.status]}`}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground font-medium">
                      ฿{item.price}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{item.dueDate}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-2 hover:bg-accent rounded-lg text-muted-foreground hover:text-foreground transition-colors">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button className="p-2 hover:bg-red-500/10 rounded-lg text-muted-foreground hover:text-red-500 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
