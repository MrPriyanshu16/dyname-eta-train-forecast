import React, { useState } from 'react';
import { Volume2, Pause, Play } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface TrainlineHeroIllustrationProps {
  className?: string;
  children?: React.ReactNode;
}

export const TrainlineHeroIllustration: React.FC<TrainlineHeroIllustrationProps> = ({
  className = '',
  children
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [isPaused, setIsPaused] = useState(false);
  const [showHonk, setShowHonk] = useState(false);

  // Play authentic dual-chime electric train horn using Web Audio API (zero external audio files needed)
  const handleHonk = () => {
    setShowHonk(true);
    setTimeout(() => setShowHonk(false), 2400);

    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Authentic Indian Railways dual-tone frequencies (WAP-7 dual chime: ~311Hz Eb4 & ~370Hz F#4)
      const freqs = [311.13, 369.99];
      freqs.forEach(freq => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        // Natural horn envelope: quick attack, sustained harmonic chime, soft release
        gain.gain.setValueAtTime(0.01, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.4);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 1.4);
      });
    } catch {
      // AudioContext unavailable or blocked by browser policy
    }
  };

  return (
    <div
      className={`relative w-full min-h-[460px] sm:min-h-[500px] lg:min-h-[540px] select-none bg-transparent ${className}`}
      aria-label="Scenic railway panorama transitioning from city to countryside and mountains with ground-level train track"
    >
      {/* 1. BACKGROUND SVG PANORAMIC ARTWORK */}
      <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden">
        <svg
          viewBox="0 0 1440 540"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full object-cover object-bottom"
          preserveAspectRatio="xMidYMax slice"
        >
          <defs>
            {/* Day / Night Atmospheric Sky Gradients */}
            <linearGradient id="panoSkyLight" x1="720" y1="0" x2="720" y2="540" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#bae6fd" stopOpacity="0.5" />
              <stop offset="35%" stopColor="#e0f2fe" stopOpacity="0.3" />
              <stop offset="70%" stopColor="#f8fafc" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#f8fafc" stopOpacity="0" />
            </linearGradient>

            <linearGradient id="panoSkyDark" x1="720" y1="0" x2="720" y2="540" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#040817" stopOpacity="0.9" />
              <stop offset="40%" stopColor="#0a122c" stopOpacity="0.7" />
              <stop offset="75%" stopColor="#09090b" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#09090b" stopOpacity="0" />
            </linearGradient>

            {/* City Silhouette Gradients */}
            <linearGradient id="panoCityLight" x1="0" y1="180" x2="0" y2="380" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#94a3b8" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#cbd5e1" stopOpacity="0.65" />
            </linearGradient>
            <linearGradient id="panoCityDark" x1="0" y1="180" x2="0" y2="380" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#1e293b" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#0f172a" stopOpacity="0.95" />
            </linearGradient>

            {/* Countryside & Heritage Hill Gradients */}
            <linearGradient id="panoHillLight" x1="700" y1="260" x2="700" y2="390" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#86efac" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#cbd5e1" stopOpacity="0.6" />
            </linearGradient>
            <linearGradient id="panoHillDark" x1="700" y1="260" x2="700" y2="390" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#13273e" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#0d1527" stopOpacity="0.9" />
            </linearGradient>

            {/* Distant Mountain Gradients */}
            <linearGradient id="panoMtnLight" x1="1200" y1="140" x2="1200" y2="380" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#93c5fd" stopOpacity="0.5" />
              <stop offset="60%" stopColor="#cbd5e1" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#e2e8f0" stopOpacity="0.4" />
            </linearGradient>
            <linearGradient id="panoMtnDark" x1="1200" y1="140" x2="1200" y2="380" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#1e293b" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#09090b" stopOpacity="0.85" />
            </linearGradient>

            {/* Ground Ballast Bed Gradient */}
            <linearGradient id="panoBallastLight" x1="0" y1="385" x2="0" y2="430" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#64748b" />
              <stop offset="35%" stopColor="#475569" />
              <stop offset="100%" stopColor="#94a3b8" stopOpacity="0.7" />
            </linearGradient>
            <linearGradient id="panoBallastDark" x1="0" y1="385" x2="0" y2="430" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="40%" stopColor="#141c2c" />
              <stop offset="100%" stopColor="#09090b" />
            </linearGradient>

            {/* Train Royal Blue Livery */}
            <linearGradient id="panoTrainBlue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1d4ed8" />
              <stop offset="45%" stopColor="#2563eb" />
              <stop offset="85%" stopColor="#1e40af" />
              <stop offset="100%" stopColor="#172554" />
            </linearGradient>

            {/* Window Warm Glow */}
            <linearGradient id="panoWindowGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>

            {/* Forward Headlight Beam Cone */}
            <linearGradient id="panoHeadlight" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#fef08a" stopOpacity="0.85" />
              <stop offset="35%" stopColor="#fef9c3" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>

            {/* Glow Filters */}
            <filter id="panoGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="panoSignalGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Keyframe Styles for High Performance 60 FPS CSS Animations */}
          <style>{`
            @keyframes panoCloudDrift {
              0% { transform: translateX(0px); }
              100% { transform: translateX(1440px); }
            }
            @keyframes panoTrainRun {
              0% { transform: translateX(-650px); }
              100% { transform: translateX(1500px); }
            }
            @keyframes panoBob {
              0%, 100% { transform: translateY(0px); }
              50% { transform: translateY(-0.8px); }
            }
            @keyframes panoSpin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            @keyframes panoSignalPulse {
              0%, 100% { opacity: 1; filter: drop-shadow(0 0 5px #10b981); }
              50% { opacity: 0.65; filter: drop-shadow(0 0 1px #10b981); }
            }
            @keyframes panoTailBlink {
              0%, 100% { opacity: 1; filter: drop-shadow(0 0 5px #ef4444); }
              45% { opacity: 1; }
              50% { opacity: 0.15; }
              95% { opacity: 0.15; }
            }
            @keyframes panoSparkle {
              0%, 100% { opacity: 0; }
              48% { opacity: 0; }
              50% { opacity: 0.95; transform: scale(1.4); }
              52% { opacity: 0; }
            }
            @keyframes panoStarTwinkle {
              0%, 100% { opacity: 0.3; }
              50% { opacity: 0.95; }
            }

            .animate-pano-cloud { animation: panoCloudDrift 70s linear infinite; }
            .animate-pano-train { animation: panoTrainRun 18s linear infinite; will-change: transform; }
            .animate-pano-bob { animation: panoBob 0.65s ease-in-out infinite; }
            .animate-pano-wheel { transform-box: fill-box; transform-origin: center; animation: panoSpin 0.35s linear infinite; }
            .animate-pano-signal { animation: panoSignalPulse 2.5s ease-in-out infinite; }
            .animate-pano-tail { animation: panoTailBlink 1.1s steps(1) infinite; }
            .animate-pano-spark { animation: panoSparkle 4.2s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
            .animate-star-twinkle { animation: panoStarTwinkle 3s ease-in-out infinite; }

            .is-paused { animation-play-state: paused !important; }

            @media (prefers-reduced-motion: reduce) {
              .animate-pano-train { animation: none; transform: translateX(450px); }
              .animate-pano-cloud, .animate-pano-wheel, .animate-pano-bob { animation: none; }
            }
          `}</style>

          {/* A. SKY BACKGROUND (Adaptive Light & Dark) */}
          <rect width="1440" height="540" fill={isDark ? "url(#panoSkyDark)" : "url(#panoSkyLight)"} />

          {/* B. CELESTIAL ELEMENTS */}
          {!isDark ? (
            /* Light Mode: Morning Sun with Halo */
            <g transform="translate(1220, 50)">
              <circle cx="25" cy="25" r="38" fill="#fef08a" opacity="0.22" />
              <circle cx="25" cy="25" r="24" fill="#fde047" opacity="0.38" />
              <circle cx="25" cy="25" r="15" fill="#fef08a" opacity="0.95" />
            </g>
          ) : (
            /* Dark Mode: Crescent Moon & Twinkling Stars across Expanded Sky */
            <g>
              <g transform="translate(1220, 50)">
                <circle cx="20" cy="20" r="16" fill="#f8fafc" opacity="0.9" filter="url(#panoGlow)" />
                <circle cx="26" cy="17" r="15" fill="#040817" />
              </g>
              <circle cx="120" cy="55" r="1.5" fill="#ffffff" className="animate-star-twinkle" />
              <circle cx="280" cy="38" r="1.2" fill="#93c5fd" className="animate-star-twinkle" style={{ animationDelay: '1.2s' }} />
              <circle cx="450" cy="65" r="1.5" fill="#ffffff" className="animate-star-twinkle" style={{ animationDelay: '0.6s' }} />
              <circle cx="680" cy="42" r="1.2" fill="#fef08a" className="animate-star-twinkle" style={{ animationDelay: '1.8s' }} />
              <circle cx="890" cy="58" r="1.5" fill="#ffffff" className="animate-star-twinkle" style={{ animationDelay: '0.9s' }} />
              <circle cx="1060" cy="35" r="1.2" fill="#93c5fd" className="animate-star-twinkle" style={{ animationDelay: '2.1s' }} />
              <circle cx="1380" cy="70" r="1.5" fill="#ffffff" className="animate-star-twinkle" style={{ animationDelay: '0.4s' }} />
              {/* Extra atmospheric stars in expanded sky */}
              <circle cx="180" cy="115" r="1.2" fill="#ffffff" className="animate-star-twinkle" style={{ animationDelay: '1.5s' }} />
              <circle cx="360" cy="135" r="1.4" fill="#93c5fd" className="animate-star-twinkle" style={{ animationDelay: '2.4s' }} />
              <circle cx="580" cy="110" r="1.3" fill="#fef08a" className="animate-star-twinkle" style={{ animationDelay: '0.8s' }} />
              <circle cx="780" cy="130" r="1.2" fill="#ffffff" className="animate-star-twinkle" style={{ animationDelay: '1.9s' }} />
              <circle cx="980" cy="120" r="1.4" fill="#93c5fd" className="animate-star-twinkle" style={{ animationDelay: '1.1s' }} />
              <circle cx="1180" cy="110" r="1.3" fill="#ffffff" className="animate-star-twinkle" style={{ animationDelay: '2.7s' }} />
            </g>
          )}

          {/* C. PARALLAX DRIFTING CLOUDS */}
          <g className={`animate-pano-cloud ${isPaused ? 'is-paused' : ''}`} opacity={isDark ? "0.35" : "0.7"}>
            <path
              d="M-80 65C-80 57 -72 51 -62 51C-59 43 -50 37 -38 37C-24 37 -13 46 -10 58C-4 58 2 63 2 69C2 75 -4 80 -10 80H-70C-76 80 -80 73 -80 65Z"
              fill={isDark ? "#334155" : "#ffffff"}
            />
            <path
              d="M580 82C580 74 588 68 598 68C601 60 610 54 622 54C636 54 647 63 650 75C656 75 662 80 662 86C662 92 656 97 650 97H590C584 97 580 90 580 82Z"
              fill={isDark ? "#334155" : "#ffffff"}
            />
          </g>

          {/* D. LOWER SCENERY & RAILWAY INFRASTRUCTURE (Shifted down by 120px to give expansive sky above) */}
          <g transform="translate(0, 120)">
            {/* 1. METROPOLIS CITY SKYLINE (Left Section: x=0 to x=520) */}
            <g>
            {/* Background City Silhouettes */}
            <path
              d="M0 380 V 270 H 35 V 230 H 75 V 285 H 105 V 205 H 145 L 160 175 L 175 205 H 205 V 250 H 240 V 220 H 290 V 275 H 325 V 240 H 375 V 295 H 410 V 265 H 455 V 320 H 510 V 380 Z"
              fill={isDark ? "url(#panoCityDark)" : "url(#panoCityLight)"}
            />

            {/* Communications Mast with Red Aircraft Warning Beacon at x=160, y=175 */}
            <line x1="160" y1="175" x2="160" y2="155" stroke="#94a3b8" strokeWidth="1.2" />
            <circle cx="160" cy="154" r="2.2" className="fill-red-500 animate-pulse" filter="url(#panoSignalGlow)" />

            {/* Glowing Windows in Skyscrapers (Dark Mode Highlight) */}
            {isDark && (
              <g fill="#fde047" opacity="0.85">
                {[215, 230, 245, 260].map((yWin, i) => (
                  <rect key={`w1-${i}`} x="115" y={yWin} width="6" height="4" rx="1" />
                ))}
                {[215, 230, 245, 260].map((yWin, i) => (
                  <rect key={`w2-${i}`} x="130" y={yWin} width="6" height="4" rx="1" />
                ))}
                {[230, 245, 260].map((yWin, i) => (
                  <rect key={`w3-${i}`} x="250" y={yWin} width="8" height="4" rx="1" />
                ))}
                {[230, 245, 260].map((yWin, i) => (
                  <rect key={`w4-${i}`} x="270" y={yWin} width="8" height="4" rx="1" />
                ))}
                {[250, 265, 280].map((yWin, i) => (
                  <rect key={`w5-${i}`} x="335" y={yWin} width="7" height="4" rx="1" />
                ))}
                {[250, 265, 280].map((yWin, i) => (
                  <rect key={`w6-${i}`} x="355" y={yWin} width="7" height="4" rx="1" />
                ))}
              </g>
            )}
          </g>

          {/* 2. HERITAGE COUNTRYSIDE & MEADOWS (Center Section: x=460 to x=980) */}
          <g>
            {/* Gentle Rolling Countryside Hills */}
            <path
              d="M450 380 Q 560 300 700 325 T 980 340 L 980 380 Z"
              fill={isDark ? "url(#panoHillDark)" : "url(#panoHillLight)"}
            />

            {/* Heritage Stone Chhatri (Pavilion Dome on Hill at x=690, y=300) */}
            <g transform="translate(685, 296)" fill={isDark ? "#475569" : "#64748b"}>
              <path d="M0 16 C3 8 9 2 15 2 C21 2 27 8 30 16 Z" />
              <rect x="14" y="-2" width="2" height="4" />
              <rect x="2" y="16" width="2.5" height="15" />
              <rect x="10" y="16" width="2.5" height="15" />
              <rect x="18" y="16" width="2.5" height="15" />
              <rect x="26" y="16" width="2.5" height="15" />
              <rect x="0" y="29" width="30" height="3" rx="1" />
            </g>

            {/* Countryside Trees & Foliage */}
            <g fill={isDark ? "rgba(6, 78, 59, 0.7)" : "rgba(4, 120, 87, 0.45)"}>
              <circle cx="540" cy="325" r="9" />
              <circle cx="552" cy="322" r="11" />
              <circle cx="566" cy="327" r="8" />
              <circle cx="810" cy="336" r="9" />
              <circle cx="824" cy="332" r="12" />
              <circle cx="838" cy="337" r="8" />
            </g>

            {/* Wayside Relay Cabin with Pitched Roof at x=895, y=348 */}
            <g transform="translate(895, 348)">
              <polygon points="12,0 0,9 24,9" fill={isDark ? "#451a03" : "#9a3412"} />
              <rect x="2" y="9" width="20" height="16" rx="1" fill={isDark ? "#334155" : "#cbd5e1"} />
              <rect x="5" y="13" width="5" height="5" fill={isDark ? "#fbbf24" : "#fef08a"} />
              <rect x="14" y="13" width="5" height="12" fill={isDark ? "#1e293b" : "#64748b"} />
            </g>
          </g>

          {/* 3. MAJESTIC MOUNTAIN RANGE (Right Section: x=900 to x=1440) */}
          <g>
            {/* Distant Lofty Peaks */}
            <path
              d="M920 380 L 1000 240 L 1070 310 L 1150 190 L 1230 290 L 1320 170 L 1400 270 L 1440 230 V 380 Z"
              fill={isDark ? "url(#panoMtnDark)" : "url(#panoMtnLight)"}
            />

            {/* Alpine Ridge Highlights */}
            <path
              d="M1150 190 L 1175 240 L 1230 290 M 1320 170 L 1345 220 L 1400 270"
              stroke="#ffffff"
              strokeWidth="1.2"
              opacity={isDark ? "0.2" : "0.4"}
            />
          </g>

          {/* E. GROUND-LEVEL RAILWAY INFRASTRUCTURE (No elevated bridge!) */}
          <g>
            {/* Grassy Ground Embankment */}
            <rect x="0" y="380" width="1440" height="42" fill={isDark ? "#090d16" : "#e2e8f0"} />
            <line x1="0" y1="380" x2="1440" y2="380" stroke={isDark ? "#064e3b" : "#86efac"} strokeWidth="2.5" />

            {/* Crushed Stone Ballast Bed */}
            <polygon
              points="0,388 1440,388 1440,418 0,418"
              fill={isDark ? "url(#panoBallastDark)" : "url(#panoBallastLight)"}
            />

            {/* Railroad Ties (Concrete / Timber Sleepers) spaced every 20px */}
            {Array.from({ length: 72 }).map((_, i) => (
              <rect
                key={i}
                x={i * 20}
                y="391"
                width="5"
                height="22"
                rx="0.8"
                fill={isDark ? "#334155" : "#cbd5e1"}
                stroke={isDark ? "#1e293b" : "#94a3b8"}
                strokeWidth="0.5"
              />
            ))}

            {/* Continuous Welded Steel Running Rails */}
            {/* Bottom Rail Flange Base */}
            <line x1="0" y1="396" x2="1440" y2="396" stroke="#334155" strokeWidth="2" />
            {/* Top Polished Steel Rail Head with Shiny Glint */}
            <line x1="0" y1="395" x2="1440" y2="395" stroke="#cbd5e1" strokeWidth="1" />
            {/* Second Inner Rail */}
            <line x1="0" y1="407" x2="1440" y2="407" stroke="#334155" strokeWidth="2" />
            <line x1="0" y1="406" x2="1440" y2="406" stroke="#cbd5e1" strokeWidth="1" />

            {/* Trackside Milestone Post (412 KM Rajasthan Lifeline) at x=780 */}
            <g transform="translate(780, 362)">
              <rect x="0" y="4" width="14" height="18" rx="2" fill="#f8fafc" stroke="#64748b" strokeWidth="1" />
              <path d="M0 4 C0 0 14 0 14 4 Z" fill="#eab308" />
              <text x="1.5" y="16" fontSize="4.5" fontWeight="bold" fill="#0f172a" fontFamily="monospace">412KM</text>
            </g>
          </g>

          {/* F. OVERHEAD ELECTRIFICATION (OHE) CATENARY SYSTEM */}
          <g>
            {/* Upper Messenger Wire */}
            <line x1="0" y1="288" x2="1440" y2="288" stroke="#94a3b8" strokeWidth="0.8" strokeDasharray="8 3" opacity="0.6" />
            {/* Lower Contact Wire (Touches locomotive pantograph at y=302) */}
            <line x1="0" y1="302" x2="1440" y2="302" stroke="#64748b" strokeWidth="1.2" opacity="0.8" />

            {/* Electrification Steel Lattice Masts grounded on ballast */}
            {[90, 340, 590, 840, 1090, 1340].map((poleX, i) => (
              <g key={i}>
                <rect x={poleX} y="280" width="5" height="106" rx="1" className="fill-slate-500 dark:fill-slate-600" />
                <rect x={poleX - 2.5} y="382" width="10" height="5" rx="0.5" className="fill-slate-600 dark:fill-slate-700" />
                <line x1={poleX + 2} y1="288" x2={poleX + 32} y2="288" stroke="#64748b" strokeWidth="1.5" />
                <line x1={poleX + 2} y1="302" x2={poleX + 28} y2="302" stroke="#64748b" strokeWidth="1.5" />
                <line x1={poleX + 28} y1="288" x2={poleX + 28} y2="302" stroke="#94a3b8" strokeWidth="1" />
                <circle cx={poleX + 28} cy="295" r="2.2" className="fill-amber-500 dark:fill-amber-400" />
              </g>
            ))}
          </g>

          {/* G. LIVE RAILWAY SIGNAL MAST */}
          <g transform="translate(1010, 290)">
            <rect x="6" y="20" width="3.5" height="96" className="fill-slate-600 dark:fill-slate-500" />
            <line x1="2" y1="114" x2="13" y2="114" stroke="#475569" strokeWidth="2.5" />
            <line x1="5" y1="40" x2="10" y2="40" stroke="#94a3b8" strokeWidth="1" />
            <line x1="5" y1="60" x2="10" y2="60" stroke="#94a3b8" strokeWidth="1" />
            <line x1="5" y1="80" x2="10" y2="80" stroke="#94a3b8" strokeWidth="1" />
            <rect x="3" y="0" width="9.5" height="22" rx="4.5" className="fill-slate-900 border border-slate-700" />
            <circle cx="7.8" cy="6" r="2.8" className="fill-red-950 opacity-40" />
            <circle
              cx="7.8"
              cy="15.5"
              r="3.2"
              className="fill-emerald-400 animate-pano-signal"
              filter="url(#panoSignalGlow)"
            />
          </g>

          {/* H. ANIMATED INDIAN RAILWAYS BLUE PASSENGER TRAIN (Cruising on Ground Track at y=355-395) */}
          <g className={`animate-pano-train ${isPaused ? 'is-paused' : ''}`}>
            {/* Vertical Suspension Momentum Bob */}
            <g className={`animate-pano-bob ${isPaused ? 'is-paused' : ''}`}>

              {/* COACH 2: REAR GUARD & LUGGAGE BRAKE VAN (SLR) */}
              <g transform="translate(0, 355)">
                <rect x="0" y="0" width="150" height="34" rx="3.5" fill="url(#panoTrainBlue)" />
                <rect x="0" y="8" width="150" height="2.2" fill="#f8fafc" />
                <rect x="0" y="26" width="150" height="2" fill="#facc15" />
                <rect x="2" y="-1.5" width="146" height="2.5" rx="1" className="fill-blue-950/70" />

                {/* Luggage Shutter Door */}
                <rect x="18" y="8" width="38" height="20" rx="1.5" className="fill-blue-950/90 stroke-blue-400/50" strokeWidth="0.8" />
                {[11, 14, 17, 20, 23].map((yLine, idx) => (
                  <line key={idx} x1="20" y1={yLine} x2="54" y2={yLine} stroke="#93c5fd" strokeWidth="0.8" opacity="0.6" />
                ))}

                {/* Guard Lookout Window */}
                <rect x="70" y="11" width="14" height="12" rx="2" fill="url(#panoWindowGlow)" filter="url(#panoGlow)" />
                
                {/* Passenger Windows */}
                {[95, 114, 132].map((winX, idx) => (
                  <g key={idx}>
                    <rect x={winX} y="11" width="12" height="11" rx="2" fill="url(#panoWindowGlow)" filter="url(#panoGlow)" />
                    <line x1={winX + 6} y1="11" x2={winX + 6} y2="22" stroke="#78350f" strokeWidth="0.8" opacity="0.4" />
                  </g>
                ))}

                {/* End-Of-Train Red Flashing Tail Lamp */}
                <circle cx="-2" cy="18" r="3.2" className="fill-red-500 animate-pano-tail" filter="url(#panoSignalGlow)" />
                {/* "LV" Circular Marker Board */}
                <circle cx="-1" cy="26" r="3.8" fill="#facc15" stroke="#1e293b" strokeWidth="0.8" />
                <text x="-3" y="28" fontSize="4.8" fontWeight="bold" fill="#000000" fontFamily="monospace">LV</text>
                <text x="3" y="17" fontSize="5.2" fontWeight="bold" fill="#ffffff" opacity="0.75" fontFamily="monospace">SLR</text>

                {/* Bogies & Rotating Wheels running on railhead */}
                <g transform="translate(24, 34)">
                  <rect x="-14" y="0" width="28" height="3.5" rx="1" fill="#1e293b" />
                  <g transform="translate(-8, 3.5)" className={`animate-pano-wheel ${isPaused ? 'is-paused' : ''}`}>
                    <circle cx="0" cy="0" r="4.2" fill="#334155" stroke="#94a3b8" strokeWidth="1" />
                    <line x1="-3.5" y1="0" x2="3.5" y2="0" stroke="#ffffff" strokeWidth="0.8" />
                    <line x1="0" y1="-3.5" x2="0" y2="3.5" stroke="#ffffff" strokeWidth="0.8" />
                  </g>
                  <g transform="translate(8, 3.5)" className={`animate-pano-wheel ${isPaused ? 'is-paused' : ''}`}>
                    <circle cx="0" cy="0" r="4.2" fill="#334155" stroke="#94a3b8" strokeWidth="1" />
                    <line x1="-3.5" y1="0" x2="3.5" y2="0" stroke="#ffffff" strokeWidth="0.8" />
                    <line x1="0" y1="-3.5" x2="0" y2="3.5" stroke="#ffffff" strokeWidth="0.8" />
                  </g>
                </g>

                <g transform="translate(126, 34)">
                  <rect x="-14" y="0" width="28" height="3.5" rx="1" fill="#1e293b" />
                  <g transform="translate(-8, 3.5)" className={`animate-pano-wheel ${isPaused ? 'is-paused' : ''}`}>
                    <circle cx="0" cy="0" r="4.2" fill="#334155" stroke="#94a3b8" strokeWidth="1" />
                    <line x1="-3.5" y1="0" x2="3.5" y2="0" stroke="#ffffff" strokeWidth="0.8" />
                    <line x1="0" y1="-3.5" x2="0" y2="3.5" stroke="#ffffff" strokeWidth="0.8" />
                  </g>
                  <g transform="translate(8, 3.5)" className={`animate-pano-wheel ${isPaused ? 'is-paused' : ''}`}>
                    <circle cx="0" cy="0" r="4.2" fill="#334155" stroke="#94a3b8" strokeWidth="1" />
                    <line x1="-3.5" y1="0" x2="3.5" y2="0" stroke="#ffffff" strokeWidth="0.8" />
                    <line x1="0" y1="-3.5" x2="0" y2="3.5" stroke="#ffffff" strokeWidth="0.8" />
                  </g>
                </g>
              </g>

              {/* Gangway Coupler 1 */}
              <g transform="translate(150, 358)">
                <rect x="0" y="0" width="8" height="28" fill="#0f172a" />
                <line x1="2.5" y1="0" x2="2.5" y2="28" stroke="#475569" strokeWidth="1" />
                <line x1="5.5" y1="0" x2="5.5" y2="28" stroke="#475569" strokeWidth="1" />
              </g>

              {/* COACH 1: PASSENGER AC CHAIR CAR */}
              <g transform="translate(158, 355)">
                <rect x="0" y="0" width="165" height="34" rx="3.5" fill="url(#panoTrainBlue)" />
                <rect x="0" y="8" width="165" height="2.2" fill="#f8fafc" />
                <rect x="0" y="26" width="165" height="2" fill="#facc15" />
                <rect x="2" y="-1.5" width="161" height="2.5" rx="1" className="fill-blue-950/70" />

                {/* Coach Passenger Windows with Traveler Silhouettes */}
                {[12, 32, 52, 72, 92, 112, 132].map((winX, idx) => (
                  <g key={idx}>
                    <rect x={winX} y="11" width="14" height="11.5" rx="2" fill="url(#panoWindowGlow)" filter="url(#panoGlow)" />
                    {idx % 2 === 0 && <circle cx={winX + 7} cy="17" r="3" fill="#78350f" opacity="0.65" />}
                    <rect x={winX} y="11" width="14" height="4.5" rx="1" fill="#ffffff" opacity="0.3" />
                  </g>
                ))}

                <rect x="68" y="23.5" width="30" height="3.5" rx="0.5" fill="#ffffff" />
                <text x="70" y="26.2" fontSize="3" fontWeight="bold" fill="#1e3a8a" fontFamily="monospace">JP - AII EXP</text>

                {/* Bogies */}
                <g transform="translate(26, 34)">
                  <rect x="-14" y="0" width="28" height="3.5" rx="1" fill="#1e293b" />
                  <g transform="translate(-8, 3.5)" className={`animate-pano-wheel ${isPaused ? 'is-paused' : ''}`}>
                    <circle cx="0" cy="0" r="4.2" fill="#334155" stroke="#94a3b8" strokeWidth="1" />
                    <line x1="-3.5" y1="0" x2="3.5" y2="0" stroke="#ffffff" strokeWidth="0.8" />
                    <line x1="0" y1="-3.5" x2="0" y2="3.5" stroke="#ffffff" strokeWidth="0.8" />
                  </g>
                  <g transform="translate(8, 3.5)" className={`animate-pano-wheel ${isPaused ? 'is-paused' : ''}`}>
                    <circle cx="0" cy="0" r="4.2" fill="#334155" stroke="#94a3b8" strokeWidth="1" />
                    <line x1="-3.5" y1="0" x2="3.5" y2="0" stroke="#ffffff" strokeWidth="0.8" />
                    <line x1="0" y1="-3.5" x2="0" y2="3.5" stroke="#ffffff" strokeWidth="0.8" />
                  </g>
                </g>

                <g transform="translate(138, 34)">
                  <rect x="-14" y="0" width="28" height="3.5" rx="1" fill="#1e293b" />
                  <g transform="translate(-8, 3.5)" className={`animate-pano-wheel ${isPaused ? 'is-paused' : ''}`}>
                    <circle cx="0" cy="0" r="4.2" fill="#334155" stroke="#94a3b8" strokeWidth="1" />
                    <line x1="-3.5" y1="0" x2="3.5" y2="0" stroke="#ffffff" strokeWidth="0.8" />
                    <line x1="0" y1="-3.5" x2="0" y2="3.5" stroke="#ffffff" strokeWidth="0.8" />
                  </g>
                  <g transform="translate(8, 3.5)" className={`animate-pano-wheel ${isPaused ? 'is-paused' : ''}`}>
                    <circle cx="0" cy="0" r="4.2" fill="#334155" stroke="#94a3b8" strokeWidth="1" />
                    <line x1="-3.5" y1="0" x2="3.5" y2="0" stroke="#ffffff" strokeWidth="0.8" />
                    <line x1="0" y1="-3.5" x2="0" y2="3.5" stroke="#ffffff" strokeWidth="0.8" />
                  </g>
                </g>
              </g>

              {/* Gangway Coupler 2 */}
              <g transform="translate(323, 358)">
                <rect x="0" y="0" width="8" height="28" fill="#0f172a" />
                <line x1="2.5" y1="0" x2="2.5" y2="28" stroke="#475569" strokeWidth="1" />
                <line x1="5.5" y1="0" x2="5.5" y2="28" stroke="#475569" strokeWidth="1" />
              </g>

              {/* LOCOMOTIVE: WAP-7 ROYAL BLUE ELECTRIC LOCO */}
              <g transform="translate(331, 353)">
                {/* Aerodynamic Cab Body */}
                <path
                  d="M0 4 C0 2 2 0 4 0 H 122 C 132 0 144 8 152 18 L 157 26 C 158 28 157 36 153 36 H 0 Z"
                  fill="url(#panoTrainBlue)"
                />
                <path d="M0 14 H 130 L 144 26 H 0 Z" fill="#f8fafc" opacity="0.95" />
                <path d="M0 17 H 132 L 146 27 H 0 Z" fill="#facc15" />

                {/* Cockpit Windshield */}
                <path
                  d="M125 3 H 133 C 138 3 143 8 147 14 L 140 14 C 134 7 130 5 125 3 Z"
                  fill="#38bdf8"
                  opacity="0.9"
                />
                <rect x="108" y="4" width="12" height="8" rx="1.5" fill="#0284c7" opacity="0.8" />
                <circle cx="114" cy="8" r="2.4" fill="#f8fafc" opacity="0.75" />

                {/* High-Voltage Roof Pantograph (Reaches up to contact wire at y=302 => rel y=-51) */}
                <g transform="translate(42, 0)">
                  <rect x="2" y="-3" width="7" height="3" fill="#ef4444" rx="0.5" />
                  <rect x="36" y="-3" width="7" height="3" fill="#ef4444" rx="0.5" />
                  <line x1="5" y1="-3" x2="20" y2="-26" stroke="#94a3b8" strokeWidth="2" />
                  <line x1="39" y1="-3" x2="24" y2="-26" stroke="#94a3b8" strokeWidth="2" />
                  <line x1="20" y1="-26" x2="22" y2="-51" stroke="#cbd5e1" strokeWidth="2" />
                  <line x1="24" y1="-26" x2="22" y2="-51" stroke="#cbd5e1" strokeWidth="2" />
                  <rect x="12" y="-52" width="20" height="2.5" rx="1" fill="#f1f5f9" />

                  {/* Electric Spark glint at wire contact */}
                  <g transform="translate(22, -51)" className="animate-pano-spark">
                    <path d="M0 -4 L1.5 -1.5 L4 0 L1.5 1.5 L0 4 L-1.5 1.5 L-4 0 L-1.5 -1.5 Z" fill="#67e8f9" filter="url(#panoGlow)" />
                  </g>
                </g>

                {/* Locomotive Stencils */}
                <text x="18" y="24" fontSize="5.5" fontWeight="extrabold" fill="#ffffff" fontFamily="monospace">WAP-7 • 30201</text>
                <text x="18" y="30" fontSize="4.2" fontWeight="bold" fill="#fef08a" fontFamily="monospace">NWR • JAIPUR</text>

                {/* Dual Headlight & Forward Glow Beam */}
                <rect x="151" y="24" width="5.5" height="5.5" rx="1.5" fill="#fef08a" filter="url(#panoGlow)" />
                <circle cx="153.5" cy="26.8" r="2" fill="#ffffff" />

                {/* Forward Light Beam illuminating track ahead */}
                <polygon
                  points="155,25 380,15 400,50 155,30"
                  fill="url(#panoHeadlight)"
                  className="opacity-75 dark:opacity-95"
                />

                {/* Heavy Duty 3-Axle Locomotive Bogies */}
                <g transform="translate(112, 36)">
                  <rect x="-24" y="0" width="48" height="3.5" rx="1" fill="#0f172a" />
                  {[-14, 0, 14].map((offset, idx) => (
                    <g key={idx} transform={`translate(${offset}, 3.5)`} className={`animate-pano-wheel ${isPaused ? 'is-paused' : ''}`}>
                      <circle cx="0" cy="0" r="4.5" fill="#1e293b" stroke="#cbd5e1" strokeWidth="1.2" />
                      <line x1="-3.8" y1="0" x2="3.8" y2="0" stroke="#ffffff" strokeWidth="0.8" />
                      <line x1="0" y1="-3.8" x2="0" y2="3.8" stroke="#ffffff" strokeWidth="0.8" />
                    </g>
                  ))}
                </g>

                <g transform="translate(38, 36)">
                  <rect x="-24" y="0" width="48" height="3.5" rx="1" fill="#0f172a" />
                  {[-14, 0, 14].map((offset, idx) => (
                    <g key={idx} transform={`translate(${offset}, 3.5)`} className={`animate-pano-wheel ${isPaused ? 'is-paused' : ''}`}>
                      <circle cx="0" cy="0" r="4.5" fill="#1e293b" stroke="#cbd5e1" strokeWidth="1.2" />
                      <line x1="-3.8" y1="0" x2="3.8" y2="0" stroke="#ffffff" strokeWidth="0.8" />
                      <line x1="0" y1="-3.8" x2="0" y2="3.8" stroke="#ffffff" strokeWidth="0.8" />
                    </g>
                  ))}
                </g>

                {/* Cattle Guard */}
                <polygon points="152,36 162,37 154,30" fill="#0f172a" />
              </g>

            </g>
          </g>
        </g>
      </svg>
      </div>

      {/* 2. MINIMAL FLOATING CONTROLS (Top Right of Sky) */}
      <div className="absolute top-3 right-4 sm:right-8 z-30 flex items-center gap-2 opacity-70 hover:opacity-100 transition-opacity">
        <button
          onClick={handleHonk}
          title="Sound Train Horn"
          className="p-1 px-2.5 rounded-full bg-white/75 dark:bg-slate-800/80 backdrop-blur-xs border border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-sky-300 text-xs flex items-center gap-1 transition-all cursor-pointer shadow-xs hover:scale-105 active:scale-95"
        >
          <Volume2 className="w-3.5 h-3.5 text-indigo-600 dark:text-sky-400" />
          <span className="font-mono text-[11px] font-semibold">Honk</span>
        </button>

        <button
          onClick={() => setIsPaused(!isPaused)}
          title={isPaused ? "Resume Animation" : "Pause Animation"}
          className="p-1.5 rounded-full bg-white/75 dark:bg-slate-800/80 backdrop-blur-xs border border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-sky-400 text-xs transition-all cursor-pointer shadow-xs hover:scale-105 active:scale-95"
        >
          {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Honk Speech Bubble when horn clicked */}
      {showHonk && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 animate-bounce bg-blue-600 dark:bg-sky-500 text-white font-mono text-xs font-bold px-3.5 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 pointer-events-none">
          <span>🔊 POO-POOO-POOT!</span>
          <span className="text-[10px] opacity-80 font-normal">(WAP-7 High-Chime)</span>
        </div>
      )}

      {/* 3. FOREGROUND CONTENT IN THE SKY (Typography) */}
      <div className="relative z-20 w-full pointer-events-auto">
        {children}
      </div>
    </div>
  );
};
