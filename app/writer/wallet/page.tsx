"use client";

import { useState, useEffect } from "react";
import { HelpCircle } from "lucide-react";
// Date formatting utilities

type WalletData = {
  wallet: {
    balance: number;
    totalSales: number;
    totalSupport: number;
    totalBalance: number;
  };
  status: {
    transferWithdrawalStatus: string;
    nextSettlementDate: string;
  };
  salesTransactions: Array<{
    id: number;
    date: string;
    type: string;
    salesItem: string;
    amount: number;
  }>;
  supportTransactions: Array<{
    id: number;
    date: string;
    readerProfile: string;
    amount: number;
  }>;
  readCoinTransfers: any[];
  withdrawals: Array<{
    id: number;
    transactionId: string;
    date: string;
    status: string;
    withdrawTo: string;
    salesAmount: number;
    supportAmount: number;
    totalWithdrawal: number;
  }>;
};

export default function WriterWalletPage() {
  const [data, setData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [salesPage, setSalesPage] = useState(1);
  const [supportPage, setSupportPage] = useState(1);
  const [withdrawalPage, setWithdrawalPage] = useState(1);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const itemsPerPage = 10;

  useEffect(() => {
    fetchWalletData();
  }, [selectedMonth, selectedYear]);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      const sessionToken = localStorage.getItem("session_token") || "";
      const response = await fetch("/api/writer/wallet", {
        headers: {
          "x-session-token": sessionToken,
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setData(result.data);
        }
      }
    } catch (error) {
      console.error("Failed to fetch wallet data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return (amount / 100).toFixed(2);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const day = date.getDate();
      const month = getThaiMonth(date.getMonth() + 1);
      const year = date.getFullYear() + 543;
      const hours = date.getHours().toString().padStart(2, "0");
      const minutes = date.getMinutes().toString().padStart(2, "0");
      return `${day} ${month} ${year} ${hours}:${minutes} น.`;
    } catch {
      return dateString;
    }
  };

  const formatDateShort = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const day = date.getDate();
      const month = getThaiMonth(date.getMonth() + 1);
      const year = date.getFullYear() + 543;
      return `${day} ${month} ${year}`;
    } catch {
      return dateString;
    }
  };

  const getThaiMonth = (month: number) => {
    const months = [
      "มกราคม",
      "กุมภาพันธ์",
      "มีนาคม",
      "เมษายน",
      "พฤษภาคม",
      "มิถุนายน",
      "กรกฎาคม",
      "สิงหาคม",
      "กันยายน",
      "ตุลาคม",
      "พฤศจิกายน",
      "ธันวาคม",
    ];
    return months[month - 1];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">ไม่พบข้อมูลกระเป๋าเงิน</p>
      </div>
    );
  }

  // Filter transactions by selected month/year
  const filteredSales = data.salesTransactions.filter((tx) => {
    const txDate = new Date(tx.date);
    return (
      txDate.getMonth() + 1 === selectedMonth &&
      txDate.getFullYear() === selectedYear
    );
  });

  const filteredSupport = data.supportTransactions.filter((tx) => {
    const txDate = new Date(tx.date);
    return (
      txDate.getMonth() + 1 === selectedMonth &&
      txDate.getFullYear() === selectedYear
    );
  });

  const totalSalesAmount = filteredSales.reduce(
    (sum, tx) => sum + tx.amount,
    0,
  );
  const totalSupportAmount = filteredSupport.reduce(
    (sum, tx) => sum + tx.amount,
    0,
  );

  // Pagination
  const salesStart = (salesPage - 1) * itemsPerPage;
  const salesEnd = salesStart + itemsPerPage;
  const paginatedSales = filteredSales.slice(salesStart, salesEnd);
  const totalSalesPages = Math.ceil(filteredSales.length / itemsPerPage);

  const supportStart = (supportPage - 1) * itemsPerPage;
  const supportEnd = supportStart + itemsPerPage;
  const paginatedSupport = filteredSupport.slice(supportStart, supportEnd);
  const totalSupportPages = Math.ceil(filteredSupport.length / itemsPerPage);

  const withdrawalStart = (withdrawalPage - 1) * itemsPerPage;
  const withdrawalEnd = withdrawalStart + itemsPerPage;
  const paginatedWithdrawals = data.withdrawals.slice(
    withdrawalStart,
    withdrawalEnd,
  );
  const totalWithdrawalPages = Math.ceil(data.withdrawals.length / itemsPerPage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-foreground">
            กระเป๋าเงินนักเขียน
          </h1>
        </div>
        <button className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors">
          <HelpCircle className="w-5 h-5" />
        </button>
      </div>

      {/* Wallet Summary */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <p className="text-sm text-muted-foreground mb-1">ยอดขาย</p>
            <p className="text-2xl font-semibold text-foreground">
              {formatCurrency(data.wallet.totalSales)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">ยอดสนับสนุน</p>
            <p className="text-2xl font-semibold text-foreground">
              {formatCurrency(data.wallet.totalSupport)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">ยอดรวมคงเหลือ</p>
            <p className="text-2xl font-semibold text-foreground">
              {formatCurrency(data.wallet.totalBalance)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-border">
          <div>
            <p className="text-sm text-muted-foreground mb-1">
              สถานะการโอน/ถอน
            </p>
            <p className="text-lg font-medium text-foreground">
              {data.status.transferWithdrawalStatus}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">
              กำหนดการตัดยอดครั้งถัดไป
            </p>
            <p className="text-lg font-medium text-foreground">
              {formatDateShort(data.status.nextSettlementDate)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Receipt History */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-foreground">
              ประวัติการรับยอดขาย - {getThaiMonth(selectedMonth)}{" "}
              {selectedYear + 543}
            </h2>
            <a
              href="#"
              className="text-sm text-purple-600 hover:text-purple-700">
              ข้อมูลเพิ่มเติม...
            </a>
          </div>

          <div className="mb-4">
            <select
              value={`${selectedYear}-${selectedMonth}`}
              onChange={(e) => {
                const [year, month] = e.target.value.split("-").map(Number);
                setSelectedYear(year);
                setSelectedMonth(month);
                setSalesPage(1);
              }}
              className="px-3 py-2 border border-border rounded-lg text-sm">
              {Array.from({ length: 12 }, (_, i) => {
                const date = new Date(selectedYear, i, 1);
                return (
                  <option key={i} value={`${selectedYear}-${i + 1}`}>
                    {getThaiMonth(i + 1)} {selectedYear + 543}
                  </option>
                );
              })}
            </select>
          </div>

          {paginatedSales.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              ไม่มีรายการขายในเดือนนี้
            </p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-2">รายการที่</th>
                      <th className="text-left p-2">วันที่</th>
                      <th className="text-left p-2">ประเภท</th>
                      <th className="text-left p-2">รายการขาย</th>
                      <th className="text-right p-2">จำนวนรับยอด</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedSales.map((tx, index) => (
                      <tr
                        key={tx.id}
                        className="border-b border-border hover:bg-muted/30">
                        <td className="p-2">{salesStart + index + 1}</td>
                        <td className="p-2">{formatDate(tx.date)}</td>
                        <td className="p-2">{tx.type}</td>
                        <td className="p-2 max-w-xs truncate">
                          {tx.salesItem}
                        </td>
                        <td className="p-2 text-right text-green-600">
                          +{formatCurrency(tx.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground mb-2">
                  จำนวนทั้งหมด {filteredSales.length} รายการ ยอดรวมทั้งหมด{" "}
                  {formatCurrency(totalSalesAmount)}
                </p>

                {totalSalesPages > 1 && (
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setSalesPage((p) => Math.max(1, p - 1))}
                      disabled={salesPage === 1}
                      className="px-3 py-1 text-sm border border-border rounded hover:bg-muted disabled:opacity-50">
                      ก่อนหน้า
                    </button>
                    <span className="text-sm text-muted-foreground">
                      หน้า {salesPage} จาก {totalSalesPages}
                    </span>
                    <button
                      onClick={() =>
                        setSalesPage((p) =>
                          Math.min(totalSalesPages, p + 1),
                        )
                      }
                      disabled={salesPage === totalSalesPages}
                      className="px-3 py-1 text-sm border border-border rounded hover:bg-muted disabled:opacity-50">
                      ถัดไป
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Support Receipt History */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-foreground">
              ประวัติการรับยอดสนับสนุน - {getThaiMonth(selectedMonth)}{" "}
              {selectedYear + 543}
            </h2>
            <a
              href="#"
              className="text-sm text-purple-600 hover:text-purple-700">
              ข้อมูลเพิ่มเติม...
            </a>
          </div>

          {paginatedSupport.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              ไม่มีรายการสนับสนุนในเดือนนี้
            </p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-2">รายการที่</th>
                      <th className="text-left p-2">วันที่</th>
                      <th className="text-left p-2">โปรไฟล์นักอ่าน</th>
                      <th className="text-right p-2">จำนวนรับยอด</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedSupport.map((tx, index) => (
                      <tr
                        key={tx.id}
                        className="border-b border-border hover:bg-muted/30">
                        <td className="p-2">{supportStart + index + 1}</td>
                        <td className="p-2">{formatDate(tx.date)}</td>
                        <td className="p-2">{tx.readerProfile}</td>
                        <td className="p-2 text-right text-green-600">
                          +{formatCurrency(tx.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground mb-2">
                  จำนวนทั้งหมด {filteredSupport.length} รายการ ยอดรวมทั้งหมด{" "}
                  {formatCurrency(totalSupportAmount)}
                </p>

                {totalSupportPages > 1 && (
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() =>
                        setSupportPage((p) => Math.max(1, p - 1))
                      }
                      disabled={supportPage === 1}
                      className="px-3 py-1 text-sm border border-border rounded hover:bg-muted disabled:opacity-50">
                      ก่อนหน้า
                    </button>
                    <span className="text-sm text-muted-foreground">
                      หน้า {supportPage} จาก {totalSupportPages}
                    </span>
                    <button
                      onClick={() =>
                        setSupportPage((p) =>
                          Math.min(totalSupportPages, p + 1),
                        )
                      }
                      disabled={supportPage === totalSupportPages}
                      className="px-3 py-1 text-sm border border-border rounded hover:bg-muted disabled:opacity-50">
                      ถัดไป
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ReadCoin Transfer History */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-lg font-medium text-foreground mb-4">
            ประวัติการโอน ReadCoin
          </h2>
          {data.readCoinTransfers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              คุณไม่มีรายการประวัติการโอน ReadCoin
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-2">วันที่</th>
                    <th className="text-left p-2">จำนวน</th>
                    <th className="text-left p-2">สถานะ</th>
                  </tr>
                </thead>
                <tbody>
                  {data.readCoinTransfers.map((tx) => (
                    <tr
                      key={tx.id}
                      className="border-b border-border hover:bg-muted/30">
                      <td className="p-2">{formatDate(tx.date)}</td>
                      <td className="p-2">{formatCurrency(tx.amount)}</td>
                      <td className="p-2">{tx.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Withdrawal History */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-lg font-medium text-foreground mb-4">
            ประวัติการถอนเงิน
          </h2>
          {data.withdrawals.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              คุณไม่มีรายการประวัติการถอนเงิน
            </p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-2">รายการที่</th>
                      <th className="text-left p-2">รหัสรายการ</th>
                      <th className="text-left p-2">วันที่ทำรายการ</th>
                      <th className="text-left p-2">สถานะรายการ</th>
                      <th className="text-left p-2">ถอนไปยัง</th>
                      <th className="text-right p-2">จำนวนยอดขาย</th>
                      <th className="text-right p-2">จำนวนยอดสนับสนุน</th>
                      <th className="text-right p-2">รวมยอดถอน</th>
                      <th className="text-left p-2">ดูข้อมูลเพิ่มเติม</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedWithdrawals.map((tx, index) => (
                      <tr
                        key={tx.id}
                        className="border-b border-border hover:bg-muted/30">
                        <td className="p-2">{withdrawalStart + index + 1}</td>
                        <td className="p-2">{tx.transactionId}</td>
                        <td className="p-2">{formatDate(tx.date)}</td>
                        <td className="p-2">
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              tx.status === "เสร็จสิ้น"
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}>
                            {tx.status}
                          </span>
                        </td>
                        <td className="p-2">{tx.withdrawTo}</td>
                        <td className="p-2 text-right">
                          {formatCurrency(tx.salesAmount)}
                        </td>
                        <td className="p-2 text-right">
                          {formatCurrency(tx.supportAmount)}
                        </td>
                        <td className="p-2 text-right font-medium">
                          {formatCurrency(tx.totalWithdrawal)}
                        </td>
                        <td className="p-2">
                          <a
                            href="#"
                            className="text-purple-600 hover:text-purple-700 text-xs">
                            ดูข้อมูลเพิ่มเติม
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalWithdrawalPages > 1 && (
                <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                  <button
                    onClick={() =>
                      setWithdrawalPage((p) => Math.max(1, p - 1))
                    }
                    disabled={withdrawalPage === 1}
                    className="px-3 py-1 text-sm border border-border rounded hover:bg-muted disabled:opacity-50">
                    ก่อนหน้า
                  </button>
                  <span className="text-sm text-muted-foreground">
                    หน้า {withdrawalPage} จาก {totalWithdrawalPages}
                  </span>
                  <button
                    onClick={() =>
                      setWithdrawalPage((p) =>
                        Math.min(totalWithdrawalPages, p + 1),
                      )
                    }
                    disabled={withdrawalPage === totalWithdrawalPages}
                    className="px-3 py-1 text-sm border border-border rounded hover:bg-muted disabled:opacity-50">
                    ถัดไป
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
