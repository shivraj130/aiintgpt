import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  LayoutDashboard, FileText, Video, ChartNoAxesCombined, Settings, Bell, Search,
  ChevronDown, ChevronRight, Plus, ArrowUpRight, ArrowRight, Sparkles, Clock3,
  CircleCheck, CircleHelp, UploadCloud, FileCheck2, BriefcaseBusiness, Target,
  Mic, Camera, Play, Pause, Send, X, Menu, MoreHorizontal, Download, CalendarDays,
  Zap, BrainCircuit, TrendingUp, ShieldCheck, Check, AlertCircle, PanelTop,
  Gauge, MessageSquareText, Award, RotateCcw
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts'

const nav = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'resume', label: 'Resume intelligence', icon: FileText },
  { id: 'interview', label: 'AI interview', icon: Video },
  { id: 'reports', label: 'Performance reports', icon: ChartNoAxesCombined },
]
const activity = [
  { initials: 'JD', name: 'Java Developer Mock Interview', meta: 'Today, 10:42 AM · 24 min', score: '86', color: 'violet', status: 'Completed' },
  { initials: 'DS', name: 'Data Science Role Assessment', meta: 'Yesterday · 18 min', score: '78', color: 'blue', status: 'Completed' },
  { initials: 'PM', name: 'Product Analyst Practice', meta: 'Nov 15, 2026 · 21 min', score: '91', color: 'green', status: 'Completed' },
]
const trend = [
  { day: 'Mon', score: 58 }, { day: 'Tue', score: 64 }, { day: 'Wed', score: 61 },
  { day: 'Thu', score: 72 }, { day: 'Fri', score: 69 }, { day: 'Sat', score: 82 }, { day: 'Sun', score: 86 },
]
const skillData = [
  { name: 'Technical knowledge', score: 88, color: 'purple' },
  { name: 'Communication', score: 76, color: 'blue' },
  { name: 'Problem solving', score: 91, color: 'green' },
  { name: 'Confidence', score: 68, color: 'orange' },
]

// Change this URL if your FastAPI backend runs on another host or port.
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

