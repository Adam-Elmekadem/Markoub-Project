import { useState } from 'react';
import { MapPin, Calendar, Search, Clock, Star } from 'lucide-react';

export const Features = () => {
  const [from, setFrom] = useState('Casablanca');
  const [to, setTo] = useState('Rabat');
  const [date, setDate] = useState('');

  const popular = [
    'Casablanca → Rabat',
    'Casablanca → Marrakech',
    'Rabat → Fès',
  ];

  const onSubmit = (e) => {
    e.preventDefault();
    // Navigate or trigger search later
    console.log('quick search', { from, to, date });
  };

  const featureCards = [
    { icon: Clock, title: 'Flexible Schedules', desc: 'Find rides that match your schedule, last-minute or planned.' },
    { icon: Star, title: 'Trusted Drivers', desc: 'Ratings and reviews help you pick reliable drivers.' },
    { icon: MapPin, title: 'Local Routes', desc: 'Connect with riders and drivers in your city and nearby towns.' },
  ];

  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-blue-700">Quick Search</h2>
          <p className="text-slate-600 mt-2">Try a quick search or pick a popular route to get started.</p>

          <form onSubmit={onSubmit} className="mt-6 flex flex-col sm:flex-row gap-3 items-center justify-center">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 w-full sm:w-64">
              <MapPin className="w-5 h-5 text-slate-400" />
              <input value={from} onChange={e => setFrom(e.target.value)} className="w-full bg-transparent outline-none text-slate-700" />
            </div>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 w-full sm:w-64">
              <MapPin className="w-5 h-5 text-slate-400 rotate-180" />
              <input value={to} onChange={e => setTo(e.target.value)} className="w-full bg-transparent outline-none text-slate-700" />
            </div>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 w-full sm:w-48">
              <Calendar className="w-5 h-5 text-slate-400" />
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-transparent outline-none text-slate-700" />
            </div>
            <button type="submit" className="inline-flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold px-4 py-2 rounded-md">
              <Search className="w-4 h-4" /> Search
            </button>
          </form>

          <div className="mt-4 flex items-center justify-center gap-3 flex-wrap">
            {popular.map((p, i) => (
              <button key={i} onClick={() => { const parts = p.split(' → '); setFrom(parts[0]); setTo(parts[1]); }} className="px-3 py-1 rounded-full bg-orange-50 text-orange-600 text-sm font-medium border border-orange-100">{p}</button>
            ))}
          </div>

          <div className="mt-10 grid md:grid-cols-3 gap-6">
            {featureCards.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="bg-white border border-slate-100 rounded-xl p-6 text-left shadow-sm">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-blue-50 text-blue-700 mb-4">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-lg text-slate-900">{f.title}</h3>
                  <p className="text-sm text-slate-600 mt-2">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
