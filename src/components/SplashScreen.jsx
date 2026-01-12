import React, { useEffect, useState } from 'react';

const SplashScreen = ({ onComplete }) => {
    const [progress, setProgress] = useState(0);
    const [textIndex, setTextIndex] = useState(0);

    const messages = [
        "INITIALIZING SPACELINK...",
        "ESTABLISHING SECURE CONNECTION...",
        "CALIBRATING DISH TELEMETRY...",
        "ANALYZING ORBITAL DATA...",
        "SYSTEMS NOMINAL."
    ];

    useEffect(() => {
        // Progress bar simulation
        const timer = setInterval(() => {
            setProgress(old => {
                if (old >= 100) {
                    clearInterval(timer);
                    return 100;
                }
                // Random increment for "hacking" feel
                return Math.min(old + Math.random() * 5, 100);
            });
        }, 100);

        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        // Text cycling
        if (progress < 100) {
            const msgTimer = setInterval(() => {
                setTextIndex(i => (i + 1) % (messages.length - 1));
            }, 800);
            return () => clearInterval(msgTimer);
        } else {
            setTextIndex(messages.length - 1); // "SYSTEMS NOMINAL"
            setTimeout(onComplete, 800); // Wait a bit before closing
        }
    }, [progress]);

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: '#050505',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            fontFamily: "'Courier New', monospace",
            color: '#00ff88'
        }}>
            {/* HUD Grid Background */}
            <div style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: 'linear-gradient(rgba(0, 255, 136, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 136, 0.05) 1px, transparent 1px)',
                backgroundSize: '20px 20px',
                pointerEvents: 'none'
            }}></div>

            <div style={{ width: '400px', position: 'relative', zIndex: 10 }}>
                {/* Terminal Output */}
                <div style={{
                    height: '60px',
                    marginBottom: '20px',
                    fontSize: '0.9rem',
                    borderLeft: '2px solid #00ff88',
                    paddingLeft: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    textShadow: '0 0 5px rgba(0,255,136,0.5)'
                }}>
                    &gt; {messages[textIndex]}<span className="blink">_</span>
                </div>

                {/* Loading Bar */}
                <div style={{
                    height: '6px',
                    background: 'rgba(0, 255, 136, 0.2)',
                    borderRadius: '2px',
                    overflow: 'hidden',
                    marginBottom: '20px',
                    boxShadow: '0 0 10px rgba(0, 255, 136, 0.1)'
                }}>
                    <div style={{
                        height: '100%',
                        width: `${progress}%`,
                        background: '#00ff88',
                        boxShadow: '0 0 15px #00ff88',
                        transition: 'width 0.1s linear'
                    }}></div>
                </div>

                {/* Radar Decoration */}
                <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    border: '1px solid rgba(0,255,136,0.3)',
                    position: 'absolute',
                    right: '-40px',
                    bottom: '-40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <div style={{
                        width: '100%', height: '100%',
                        background: 'conic-gradient(from 0deg, transparent 0deg, rgba(0,255,136,0.5) 360deg)',
                        borderRadius: '50%',
                        animation: 'spin 2s linear infinite',
                        opacity: 0.5
                    }}></div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', opacity: 0.7 }}>
                    <span>MEM: {Math.floor(progress * 102)} MB</span>
                    <span>CPU: {Math.floor(progress * 0.8)}%</span>
                </div>

            </div>

            <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .blink { animation: blink 1s step-end infinite; }
        @keyframes blink { 50% { opacity: 0; } }
      `}</style>
        </div>
    );
};

export default SplashScreen;