function App() {
  const [page, setPage] = useState('overview')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [toast, setToast] = useState('')
  const [resume, setResume] = useState(null)
  const [job, setJob] = useState('AI / ML Engineer')
  const [interviewStarted, setInterviewStarted] = useState(false)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const [answers, setAnswers] = useState([])
  const [interviewQuestions, setInterviewQuestions] = useState([])
  const [sessionId, setSessionId] = useState(null)
  const [evaluating, setEvaluating] = useState(false)
  const [reportTab, setReportTab] = useState('overview')
  const fileRef = useRef(null)

  const showToast = (msg) => {
    setToast(msg)
    window.setTimeout(() => setToast(''), 3200)
  }
  const go = (id) => {
    setPage(id)
    setMobileOpen(false)
  }

  const currentQuestion = interviewQuestions[questionIndex]

  const handleFile = (f) => {
    if (f) {
      setResume(f)
      showToast(`${f.name} added successfully`)
    }
  }

  const startInterview = async ({ mode, role, difficulty }) => {
    try {
      const response = await fetch(`${API_BASE}/api/interview/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_role: role,
          interview_type: mode,
          difficulty,
          resume_context: ''
        })
      })

      const result = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(result.detail || `Question generation failed (${response.status})`)
      }
      if (!result.session_id || !Array.isArray(result.questions) || !result.questions.length) {
        throw new Error('The backend returned an incomplete interview session.')
      }

      setSessionId(result.session_id)
      setInterviewQuestions(result.questions)
      setAnswers([])
      setQuestionIndex(0)
      setAnswer('')
      setInterviewStarted(true)
      showToast(`${result.questions.length} AI questions generated successfully`)
    } catch (error) {
      showToast(error.message || 'Could not connect to the backend')
    }
  }

  const saveAnswer = async () => {
    if (!answer.trim()) {
      showToast('Write your answer first')
      return
    }
    if (!sessionId || !currentQuestion) {
      showToast('Interview session is missing. Please start a new interview.')
      return
    }

    setEvaluating(true)
    try {
      const response = await fetch(`${API_BASE}/api/interview/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          question: currentQuestion.question,
          answer: answer.trim()
        })
      })

      const result = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(result.detail || `Answer evaluation failed (${response.status})`)
      }
      if (!result.evaluation) {
        throw new Error('The backend did not return an answer evaluation.')
      }

      const savedAnswer = {
        question: currentQuestion.question,
        category: currentQuestion.category,
        answer: answer.trim(),
        evaluation: result.evaluation
      }
      const updatedAnswers = [...answers, savedAnswer]
      setAnswers(updatedAnswers)
      setAnswer('')

      if (questionIndex < interviewQuestions.length - 1) {
        setQuestionIndex(index => index + 1)
        showToast('Answer evaluated and saved')
      } else {
        setInterviewStarted(false)
        setReportTab('answers')
        setPage('reports')
        showToast('Interview completed! Your AI report is ready.')
      }
    } catch (error) {
      showToast(error.message || 'Could not evaluate your answer')
    } finally {
      setEvaluating(false)
    }
  }

  return <div className="app-shell">
    <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
      <div className="brand"><div className="brand-mark"><BrainCircuit size={21}/></div><div><div className="brand-name">Interview<span>IQ</span></div><div className="brand-caption">INTELLIGENCE PLATFORM</div></div><button className="mobile-close icon-btn" onClick={()=>setMobileOpen(false)}><X size={18}/></button></div>
      <div className="workspace-label">WORKSPACE</div>
      <nav className="nav-list">{nav.map(item => <button key={item.id} className={`nav-item ${page===item.id?'active':''}`} onClick={()=>go(item.id)}><item.icon size={18}/><span>{item.label}</span>{item.id==='reports'&&answers.length>0&&<span className="nav-count">{answers.length}</span>}</button>)}</nav>
      <div className="sidebar-bottom">
        <div className="upgrade-card"><div className="upgrade-icon"><Sparkles size={17}/></div><strong>Unlock your potential</strong><p>Build confidence with personalized interview practice.</p><button onClick={()=>go('interview')}>Start practicing <ArrowUpRight size={14}/></button></div>
        <button className={`nav-item ${page==='settings'?'active':''}`} onClick={()=>go('settings')}><Settings size={18}/><span>Settings</span></button>
        <div className="profile-row"><div className="avatar">SO</div><div className="profile-info"><strong>Shiv Raj Ojha</strong><span>Candidate account</span></div><MoreHorizontal size={18} className="muted"/></div>
      </div>
    </aside>
    {mobileOpen && <div className="scrim" onClick={()=>setMobileOpen(false)}/>}
    <main className="main-area">
      <header className="topbar"><div className="topbar-left"><button className="mobile-menu icon-btn" onClick={()=>setMobileOpen(true)}><Menu size={20}/></button><div className="breadcrumb">Workspace <ChevronRight size={14}/> <strong>{nav.find(n=>n.id===page)?.label || 'Settings'}</strong></div></div><div className="topbar-actions"><div className="search-box"><Search size={16}/><input placeholder="Search anything..." /></div><button className="icon-btn notification" onClick={()=>showToast('You are all caught up!')}><Bell size={18}/><i/></button><div className="top-user"><div className="avatar small">SO</div><ChevronDown size={14}/></div></div></header>
      <div className="page-content">
        {page==='overview' && <Dashboard go={go} showToast={showToast}/>}
        {page==='resume' && <ResumePage resume={resume} fileRef={fileRef} handleFile={handleFile} job={job} setJob={setJob} showToast={showToast}/>}
        {page==='interview' && <InterviewPage started={interviewStarted} setStarted={setInterviewStarted} question={currentQuestion} questionIndex={questionIndex} questions={interviewQuestions} answer={answer} setAnswer={setAnswer} saveAnswer={saveAnswer} evaluating={evaluating} startInterview={startInterview} showToast={showToast}/>}
        {page==='reports' && <ReportsPage tab={reportTab} setTab={setReportTab} answers={answers} sessionId={sessionId}/>}
        {page==='settings' && <SettingsPage showToast={showToast}/>}
      </div>
      <footer className="footer"><span>© 2026 InterviewIQ · AI Interview Intelligence Platform</span><span><span className="status-dot"/> All systems operational</span></footer>
    </main>
    {toast && <div className="toast"><CircleCheck size={17}/>{toast}</div>}
  </div>
}

