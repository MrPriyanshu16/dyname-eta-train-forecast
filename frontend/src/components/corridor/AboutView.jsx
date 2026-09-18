import React from 'react';
import { BookOpen, Users, Cpu, Server, Layout, CheckCircle, Database } from 'lucide-react';

export default function AboutView() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Problem Statement Hero */}
      <div className="p-6 bg-rail-card border border-rail-border rounded-xl shadow-md space-y-3">
        <div className="flex items-center space-x-2">
          <span className="px-2.5 py-0.5 text-xs font-mono font-bold rounded bg-rail-accent/20 text-rail-accent border border-rail-accent/30">
            SIH Problem Statement ID: 26028
          </span>
          <span className="text-xs text-rail-muted">Ministry of Railways • Smart Automation</span>
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">
          Dynamic Forecast of Expected Time of Arrival (ETA) for Coaching Trains
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed">
          Accurate forecasting of the Expected Time of Arrival (ETA) for coaching trains is vital for improving passenger satisfaction and operational efficiency in Indian Railways. Currently, ETA is estimated using static schedules, current delays, and in-built recovery times, which fail to reflect real-world ground realities such as speed restrictions, section congestion, signal halts, or weather disruptions.
        </p>
      </div>

      {/* Project Team & Academic Submission Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Submitted By */}
        <div className="p-5 bg-rail-card border border-rail-border rounded-xl shadow-md space-y-3">
          <div className="flex items-center space-x-2 text-xs font-semibold text-rail-muted uppercase">
            <Users className="w-4 h-4 text-rail-accent" />
            <span>Project Authors</span>
          </div>
          <div className="space-y-2">
            <div className="p-3 bg-rail-bg rounded-lg border border-rail-border flex items-center justify-between">
              <div>
                <h5 className="font-semibold text-sm text-white">Priyanshu Prajapat</h5>
                <p className="text-xs text-rail-muted">B.Tech Computer Science & Engineering</p>
              </div>
              <span className="font-mono text-xs text-rail-accent bg-rail-accent/10 px-2 py-0.5 rounded border border-rail-accent/20">
                23EJICS125
              </span>
            </div>
            <div className="p-3 bg-rail-bg rounded-lg border border-rail-border flex items-center justify-between">
              <div>
                <h5 className="font-semibold text-sm text-white">Keshav Solanki</h5>
                <p className="text-xs text-rail-muted">B.Tech Computer Science & Engineering</p>
              </div>
              <span className="font-mono text-xs text-rail-accent bg-rail-accent/10 px-2 py-0.5 rounded border border-rail-accent/20">
                23EJICS075
              </span>
            </div>
          </div>
        </div>

        {/* Submitted To / Mentors */}
        <div className="p-5 bg-rail-card border border-rail-border rounded-xl shadow-md space-y-3">
          <div className="flex items-center space-x-2 text-xs font-semibold text-rail-muted uppercase">
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <span>Project Guidance & Mentors</span>
          </div>
          <div className="space-y-2">
            <div className="p-3 bg-rail-bg rounded-lg border border-rail-border flex items-center justify-between">
              <div>
                <h5 className="font-semibold text-sm text-white">Ms. Harshita Khangarot</h5>
                <p className="text-xs text-rail-muted">Faculty Mentor / Guide</p>
              </div>
              <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Guide
              </span>
            </div>
            <div className="p-3 bg-rail-bg rounded-lg border border-rail-border flex items-center justify-between">
              <div>
                <h5 className="font-semibold text-sm text-white">Mr. Dushyant Sharma</h5>
                <p className="text-xs text-rail-muted">Faculty Mentor / Guide</p>
              </div>
              <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Guide
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Full-Stack Architecture & Technology Stack */}
      <div className="p-6 bg-rail-card border border-rail-border rounded-xl shadow-md space-y-4">
        <h4 className="font-bold text-base text-white flex items-center space-x-2">
          <Cpu className="w-5 h-5 text-rail-accent" />
          <span>Technical Architecture Stack</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
          
          <div className="p-3.5 bg-rail-bg rounded-lg border border-rail-border space-y-1.5">
            <div className="flex items-center space-x-2 text-sky-400 text-xs font-bold uppercase">
              <Layout className="w-4 h-4" />
              <span>Frontend Client</span>
            </div>
            <p className="text-sm font-semibold text-white">React 19 + Vite</p>
            <p className="text-xs text-rail-muted">Tailwind CSS, Leaflet GIS mapping, Lucide icons, responsive layout.</p>
          </div>

          <div className="p-3.5 bg-rail-bg rounded-lg border border-rail-border space-y-1.5">
            <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase">
              <Server className="w-4 h-4" />
              <span>Backend Engine</span>
            </div>
            <p className="text-sm font-semibold text-white">FastAPI (Python)</p>
            <p className="text-xs text-rail-muted">Asynchronous REST APIs & WebSocket real-time event streaming pipeline.</p>
          </div>

          <div className="p-3.5 bg-rail-bg rounded-lg border border-rail-border space-y-1.5">
            <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase">
              <Cpu className="w-4 h-4" />
              <span>Machine Learning</span>
            </div>
            <p className="text-sm font-semibold text-white">Scikit-Learn Ensemble</p>
            <p className="text-xs text-rail-muted">Gradient Boosted Regressor with Explainable AI delay attribution.</p>
          </div>

          <div className="p-3.5 bg-rail-bg rounded-lg border border-rail-border space-y-1.5">
            <div className="flex items-center space-x-2 text-purple-400 text-xs font-bold uppercase">
              <Database className="w-4 h-4" />
              <span>Railway Data</span>
            </div>
            <p className="text-sm font-semibold text-white">NDLS-CNB Corridor</p>
            <p className="text-xs text-rail-muted">440 km high-density trunk route, 7 stations, block headway physics.</p>
          </div>

        </div>
      </div>

    </div>
  );
}
