import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import { 
  MessageSquare, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Loader2, 
  Play, 
  Send, 
  ArrowRight, 
  RotateCcw, 
  Award, 
  BookOpen, 
  Target, 
  Brain, 
  HelpCircle, 
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  Check,
  FileText
} from 'lucide-react';

const TARGET_ROLES = [
  "Software Engineer",
  "Backend Developer",
  "Frontend Developer",
  "Full Stack Developer",
  "Python Developer",
  "Java Developer",
  "Data Analyst",
  "Data Scientist",
  "AI/ML Engineer",
  "DevOps Engineer"
];

export default function MockInterviewPage() {
  const [resumes, setResumes] = useState([]);
  const [loadingResumes, setLoadingResumes] = useState(true);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [targetRole, setTargetRole] = useState('Software Engineer');
  const [difficulty, setDifficulty] = useState('Medium');
  const [totalQuestions, setTotalQuestions] = useState(5);

  // Interview state: 'setup' | 'active' | 'feedback' | 'completed'
  const [interviewState, setInterviewState] = useState('setup');
  const [interviewData, setInterviewData] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(1);
  const [answerText, setAnswerText] = useState('');

  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [startingInterview, setStartingInterview] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState(null);
  const [finalSummary, setFinalSummary] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    setLoadingResumes(true);
    setErrorMsg('');
    try {
      const response = await apiClient.get('/resumes');
      setResumes(response.data);
      if (response.data.length > 0) {
        setSelectedResumeId(response.data[0].id);
      }
    } catch (err) {
      console.error('Error fetching resumes:', err);
      setErrorMsg('Failed to load user resumes. Please try again.');
    } finally {
      setLoadingResumes(false);
    }
  };

  const handleStartInterview = async () => {
    if (!selectedResumeId) {
      setErrorMsg('Please select a resume to start the interview.');
      return;
    }

    setStartingInterview(true);
    setErrorMsg('');

    try {
      const response = await apiClient.post('/interviews/start', {
        resume_id: parseInt(selectedResumeId),
        target_role: targetRole,
        difficulty: difficulty,
        total_questions: parseInt(totalQuestions)
      });

      setInterviewData(response.data);
      setCurrentQuestion(response.data.first_question);
      setCurrentQuestionIndex(1);
      setAnswerText('');
      setCurrentFeedback(null);
      setInterviewState('active');
    } catch (err) {
      console.error('Error starting interview:', err);
      const detail = err.response?.data?.detail || 'Failed to start interview session. Please try again.';
      setErrorMsg(detail);
    } finally {
      setStartingInterview(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!answerText || answerText.trim().length === 0) {
      setErrorMsg('Please enter your answer before submitting.');
      return;
    }

    setSubmittingAnswer(true);
    setErrorMsg('');

    try {
      const response = await apiClient.post(`/interviews/${interviewData.interview_id}/answer`, {
        question_index: currentQuestionIndex,
        answer_text: answerText.trim()
      });

      setCurrentFeedback(response.data.feedback);

      if (response.data.is_completed) {
        fetchFinalSummary(interviewData.interview_id);
      } else {
        setInterviewData(prev => ({
          ...prev,
          nextQuestion: response.data.next_question
        }));
      }
      setInterviewState('feedback');
    } catch (err) {
      console.error('Error submitting answer:', err);
      const detail = err.response?.data?.detail || 'Failed to evaluate answer. Please try again.';
      setErrorMsg(detail);
    } finally {
      setSubmittingAnswer(false);
    }
  };

  const handleNextQuestion = () => {
    if (interviewData?.nextQuestion) {
      setCurrentQuestion(interviewData.nextQuestion);
      setCurrentQuestionIndex(prev => prev + 1);
      setAnswerText('');
      setCurrentFeedback(null);
      setInterviewState('active');
    } else {
      fetchFinalSummary(interviewData.interview_id);
    }
  };

  const fetchFinalSummary = async (interviewId) => {
    try {
      const response = await apiClient.get(`/interviews/${interviewId}`);
      setFinalSummary(response.data);
      setInterviewState('completed');
    } catch (err) {
      console.error('Error fetching interview summary:', err);
    }
  };

  const handleRestart = () => {
    setInterviewState('setup');
    setInterviewData(null);
    setCurrentQuestion(null);
    setCurrentQuestionIndex(1);
    setAnswerText('');
    setCurrentFeedback(null);
    setFinalSummary(null);
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Banner Header */}
        <div className="bg-gradient-to-r from-blue-950/60 via-indigo-900/40 to-slate-900 p-6 sm:p-8 rounded-2xl border border-blue-500/20 shadow-xl relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-400">
                  <Brain className="w-6 h-6" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  AI Mock Technical Interview Engine
                </h1>
              </div>
              <p className="mt-2 text-slate-300 max-w-2xl text-sm sm:text-base">
                Practice realistic technical and behavioral interview questions tailored to your target job role and uploaded resume. Get instant scoring, strengths, and study recommendations.
              </p>
            </div>

            <div className="flex items-center gap-2 bg-slate-800/80 backdrop-blur border border-slate-700/60 px-3.5 py-1.5 rounded-full text-xs text-slate-300 self-start md:self-auto">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Real-Time Feedback</span>
            </div>
          </div>
        </div>

        {/* ----------------- STEP 1: SETUP VIEW ----------------- */}
        {interviewState === 'setup' && (
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-6 sm:p-8 shadow-xl backdrop-blur space-y-6 animate-fadeIn">
            <div className="border-b border-slate-700/60 pb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-400" />
                <span>Interview Session Configuration</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Customize your mock interview session parameters below.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-950/60 border border-red-800/60 rounded-lg text-red-300 text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Select Resume */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">
                  Select Candidate Resume
                </label>
                {loadingResumes ? (
                  <div className="flex items-center gap-2 text-sm text-slate-400 py-2.5">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                    <span>Loading user resumes...</span>
                  </div>
                ) : resumes.length === 0 ? (
                  <div className="text-sm text-amber-400 flex items-center gap-2 py-2">
                    <AlertTriangle className="w-4 h-4" />
                    <span>No resumes found. Please upload a resume first on the Resume page.</span>
                  </div>
                ) : (
                  <select
                    value={selectedResumeId}
                    onChange={(e) => setSelectedResumeId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {resumes.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.original_filename} (Uploaded: {new Date(r.created_at).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Target Job Role */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">
                  Target Job Role
                </label>
                <select
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {TARGET_ROLES.map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>

              {/* Difficulty */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">
                  Difficulty Level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['Easy', 'Medium', 'Hard'].map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setDifficulty(level)}
                      className={`py-2.5 rounded-lg text-xs font-semibold border transition-all ${
                        difficulty === level 
                          ? 'bg-blue-600 border-blue-500 text-white shadow-md' 
                          : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              {/* Number of Questions */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">
                  Number of Questions
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[5, 10, 15].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setTotalQuestions(num)}
                      className={`py-2.5 rounded-lg text-xs font-semibold border transition-all ${
                        totalQuestions === num 
                          ? 'bg-blue-600 border-blue-500 text-white shadow-md' 
                          : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      {num} Questions
                    </button>
                  ))}
                </div>
              </div>

            </div>

            <div className="pt-4 border-t border-slate-700/60">
              <button
                onClick={handleStartInterview}
                disabled={startingInterview || !selectedResumeId || resumes.length === 0}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl px-6 py-3.5 text-base flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 transition-all duration-200"
              >
                {startingInterview ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Generating Interview Session...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 text-blue-200 fill-blue-200" />
                    <span>Start Mock Interview</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ----------------- STEP 2: ACTIVE QUESTION VIEW ----------------- */}
        {interviewState === 'active' && currentQuestion && (
          <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6 animate-fadeIn">
            
            {/* Progress Header */}
            <div className="flex items-center justify-between border-b border-slate-700/60 pb-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400">
                  Question {currentQuestionIndex} of {interviewData.total_questions}
                </span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300">
                  {currentQuestion.category}
                </span>
              </div>
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                Difficulty: {currentQuestion.difficulty}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-700/60 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-blue-500 h-full transition-all duration-300"
                style={{ width: `${(currentQuestionIndex / interviewData.total_questions) * 100}%` }}
              />
            </div>

            {/* Question Text */}
            <div className="bg-slate-900/80 border border-slate-700/60 p-5 rounded-xl space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Interviewer Question
              </span>
              <p className="text-base sm:text-lg font-medium text-white leading-relaxed">
                "{currentQuestion.question_text}"
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-950/60 border border-red-800/60 rounded-lg text-red-300 text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Answer Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Your Answer
                </label>
                <span className="text-xs text-slate-400">
                  {answerText.trim().split(/\s+/).filter(Boolean).length} words
                </span>
              </div>
              <textarea
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                placeholder="Type your detailed answer here... Explain architectural decisions, technologies used, and core principles clearly."
                rows={6}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-500"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleSubmitAnswer}
                disabled={submittingAnswer || !answerText.trim()}
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl px-6 py-3 text-sm flex items-center gap-2 shadow-lg shadow-blue-600/20 transition"
              >
                {submittingAnswer ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Evaluating Answer...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit Answer</span>
                  </>
                )}
              </button>
            </div>

          </div>
        )}

        {/* ----------------- STEP 3: FEEDBACK VIEW ----------------- */}
        {interviewState === 'feedback' && currentFeedback && (
          <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6 animate-fadeIn">
            
            <div className="flex items-center justify-between border-b border-slate-700/60 pb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <span>Question Evaluation Feedback</span>
              </h2>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-700 text-slate-300">
                Question {currentQuestionIndex} of {interviewData.total_questions}
              </span>
            </div>

            {/* Score Banner */}
            <div className="bg-slate-900/90 border border-slate-700/60 p-5 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={`flex items-center justify-center w-16 h-16 rounded-2xl font-black text-2xl border ${
                  currentFeedback.score >= 80 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                  currentFeedback.score >= 60 ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' :
                  'bg-amber-500/10 border-amber-500/30 text-amber-400'
                }`}>
                  {currentFeedback.score}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Answer Score: {currentFeedback.score}/100</h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="text-xs font-medium text-slate-400">Technical Depth: <strong className="text-slate-200">{currentFeedback.technical_understanding}</strong></span>
                    <span className="text-slate-600">•</span>
                    <span className="text-xs font-medium text-slate-400">Clarity: <strong className="text-slate-200">{currentFeedback.clarity}</strong></span>
                  </div>
                </div>
              </div>

              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                currentFeedback.correctness === 'Strong' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                currentFeedback.correctness === 'Satisfactory' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30' :
                'bg-amber-500/10 text-amber-400 border border-amber-500/30'
              }`}>
                {currentFeedback.correctness} Assessment
              </span>
            </div>

            {/* Strengths & Weaknesses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              <div className="bg-slate-900/60 border border-emerald-500/20 p-4 rounded-xl space-y-2">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Key Strengths
                </span>
                <ul className="space-y-1 text-xs text-slate-300">
                  {currentFeedback.strengths.map((str, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-emerald-400 font-bold">•</span>
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-slate-900/60 border border-amber-500/20 p-4 rounded-xl space-y-2">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  Areas to Expand
                </span>
                <ul className="space-y-1 text-xs text-slate-300">
                  {currentFeedback.weaknesses.map((wk, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-amber-400 font-bold">•</span>
                      <span>{wk}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>

            {/* Ideal Answer Key Points */}
            <div className="bg-slate-900/80 border border-slate-700/60 p-4 rounded-xl space-y-2">
              <span className="text-xs font-bold text-purple-300 uppercase tracking-wider block flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-purple-400" />
                Ideal Answer Key Points
              </span>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {currentFeedback.ideal_key_points.map((kp, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-purple-400 flex-shrink-0 mt-0.5" />
                    <span>{kp}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleNextQuestion}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl px-6 py-3 text-sm flex items-center gap-2 shadow-lg shadow-blue-600/20 transition"
              >
                <span>{currentQuestionIndex < interviewData.total_questions ? 'Next Question' : 'View Final Summary'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        )}

        {/* ----------------- STEP 4: FINAL COMPLETED RESULTS ----------------- */}
        {interviewState === 'completed' && finalSummary && (
          <div className="space-y-8 animate-fadeIn">
            
            {/* Overall Results Header */}
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-700/60 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Award className="w-6 h-6 text-yellow-400" />
                    <span>Interview Performance Report</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Target Role: <strong className="text-white">{finalSummary.target_role}</strong> • Difficulty: <strong className="text-white">{finalSummary.difficulty}</strong>
                  </p>
                </div>

                <button
                  onClick={handleRestart}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-xs font-bold text-white transition self-start sm:self-auto"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Start New Interview</span>
                </button>
              </div>

              {/* Score Badges Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                
                <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-5 text-center flex flex-col items-center justify-center">
                  <span className="text-xs uppercase tracking-wider font-semibold text-slate-400 mb-1">
                    Overall Performance
                  </span>
                  <span className={`text-4xl font-black ${
                    finalSummary.overall_score >= 80 ? 'text-emerald-400' :
                    finalSummary.overall_score >= 60 ? 'text-blue-400' : 'text-amber-400'
                  }`}>
                    {finalSummary.overall_score}/100
                  </span>
                </div>

                <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-5 text-center flex flex-col items-center justify-center">
                  <span className="text-xs uppercase tracking-wider font-semibold text-slate-400 mb-1">
                    Technical Knowledge
                  </span>
                  <span className="text-4xl font-black text-purple-400">
                    {finalSummary.technical_score}/100
                  </span>
                </div>

                <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-5 text-center flex flex-col items-center justify-center">
                  <span className="text-xs uppercase tracking-wider font-semibold text-slate-400 mb-1">
                    Communication & Clarity
                  </span>
                  <span className="text-4xl font-black text-indigo-400">
                    {finalSummary.communication_score}/100
                  </span>
                </div>

              </div>

              {/* Strong / Weak / Study Recommendations */}
              {finalSummary.summary_feedback && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
                  
                  <div className="bg-slate-900/60 border border-emerald-500/20 p-4 rounded-xl space-y-2">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
                      Strong Areas
                    </span>
                    <ul className="space-y-1 text-xs text-slate-300">
                      {finalSummary.summary_feedback.strong_areas.map((sa, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                          <span>{sa}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-slate-900/60 border border-amber-500/20 p-4 rounded-xl space-y-2">
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                      Weak Areas
                    </span>
                    <ul className="space-y-1 text-xs text-slate-300">
                      {finalSummary.summary_feedback.weak_areas.map((wa, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                          <span>{wa}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-slate-900/60 border border-purple-500/20 p-4 rounded-xl space-y-2">
                    <span className="text-xs font-bold text-purple-300 uppercase tracking-wider block">
                      Recommended Topics to Study
                    </span>
                    <ul className="space-y-1 text-xs text-slate-300">
                      {finalSummary.summary_feedback.study_recommendations.map((rec, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-purple-400 flex-shrink-0 mt-0.5" />
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                </div>
              )}

            </div>

            {/* Question Breakdown Review */}
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-6 sm:p-8 shadow-xl space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-700/60 pb-3">
                <FileText className="w-5 h-5 text-blue-400" />
                <span>Question-by-Question Review</span>
              </h3>

              <div className="space-y-4">
                {finalSummary.answers.map((ans, idx) => (
                  <div key={idx} className="bg-slate-900/80 border border-slate-700/40 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-400">
                        Q{ans.question_index}: {ans.question_text}
                      </span>
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-200">
                        Score: {ans.score}/100
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 italic font-mono bg-slate-950 p-2.5 rounded border border-slate-800">
                      "{ans.user_answer}"
                    </p>

                    <div className="text-[11px] text-slate-400 pt-1">
                      <strong className="text-purple-300">Feedback: </strong> {ans.improvement_suggestion}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
