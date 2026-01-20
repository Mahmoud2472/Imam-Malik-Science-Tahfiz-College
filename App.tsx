
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Standard imports for high stability
import Home from './pages/Home';
import Admissions from './pages/Admissions';
import Fees from './pages/Fees';
import StudentPortal from './pages/StudentPortal';
import TeacherDashboard from './pages/TeacherDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Contact from './pages/Contact';
import Gallery from './pages/Gallery';

// Explicit interfaces for ErrorBoundary props and state
interface ErrorBoundaryProps {
  // Fix: Make children optional to satisfy JSX validator if needed in this environment
  children?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

// Global Error Boundary to catch UI crashes
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  // Fix: Explicitly define state and props to resolve TS error "Property does not exist on type ErrorBoundary"
  // This ensures the class has these properties available for access in the methods below.
  public state: ErrorBoundaryState = { hasError: false };
  // Added explicit props property declaration to fix "Property 'props' does not exist on type 'ErrorBoundary'"
  public props: ErrorBoundaryProps;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    // Ensure props is locally assigned if the base class inheritance is not being detected correctly
    this.props = props;
  }

  static getDerivedStateFromError(_: Error): ErrorBoundaryState { 
    return { hasError: true }; 
  }

  render() {
    // Fix: Access state and props which are inherited from React.Component
    // The instance properties 'state' and 'props' are now correctly typed and recognized.
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6 text-center">
          <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
            <span className="text-4xl font-bold">!</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-4">Portal Connection Issue</h2>
          <p className="text-slate-500 mb-8 max-w-sm"> We encountered a display error. Please refresh the portal to continue.</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-8 py-4 bg-blue-900 text-white rounded-2xl font-black shadow-xl hover:scale-105 transition-transform"
          >
            Refresh Portal
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      {/* Use HashRouter for 100% compatibility in preview environments */}
      <Router>
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/admissions" element={<Admissions />} />
              <Route path="/fees" element={<Fees />} />
              <Route path="/portal" element={<StudentPortal />} />
              <Route path="/staff" element={<TeacherDashboard />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/gallery" element={<Gallery />} />
              <Route path="/contact" element={<Contact />} />
              {/* Fallback to home if path not found */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </ErrorBoundary>
  );
};

export default App;
