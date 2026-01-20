import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Star, Users, ArrowRight, Bell, Loader2 } from 'lucide-react';
import { MOCK_POSTS, SCHOOL_NAME } from '../constants';
import { Post } from '../types';
import { driveService } from '../services/driveService';

const HERO_IMAGES = [
  { 
    url: 'https://res.cloudinary.com/dswuqqfuk/image/upload/v1768901132/student_hero.jpg_1_ayqjee.jpg', 
    title: 'Excellence in Science' 
  },
  { 
    url: 'https://res.cloudinary.com/dswuqqfuk/image/upload/v1768901129/classroom.jpg_1_vbhj51.jpg', 
    title: 'Modern Learning Environment' 
  }
];

const Home: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [currentHero, setCurrentHero] = useState(0);

  useEffect(() => {
    // Non-blocking news fetch
    const fetchLatestNews = async () => {
      try {
        const data = await driveService.getTable('imst_posts');
        if (data && data.length > 0) {
          setPosts(data.slice(0, 3));
        } else {
          setPosts(MOCK_POSTS.slice(0, 3));
        }
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
      {/* Hero Section Slideshow - Optimized for instant appearance */}
      <div className="relative bg-blue-950 text-white overflow-hidden h-[550px] sm:h-[700px]">
        {HERO_IMAGES.map((img, idx) => (
          <div 
            key={idx} 
            className={`absolute inset-0 transition-all duration-[2000ms] ease-in-out ${idx === currentHero ? 'opacity-100' : 'opacity-0'}`}
          >
            <img 
              src={img.url} 
              alt={img.title} 
              className="w-full h-full object-cover"
              loading={idx === 0 ? "eager" : "lazy"}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-blue-950/60 via-blue-900/40 to-blue-950/90"></div>
          </div>
        ))}
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-center text-center z-10">
          <div className="mb-6 mx-auto w-24 h-24 sm:w-32 sm:h-32 bg-white rounded-full p-1 border-4 border-yellow-400 shadow-2xl overflow-hidden">
              <img 
                src="https://res.cloudinary.com/dswuqqfuk/image/upload/logo.jpg_imoamc.jpg" 
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.length > 0 ? posts.map((post) => (
              <div key={post.id} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:shadow-xl transition-all duration-300 h-full flex flex-col group">
                <span className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-4 bg-blue-50 px-3 py-1 rounded-full w-fit">{post.date}</span>
                <h3 className="text-xl font-bold text-slate-800 mb-4 line-clamp-2 group-hover:text-blue-700 transition-colors">{post.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed line-clamp-4 mb-6 flex-grow">{post.content}</p>
                <button className="text-blue-600 text-sm font-bold hover:text-blue-800 flex items-center mt-auto border-t pt-4">
                  Read Full Article <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            )) : (
              <div className="col-span-full flex justify-center py-20"><Loader2 className="animate-spin text-blue-600 h-10 w-10" /></div>
            )}
          </div>
        </div>
      </div>

      {/* Mission Section */}
      <div className="py-24 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="relative">
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
                At {SCHOOL_NAME}, we are committed to providing a conducive learning environment that nurtures both the intellect and the soul.
              </p>
              <div className="space-y-6">
                {[
                  { icon: BookOpen, title: 'Integrated Curriculum', desc: 'Merging Nigerian standards with deep Tahfiz modules.' },
                  { icon: Users, title: 'Mentorship Program', desc: 'Personalized guidance from moral role models.' },
                  { icon: Star, title: 'Modern Labs', desc: 'Fully equipped science and ICT laboratories.' }
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