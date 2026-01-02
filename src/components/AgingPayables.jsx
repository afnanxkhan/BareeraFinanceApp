import React, { useState, useEffect } from 'react';
import { useAuth } from "../AuthContext";
import { databases, DATABASE_ID, COLLECTIONS, Query } from "../lib/appwrite";

const AgingPayables = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
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
        const [entriesRes, vendorsRes] = await Promise.all([
          databases.listDocuments(DATABASE_ID, COLLECTIONS.journalEntries, [
            Query.limit(100)
          ]),
          databases.listDocuments(DATABASE_ID, COLLECTIONS.vendors, [
            Query.limit(100)
          ])
        ]);

        const vendorMap = {};
        vendorsRes.documents.forEach(v => {
          vendorMap[v.$id] = v.name;
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

        entriesRes.documents.forEach(doc => {
          // Using totalCredit > 0 as a proxy for "Bill/Payable"
          if (!doc.totalCredit) return;

          const dueDate = new Date(doc.entryDate);
          const diffTime = Math.abs(now - dueDate);
          const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          const item = {
            id: doc.$id,
            vendor: vendorMap[doc.vendorId] || doc.description || "Unknown",
            amount: doc.totalCredit,
            dueDate: doc.entryDate.split('T')[0],
            days: days
          };

          if (days <= 30) buckets.current.push(item);
          else if (days <= 60) buckets.days30.push(item);
          else if (days <= 90) buckets.days60.push(item);
          else if (days <= 120) buckets.days90.push(item);
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

  const total = (k) => agingData[k].reduce((s, b) => s + b.amount, 0);

  const totals = {
    current: total('current'),
    days30: total('days30'),
    days60: total('days60'),
    days90: total('days90'),
    over90: total('over90'),
  };

  const grandTotal = Object.values(totals).reduce((s, v) => s + v, 0);

  const handlePrint = () => window.print();

  const getPriority = (days) => {
    if (days > 90) return { label: 'Critical', cls: 'bg-red-500/20 text-red-300' };
    if (days > 60) return { label: 'High', cls: 'bg-orange-500/20 text-orange-300' };
    if (days > 30) return { label: 'Medium', cls: 'bg-yellow-500/20 text-yellow-300' };
    return { label: 'Low', cls: 'bg-green-500/20 text-green-300' };
  };

  if (loading) return <div className="p-10 text-white">Loading aging report...</div>;

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-[#1a1f2b] to-[#261b2d] text-white">

      <style>{`
        @media print {
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="max-w-7xl mx-auto space-y-8">

        <div>
          <h1 className="text-3xl font-bold mb-1">Aging Payables</h1>
          <p className="text-white/60">Outstanding vendor bills by aging period</p>
        </div>

        {/* ACTIONS */}
        <div className="flex gap-4 no-print">
          <button
            onClick={handlePrint}
            className="px-6 py-3 rounded-xl bg-white/10 transition
                       hover:bg-white/20
                       hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]
                       hover:-translate-y-0.5"
          >
            Print
          </button>
        </div>

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          {[
            ['Grand Total', grandTotal, 'text-red-300'],
            ['Current', totals.current, 'text-blue-300'],
            ['1–30 Days', totals.days30, 'text-yellow-300'],
            ['31–60 Days', totals.days60, 'text-orange-300'],
            ['61–90 Days', totals.days90, 'text-red-300'],
            ['90+ Days', totals.over90, 'text-purple-300'],
          ].map(([label, value, color]) => (
            <div
              key={label}
              className="p-5 rounded-2xl text-center bg-white/5 border border-white/10
                         transition-all duration-300
                         hover:-translate-y-1
                         hover:shadow-[0_0_35px_rgba(255,255,255,0.18)]"
            >
              <div className={`text-2xl font-bold ${color}`}>
                PKR {value.toLocaleString()}
              </div>
              <div className="text-sm text-white/60 mt-1">{label}</div>
            </div>
          ))}
        </div>

        {/* TABLES */}
        {Object.entries(agingData).map(([key, rows]) => (
          <div key={key} className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-4 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</h3>

            {rows.length === 0 ? (
              <div className="text-white/30 text-center py-2">No records</div>
            ) : (
              <table className="w-full">
                <thead className="text-white/60 text-sm">
                  <tr>
                    <th className="p-3 text-left">Bill</th>
                    <th className="p-3 text-left">Vendor</th>
                    <th className="p-3 text-left">Amount</th>
                    <th className="p-3 text-left">Due</th>
                    <th className="p-3 text-left">Age</th>
                    <th className="p-3 text-left">Priority</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((b) => {
                    const p = getPriority(b.days);
                    return (
                      <tr key={b.id} className="border-t border-white/10">
                        <td className="p-3 text-xs opacity-70">{b.id}</td>
                        <td className="p-3">{b.vendor}</td>
                        <td className="p-3 font-medium">PKR {b.amount.toLocaleString()}</td>
                        <td className="p-3">{b.dueDate}</td>
                        <td className="p-3">{b.days}</td>
                        <td className="p-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${p.cls}`}>
                            {p.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        ))}

        <div className="text-center text-sm text-white/50">
          Payment priority is auto-calculated based on overdue days.
        </div>

      </div>
    </div>
  );
};

export default AgingPayables;
