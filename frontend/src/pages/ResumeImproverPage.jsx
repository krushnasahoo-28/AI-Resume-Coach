import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import { 
  Wand2, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Loader2, 
  Copy, 
  Check, 
  FileText, 
  RefreshCw, 
  SlidersHorizontal, 
  Layers, 
  ShieldCheck, 
  Activity, 
  TrendingUp, 
  ArrowRight,
  Info
} from 'lucide-react';

export default function ResumeImproverPage() {
  const [resumes, setResumes] = useState([]);
  const [loadingResumes, setLoadingResumes] = useState(true);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  
  const [analyzing, setAnalyzing] = useState(false);
  const [improvementResult, setImprovementResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  // Filters
  const [impactFilter, setImpactFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');

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
        const firstId = response.data[0].id;
        setSelectedResumeId(firstId);
        fetchExistingImprovement(firstId);
      }
    } catch (err) {
      console.error('Error fetching resumes:', err);
      setErrorMsg('Failed to load user resumes. Please try again.');
    } finally {
      setLoadingResumes(false);
    }
  };

  const fetchExistingImprovement = async (resumeId) => {
    try {
      const response = await apiClient.get(`/improver/${resumeId}`);
      if (response.data) {
        setImprovementResult(response.data);
      }
    } catch (err) {
      // Auto-generate if not fetched
      console.log('No prior improvement found, user can click analyze.');
    }
  };

  const handleResumeChange = (e) => {
    const id = e.target.value;
    setSelectedResumeId(id);
    setImprovementResult(null);
    if (id) {
      fetchExistingImprovement(id);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedResumeId) {
      setErrorMsg('Please select a resume to analyze.');
      return;
    }

    setAnalyzing(true);
    setErrorMsg('');

    try {
      const response = await apiClient.post(`/improver/suggest/${selectedResumeId}`);
      setImprovementResult(response.data);
    } catch (err) {
      console.error('Improvement analysis error:', err);
      const detail = err.response?.data?.detail || 'Failed to generate resume improvements. Please try again.';
      setErrorMsg(detail);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Filter suggestions
  const suggestions = improvementResult?.suggestions || [];
  const filteredSuggestions = suggestions.filter(item => {
    const matchesImpact = impactFilter === 'All' || item.impact_level === impactFilter;
    const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
    return matchesImpact && matchesCategory;
  });

  const categories = ['All', ...new Set(suggestions.map(s => s.category))];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-purple-900/40 via-indigo-900/40 to-slate-900 p-6 sm:p-8 rounded-2xl border border-purple-500/20 shadow-xl relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-purple-500/10 border border-purple-500/30 rounded-xl text-purple-400">
                  <Wand2 className="w-6 h-6" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Resume Improvement Engine
                </h1>
              </div>
              <p className="mt-2 text-slate-300 max-w-2xl text-sm sm:text-base">
                Transform passive bullets into high-impact, quantifiable statements. Eliminate weak verbs, fix formatting bottlenecks, and boost your hiring callbacks.
              </p>
            </div>
            
            <div className="flex items-center gap-2 bg-slate-800/80 backdrop-blur border border-slate-700/60 px-3.5 py-1.5 rounded-full text-xs text-slate-300 self-start md:self-auto">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Zero-Fabrication Guarantee</span>
            </div>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5 shadow-lg backdrop-blur">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
            <div className="sm:col-span-8">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Select Candidate Resume
              </label>
              {loadingResumes ? (
                <div className="flex items-center gap-2 text-sm text-slate-400 py-2.5">
                  <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
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
                  onChange={handleResumeChange}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {resumes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.original_filename} (Uploaded: {new Date(r.created_at).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="sm:col-span-4">
              <button
                onClick={handleAnalyze}
                disabled={analyzing || !selectedResumeId || resumes.length === 0}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg px-5 py-2.5 text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20 transition-all duration-200"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing Bullet Points...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-purple-200" />
                    <span>Analyze & Improve Resume</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="mt-4 p-3 bg-red-950/60 border border-red-800/60 rounded-lg text-red-300 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Improvement Results */}
        {improvementResult && (
          <div className="space-y-8 animate-fadeIn">
            
            {/* Health & Metrics Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              
              {/* Health Score Gauge */}
              <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-5 flex flex-col items-center justify-center text-center shadow-lg relative overflow-hidden">
                <span className="text-xs uppercase tracking-wider font-semibold text-slate-400 mb-2">
                  Resume Health Score
                </span>
                <div className="relative flex items-center justify-center w-24 h-24 my-1">
                  <svg className="w-full h-full" viewBox="0 0 36 36">
                    <path
                      className="text-slate-700"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className={
                        improvementResult.overall_health_score >= 80 ? "text-emerald-500" :
                        improvementResult.overall_health_score >= 60 ? "text-indigo-400" : "text-amber-400"
                      }
                      strokeDasharray={`${improvementResult.overall_health_score}, 100`}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <span className="absolute text-2xl font-black text-white">
                    {improvementResult.overall_health_score}
                  </span>
                </div>
                <span className="text-xs text-slate-400 mt-1">Out of 100 Max Score</span>
              </div>

              {/* Metric Card 1 */}
              <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-5 flex flex-col justify-between shadow-lg">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs uppercase tracking-wider font-semibold">Strong Action Verbs</span>
                  <Activity className="w-4 h-4 text-purple-400" />
                </div>
                <div className="my-2">
                  <span className="text-3xl font-extrabold text-white">
                    {improvementResult.metrics_summary.action_verb_count}
                  </span>
                  <span className="text-xs text-slate-400 block mt-1">Verbs starting bullet statements</span>
                </div>
                <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-purple-500 h-full rounded-full" style={{ width: `${Math.min(improvementResult.metrics_summary.action_verb_count * 15, 100)}%` }} />
                </div>
              </div>

              {/* Metric Card 2 */}
              <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-5 flex flex-col justify-between shadow-lg">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs uppercase tracking-wider font-semibold">Quantifiable Metrics</span>
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="my-2">
                  <span className="text-3xl font-extrabold text-white">
                    {improvementResult.metrics_summary.quantifiable_metrics_count}
                  </span>
                  <span className="text-xs text-slate-400 block mt-1">Bullets with numbers/percentages</span>
                </div>
                <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${Math.min(improvementResult.metrics_summary.quantifiable_metrics_count * 20, 100)}%` }} />
                </div>
              </div>

              {/* Metric Card 3 */}
              <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-5 flex flex-col justify-between shadow-lg">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs uppercase tracking-wider font-semibold">Suggestions Generated</span>
                  <Wand2 className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="my-2">
                  <span className="text-3xl font-extrabold text-white">
                    {improvementResult.metrics_summary.total_suggestions}
                  </span>
                  <span className="text-xs text-slate-400 block mt-1">Actionable bullet rewrites</span>
                </div>
                <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 h-full rounded-full" style={{ width: '100%' }} />
                </div>
              </div>

            </div>

            {/* Main Content Grid: Suggestions (Left 8) + Section Health (Right 4) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left Column: Suggestions */}
              <div className="lg:col-span-8 space-y-6">
                
                {/* Filters Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-800/60 border border-slate-700/60 p-4 rounded-xl">
                  <div className="flex items-center gap-2 text-sm font-semibold text-white">
                    <SlidersHorizontal className="w-4 h-4 text-purple-400" />
                    <span>Filter Improvements ({filteredSuggestions.length})</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Impact Pills */}
                    <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-700 text-xs">
                      {['All', 'High', 'Medium', 'Low'].map((level) => (
                        <button
                          key={level}
                          onClick={() => setImpactFilter(level)}
                          className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                            impactFilter === level 
                              ? 'bg-purple-600 text-white shadow' 
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>

                    {/* Category Select */}
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-3 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Suggestions List */}
                {filteredSuggestions.length === 0 ? (
                  <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-8 text-center text-slate-400">
                    <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                    <h3 className="text-base font-semibold text-white">No suggestions match filter</h3>
                    <p className="text-xs mt-1 text-slate-400">Try adjusting your category or impact filters above.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredSuggestions.map((item) => (
                      <div
                        key={item.id}
                        className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-5 space-y-4 hover:border-purple-500/40 transition-all shadow-md"
                      >
                        {/* Card Header: Category & Impact */}
                        <div className="flex items-center justify-between gap-2 border-b border-slate-700/40 pb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300">
                              {item.category}
                            </span>
                          </div>

                          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                            item.impact_level === 'High' ? 'bg-red-500/10 text-red-400 border border-red-500/30' :
                            item.impact_level === 'Medium' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                            'bg-slate-700 text-slate-300 border border-slate-600'
                          }`}>
                            {item.impact_level} Impact
                          </span>
                        </div>

                        {/* Original vs Suggested */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          
                          {/* Original */}
                          <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-lg">
                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                              Original Text
                            </span>
                            <p className="text-xs text-slate-300 font-mono leading-relaxed line-through decoration-red-500/60">
                              "{item.original}"
                            </p>
                          </div>

                          {/* Suggested */}
                          <div className="bg-purple-950/20 border border-purple-500/30 p-3.5 rounded-lg relative">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-xs font-semibold text-purple-300 uppercase tracking-wider flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-purple-400" />
                                Recommended Rewrite
                              </span>
                              
                              <button
                                onClick={() => handleCopy(item.id, item.suggested)}
                                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition"
                                title="Copy suggested rewrite"
                              >
                                {copiedId === item.id ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                            <p className="text-xs text-purple-100 font-medium leading-relaxed">
                              "{item.suggested}"
                            </p>
                          </div>

                        </div>

                        {/* Reason / Explanation */}
                        <div className="flex items-start gap-2 bg-slate-900/50 p-3 rounded-lg border border-slate-800 text-xs text-slate-300">
                          <Info className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold text-slate-200">Why this helps: </span>
                            <span>{item.reason}</span>
                          </div>
                        </div>

                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Section Health Breakdown */}
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-5 space-y-5 sticky top-8 shadow-lg">
                  <div className="flex items-center gap-2 border-b border-slate-700/40 pb-3">
                    <Layers className="w-5 h-5 text-purple-400" />
                    <h2 className="text-base font-bold text-white">Section Health Overview</h2>
                  </div>

                  <div className="space-y-4">
                    {improvementResult.section_recommendations.map((sec) => (
                      <div 
                        key={sec.section}
                        className="bg-slate-900/70 border border-slate-700/40 rounded-lg p-3.5 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white uppercase tracking-wider">
                            {sec.section}
                          </span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            sec.status === 'Good' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                            sec.status === 'Needs Improvement' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                            'bg-red-500/10 text-red-400 border border-red-500/30'
                          }`}>
                            {sec.status}
                          </span>
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed">
                          {sec.feedback}
                        </p>

                        {sec.recommendations && sec.recommendations.length > 0 && (
                          <div className="pt-1 space-y-1">
                            {sec.recommendations.map((rec, i) => (
                              <div key={i} className="flex items-start gap-1.5 text-[11px] text-slate-400">
                                <ArrowRight className="w-3 h-3 text-purple-400 flex-shrink-0 mt-0.5" />
                                <span>{rec}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-slate-700/40 text-center">
                    <p className="text-[11px] text-slate-400">
                      💡 Tip: Incorporate 2-3 quantifiable metrics into each experience bullet point to maximize interview invitations.
                    </p>
                  </div>

                </div>
              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}
