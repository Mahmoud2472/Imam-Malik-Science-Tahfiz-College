import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Lock, BookOpen } from 'lucide-react';
import { SCHOOL_NAME } from '../constants';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Admissions', path: '/admissions' },
    { name: 'School Fees', path: '/fees' },
    { name: 'Student Portal', path: '/portal' },
    { name: 'Gallery', path: '/gallery' },
    { name: 'Contact', path: '/contact' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-blue-900 text-white shadow-2xl sticky top-0 z-50 ring-1 ring-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-4 group">
              <div className="h-14 w-14 bg-white rounded-xl p-0.5 overflow-hidden flex items-center justify-center shadow-lg group-hover:rotate-6 transition-transform">
                 <img 
                    src="https://res.cloudinary.com/dswuqqfuk/image/upload/logo.jpg_imoamc.jpg" 
                    alt="IMST Logo" 
                    className="h-full w-full object-contain rounded-lg"
                 />
              </div>
              <div className="flex flex-col">
                <span className="font-black text-xl tracking-tight hidden sm:block">
                  IMAM MALIK
                </span>
                <span className="text-[10px] font-bold text-yellow-400 tracking-[0.2em] hidden sm:block">
                  SCIENCE & TAHFIZ
                </span>
                <span className="font-black text-xl sm:hidden">
                  IMST COLLEGE
                </span>
              </div>
            </Link>
          </div>
          
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-2">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                    isActive(link.path)
                      ? 'bg-yellow-400 text-blue-900 shadow-lg'
                      : 'text-blue-100 hover:bg-blue-800 hover:text-white'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              <div className="h-6 w-px bg-blue-700 mx-4"></div>
              <div className="flex space-x-3">
                 <Link to="/staff" className="p-2 bg-blue-800 text-blue-200 hover:text-white rounded-lg transition-colors" title="Staff Login">
                    <BookOpen size={20} />
                 </Link>
                 <Link to="/admin" className="p-2 bg-blue-800 text-blue-200 hover:text-white rounded-lg transition-colors" title="Admin Login">
                    <Lock size={20} />
                 </Link>
              </div>
            </div>
          </div>
          
          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-3 rounded-xl text-blue-200 hover:text-white hover:bg-blue-800 focus:outline-none transition-colors"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden bg-blue-950 border-t border-blue-800">
          <div className="px-4 pt-4 pb-6 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={`block px-4 py-3 rounded-xl text-base font-bold transition-all ${
                  isActive(link.path)
                    ? 'bg-yellow-400 text-blue-900'
                    : 'text-white hover:bg-blue-900'
                }`}
              >
                {link.name}
              </Link>
            ))}
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-blue-800 mt-4">
              <Link to="/staff" onClick={() => setIsOpen(false)} className="flex items-center justify-center py-3 bg-blue-900 rounded-xl text-sm font-bold text-blue-200 border border-blue-800">
                <BookOpen size={18} className="mr-2" /> Staff
              </Link>
              <Link to="/admin" onClick={() => setIsOpen(false)} className="flex items-center justify-center py-3 bg-blue-900 rounded-xl text-sm font-bold text-blue-200 border border-blue-800">
                <Lock size={18} className="mr-2" /> Admin
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;