export const About = () => {
  return (
    <section id="about" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-blue-700 mb-4">About Markoub</h2>
          <p className="text-slate-600 mb-6">We make local travel easier and more social. Drivers list seats, riders book, and everyone shares the journey.</p>

          <div className="grid md:grid-cols-3 gap-6 mt-8">
            <div className="bg-blue-50 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-blue-700">Our Mission</h3>
              <p className="text-sm text-slate-600 mt-2">Reduce solo-car trips, lower commuting costs, and build trusted local communities.</p>
            </div>
            <div className="bg-orange-50 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-orange-600">Our Promise</h3>
              <p className="text-sm text-slate-600 mt-2">Secure bookings, verified drivers, and simple cancellations if plans change.</p>
            </div>
            <div className="bg-white border border-slate-100 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-blue-700">How it works</h3>
              <ol className="text-sm text-slate-600 mt-2 list-decimal list-inside space-y-1">
                <li>Search or offer a ride.</li>
                <li>Confirm booking and chat with your driver.</li>
                <li>Meet and share the trip — rate each other afterward.</li>
              </ol>
            </div>
          </div>

          <div className="mt-10 text-slate-600">
            <p className="mb-3">Built by people who commute. Designed for simplicity. Trusted by thousands across Morocco.</p>
            <div className="inline-flex items-center gap-3 bg-blue-700 text-white px-4 py-2 rounded-full">Join the community</div>
          </div>
        </div>
      </div>
    </section>
  );
};
