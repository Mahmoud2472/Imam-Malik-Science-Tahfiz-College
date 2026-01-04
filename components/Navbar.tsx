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
    { name: 'Contact', path: '/contact' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-blue-900 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-white rounded-full p-0.5 overflow-hidden flex items-center justify-center">
                 <img 
                    src="/images/logo.jpg" 
                    alt="IMST" 
                    className="h-full w-full object-cover"
                    onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://placehold.co/100x100/1e3a8a/ffffff?text=IMST';
                    }}
                 />
              </div>
              <span className="font-bold text-lg sm:text-xl tracking-tight hidden sm:block">
                {SCHOOL_NAME}
              </span>
              <span className="font-bold text-lg sm:text-xl tracking-tight sm:hidden">
                IMST College
              </span>
            </Link>
          </div>
          
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(link.path)
                      ? 'bg-blue-800 text-yellow-400'
                      : 'hover:bg-blue-800 hover:text-white'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              <div className="border-l border-blue-700 pl-4 flex space-x-2">
                 <Link to="/staff" className="text-blue-200 hover:text-white" title="Staff Login">
                    <BookOpen size={18} />
                 </Link>
                 <Link to="/admin" className="text-blue-200 hover:text-white" title="Admin Login">
                    <Lock size={18} />
                 </Link>
              </div>
            </div>
          </div>
          
          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-blue-200 hover:text-white hover:bg-blue-800 focus:outline-none"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden bg-blue-800">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActive(link.path)
                    ? 'bg-blue-900 text-yellow-400'
                    : 'text-white hover:bg-blue-700'
                }`}
              >
                {link.name}
              </Link>
            ))}
            <div className="border-t border-blue-700 mt-2 pt-2">
              <Link
                  to="/staff"
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white"
                >
                  Staff Login
              </Link>
              <Link
                  to="/admin"
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white"
                >
                  Admin Login
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;