function PageHeading({eyebrow,title,description,action, onAction}) {
  return <div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{action&&<button className="btn btn-primary" onClick={onAction}>{action==='New interview'?<Plus size={17}/>:<Download size={16}/>} {action}</button>}</div>
}
function Dashboard({go,showToast}) {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    let active = true
    const loadAnalytics = async () => {
      setLoading(true)
      setLoadError('')
      try {
        const response = await fetch(`${API_BASE}/api/interview/analytics`)
        const result = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(result.detail || `Could not load dashboard (${response.status})`)
        if (active) setAnalytics(result)
      } catch (error) {
        if (active) setLoadError(error.message || 'Could not connect to the backend')
      } finally {
        if (active) setLoading(false)
      }
    }
    loadAnalytics()
    return () => { active = false }
  }, [])

  // Support both the current API response and the earlier analytics response.
  const totalAnswers = analytics?.total_answers ?? analytics?.evaluated_answers ?? 0
  const averageScore = analytics?.average_score
  const score = typeof averageScore === 'number' && Number.isFinite(averageScore) ? averageScore : 0
  const competencyData = analytics?.skill_scores || analytics?.competencies || {}
  const trendData = analytics?.trend?.length
    ? analytics.trend
    : [{day:'No evaluated interviews',score:0}]
  const skills = [
    { name: 'Technical accuracy', score: competencyData.technical_accuracy ?? 0, color: 'purple' },
    { name: 'Relevance', score: competencyData.relevance ?? 0, color: 'blue' },
    { name: 'Clarity', score: competencyData.clarity ?? 0, color: 'green' },
    { name: 'Overall performance', score, color: 'orange' },
  ]
  const recent = analytics?.recent_interviews || analytics?.sessions || []

  return <>
    <PageHeading eyebrow="YOUR WORKSPACE" title="Good evening, Shiv 👋" description="Your next opportunity starts with preparation. Here's your progress at a glance." action="New interview" onAction={()=>go('interview')}/>
    <div className="hero-banner"><div className="hero-orb orb-one"/><div className="hero-orb orb-two"/><div className="hero-content"><div className="hero-tag"><Sparkles size={13}/> YOUR PRACTICE INSIGHT</div><h2>{analytics?.total_interviews ? <>You're building <em>real momentum</em>.</> : <>Your interview journey <em>starts here</em>.</>}</h2><p>{analytics?.total_interviews ? `You've created ${analytics.total_interviews} interview session${analytics.total_interviews===1?'':'s'} and submitted ${totalAnswers} answer${totalAnswers===1?'':'s'}. Submit answers to unlock your performance insights.` : 'Complete your first AI-powered mock interview. Your real performance insights will appear here.'}</p><button className="hero-button" onClick={()=>go('reports')}>View performance <ArrowRight size={15}/></button></div><div className="hero-score"><div className="score-ring"><div><strong>{Math.round(score)}</strong><span>/ 100</span></div></div><span>AVERAGE SCORE</span><small><TrendingUp size={13}/> {totalAnswers} evaluated answers</small></div></div>
    {loadError && <div className="api-error" role="alert"><AlertCircle size={16}/><span>{loadError}. Start the backend and refresh this page.</span></div>}
    <div className="section-head"><div><h2>Your performance</h2><p>Calculated from your saved interview evaluations</p></div><button className="text-btn" onClick={()=>go('reports')}>Full analytics <ArrowUpRight size={15}/></button></div>
    <div className="stats-grid">
      <Stat icon={Video} label="Interview sessions" value={loading?'…':String(analytics?.total_interviews ?? 0)} change="Saved in your database" tone="purple"/>
      <Stat icon={Target} label="Average score" value={loading?'…':`${Math.round(score)}%`} change="Across evaluated answers" tone="blue"/>
      <Stat icon={MessageSquareText} label="Answers evaluated" value={loading?'…':String(totalAnswers)} change="AI feedback generated" tone="green"/>
      <Stat icon={Award} label="Resume analyses" value={loading?'…':String(analytics?.resume_analyses ?? analytics?.total_resume_analyses ?? 0)} change="Saved resume reports" tone="orange"/>
    </div>
    <div className="dashboard-grid">
      <div className="panel trend-panel"><div className="panel-head"><div><h3>Readiness progress</h3><p>Average score by interview session</p></div><span className="select-pill">All sessions</span></div><div className="chart-legend"><span><i className="legend-dot purple-dot"/> Average score</span><strong>{Math.round(score)} <small>/100</small></strong></div><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><AreaChart data={trendData} margin={{top:10,right:8,left:-22,bottom:0}}><defs><linearGradient id="fillPurple" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8b72f7" stopOpacity={0.22}/><stop offset="95%" stopColor="#8b72f7" stopOpacity={0}/></linearGradient></defs><CartesianGrid stroke="#252c40" strokeDasharray="3 5" vertical={false}/><XAxis dataKey="day" tick={{fill:'#858da4',fontSize:11}} axisLine={false} tickLine={false}/><YAxis domain={[0,100]} tick={{fill:'#858da4',fontSize:11}} axisLine={false} tickLine={false}/><Tooltip contentStyle={{background:'#171e31',border:'1px solid #303951',borderRadius:10,color:'#fff'}}/><Area type="monotone" dataKey="score" stroke="#9b83ff" strokeWidth={2.5} fill="url(#fillPurple)" activeDot={{r:5,fill:'#b5a5ff'}}/></AreaChart></ResponsiveContainer></div></div>
      <div className="panel skills-panel"><div className="panel-head"><div><h3>Skill breakdown</h3><p>Based on Gemini answer evaluations</p></div><button className="icon-btn" onClick={()=>go('reports')}><ArrowUpRight size={17}/></button></div><div className="skill-list">{skills.map(s=><div className="skill-row" key={s.name}><div className="skill-label"><span>{s.name}</span><strong>{Math.round(s.score)}%</strong></div><div className="progress-track"><div className={`progress-fill ${s.color}`} style={{width:`${Math.max(0,Math.min(100,s.score))}%`}}/></div></div>)}</div><div className="skill-tip"><Sparkles size={15}/><span><strong>Practice tip:</strong> Submit more answers to build a meaningful skill profile.</span></div></div>
    </div>
    <div className="section-head activity-heading"><div><h2>Recent interviews</h2><p>Your latest saved interview sessions</p></div><button className="text-btn" onClick={()=>go('reports')}>View all <ArrowRight size={15}/></button></div>
    <div className="panel activity-panel">{loading ? <div className="empty-analysis"><strong>Loading interview history…</strong></div> : recent.length ? recent.map((item,i)=><div className="activity-row" key={item.session_id}><div className={`activity-avatar ${['violet','blue','green'][i%3]}`}>{String(item.target_role || 'AI').slice(0,2).toUpperCase()}</div><div className="activity-name"><strong>{item.target_role} · {item.interview_type}</strong><span>{item.created_at ? new Date(item.created_at).toLocaleString() : 'Saved session'} · {item.answer_count} answers</span></div><span className="completed-pill"><i/> {item.completed?'Completed':'In progress'}</span><div className="activity-score"><strong>{item.average_score===null?'—':Math.round(item.average_score)}</strong><span>/100</span></div><button className="icon-btn" onClick={()=>showToast(`Session #${item.session_id} is saved in your database`)}><ChevronRight size={17}/></button></div>) : <div className="empty-analysis"><div className="empty-graphic"><BrainCircuit size={30}/></div><strong>No interviews yet</strong><p>Start an AI interview. Your saved sessions and scores will appear here.</p><button className="btn btn-primary" onClick={()=>go('interview')}>Start your first interview</button></div>}</div>
  </>
}
function Stat({icon:Icon,label,value,change,tone}) { return <div className="stat-card"><div className={`stat-icon ${tone}`}><Icon size={18}/></div><div className="stat-label">{label}</div><div className="stat-value">{value}</div><div className="stat-change"><TrendingUp size={13}/>{change}</div></div> }

