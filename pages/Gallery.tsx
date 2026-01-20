import React from 'react';
import { ExternalLink, Image as ImageIcon, Sparkles, BookOpen, Microscope } from 'lucide-react';
import { SCHOOL_NAME } from '../constants';

const HIGHLIGHTS = [
  { 
    url: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=800&auto=format&fit=crop', 
    title: 'Advanced Science Lab', 
    category: 'Science',
    icon: Microscope
  },
  { 
    url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=800&auto=format&fit=crop', 
    title: 'Quranic Recitation Hall', 
    category: 'Tahfiz',
    icon: BookOpen
  },
  { 
    url: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=800&auto=format&fit=crop', 
    title: 'Interactive Classrooms', 
    category: 'Academic',
    icon: Sparkles
  },
  { 
    url: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=800&auto=format&fit=crop', 
    title: 'Student Library', 
    category: 'Research',
    icon: BookOpen
  },
  { 
    url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=800&auto=format&fit=crop', 
    title: 'Faculty Building', 
    category: 'Campus',
    icon: Sparkles
  },
  { 
    url: 'https://images.unsplash.com/photo-1541339907198-e08756ebafe3?q=80&w=800&auto=format&fit=crop', 
    title: 'Graduation Ceremony', 
    category: 'Success',
    icon: Sparkles
  }
];

const Gallery: React.FC = () => {
  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center mb-20">
          <span className="text-blue-600 font-bold tracking-widest uppercase text-sm mb-4 block">Visual Journey</span>
          <h1 className="text-5xl md:text-6xl font-black text-slate-900 mb-6">College Gallery</h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Exploring the intersection of modern science and spiritual devotion at {SCHOOL_NAME}.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-24">
          {HIGHLIGHTS.map((item, idx) => (
            <div key={idx} className="group relative rounded-3xl overflow-hidden shadow-2xl bg-slate-100 aspect-[4/3]">
              <img 
                src={item.url} 
                alt={item.title}
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-blue-950 via-blue-900/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity"></div>
              <div className="absolute bottom-0 left-0 p-8 w-full">
                <div className="flex items-center space-x-2 text-yellow-400 mb-2">
                   <item.icon size={16} />
                   <span className="text-xs font-bold uppercase tracking-widest">{item.category}</span>
                </div>
                <h3 className="text-white text-2xl font-bold">{item.title}</h3>
              </div>
            </div>
          ))}
        </div>

        <div className="relative rounded-[4rem] overflow-hidden bg-blue-900 p-12 md:p-24 text-center">
          <div className="absolute inset-0 opacity-10">
             <img src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=1500&auto=format&fit=crop" className="w-full h-full object-cover" alt="Background" />
          </div>
          <div className="relative z-10 max-w-3xl mx-auto">
            <div className="w-20 h-20 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl">
              <ImageIcon size={32} className="text-blue-900" />
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6">Access Full School Archive</h2>
            <p className="text-blue-100 text-lg mb-10 leading-relaxed">
              Our complete photography collection, including Cultural Days, Sports Festivals, and Academic Seminars, is hosted on our official Google Photos cloud.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a 
                href="https://photos.app.goo.gl/AJidxMQgnfyTNw6U6" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group w-full sm:w-auto inline-flex items-center justify-center px-10 py-5 bg-white text-blue-900 font-black text-lg rounded-full hover:bg-yellow-400 transition-all shadow-2xl active:scale-95"
              >
                Open Google Photos <ExternalLink className="ml-3 h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Gallery;