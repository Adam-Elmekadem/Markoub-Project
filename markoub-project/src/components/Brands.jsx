export const Brands = () => {
  const brands = [
    { name: 'Nike', logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a6/Logo_NIKE.svg' },
    { name: 'Adidas', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/20/Adidas_Logo.svg' },
    { name: 'Netflix', text: 'NETFLIX' },
    { name: 'IKEA', text: 'IKEA' },
    { name: 'WhatsApp', icon: '💬' },
    { name: 'Verizon', text: 'verizon' },
    { name: 'Samsung', text: 'SAMSUNG' },
    { name: 'Versace', text: 'VERSACE' },
  ];
  // Convert brands into a small testimonial-style grid to feel more human
  const testimonials = [
    { name: 'Amina', role: 'Student — Casablanca', quote: 'Saved 40% on my daily commute and met great people.' },
    { name: 'Youssef', role: 'Developer — Rabat', quote: 'Easy to use and drivers are reliable.' },
    { name: 'Leila', role: 'Teacher — Marrakech', quote: 'I love how simple booking is — highly recommend.' },
    { name: 'Karim', role: 'Designer — Fès', quote: 'Great for weekend trips and city commutes.' },
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl md:text-5xl font-bold text-blue-700 text-center mb-8">Trusted by thousands</h2>

        <p className="text-center text-slate-600 max-w-2xl mx-auto mb-8">Communities across Morocco are using Markoub to share trips and reduce costs. Here are a few stories from our users.</p>

        <div className="grid md:grid-cols-4 gap-6">
          {testimonials.map((t, i) => (
            <div key={i} className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold">{t.name.charAt(0)}</div>
                <div>
                  <div className="font-semibold text-slate-900">{t.name}</div>
                  <div className="text-xs text-slate-500">{t.role}</div>
                </div>
              </div>
              <p className="text-sm text-slate-600">“{t.quote}”</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