function ResumePage({resume,fileRef,handleFile,job,setJob,showToast}) {
  const [analysis,setAnalysis] = useState(null)
  const [analyzing,setAnalyzing] = useState(false)
  const [error,setError] = useState('')
  const [drag,setDrag] = useState(false)

  const analyzeResume = async () => {
    if (!resume) return

    const formData = new FormData()
    formData.append('file', resume)
    formData.append('target_role', job)

    setAnalyzing(true)
    setError('')
    setAnalysis(null)

    try {
      const response = await fetch(`${API_BASE}/api/resume/analyze`, {
        method: 'POST',
        body: formData,
      })

      const result = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(result.detail || `Resume analysis failed (${response.status})`)
      }

      if (!result.analysis) {
        throw new Error('The backend response did not contain resume analysis.')
      }

      setAnalysis(result.analysis)
      showToast('Resume analysis completed successfully')
    } catch (err) {
      const message = err.message || 'Could not connect to the backend.'
      setError(message)
      showToast('Resume analysis failed')
    } finally {
      setAnalyzing(false)
    }
  }

  const onFileSelected = (file) => {
    if (!file) return
    const validType = /\.(pdf|docx)$/i.test(file.name)
    if (!validType) {
      setError('Please upload a PDF or DOCX file. DOC files are not supported by the backend.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('The file is larger than 10 MB. Please choose a smaller resume.')
      return
    }
    setError('')
    setAnalysis(null)
    handleFile(file)
  }
const list = (items) => Array.isArray(items) && items.length > 0
    ? <ul className="analysis-list">{items.map((item,index)=><li key={`${index}-${item}`}>{item}</li>)}</ul>
    : <p className="analysis-empty">No information identified.</p>

  return <>
    <PageHeading eyebrow="PROFILE & CAREER" title="Resume intelligence" description="Turn your resume into a strategic advantage. Understand your strengths and find your next opportunity."/>
    <div className="resume-layout">
      <div className="panel upload-panel">
        <div className="panel-head"><div><h3>Upload your resume</h3><p>We'll analyze your experience, skills and qualifications.</p></div><div className="subtle-icon"><FileText size={19}/></div></div>
        <div className={`dropzone ${drag?'dragging':''}`} onDragOver={e=>{e.preventDefault();setDrag(true)}} onDragLeave={()=>setDrag(false)} onDrop={e=>{e.preventDefault();setDrag(false);onFileSelected(e.dataTransfer.files[0])}} onClick={()=>fileRef.current?.click()}>
          <input ref={fileRef} type="file" accept=".pdf,.docx" hidden onChange={e=>onFileSelected(e.target.files[0])}/>
          <div className="upload-icon"><UploadCloud size={25}/></div>
          <strong>{resume?resume.name:'Drop your resume here'}</strong>
          <span>{resume?`${(resume.size/1024).toFixed(0)} KB · Ready to analyze`:'or click to browse files'}</span>
          <small>PDF or DOCX · Max 10 MB</small>
        </div>
        <div className="upload-note"><ShieldCheck size={16}/><span>Your resume is sent to your local backend for analysis.</span></div>
        <div className="form-group"><label>Target role</label><div className="input-wrap"><BriefcaseBusiness size={16}/><select value={job} onChange={e=>{setJob(e.target.value);setAnalysis(null);setError('')}}><option>AI / ML Engineer</option><option>Data Scientist</option><option>Python Developer</option><option>Software Engineer</option><option>Data Analyst</option></select><ChevronDown size={14}/></div></div>
        {error && <div className="api-error" role="alert"><AlertCircle size={16}/><span>{error}</span></div>}
        <button className="btn btn-primary full-btn" disabled={!resume || analyzing} onClick={analyzeResume}>
          {analyzing?<><RotateCcw size={16} className="spin-icon"/> Analyzing resume...</>:<><Sparkles size={16}/> Analyze my resume</>}
        </button>
      </div>

      <div className="panel match-panel">
        <div className="panel-head"><div><h3>Role compatibility</h3><p>AI-generated insights for your target role</p></div><span className="live-badge"><i/> LIVE ANALYSIS</span></div>
        {analysis ? <div className="real-analysis">
          <div className="match-score"><div className="match-number">{Number(analysis.match_score ?? 0)}<span>%</span></div><div><strong>{Number(analysis.match_score ?? 0)>=80?'Strong match':Number(analysis.match_score ?? 0)>=60?'Good match':'Room to improve'}</strong><p>{analysis.summary || `Resume analysis for ${job}.`}</p></div></div>
          <div className="match-bar"><span style={{width:`${Math.max(0,Math.min(100,Number(analysis.match_score ?? 0)))}%`}}/></div>
          <div className="analysis-section"><h4><Check size={15}/> Candidate & education</h4><p><strong>{analysis.candidate_name || 'Candidate name not identified'}</strong></p>{list(analysis.education)}</div>
          <div className="analysis-section"><h4><BrainCircuit size={15}/> Skills identified</h4>{list(analysis.skills)}</div>
          <div className="analysis-section"><h4><BriefcaseBusiness size={15}/> Experience</h4>{list(analysis.experience)}</div>
          <div className="analysis-section"><h4><Target size={15}/> Projects</h4>{list(analysis.projects)}</div>
          <div className="analysis-section"><h4><CircleCheck size={15}/> Strengths</h4>{list(analysis.strengths)}</div>
          <div className="analysis-section"><h4><AlertCircle size={15}/> Improvements</h4>{list(analysis.improvements)}</div>
          <div className="analysis-section"><h4><Zap size={15}/> Missing skills</h4>{list(analysis.missing_skills)}</div>
        </div> : analyzing ? <div className="empty-analysis"><div className="empty-graphic"><BrainCircuit size={32}/></div><strong>Gemini is analyzing your resume</strong><p>This may take a few moments. Keep this page open while the backend processes your file.</p><div className="mini-skeleton"><i/><i/><i/></div></div> : <div className="empty-analysis"><div className="empty-graphic"><BrainCircuit size={32}/></div><strong>Your analysis will appear here</strong><p>Upload a PDF or DOCX resume, choose a target role and run the analysis to see real AI-generated insights.</p><div className="mini-skeleton"><i/><i/><i/></div></div>}
      </div>
    </div>
    <div className="section-head"><div><h2>What you'll get</h2><p>Actionable insights designed for your next career move</p></div></div>
    <div className="feature-grid"><Feature icon={Target} title="Skills extraction" desc="Identify technical and soft skills from your resume."/><Feature icon={BriefcaseBusiness} title="Job compatibility" desc="Compare your profile with the target job requirements."/><Feature icon={Sparkles} title="Smart recommendations" desc="Get specific suggestions to strengthen your profile."/></div>
  </>
}
function Insight({icon:Icon,tone,title,desc}) { return <div className="insight-row"><div className={`insight-icon ${tone}`}><Icon size={16}/></div><div><strong>{title}</strong><p>{desc}</p></div></div> }
function Feature({icon:Icon,title,desc}) { return <div className="feature-card"><div className="feature-icon"><Icon size={19}/></div><strong>{title}</strong><p>{desc}</p></div> }

