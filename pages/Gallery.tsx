import React from 'react';
import { ExternalLink, Image as ImageIcon, Camera, Layout } from 'lucide-react';
import { SCHOOL_NAME } from '../constants';

const GALLERY_IMAGES = [
  { url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=800&auto=format&fit=crop', title: 'Main Campus Building' },
  { url: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=800&auto=format&fit=crop', title: 'Science Laboratory' },
  { url: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=800&auto=format&fit=crop', title: 'Interactive Learning' },
  { url: 'https://images.unsplash.com/photo-1541339907198-e08756ebafe3?q=80&w=800&auto=format&fit=crop', title: 'Student Graduation' },
  { url: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?q=80&w=800&auto=format&fit=crop', title: 'College Library' },
  { url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=800&auto=format&fit=crop', title: 'Classroom Environment' },
];

const Gallery: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      <div className="text-center mb-16">
        <div className="inline-flex items-center justify-center p-3 bg-blue-100 text-blue-700 rounded-2xl mb-4">
          <Camera size={28} />
        </div>
        <h1 className="text-5xl font-extrabold text-slate-900 mb-4">Our Gallery</h1>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto font-light">
          A glimpse into the life, facilities, and spiritual journey at {SCHOOL_NAME}.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 mb-20">
        {GALLERY_IMAGES.map((img, idx) => (
          <div key={idx} className="group relative overflow-hidden rounded-3xl shadow-xl aspect-[4/3] bg-slate-100 ring-1 ring-slate-200">
            <img 
              src={img.url} 
              alt={img.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-blue-900/90 via-blue-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-8">
              <span className="text-yellow-400 text-xs font-bold uppercase tracking-widest mb-1">Academic Life</span>
              <h3 className="text-white font-bold text-xl">{img.title}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-br from-blue-900 to-blue-950 border-4 border-white shadow-2xl rounded-[3rem] p-10 md:p-20 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-yellow-400/5 rounded-full -ml-32 -mb-32 blur-3xl"></div>
        
        <div className="relative z-10">
          <div className="w-20 h-20 bg-yellow-400 text-blue-950 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl animate-bounce">
            <Layout size={36} />
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Explore Our Full Album</h2>
          <p className="text-blue-100 mb-12 max-w-2xl mx-auto text-lg leading-relaxed">
            We maintain a complete digital archive of our school activities, cultural days, and sports festivals on Google Photos. Click below to see more.
          </p>
          <a 
            href="https://photos.app.goo.gl/AJidxMQgnfyTNw6U6" 
            target="_blank" 
            rel="noopener noreferrer"
            className="group inline-flex items-center px-12 py-5 bg-white text-blue-900 font-extrabold text-lg rounded-full hover:bg-yellow-400 hover:text-blue-950 transition-all shadow-2xl hover:scale-110 active:scale-95"
          >
            Visit Google Photos Album <ExternalLink className="ml-3 h-6 w-6 group-hover:rotate-12 transition-transform" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default Gallery;