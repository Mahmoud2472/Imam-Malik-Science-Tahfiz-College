import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Star, Users, ArrowRight, Bell, Loader2 } from 'lucide-react';
import { MOCK_POSTS, SCHOOL_NAME } from '../constants';
import { Post } from '../types';
import { driveService } from '../services/driveService';

const HERO_IMAGES = [
  { 
    url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=1500&auto=format&fit=crop', 
    title: 'Excellence in Science' 
  },
  { 
    url: 'https://images.unsplash.com/photo-1584551270941-624242c71f8e?q=80&w=1500&auto=format&fit=crop', 
    title: 'Spiritual Growth & Tahfiz' 
  },
  { 
    url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=1500&auto=format&fit=crop', 
    title: 'Empowering Future Leaders' 
  }
];

const Home: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [currentHero, setCurrentHero] = useState(0);

  useEffect(() => {
    const fetchLatestNews = async () => {
      try {
        const data = await driveService.getTable('imst_posts');
        if (data && data.length > 0) setPosts(data.slice(0, 3));
        else setPosts(MOCK_POSTS.slice(0, 3));
      } catch (err) {
        setPosts(MOCK_POSTS.slice(0, 3));
      } finally {
        setLoadingPosts(false);
      }
    };
    fetchLatestNews();

    const interval = setInterval(() => {
      setCurrentHero(prev => (prev + 1) % HERO_IMAGES.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section Slideshow */}
      <div className="relative bg-blue-950 text-white overflow-hidden h-[550px] sm:h-[700px]">
        {HERO_IMAGES.map((img, idx) => (
          <div 
            key={idx} 
            className={`absolute inset-0 transition-all duration-[2000ms] ease-in-out ${idx === currentHero ? 'opacity-100 scale-105' : 'opacity-0 scale-100'}`}
          >
            <img 
              src={img.url} 
              alt={img.title} 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-blue-950/60 via-blue-900/40 to-blue-950/90"></div>
          </div>
        ))}
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-center text-center z-10">
          <div className="mb-6 mx-auto w-24 h-24 sm:w-32 sm:h-32 bg-white rounded-full p-1 border-4 border-yellow-400 shadow-2xl animate-pulse">
              <img 
                src="https://api.dicebear.com/7.x/initials/svg?seed=IMST&backgroundColor=1e3a8a&fontFamily=Inter&fontWeight=700" 
                alt="Badge" 
                className="w-full h-full rounded-full object-contain" 
              />
          </div>
          <h1 className="text-4xl md:text-7xl font-extrabold tracking-tight mb-4 leading-tight drop-shadow-lg text-white">
            {SCHOOL_NAME}
          </h1>
          <p className="text-lg md:text-2xl text-blue-100 max-w-3xl mx-auto mb-10 font-light leading-relaxed drop-shadow-md">
            Integrating <span className="text-yellow-400 font-bold border-b-2 border-yellow-400/30">Science</span> & <span className="text-yellow-400 font-bold border-b-2 border-yellow-400/30">Tahfiz</span> for the leaders of tomorrow.
          </p>
          <div className="flex flex-col sm:flex-row gap-5 justify-center w-full">
            <Link 
              to="/admissions" 
              className="inline-flex items-center justify-center px-10 py-4 border border-transparent text-lg font-bold rounded-full text-blue-900 bg-yellow-400 hover:bg-yellow-300 transition-all shadow-2xl hover:scale-105 active:scale-95"
            >
              Apply Now
            </Link>
            <Link 
              to="/portal" 
              className="inline-flex items-center justify-center px-10 py-4 border-2 border-white/40 backdrop-blur-md text-lg font-bold rounded-full text-white hover:bg-white hover:text-blue-900 transition-all shadow-2xl hover:scale-105 active:scale-95"
            >
              Student Portal
            </Link>
          </div>
        </div>

        {/* Slideshow Progress Indicators */}
        <div className="absolute bottom-10 left-0 right-0 flex justify-center space-x-3 z-20">
          {HERO_IMAGES.map((_, idx) => (
            <button 
              key={idx} 
              onClick={() => setCurrentHero(idx)}
              className={`h-1.5 rounded-full transition-all duration-500 ${idx === currentHero ? 'bg-yellow-400 w-12' : 'bg-white/30 w-4 hover:bg-white/50'}`}
            />
          ))}
        </div>
      </div>

      {/* Latest News Section */}
      <div className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 flex items-center">
                <Bell className="h-8 w-8 mr-3 text-orange-500" />
                Latest News & Updates
              </h2>
              <p className="text-slate-500 mt-2">Stay informed about our community and academic calendar.</p>
            </div>
            <Link to="/gallery" className="text-blue-600 font-bold hover:underline flex items-center">
              School Gallery <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </div>

          {loadingPosts ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600 h-10 w-10" /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post) => (
                <div key={post.id} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:shadow-xl transition-all duration-300 h-full flex flex-col group">
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-4 bg-blue-50 px-3 py-1 rounded-full w-fit">{post.date}</span>
                  <h3 className="text-xl font-bold text-slate-800 mb-4 line-clamp-2 group-hover:text-blue-700 transition-colors">{post.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed line-clamp-4 mb-6 flex-grow">{post.content}</p>
                  <button className="text-blue-600 text-sm font-bold hover:text-blue-800 flex items-center mt-auto border-t pt-4">
                    Read Full Article <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mission Section */}
      <div className="py-24 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-blue-100 rounded-full blur-3xl opacity-50"></div>
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <img 
                  src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=1000&auto=format&fit=crop" 
                  alt="Student learning" 
                  className="w-full h-[500px] object-cover"
                />
              </div>
            </div>
            <div>
              <h2 className="text-4xl font-bold text-slate-900 mb-6">Our Mission & Values</h2>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                At {SCHOOL_NAME}, we are committed to providing a conducive learning environment that nurtures both the intellect and the soul. Our curriculum is designed to prepare students for the complexities of the modern world while keeping them firmly rooted in Islamic values and Quranic wisdom.
              </p>
              <div className="space-y-6">
                {[
                  { icon: BookOpen, title: 'Integrated Curriculum', desc: 'Merging Nigerian Education Research and Development Council (NERDC) standards with deep Tahfiz modules.' },
                  { icon: Users, title: 'Mentorship Program', desc: 'Personalized guidance from teachers who act as moral role models for every student.' },
                  { icon: Star, title: 'Modern Labs', desc: 'Fully equipped science and ICT laboratories to foster innovation and hands-on discovery.' }
                ].map((item, i) => (
                  <div key={i} className="flex items-start">
                    <div className="bg-blue-50 p-3 rounded-xl text-blue-600 mr-4">
                      <item.icon size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">{item.title}</h4>
                      <p className="text-slate-500 text-sm">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;