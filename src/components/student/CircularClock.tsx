import React, { useEffect, useState } from 'react';
import { Clock, Snowflake, Play } from 'lucide-react';

interface CircularClockProps {
  totalSeconds: number;
  secondsRemaining: number;
  isRunning: boolean;
  isFrozen: boolean;
}

export const CircularClock: React.FC<CircularClockProps> = ({
  totalSeconds,
  secondsRemaining,
  isRunning,
  isFrozen,
}) => {
  // Current real-time clock angles for smooth analog display
  // When exam is active, we tick every second
  const [currentSecondsAngle, setCurrentSecondsAngle] = useState(0);
  const [currentMinutesAngle, setCurrentMinutesAngle] = useState(0);
  const [currentHoursAngle, setCurrentHoursAngle] = useState(0);

  useEffect(() => {
    // If frozen, do not update hands further
    if (isFrozen) return;

    // Calculate time elapsed
    const elapsedSeconds = Math.max(0, totalSeconds - secondsRemaining);
    
    // We can show the time elapsed on the analog face starting from 12:00 or current wall-clock
    // Showing exam elapsed time or active ticking gives clear physical feedback
    const sec = elapsedSeconds % 60;
    const min = Math.floor(elapsedSeconds / 60) % 60;
    const hr = Math.floor(elapsedSeconds / 3600) % 12;

    const secAngle = sec * 6; // 360 / 60 = 6 deg per second
    const minAngle = (min * 6) + (sec * 0.1); // 6 deg per min + smooth fraction
    const hrAngle = (hr * 30) + (min * 0.5); // 30 deg per hour + smooth fraction

    setCurrentSecondsAngle(secAngle);
    setCurrentMinutesAngle(minAngle);
    setCurrentHoursAngle(hrAngle);
  }, [secondsRemaining, totalSeconds, isFrozen]);

  // Percentage of time remaining for circular ring
  const percentRemaining = Math.max(0, Math.min(100, (secondsRemaining / Math.max(1, totalSeconds)) * 100));
  const radius = 94;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentRemaining / 100) * circumference;

  // Format digital display
  const displayMins = Math.floor(secondsRemaining / 60);
  const displaySecs = secondsRemaining % 60;
  const digitalTime = `${displayMins.toString().padStart(2, '0')}:${displaySecs.toString().padStart(2, '0')}`;

  // Ring color depending on remaining time
  let ringColor = '#4f46e5'; // Indigo
  if (percentRemaining < 15) {
    ringColor = '#e11d48'; // Rose/Red
  } else if (percentRemaining < 35) {
    ringColor = '#d97706'; // Amber
  } else if (isFrozen) {
    ringColor = '#38bdf8'; // Ice blue
  }

  // Generate tick marks (60 ticks)
  const ticks = Array.from({ length: 60 }).map((_, i) => {
    const isHour = i % 5 === 0;
    const angle = i * 6 * (Math.PI / 180);
    const innerR = isHour ? 78 : 83;
    const outerR = 88;
    const x1 = 110 + innerR * Math.sin(angle);
    const y1 = 110 - innerR * Math.cos(angle);
    const x2 = 110 + outerR * Math.sin(angle);
    const y2 = 110 - outerR * Math.cos(angle);

    return (
      <line
        key={i}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={isHour ? '#334155' : '#94a3b8'}
        strokeWidth={isHour ? 2.5 : 1}
        strokeLinecap="round"
      />
    );
  });

  // Hour numerals (12, 1, 2, ... 11)
  const hourNumerals = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((num) => {
    const angle = num * 30 * (Math.PI / 180);
    const textRadius = 66;
    const x = 110 + textRadius * Math.sin(angle);
    const y = 110 - textRadius * Math.cos(angle);

    return (
      <text
        key={num}
        x={x}
        y={y + 4}
        textAnchor="middle"
        fontSize="10.5"
        fontWeight="700"
        fill={num % 3 === 0 ? '#1e293b' : '#64748b'}
        className="select-none font-sans"
      >
        {num}
      </text>
    );
  });

  return (
    <div
      id="circular-analog-clock-container"
      className={`rounded-2xl p-4 border transition-all flex flex-col items-center justify-center relative overflow-hidden ${
        isFrozen
          ? 'bg-sky-50/80 border-sky-300 shadow-md ring-2 ring-sky-200'
          : 'bg-white border-slate-200 shadow-sm'
      }`}
    >
      {/* Frozen Badge Banner if expired */}
      {isFrozen && (
        <div className="absolute top-2 left-0 right-0 z-20 flex justify-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-sky-100 border border-sky-300 text-sky-800 text-[11px] font-bold shadow-xs animate-pulse">
            <Snowflake className="w-3.5 h-3.5 text-sky-600" />
            Clock Frozen • Exam Ended
          </span>
        </div>
      )}

      {/* Header Label */}
      <div className="w-full flex items-center justify-between mb-2">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <Clock className={`w-3.5 h-3.5 ${isFrozen ? 'text-sky-600' : 'text-indigo-600'}`} />
          Exam Analog Clock
        </span>
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
            isFrozen
              ? 'bg-sky-200/70 text-sky-900'
              : isRunning
              ? 'bg-emerald-100 text-emerald-800 animate-pulse'
              : 'bg-slate-100 text-slate-600'
          }`}
        >
          {isFrozen ? 'Frozen' : isRunning ? 'Hands Active' : 'Ready'}
        </span>
      </div>

      {/* SVG Analog Clock Face */}
      <div className="relative w-56 h-56 flex items-center justify-center select-none my-1">
        <svg
          viewBox="0 0 220 220"
          className="w-full h-full drop-shadow-sm"
          style={{ transform: 'rotate(0deg)' }}
        >
          <defs>
            {/* Gradient for clock bezel */}
            <radialGradient id="clockBezelGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="88%" stopColor="#f8fafc" />
              <stop offset="100%" stopColor="#e2e8f0" />
            </radialGradient>
            
            {/* Frost pattern if frozen */}
            <linearGradient id="frostGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#e0f2fe" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#bae6fd" stopOpacity="0.4" />
            </linearGradient>

            {/* Shadow filter for hands */}
            <filter id="handShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="1" dy="1.5" stdDeviation="1" floodColor="#0f172a" floodOpacity="0.25" />
            </filter>
          </defs>

          {/* Outer Bezel Rim */}
          <circle
            cx="110"
            cy="110"
            r="104"
            fill="none"
            stroke="#cbd5e1"
            strokeWidth="3"
          />

          {/* Time Remaining Circular Progress Arc */}
          <circle
            cx="110"
            cy="110"
            r={radius}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth="7"
          />
          <circle
            cx="110"
            cy="110"
            r={radius}
            fill="none"
            stroke={ringColor}
            strokeWidth="7"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform="rotate(-90 110 110)"
            className="transition-all duration-1000 ease-linear"
          />

          {/* Inner Clock Face Background */}
          <circle
            cx="110"
            cy="110"
            r="88"
            fill="url(#clockBezelGradient)"
            stroke="#e2e8f0"
            strokeWidth="1.5"
          />

          {/* Frost overlay if frozen */}
          {isFrozen && (
            <circle
              cx="110"
              cy="110"
              r="88"
              fill="url(#frostGradient)"
            />
          )}

          {/* 60 Ticks */}
          {ticks}

          {/* 12 Hour Numerals */}
          {hourNumerals}

          {/* Brand/Watermark Text in Dial */}
          <text
            x="110"
            y="94"
            textAnchor="middle"
            fontSize="8"
            fontWeight="700"
            letterSpacing="0.08em"
            fill="#94a3b8"
            className="uppercase"
          >
            EXAM TIMER
          </text>

          {/* ================= CLOCK HANDS ================= */}
          {/* 1. Hour Hand */}
          <g
            transform={`rotate(${currentHoursAngle} 110 110)`}
            filter="url(#handShadow)"
            className={isFrozen ? 'transition-none' : 'transition-transform duration-300 ease-out'}
          >
            <line
              x1="110"
              y1="118"
              x2="110"
              y2="64"
              stroke="#0f172a"
              strokeWidth="4.5"
              strokeLinecap="round"
            />
          </g>

          {/* 2. Minute Hand */}
          <g
            transform={`rotate(${currentMinutesAngle} 110 110)`}
            filter="url(#handShadow)"
            className={isFrozen ? 'transition-none' : 'transition-transform duration-300 ease-out'}
          >
            <line
              x1="110"
              y1="122"
              x2="110"
              y2="42"
              stroke="#334155"
              strokeWidth="3.2"
              strokeLinecap="round"
            />
          </g>

          {/* 3. Second Hand (Smooth moving red/rose needle) */}
          <g
            transform={`rotate(${currentSecondsAngle} 110 110)`}
            filter="url(#handShadow)"
            className={isFrozen ? 'transition-none' : 'transition-transform duration-200 ease-linear'}
          >
            {/* Counterbalance tail */}
            <line
              x1="110"
              y1="128"
              x2="110"
              y2="110"
              stroke="#e11d48"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {/* Needle pointer */}
            <line
              x1="110"
              y1="110"
              x2="110"
              y2="30"
              stroke="#e11d48"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            {/* Small red pip on needle */}
            <circle cx="110" cy="46" r="3" fill="#e11d48" />
          </g>

          {/* Center Pivot Pin & Cap */}
          <circle cx="110" cy="110" r="5" fill="#0f172a" />
          <circle cx="110" cy="110" r="2.2" fill="#f8fafc" />
        </svg>
      </div>

      {/* Digital Readout & Status Below Dial */}
      <div className="text-center mt-2 w-full">
        <div
          className={`font-mono text-xl font-black tracking-wider ${
            isFrozen
              ? 'text-sky-900'
              : percentRemaining < 15
              ? 'text-rose-600 animate-pulse'
              : 'text-slate-800'
          }`}
        >
          {digitalTime}
        </div>
        <p className="text-[11px] font-medium text-slate-500 mt-0.5">
          {isFrozen
            ? 'Timer completed • Questions locked'
            : isRunning
            ? 'Hands in motion as you answer'
            : 'Click start to begin'}
        </p>
      </div>
    </div>
  );
};
