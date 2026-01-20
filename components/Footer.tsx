import React from 'react';
import { Link } from 'react-router-dom';
import { SCHOOL_NAME, SCHOOL_ADDRESS, SCHOOL_PHONE, SCHOOL_EMAIL } from '../constants';
import { MapPin, Phone, Mail } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 py-10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h3 className="text-white text-lg font-bold mb-4">{SCHOOL_NAME}</h3>
          <p className="text-sm leading-relaxed">
            Providing quality education, moral upbringing, and a strong Islamic foundation for the leaders of tomorrow.
          </p>
        </div>
        <div>
          <h3 className="text-white text-lg font-bold mb-4">Quick Links</h3>
          <ul className="space-y-2 text-sm">
            <li><Link to="/admissions" className="hover:text-yellow-400 transition-colors">Admissions</Link></li>
            <li><Link to="/portal" className="hover:text-yellow-400 transition-colors">Student Portal</Link></li>
            <li><Link to="/fees" className="hover:text-yellow-400 transition-colors">Pay Fees</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-white text-lg font-bold mb-4">Contact Us</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-start">
              <MapPin className="h-5 w-5 mr-2 text-blue-500 shrink-0" />
              <span>{SCHOOL_ADDRESS}</span>
            </div>
            <div className="flex items-center">
              <Phone className="h-5 w-5 mr-2 text-blue-500 shrink-0" />
              <span>{SCHOOL_PHONE}</span>
            </div>
            <div className="flex items-center">
              <Mail className="h-5 w-5 mr-2 text-blue-500 shrink-0" />
              <span>{SCHOOL_EMAIL}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-slate-800 mt-8 pt-8 text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} {SCHOOL_NAME}. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;