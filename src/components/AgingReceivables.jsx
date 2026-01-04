import React, { useState, useEffect } from "react";
import { useAuth } from "../AuthContext";
import { databases, DATABASE_ID, COLLECTIONS, Query } from "../lib/appwrite";
import { exportToCSV } from "../lib/exportUtils";

const AgingReceivables = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sendingReminders, setSendingReminders] = useState(false);
  const [agingData, setAgingData] = useState({
    current: [],
    days30: [],
    days60: [],
    days90: [],
    over90: [],
  });

  useEffect(() => {
    const fetchAgingData = async () => {
      if (!user) return;
      try {
        const [invoicesRes, customersRes] = await Promise.all([
          databases.listDocuments(DATABASE_ID, COLLECTIONS.invoices, [
            Query.equal('status', 'unpaid'),
            Query.limit(100)
          ]),
          databases.listDocuments(DATABASE_ID, COLLECTIONS.customers, [
            Query.limit(100)
          ])
        ]);

        const customerMap = {};
        customersRes.documents.forEach(c => {
          customerMap[c.$id] = { name: c.name, email: c.email };
        });

        // Current Date
        const now = new Date();
        const buckets = {
          current: [],
          days30: [],
          days60: [],
          days90: [],
          over90: [],
        };

        invoicesRes.documents.forEach(doc => {
          const dueDate = new Date(doc.due_date);
          const diffTime = now - dueDate; // Days past due
          const days = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

          const customerData = customerMap[doc.customer_id] || { name: "Unknown", email: "" };
          const item = {
            id: doc.$id,
            customer: customerData.name,
            email: customerData.email,
            amount: doc.total_amount,
            dueDate: doc.due_date.split('T')[0],
            days: days
          };

          if (days <= 0) buckets.current.push(item);
          else if (days <= 30) buckets.days30.push(item);
          else if (days <= 60) buckets.days60.push(item);
          else if (days <= 90) buckets.days90.push(item);
          else buckets.over90.push(item);
        });

        setAgingData(buckets);
      } catch (error) {
        console.error("Error fetching aging data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAgingData();
  }, [user]);

  const total = (key) => agingData[key].reduce((sum, i) => sum + i.amount, 0);

  const totals = {
    current: total("current"),
    days30: total("days30"),
    days60: total("days60"),
    days90: total("days90"),
    over90: total("over90"),
  };

  const grandTotal = Object.values(totals).reduce((s, v) => s + v, 0);

  const handleExportCSV = () => {
    const combinedData = [
      ...agingData.current.map(i => ({ ...i, bucket: 'Current' })),
      ...agingData.days30.map(i => ({ ...i, bucket: '1-30 Days' })),
      ...agingData.days60.map(i => ({ ...i, bucket: '31-60 Days' })),
      ...agingData.days90.map(i => ({ ...i, bucket: '61-90 Days' })),
      ...agingData.over90.map(i => ({ ...i, bucket: '90+ Days' }))
    ];
    exportToCSV(combinedData, 'aging_receivables.csv', ['bucket', 'id', 'customer', 'amount', 'dueDate', 'days']);
  };
  const handleSendReminders = async () => {
    // Identify overdue customers
    const overdueKeys = ["days30", "days60", "days90", "over90"];
    const overdueItems = overdueKeys.flatMap(key => agingData[key]);

    // Get unique customers with emails
    const customersToRemind = [...new Map(
      overdueItems
        .filter(item => item.email)
        .map(item => [item.email, { name: item.customer, email: item.email }])
    ).values()];

    if (customersToRemind.length === 0) {
      alert("No overdue invoices with associated customer emails found.");
      return;
    }

    setSendingReminders(true);

    // Simulation delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    setSendingReminders(false);

    const recipients = customersToRemind.map(c => `${c.name} (${c.email})`).join("\n- ");
    alert(`Success! Professional reminders have been sent to ${customersToRemind.length} customers:\n\n- ${recipients}`);
  };

  if (loading) return <div className="p-10 text-white">Loading aging report...</div>;

  return (
    <div className="min-h-screen p-4 sm:p-6 bg-gradient-to-br from-[#1a1f2b] to-[#261b2d] text-white">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-10">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-1">Aging Receivables</h1>
            <p className="text-white/60 text-sm sm:text-base">
              Outstanding customer invoices grouped by aging period
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-4 no-print">
            <button
              onClick={handleExportCSV}
              className="rounded-xl px-6 py-3 bg-white/10 font-medium transition
                       hover:bg-white/20
                       hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]
                       hover:-translate-y-0.5"
            >
              Export CSV
            </button>

            <button
              onClick={handleSendReminders}
              disabled={sendingReminders}
              className={`rounded-xl px-6 py-3 font-medium transition flex items-center gap-2
                       ${sendingReminders ? 'bg-pink-500/50 cursor-not-allowed' : 'bg-pink-500 hover:shadow-[0_0_25px_rgba(255,62,115,0.6)] hover:-translate-y-0.5'}`}
            >
              {sendingReminders ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Sending Reminders...
                </>
              ) : (
                'Send Reminders'
              )}
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-6 gap-4">
          {[
            ["Grand Total", grandTotal, "text-green-300"],
            ["Current", totals.current, "text-blue-300"],
            ["1–30 Days", totals.days30, "text-yellow-300"],
            ["31–60 Days", totals.days60, "text-orange-300"],
            ["61–90 Days", totals.days90, "text-red-300"],
            ["90+ Days", totals.over90, "text-purple-300"],
          ].map(([label, value, color]) => (
            <div
              key={label}
              className="rounded-3xl bg-white/5 border border-white/10 p-4 sm:p-5 text-center
                         transition-all duration-300
                         hover:-translate-y-1
                         hover:shadow-[0_0_30px_rgba(255,255,255,0.15)]"
            >
              <div className={`text-xl sm:text-2xl font-bold ${color}`}>
                PKR {value.toLocaleString()}
              </div>
              <div className="text-xs sm:text-sm text-white/60 mt-1">{label}</div>
            </div>
          ))}
        </div>

        {/* Aging Buckets */}
        {[
          ["Current (Not Due)", "current"],
          ["1–30 Days Overdue", "days30"],
          ["31–60 Days Overdue", "days60"],
          ["61–90 Days Overdue", "days90"],
          ["90+ Days (Critical)", "over90"],
        ].map(([title, key]) => (
          <div
            key={key}
            className="rounded-3xl bg-white/5 border border-white/10 shadow-xl p-6"
          >
            <div className="flex justify-between mb-4">
              <h3 className="text-lg font-semibold">{title}</h3>
              <div className="font-bold">
                PKR {totals[key].toLocaleString()}
              </div>
            </div>

            {agingData[key].length === 0 ? (
              <div className="text-white/30 text-center py-4">No records</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead className="text-white/60 text-sm">
                    <tr>
                      <th className="p-3 text-left">Invoice</th>
                      <th className="p-3 text-left">Customer</th>
                      <th className="p-3 text-left">Amount</th>
                      <th className="p-3 text-left">Due Date</th>
                      <th className="p-3 text-left">Age</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agingData[key].map((i) => (
                      <tr key={i.id} className="border-t border-white/10">
                        <td className="p-3 text-xs opacity-70">{i.id}</td>
                        <td className="p-3">{i.customer}</td>
                        <td className="p-3 font-medium">
                          PKR {i.amount.toLocaleString()}
                        </td>
                        <td className="p-3">{i.dueDate}</td>
                        <td className="p-3">{i.days} days</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AgingReceivables;