function InterviewPage({
  started, setStarted, question, questionIndex, questions,
  answer, setAnswer, saveAnswer, evaluating, startInterview, showToast
}) {
  const [mode, setMode] = useState('Technical')
  const [role, setRole] = useState('AI / ML Engineer')
  const [difficulty, setDifficulty] = useState('Intermediate')
  const [micOn, setMicOn] = useState(false)
  const [camOn, setCamOn] = useState(true)
  const [starting, setStarting] = useState(false)

  const handleStart = async () => {
    setStarting(true)
    try {
      await startInterview({ mode, role, difficulty })
    } finally {
      setStarting(false)
    }
  }

  return <>
    <PageHeading eyebrow="PRACTICE ARENA" title="AI mock interview" description="Practice in a realistic interview environment and get structured feedback on your answers."/>
    {!started ? <div className="interview-start-layout">
      <div className="panel setup-panel">
        <div className="setup-illustration"><div className="setup-orbit orbit-a"/><div className="setup-orbit orbit-b"/><div className="setup-center"><BrainCircuit size={39}/></div><div className="float-chip chip-a"><Mic size={15}/></div><div className="float-chip chip-b"><MessageSquareText size={15}/></div><div className="float-chip chip-c"><Sparkles size={15}/></div></div>
        <div className="setup-copy"><span className="live-badge"><i/> READY WHEN YOU ARE</span><h2>Your next great interview starts here.</h2><p>Get personalized questions, practice your responses and discover where you can improve.</p></div>
        <div className="setup-details">
          <div><Clock3 size={17}/><span><strong>15–20 min</strong><small>Estimated duration</small></span></div>
          <div><MessageSquareText size={17}/><span><strong>5 questions</strong><small>Generated by Gemini</small></span></div>
          <div><ChartNoAxesCombined size={17}/><span><strong>AI feedback</strong><small>After every answer</small></span></div>
        </div>
      </div>
      <div className="panel configure-panel">
        <div className="panel-head"><div><h3>Configure your session</h3><p>Choose the interview you'd like to practice.</p></div></div>
        <div className="form-group"><label>Interview type</label><div className="mode-options">
          {['Technical','Behavioral','Mixed'].map(m=><button key={m} className={`mode-option ${mode===m?'selected':''}`} onClick={()=>setMode(m)}>{m==='Technical'?<BrainCircuit size={17}/>:m==='Behavioral'?<MessageSquareText size={17}/>:<Sparkles size={17}/>}<span>{m}</span>{mode===m&&<Check size={15}/>}</button>)}
        </div></div>
        <div className="form-group"><label>Target position</label><div className="input-wrap"><BriefcaseBusiness size={16}/><select value={role} onChange={e=>setRole(e.target.value)}><option>AI / ML Engineer</option><option>Python Developer</option><option>Data Scientist</option><option>Software Engineer</option><option>Data Analyst</option></select><ChevronDown size={14}/></div></div>
        <div className="form-group"><label>Difficulty level</label><div className="difficulty-options">
          {['Beginner','Intermediate','Advanced'].map(level=><button type="button" key={level} className={difficulty===level?'chosen':''} onClick={()=>setDifficulty(level)}>{level}</button>)}
        </div></div>
        <div className="session-notice"><ShieldCheck size={16}/><span>Gemini generates questions based on your selected role, interview type and difficulty.</span></div>
        <button className="btn btn-primary full-btn" onClick={handleStart} disabled={starting}>{starting?<><RotateCcw size={16} className="spin-icon"/> Generating questions...</>:<><Play size={16} fill="currentColor"/> Start interview <ArrowRight size={16}/></>}</button>
      </div>
    </div> : <div className="interview-workspace">
      <div className="interview-main">
        <div className="interview-topline"><div className="session-live"><i/> INTERVIEW IN PROGRESS</div><div className="question-counter">QUESTION {questionIndex+1} <span>/ {questions.length}</span></div></div>
        <div className="question-progress">{questions.map((q,i)=><i key={i} className={i<=questionIndex?'done':''}/>)}</div>
        <div className="question-card"><div className="question-type"><Sparkles size={14}/>{question?.category || 'Interview question'}</div><h2>{question?.question || 'Preparing your question...'}</h2><div className="question-hint"><CircleHelp size={16}/><span>{question?.what_to_assess || 'Structure your answer clearly and support it with an example.'}</span></div></div>
        <div className="answer-area">
          <div className="answer-head"><label>Your response</label><span>Take your time. Structure your thoughts.</span></div>
          <textarea value={answer} onChange={e=>setAnswer(e.target.value)} placeholder="Type your answer here... Explain your thinking clearly and use examples where possible." disabled={evaluating}/>
          <div className="answer-footer"><span>{answer.trim().split(/\s+/).filter(Boolean).length} words</span><button className="btn btn-primary" onClick={saveAnswer} disabled={evaluating||!answer.trim()}>{evaluating?<><RotateCcw size={15} className="spin-icon"/> Evaluating...</>:questionIndex===questions.length-1?'Finish interview':'Submit answer'}{!evaluating&&<ArrowRight size={15}/>}</button></div>
        </div>
      </div>
      <div className="interview-side">
        <div className="panel camera-panel"><div className="camera-header"><span>YOUR CAMERA</span><span className="camera-status"><i/> {camOn?'PREVIEW':'OFF'}</span></div><div className="camera-preview"><div className="camera-placeholder"><div className="camera-avatar">SO</div><span>{camOn?'Camera preview placeholder':'Camera is turned off'}</span><small>Connect a camera to enable live preview</small></div><div className="camera-controls"><button className={micOn?'control-active':''} onClick={()=>setMicOn(!micOn)}><Mic size={16}/></button><button className={camOn?'control-active':''} onClick={()=>setCamOn(!camOn)}><Camera size={16}/></button></div></div></div>
        <div className="panel tips-panel"><h3><Sparkles size={16}/> Interview tips</h3><ul><li>Take a moment to structure your answer.</li><li>Use a real example wherever possible.</li><li>Explain your reasoning, not just the result.</li></ul></div>
        <button className="end-session" onClick={()=>{setStarted(false);showToast('Interview session ended. Submitted answers remain saved.')}}><X size={15}/> End session</button>
      </div>
    </div>}
  </>
}

