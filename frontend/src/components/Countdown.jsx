'use client';

import { useState, useEffect } from 'react';

export default function Countdown({ unlockDate }) {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());
  const [prevTimeLeft, setPrevTimeLeft] = useState(timeLeft);

  function calculateTimeLeft() {
    const difference = new Date(unlockDate).getTime() - Date.now();
    
    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
    }

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / (1000 * 60)) % 60),
      seconds: Math.floor((difference / 1000) % 60),
      isExpired: false,
    };
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setPrevTimeLeft(timeLeft);
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  if (timeLeft.isExpired) {
    return (
      <div className="text-center">
        <p className="text-green-600 font-semibold text-xl">🔓 Capsule Unlocked!</p>
      </div>
    );
  }

  const timeUnits = [
    { label: 'Days', value: timeLeft.days, prevValue: prevTimeLeft.days },
    { label: 'Hours', value: timeLeft.hours, prevValue: prevTimeLeft.hours },
    { label: 'Min', value: timeLeft.minutes, prevValue: prevTimeLeft.minutes },
    { label: 'Sec', value: timeLeft.seconds, prevValue: prevTimeLeft.seconds },
  ];

  return (
    <div className="flex justify-center gap-3">
      {timeUnits.map((unit, index) => (
        <div key={unit.label} className="flex flex-col items-center">
          <div 
            className={`
              bg-white border border-gray-200 rounded-xl shadow-sm
              w-16 h-16 flex items-center justify-center
              transition-transform duration-200
              ${unit.value !== unit.prevValue ? 'scale-105' : ''}
            `}
          >
            <span className="text-2xl font-bold text-gray-900">
              {String(unit.value).padStart(2, '0')}
            </span>
          </div>
          <span className="text-xs text-gray-500 mt-2 font-medium">
            {unit.label}
          </span>
        </div>
      ))}
    </div>
  );
}