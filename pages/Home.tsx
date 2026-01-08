import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Star, Users, ArrowRight, Bell, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { MOCK_POSTS, SCHOOL_NAME } from '../constants';
import { Post } from '../types';
import { driveService } from '../services/driveService';

const HERO_IMAGES = [
  { url: '/images/assembly.jpg', fallback: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=1500', title: 'Excellence in Education' },
  { url: '/images/girls.jpg', fallback: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=1500', title: 'Dedicated to Growth' },
  { url: '/images/staff.jpg', fallback: 'https://images.unsplash.com/photo-1544717297-fa154da09f5b?q=80&w=1500', title: 'Mentorship & Values' }
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

    // Slideshow interval
    const interval = setInterval(() => {
      setCurrentHero(prev => (prev + 1) % HERO_IMAGES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section Slideshow */}
      <div className="relative bg-blue-900 text-white overflow-hidden h-[500px] sm:h-[650px]">
        {HERO_IMAGES.map((img, idx) => (
          <div 
            key={idx} 
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${idx === currentHero ? 'opacity-100' : 'opacity-0'}`}
          >
            <img 
              src={img.url} 
              alt={img.title} 
              className="w-full h-full object-cover object-center"
              onError={(e) => { (e.target as HTMLImageElement).src = img.fallback; }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-blue-900/95 via-blue-900/40 to-transparent"></div>
          </div>
        ))}
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-center text-center pt-16 z-10">
          <div className="mb-6 mx-auto w-24 h-24 sm:w-32 sm:h-32 bg-white/10 backdrop-blur-sm rounded-full p-2 border-2 border-white/20 shadow-2xl animate-bounce-slow">
              <img src="/images/logo.jpg" alt="Badge" className="w-full h-full object-contain drop-shadow-md" 
                onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/100x100/1e3a8a/ffffff?text=IMST'; }}
              />
          </div>
          <h1 className="text-4xl md:text-7xl font-extrabold tracking-tight mb-4 leading-tight drop-shadow-2xl text-white">
            {SCHOOL_NAME}
          </h1>
          <p className="text-lg md:text-2xl text-blue-100 max-w-3xl mx-auto mb-10 font-light leading-relaxed drop-shadow-md">
            Integrating <span className="text-yellow-400 font-bold">Science</span> & <span className="text-yellow-400 font-bold">Tahfiz</span> for the leaders of tomorrow.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center w-full">
            <Link 
              to="/admissions" 
              className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-base font-bold rounded-full text-blue-900 bg-yellow-400 hover:bg-yellow-300 transition-all shadow-xl hover:scale-105"
            >
              Apply Now
            </Link>
            <Link 
              to="/portal" 
              className="inline-flex items-center justify-center px-8 py-4 border-2 border-white/30 backdrop-blur-sm text-base font-bold rounded-full text-white hover:bg-white hover:text-blue-900 transition-all shadow-xl hover:scale-105"
            >
              Student Portal
            </Link>
          </div>
        </div>

        {/* Slideshow Controls */}
        <div className="absolute bottom-8 left-0 right-0 flex justify-center space-x-2 z-20">
          {HERO_IMAGES.map((_, idx) => (
            <button 
              key={idx} 
              onClick={() => setCurrentHero(idx)}
              className={`w-3 h-3 rounded-full transition-all ${idx === currentHero ? 'bg-yellow-400 w-8' : 'bg-white/40'}`}
            />
          ))}
        </div>
      </div>

      {/* Latest News Section */}
      <div className="py-12 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center">
              <Bell className="h-6 w-6 mr-2 text-orange-500" />
              Latest News & Updates
            </h2>
            <span className="text-sm text-blue-600 font-medium cursor-pointer hover:underline">View All</span>
          </div>

          {loadingPosts ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-blue-600 h-8 w-8" /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <div key={post.id} className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 hover:shadow-md transition-shadow h-full flex flex-col">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 block">{post.date}</span>
                  <h3 className="text-lg font-bold text-slate-800 mb-2 line-clamp-2">{post.title}</h3>
                  <p className="text-slate-600 text-sm line-clamp-3 mb-4 flex-grow">{post.content}</p>
                  <button className="text-blue-600 text-sm font-medium hover:text-blue-800 flex items-center mt-auto">
                    Read More <ArrowRight className="h-3 w-3 ml-1" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="p-6 bg-slate-50 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen size={24} />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Tahfiz & Science</h3>
              <p className="text-slate-600">A balanced curriculum integrating Quranic memorization with modern scientific education.</p>
            </div>
            <div className="p-6 bg-slate-50 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users size={24} />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Qualified Staff</h3>
              <p className="text-slate-600">Experienced teachers dedicated to the moral and academic growth of every student.</p>
            </div>
            <div className="p-6 bg-slate-50 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star size={24} />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Modern Facilities</h3>
              <p className="text-slate-600">Conducive learning environment equipped with laboratories and computer centers.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;