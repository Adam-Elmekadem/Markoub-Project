import { Mail, Phone, User, MessageSquare } from 'lucide-react';

export const Contact = () => {
  const handleSubmit = (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const payload = Object.fromEntries(form.entries());
    // TODO: wire to backend/email service
    console.log('Contact form submitted:', payload);
    alert('Thanks! We\'ll get back to you soon.');
    e.currentTarget.reset();
  };

  return (
    <section className="py-16 md:py-24 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-blue-700 text-center mb-10">Contact Us</h2>

        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
          {/* Info */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Get in touch</h3>
            <p className="text-slate-600 mb-6">Have a question about rides, accounts, or partnerships? Send us a message and we\'ll respond within 1-2 business days.</p>
            <ul className="space-y-3 text-slate-700">
              <li className="flex items-center gap-3"><Mail className="w-5 h-5 text-blue-700"/> support@markoub.com</li>
              <li className="flex items-center gap-3"><Phone className="w-5 h-5 text-blue-700"/> +1 (555) 123-4567</li>
            </ul>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
              <div className="relative">
                <User className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input name="name" required placeholder="Enter your name" className="w-full pl-10 pr-3 py-3 rounded-lg bg-white text-slate-900 placeholder-slate-400 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input type="email" name="email" required placeholder="Enter your email" className="w-full pl-10 pr-3 py-3 rounded-lg bg-white text-slate-900 placeholder-slate-400 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
              <input name="subject" placeholder="How can we help?" className="w-full px-3 py-3 rounded-lg bg-white text-slate-900 placeholder-slate-400 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
              <textarea name="message" required rows="5" placeholder="Write your message..." className="w-full px-3 py-3 rounded-lg bg-white text-slate-900 placeholder-slate-400 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <button type="submit" className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 rounded-lg">Send Message</button>
          </form>
        </div>
      </div>
    </section>
  );
}
