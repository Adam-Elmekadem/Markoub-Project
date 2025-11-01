import { useEffect, useState } from 'react';
import { AdminAPI } from '../../utils/adminApi';

export const Dashboard = () => {
  const [stats, setStats] = useState({ users: 0, rides: 0, comments: 0 });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [users, rides, comments] = await Promise.all([
          AdminAPI.listUsers(),
          AdminAPI.listRides(),
          AdminAPI.listComments(),
        ]);
        if (!mounted) return;
        setStats({ users: (users || []).length, rides: (rides || []).length, comments: (comments || []).length });
      } catch (err) {
        console.error('Failed to load dashboard stats', err);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl md:text-4xl font-extrabold text-blue-700">Admin Dashboard</h1>
      <p className="text-slate-600">Quick overview of your platform data.</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[{label:'Users', value: stats.users, color:'bg-blue-50 text-blue-700 border-blue-200'}, {label:'Rides', value: stats.rides, color:'bg-orange-50 text-orange-600 border-orange-200'}, {label:'Comments', value: stats.comments, color:'bg-blue-100 text-blue-700 border-blue-200'}].map((c) => (
          <div key={c.label} className={`rounded-2xl border p-6 ${c.color}`}>
            <div className="text-2xl font-bold">{c.value}</div>
            <div className="text-sm font-medium opacity-80">{c.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
