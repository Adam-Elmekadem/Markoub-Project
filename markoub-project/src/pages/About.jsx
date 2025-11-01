import { Users, Shield, HeartHandshake, Globe, Award, ThumbsUp, Star, ChevronDown } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

const CountUp = ({ end, duration = 2000, suffix = '' }) => {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          let startTime;
          const animate = (currentTime) => {
            if (!startTime) startTime = currentTime;
            const progress = Math.min((currentTime - startTime) / duration, 1);
            
            // Parse end value (handle 'k', 'M', etc.)
            let numericEnd = parseFloat(end.toString().replace(/[kKmM+]/g, ''));
            const multiplier = end.toString().includes('k') || end.toString().includes('K') ? 1000 
                             : end.toString().includes('M') || end.toString().includes('m') ? 1000000 
                             : 1;
            numericEnd *= multiplier;
            
            setCount(Math.floor(progress * numericEnd));
            
            if (progress < 1) {
              requestAnimationFrame(animate);
            }
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration, hasAnimated]);

  // Format the count back with suffix
  const formatCount = (num) => {
    const endStr = end.toString();
    if (endStr.includes('k') || endStr.includes('K')) {
      return `${(num / 1000).toFixed(0)}k`;
    } else if (endStr.includes('M') || endStr.includes('m')) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (endStr.includes('.')) {
      return num.toFixed(1);
    }
    return num;
  };

  return <span ref={ref}>{formatCount(count)}{suffix}</span>;
};

export const About = () => {
  const scrollToContent = () => {
    const missionSection = document.getElementById('mission-section');
    if (missionSection) {
      missionSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="about" className="bg-gray-50">
      {/* Hero */}
      <div className="relative h-screen">
        <img
          src="public/images/about-hero-image.jpg"
          alt="People traveling together"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white">About MARKOUB</h1>
            <p className="text-white/90 mt-4 md:text-xl lg:text-2xl max-w-3xl mx-auto">
              Connecting riders and drivers to make everyday journeys smarter, safer, and more affordable.
            </p>
            
            {/* Scroll Down Icon */}
            <div 
              onClick={scrollToContent}
              className="mt-12 flex justify-center animate-bounce cursor-pointer hover:opacity-70 transition-opacity"
            >
              <ChevronDown className="w-8 h-8 md:w-10 md:h-10 text-white/80" />
            </div>
          </div>
        </div>
      </div>

      {/* Mission & Values */}
      <div id="mission-section" className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-blue-300">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-4">
              <Globe className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Our Mission</h3>
            <p className="text-slate-600 mt-2">Empower communities with reliable, sustainable, and cost-effective shared rides.</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-orange-300">
            <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center mb-4">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Safety First</h3>
            <p className="text-slate-600 mt-2">Verified profiles, ratings, and preferences ensure a comfortable experience for everyone.</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-green-300">
            <div className="w-12 h-12 rounded-xl bg-green-100 text-green-600 flex items-center justify-center mb-4">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Built on Trust</h3>
            <p className="text-slate-600 mt-2">Transparent reviews and community guidelines foster respect and reliability.</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-white/70 border-y">
        <div className="container mx-auto px-4 py-10 grid md:grid-cols-4 gap-6 text-center">
          <div>
            <p className="text-3xl font-extrabold text-blue-700"><CountUp end="50k" />+</p>
            <p className="text-slate-600">Happy Riders</p>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-blue-700"><CountUp end="20k" />+</p>
            <p className="text-slate-600">Verified Drivers</p>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-blue-700"><CountUp end="2M" />+</p>
            <p className="text-slate-600">KM Shared</p>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-blue-700"><CountUp end="4.8" /></p>
            <p className="text-slate-600">Average Rating</p>
          </div>
        </div>
      </div>

      {/* Team */}
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="mb-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-blue-700">Meet the Team</h2>
          <p className="text-slate-600 mt-2">A passionate crew building smarter mobility</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { name: 'Amina El Fassi', role: 'Product Lead', img: 'https://images.unsplash.com/photo-1544006659-f0b21884ce1d?q=80&w=800&auto=format&fit=crop' },
            { name: 'Youssef Rahmani', role: 'Engineering', img: 'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?q=80&w=800&auto=format&fit=crop' },
            { name: 'Salma Benali', role: 'Design', img: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=800&auto=format&fit=crop' },
            { name: 'Karim Haddad', role: 'Growth', img: 'https://images.unsplash.com/photo-1556157382-97eda2d62296?q=80&w=800&auto=format&fit=crop' },
          ].map((m) => (
            <div key={m.name} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-2 hover:border-blue-300">
              <img src={m.img} alt={m.name} className="w-full h-48 object-cover transition-transform duration-300 hover:scale-105" />
              <div className="p-5">
                <h3 className="font-semibold text-slate-900">{m.name}</h3>
                <p className="text-sm text-slate-600">{m.role}</p>
                <div className="mt-3 flex items-center gap-1 text-yellow-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400" />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Values */}
      <div className="container mx-auto px-4 pb-16">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-blue-300">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-4">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Quality</h3>
            <p className="text-slate-600 mt-2">We obsess over details to deliver a smooth, reliable experience.</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-orange-300">
            <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center mb-4">
              <ThumbsUp className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Simplicity</h3>
            <p className="text-slate-600 mt-2">From search to booking, every step is designed to be effortless.</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-green-300">
            <div className="w-12 h-12 rounded-xl bg-green-100 text-green-600 flex items-center justify-center mb-4">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Community</h3>
            <p className="text-slate-600 mt-2">We’re building a trusted network of riders and drivers across cities.</p>
          </div>
        </div>
      </div>
    </section>
  );
};
