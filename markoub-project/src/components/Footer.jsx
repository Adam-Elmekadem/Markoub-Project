import { useState } from 'react';
import { Button } from './Button';

export const Footer = () => {
  const [email, setEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Newsletter signup:', email);
    setEmail('');
  };

  return (
    <footer id="contact" className="bg-blue-700 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-bold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><a href="#home" className="hover:text-orange-300 transition-colors">Home</a></li>
              <li><a href="#rides" className="hover:text-orange-300 transition-colors">Rides</a></li>
              <li><a href="#blogs" className="hover:text-orange-300 transition-colors">Blogs</a></li>
              <li><a href="#about" className="hover:text-orange-300 transition-colors">About Us</a></li>
              <li><a href="#contact" className="hover:text-orange-300 transition-colors">Contact</a></li>
            </ul>
          </div>

          {/* Our Socials */}
          <div>
            <h4 className="text-lg font-bold mb-4">Our Socials</h4>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-orange-300 transition-colors">Facebook</a></li>
              <li><a href="#" className="hover:text-orange-300 transition-colors">Instagram</a></li>
              <li><a href="#" className="hover:text-orange-300 transition-colors">X - Twitter</a></li>
              <li><a href="#" className="hover:text-orange-300 transition-colors">Linkedin</a></li>
              <li><a href="#" className="hover:text-orange-300 transition-colors">Tiktok</a></li>
            </ul>
          </div>

          {/* Address & Contact */}
          <div>
            <h4 className="text-lg font-bold mb-4">Adress & contact</h4>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span>CMC TAM43NA</span>
              </li>
              <li className="flex items-start gap-2">
                <span>Phone: +212 6 18 98 10 78</span>
              </li>
              <li className="flex items-start gap-2">
                <span>Email: adamelmekadem3@gmail.com</span>
              </li>
              <li className="flex items-start gap-2">
                <span>Ville: Rabat</span>
              </li>
            </ul>
          </div>

          {/* Partners */}
          <div>
            <h4 className="text-lg font-bold mb-4">Partners</h4>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-orange-300 transition-colors">Netflix</a></li>
              <li><a href="#" className="hover:text-orange-300 transition-colors">CMC TAM43NA</a></li>
              <li><a href="#" className="hover:text-orange-300 transition-colors">VISA</a></li>
              <li><a href="#" className="hover:text-orange-300 transition-colors">MasterCard</a></li>
            </ul>
          </div>
        </div>

        {/* Newsletter */}
        <div className="border-t-2 border-white pt-8 mb-8">
          <form onSubmit={handleSubmit} className="w-full">
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address..."
                className="w-full sm:flex-1 px-4 py-3 rounded-lg bg-white text-gray-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-white"
                required
              />
              <Button variant="secondary" size="md" type="submit" className="w-full sm:w-auto">
                Subscribe
              </Button>
            </div>
          </form>
        </div>

        {/* Bottom Bar */}
        <div className="border-t-2 border-white pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
          <div>
            <a href="#" className="hover:text-orange-300 transition-colors mr-6">Privacy Policy</a>
            <a href="#" className="hover:text-orange-300 transition-colors">Terms of Service</a>
          </div>
          <div>
            © 2024 NetProust. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};
