import { Card } from './Card';
import { Flag, Plus, BarChart3, ArrowRight, ShieldCheck, Wallet } from 'lucide-react';

export const Services = () => {
  const services = [
    {
      icon: Flag,
      color: 'bg-blue-50',
      title: 'Offer a Ride',
      subtitle: 'Share seats with others',
      description: 'List your next trip, set price, and pick your passengers. Simple scheduling and seat management.'
    },
    {
      icon: Wallet,
      color: 'bg-orange-50',
      title: 'Fair Pricing',
      subtitle: 'Transparent fees',
      description: 'Split costs fairly and see exactly what you pay. No hidden fees.'
    },
    {
      icon: ShieldCheck,
      color: 'bg-blue-50',
      title: 'Verified Drivers',
      subtitle: 'Ratings & reviews',
      description: 'Driver profiles, ratings and verified phone numbers help you pick a safe ride.'
    },
  ];

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center mb-8">
          <h2 className="text-4xl font-bold text-blue-700">What Markoub offers</h2>
          <p className="text-slate-600 mt-2">Powerful, local carpooling features designed for everyday trips and weekend escapes.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {services.map((s, i) => {
            const Icon = s.icon;
            return (
              <Card key={i} className={`p-6 rounded-xl hover:shadow-xl transition-shadow ${s.color}`}>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white rounded-md flex items-center justify-center text-blue-700 shadow-sm">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-lg text-slate-900">{s.title}</h3>
                    <p className="text-sm text-slate-600 mt-1">{s.subtitle}</p>
                  </div>
                </div>
                <p className="text-sm text-slate-600 mt-4">{s.description}</p>
                <div className="mt-6 text-right">
                  <button className="inline-flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-3 py-2 rounded-md">
                    Learn more <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};
