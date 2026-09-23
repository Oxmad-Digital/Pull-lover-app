"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";
import "./HeaderHero.css";

gsap.registerPlugin(SplitText);

function useDropSettings() {
  const [dropDate, setDropDate] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [badgeText, setBadgeText] = useState(null);
  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        setDropDate(data.dropDate ? new Date(data.dropDate) : null);
        setStartDate(data.startDate ? new Date(data.startDate) : null);
        setBadgeText(data.badgeText ?? "");
      })
      .catch(() => {});
  }, []);
  return { dropDate, startDate, badgeText };
}

function useCountdown(target) {
  const calc = () => {
    if (!target) return null;
    const diff = Math.max(0, target - Date.now());
    return {
      days: Math.floor(diff / 86400000),
      hours: Math.floor((diff % 86400000) / 3600000),
      minutes: Math.floor((diff % 3600000) / 60000),
    };
  };
  const [time, setTime] = useState(null);
  useEffect(() => {
    if (!target) return;
    setTime(calc());
    const id = setInterval(() => {
      const next = calc();
      setTime(next);
      if (next.days === 0 && next.hours === 0 && next.minutes === 0) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [target]);
  return time;
}

function useProgress(dropDate, startDate) {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    if (!dropDate || !startDate) return;
    const calc = () => {
      const total = dropDate - startDate;
      const elapsed = Math.min(Date.now() - startDate, total);
      return Math.max(0, Math.min(100, (elapsed / total) * 100));
    };
    const id = setTimeout(() => setProgress(calc()), 200);
    return () => clearTimeout(id);
  }, [dropDate, startDate]);
  return progress;
}

function DigitGroupBar({ value, label }) {
  const str = value != null ? String(value).padStart(2, "0") : "00";
  return (
    <div className="hcb-group">
      <div className="hcb-boxes">
        <span className="hcb-box">{str[0]}</span>
        <span className="hcb-box">{str[1]}</span>
      </div>
      <span className="hcb-label">{label}</span>
    </div>
  );
}

export default function HeaderHero() {
  const [showBadge, setShowBadge] = useState(true);
  const sectionRef = useRef(null);
  const titleRef = useRef(null);
  const subRef = useRef(null);
  const { dropDate, startDate, badgeText } = useDropSettings();
  const time = useCountdown(dropDate);
  const progress = useProgress(dropDate, startDate);
  const { days = 0, hours = 0, minutes = 0 } = time ?? {};
  const isExpired = time !== null && days === 0 && hours === 0 && minutes === 0;

  useEffect(() => {
    if (!titleRef.current || !subRef.current) return;

    const letters = titleRef.current.querySelectorAll(".hero-letter");
    const subSplit = SplitText.create(subRef.current, { type: "words" });

    const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

    tl.from(letters, { y: 100, autoAlpha: 0, stagger: 0.05, duration: 1 })
      .from(subSplit.words, { y: 30, autoAlpha: 0, stagger: 0.04, duration: 0.7 }, "-=0.5")
      .from(".hero-cta", { autoAlpha: 0, y: 20, duration: 0.6 }, "-=0.4");

    const badge = document.querySelector(".hero-badge");
    const countdownBar = document.querySelector(".hero-countdown-bar");
    if (badge) tl.from(badge, { autoAlpha: 0, y: -20, duration: 0.5 }, "-=0.4");
    if (countdownBar) tl.from(countdownBar, { autoAlpha: 0, y: 20, duration: 0.5 }, "-=0.3");

    return () => {
      tl.kill();
      subSplit.revert();
    };
  }, []);

  return (
    <section className="hero-section" ref={sectionRef}>

      <div className="hero-container">
        <div className="hero-content-left">
          <h1 className="hero-title" ref={titleRef}>
            <span className="bold">
              {"Pull".split("").map((char, i) => (
                <span key={i} className="hero-letter">{char}</span>
              ))}
            </span>
            <span className="script">
              {"Lover".split("").map((char, i) => (
                <span key={i} className="hero-letter">{char}</span>
              ))}
            </span>
          </h1>
          <p className="hero-sub" ref={subRef}>
            Eo adducta re per Isauriam, rege Persarum bellis finitimis
          </p>
          <Link href="/#piece" className="hero-cta">
            Je précommande
          </Link>
        </div>

        <div className="hero-content-right">
          {showBadge && badgeText && (
            <div className="hero-badge">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="badge-icon">
                <path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6981 21.5547 10.4458 21.3031 10.27 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>{badgeText}</span>
              <button onClick={() => setShowBadge(false)} className="badge-close" aria-label="Fermer la notification">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" fill="currentColor" />
                  <path d="M8 12H16" stroke="black" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="social-vertical">
        <span className="follow-label">Suivez-nous</span>
        <div className="social-line" />
        <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M7 2H17C19.7614 2 22 4.23858 22 7V17C22 19.7614 19.7614 22 17 22H7C4.23858 22 2 19.7614 2 17V7C2 4.23858 4.23858 2 7 2ZM7 4C5.34315 4 4 5.34315 4 7V17C4 18.6569 5.34315 20 7 20H17C18.6569 20 20 18.6569 20 17V7C20 5.34315 18.6569 4 17 4H7ZM12 7C14.7614 7 17 9.23858 17 12C17 14.7614 14.7614 17 12 17C9.23858 17 7 14.7614 7 12C7 9.23858 9.23858 7 12 7ZM12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9ZM17.5 5.25C17.9142 5.25 18.25 5.58579 18.25 6C18.25 6.41421 17.9142 6.75 17.5 6.75C17.0858 6.75 16.75 6.41421 16.75 6C16.75 5.58579 17.0858 5.25 17.5 5.25Z" fill="currentColor" />
          </svg>
        </a>
        <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2ZM14.85 10H12.5V8.815C12.5 8.169 12.825 7.75 13.627 7.75H14.85V6H13.25C11.511 6 10.5 6.947 10.5 8.5V10H9V12H10.5V18H12.5V12H14.522L14.85 10Z" fill="currentColor" />
          </svg>
        </a>
      </div>

      <div className="made-with-love">100% made with love</div>

      {!isExpired && dropDate && (
        <div className="hero-countdown-bar">
          <span className="hcb-title">Nouveau drop en cours</span>
          <div className="hcb-sep" />
          <div className="hcb-counter">
            <DigitGroupBar value={days} label="Jours" />
            <span className="hcb-colon">:</span>
            <DigitGroupBar value={hours} label="Heures" />
            <span className="hcb-colon">:</span>
            <DigitGroupBar value={minutes} label="Min" />
          </div>
          <div className="hcb-sep" />
          <div className="hcb-progress-track">
            <div className="hcb-progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

    </section>
  );
}
