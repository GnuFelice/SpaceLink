import React from 'react';
import '../index.css';

const MainLayout = ({ children }) => {
    return (
        <div className="app-container" style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            background: 'radial-gradient(circle at top right, #1a253a 0%, var(--bg-deep) 40%)'
        }}>
            {/* Title Bar Area (Draggable) */}
            <header style={{
                height: 'var(--header-height)',
                WebkitAppRegion: 'drag', // Electron drag
                display: 'flex',
                alignItems: 'center',
                padding: '0 16px',
                borderBottom: '1px solid var(--border-glass)',
                backgroundColor: 'rgba(10, 14, 23, 0.8)',
                backdropFilter: 'var(--glass-blur)'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontWeight: 'bold',
                    letterSpacing: '1px',
                    color: 'var(--accent-cyan)',
                    textShadow: 'var(--neon-glow)'
                }}>
                    <span style={{ fontSize: '1.2rem' }}>✦</span> SPACELINK
                </div>
            </header>

            {/* Main Content */}
            <main style={{
                flex: 1,
                overflow: 'auto',
                position: 'relative',
                padding: '20px'
            }}>
                {children}
            </main>
        </div>
    );
};

export default MainLayout;
