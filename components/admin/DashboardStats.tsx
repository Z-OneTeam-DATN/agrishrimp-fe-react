import { Banknote, ShoppingCart, Users, Box } from "lucide-react";

const stats = [
  { label: "Doanh thu tổng", value: "2.5B VND", trend: "+12.5%", icon: Banknote, color: "bg-teal-50 text-teal-600" },
  { label: "Tổng đơn hàng", value: "1,240", trend: "+5.2%", icon: ShoppingCart, color: "bg-blue-50 text-blue-600" },
  { label: "CTV hoạt động", value: "85", trend: "+2.1%", icon: Users, color: "bg-purple-50 text-purple-600" },
  { label: "Tổng sản phẩm", value: "450", trend: "+8.4%", icon: Box, color: "bg-orange-50 text-orange-600" },
];

export default function DashboardStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((item, index) => {
        const Icon = item.icon;
        return (
          <div key={index} className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-50">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl ${item.color}`}>
                <Icon size={24} />
              </div>
              <span className="bg-green-100 text-green-600 text-[11px] font-bold px-2 py-1 rounded-full">
                {item.trend}
              </span>
            </div>
            <p className="text-gray-500 text-sm font-medium">{item.label}</p>
            <h3 className="text-3xl font-bold text-gray-800 mt-1">{item.value}</h3>
          </div>
        );
      })}
    </div>
  );
}