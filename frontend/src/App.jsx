import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Header from './components/Header';
import Footer from './components/Footer';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ResumeAnalyzerPage from './pages/ResumeAnalyzerPage';
import SkillGapPage from './pages/SkillGapPage';
import JobMatchingPage from './pages/JobMatchingPage';
import ResumeImproverPage from './pages/ResumeImproverPage';
import MockInterviewPage from './pages/MockInterviewPage';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-slate-900 text-slate-100 font-sans">
          <Header />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/analyzer" 
                element={
                  <ProtectedRoute>
                    <ResumeAnalyzerPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/skill-gap" 
                element={
                  <ProtectedRoute>
                    <SkillGapPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/job-matching" 
                element={
                  <ProtectedRoute>
                    <JobMatchingPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/resume-improver" 
                element={
                  <ProtectedRoute>
                    <ResumeImproverPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/mock-interview" 
                element={
                  <ProtectedRoute>
                    <MockInterviewPage />
                  </ProtectedRoute>
                } 
              />
              {/* Fallback redirect */}
              <Route path="*" element={<LandingPage />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}