function ReportsPage({tab,setTab,answers,sessionId}) {
  const [selected,setSelected] = useState(0)
  const scoreOf = (key) => {
    const values = answers.map(a => Number(a.evaluation?.[key])).filter(v => Number.isFinite(v))
    return values.length ? Math.round(values.reduce((sum,v)=>sum+v,0)/values.length) : null
  }
  const overall = scoreOf('overall_score')
  const technical = scoreOf('technical_accuracy')
  const relevance = scoreOf('relevance')
  const clarity = scoreOf('clarity')
  const data = [
    {name:'Technical accuracy',score:technical},
    {name:'Relevance',score:relevance},
    {name:'Clarity',score:clarity}
  ].filter(item => item.score !== null)

  const allStrengths = [...new Set(answers.flatMap(a => Array.isArray(a.evaluation?.strengths) ? a.evaluation.strengths : []))]
  const allImprovements = [...new Set(answers.flatMap(a => Array.isArray(a.evaluation?.improvements) ? a.evaluation.improvements : []))]

  return <>
    <PageHeading eyebrow="INSIGHTS & GROWTH" title="Performance reports" description="Understand your strengths, identify opportunities and make every practice count." action="Export report" onAction={()=>window.print()}/>
    <div className="report-tabs"><button className={tab==='overview'?'active':''} onClick={()=>setTab('overview')}>Overview</button><button className={tab==='answers'?'active':''} onClick={()=>setTab('answers')}>Answer review <span>{answers.length}</span></button></div>
    {tab==='overview' ? <>
      <div className="report-hero panel">
        <div className="report-score-ring"><div><strong>{overall===null?'—':overall}</strong><span>/100</span></div></div>
        <div className="report-summary"><span className="live-badge"><i/> AI EVALUATION</span><h2>{overall===null?'Your report is taking shape':'Your interview performance'}</h2><p>{overall===null?'Complete an AI mock interview to see scores calculated from your submitted answers.':`Based on ${answers.length} evaluated answer${answers.length===1?'':'s'} in this interview. Scores are generated by the AI evaluator.`}</p><div className="report-tags"><span><CircleCheck size={13}/> {answers.length} answers evaluated</span>{sessionId&&<span>Session #{sessionId}</span>}</div></div>
        <div className="report-date"><CalendarDays size={15}/> Current session</div>
      </div>
      <div className="report-metrics">
        <Stat icon={BrainCircuit} label="Technical accuracy" value={technical===null?'—':`${technical}%`} change="AI-evaluated answers" tone="purple"/>
        <Stat icon={MessageSquareText} label="Relevance" value={relevance===null?'—':`${relevance}%`} change="AI-evaluated answers" tone="blue"/>
        <Stat icon={Target} label="Clarity" value={clarity===null?'—':`${clarity}%`} change="AI-evaluated answers" tone="green"/>
        <Stat icon={Gauge} label="Overall score" value={overall===null?'—':`${overall}%`} change="Average answer score" tone="orange"/>
      </div>
      <div className="dashboard-grid report-grid">
        <div className="panel"><div className="panel-head"><div><h3>Competency analysis</h3><p>Average scores from Gemini's evaluations</p></div></div>
          {data.length ? <div className="competency-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={data} layout="vertical" margin={{left:10,right:15,top:5,bottom:5}}><CartesianGrid stroke="#252c40" horizontal={false}/><XAxis type="number" domain={[0,100]} tick={{fill:'#858da4',fontSize:10}} axisLine={false} tickLine={false}/><YAxis type="category" dataKey="name" width={112} tick={{fill:'#b5bdd0',fontSize:11}} axisLine={false} tickLine={false}/><Tooltip contentStyle={{background:'#171e31',border:'1px solid #303951',borderRadius:10,color:'#fff'}}/><Bar dataKey="score" fill="#9279f5" radius={[0,6,6,0]} barSize={13}/></BarChart></ResponsiveContainer></div> : <div className="empty-analysis"><div className="empty-graphic"><ChartNoAxesCombined size={30}/></div><strong>No evaluation data yet</strong><p>Complete at least one interview answer to populate this chart.</p></div>}
        </div>
        <div className="panel recommendations"><div className="panel-head"><div><h3>Feedback highlights</h3><p>Extracted from your answer evaluations</p></div><Sparkles size={17} className="purple-text"/></div>
          {allStrengths.length ? allStrengths.slice(0,4).map((item,i)=><Insight key={`s-${i}`} icon={CircleCheck} tone="good" title="Strength" desc={item}/>) : <p className="analysis-empty">Strengths will appear here after your answers are evaluated.</p>}
          {allImprovements.length ? allImprovements.slice(0,4).map((item,i)=><Insight key={`i-${i}`} icon={Target} tone="warn" title="Improvement opportunity" desc={item}/>) : <p className="analysis-empty">Improvement suggestions will appear here after evaluation.</p>}
        </div>
      </div>
    </> : <div className="panel answer-review">
      <div className="panel-head"><div><h3>Interview answer review</h3><p>Review each answer alongside its AI-generated evaluation.</p></div></div>
      {answers.length ? answers.map((a,i)=><div className="review-item" key={i}>
        <button onClick={()=>setSelected(selected===i?-1:i)}><span>Q{i+1}. {a.question}</span><ChevronDown size={16}/></button>
        {selected===i&&<div className="review-answer">
          <strong>Your response</strong><p>{a.answer}</p>
          {a.evaluation && <>
            <div className="report-tags">
              <span>Overall: {a.evaluation.overall_score ?? '—'}/100</span>
              <span>Technical: {a.evaluation.technical_accuracy ?? '—'}/100</span>
              <span>Relevance: {a.evaluation.relevance ?? '—'}/100</span>
              <span>Clarity: {a.evaluation.clarity ?? '—'}/100</span>
            </div>
            {a.evaluation.feedback && <div className="demo-feedback"><Sparkles size={14}/>{a.evaluation.feedback}</div>}
            {Array.isArray(a.evaluation.strengths)&&a.evaluation.strengths.length>0&&<div className="analysis-section"><h4><CircleCheck size={15}/> Strengths</h4><ul className="analysis-list">{a.evaluation.strengths.map((x,j)=><li key={j}>{x}</li>)}</ul></div>}
            {Array.isArray(a.evaluation.improvements)&&a.evaluation.improvements.length>0&&<div className="analysis-section"><h4><Target size={15}/> Improvements</h4><ul className="analysis-list">{a.evaluation.improvements.map((x,j)=><li key={j}>{x}</li>)}</ul></div>}
            {Array.isArray(a.evaluation.suggested_answer_points)&&a.evaluation.suggested_answer_points.length>0&&<div className="analysis-section"><h4><Sparkles size={15}/> Suggested answer points</h4><ul className="analysis-list">{a.evaluation.suggested_answer_points.map((x,j)=><li key={j}>{x}</li>)}</ul></div>}
          </>}
        </div>}
      </div>) : <div className="empty-analysis"><div className="empty-graphic"><MessageSquareText size={30}/></div><strong>No evaluated answers yet</strong><p>Complete a mock interview to review your responses here.</p></div>}
    </div>}
    <div className="disclaimer"><ShieldCheck size={15}/><span>Scores and feedback are AI-generated practice guidance. They are not validated psychometric or hiring assessments.</span></div>
  </>
}

function SettingsPage({showToast}) {
  return <><PageHeading eyebrow="PREFERENCES" title="Settings" description="Manage your profile and interview experience."/><div className="settings-grid"><div className="panel settings-card"><h3>Profile information</h3><p>Personalize your candidate profile.</p><div className="settings-profile"><div className="avatar large">SO</div><div><strong>Shiv Raj Ojha</strong><span>Candidate account</span></div></div><div className="form-group"><label>Full name</label><input className="plain-input" defaultValue="Shiv Raj Ojha"/></div><div className="form-group"><label>Target role</label><input className="plain-input" defaultValue="AI / ML Engineer"/></div><button className="btn btn-primary" onClick={()=>showToast('Profile settings saved')}>Save changes</button></div><div className="panel settings-card"><h3>Interview preferences</h3><p>Configure your practice environment.</p><SettingRow title="Interview reminders" desc="Receive a reminder to practice regularly."/><SettingRow title="Detailed feedback" desc="Show suggestions after each answer."/><SettingRow title="Camera preview" desc="Enable camera preview before interviews."/></div></div></>
}
function SettingRow({title,desc}) { const [on,setOn]=useState(true); return <div className="setting-row"><div><strong>{title}</strong><span>{desc}</span></div><button className={`toggle ${on?'on':''}`} onClick={()=>setOn(!on)}><i/></button></div> }

export default App