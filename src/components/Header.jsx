import React, { useState, useEffect, useRef } from 'react';
import '../App.css';

const Header = () => {
  const [isAnimating, setIsAnimating] = useState(true); // Set to true by default
  const [glowColor, setGlowColor] = useState('#4287f5');
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const headerRef = useRef(null);
  
  const colors = ['#4287f5', '#42f5b3', '#f542a1', '#f5d442', '#ff00ff', '#00ffff'];
  const [colorIndex, setColorIndex] = useState(0);
  
  const fullText = 'Billing Management System';
  
  const handleMouseMove = (e) => {
    if (headerRef.current) {
      const { left, top, width, height } = headerRef.current.getBoundingClientRect();
      const x = (e.clientX - left) / width - 0.5;
      const y = (e.clientY - top) / height - 0.5;
      setMousePosition({ x, y });
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setColorIndex((prevIndex) => (prevIndex + 1) % colors.length);
      setGlowColor(colors[colorIndex]);
    }, 1500);
    
    return () => clearInterval(interval);
  }, [isAnimating, colorIndex, colors]);

  const headerStyle = {
    backgroundColor: '#0f2480',
    boxShadow: `0 0 25px ${glowColor}, 0 10px 30px rgba(0,0,0,0.5)`,
    transition: 'all 0.3s ease-out',
    borderRadius: '15px',
    transform: `
      perspective(1000px)
      rotateX(${mousePosition.y * 15}deg)
      rotateY(${mousePosition.x * 15}deg)
      scale(${1 + Math.abs(mousePosition.x) * 0.05})
    `,
    transformStyle: 'preserve-3d',
    position: 'relative',
    overflow: 'hidden',
    margin: '5px 20px',
    width: 'calc(100% - 3rem)',
  };

  const titleStyle = {
    color: 'white',
    margin: "10px 0",
    textAlign: 'center',
    fontFamily: '"Segoe UI", Arial, sans-serif',
    fontWeight: 700,
    letterSpacing: '2px',
    position: 'relative',
    display: 'block',
    textShadow: `
      0 0 15px ${glowColor},
      0 0 20px ${glowColor},
      0 0 30px ${glowColor},
      0 5px 0 rgba(0,0,0,0.3),
      0 10px 10px rgba(0,0,0,0.2)
    `,
    transition: 'all 0.5s ease-out',
    transform: `
      translateZ(30px)
      rotateX(${mousePosition.y * -5}deg)
      rotateY(${mousePosition.x * -5}deg)
    `,
    animation: isAnimating ? 'pulse 2s infinite alternate' : 'none',
    width: '100%',
  };

  const particles = Array.from({ length: 20 }).map((_, i) => ({
    id: i,
    size: Math.random() * 5 + 2,
    x: Math.random() * 100,
    y: Math.random() * 100,
    speed: Math.random() * 2 + 1,
    delay: Math.random() * 5,
    color: colors[Math.floor(Math.random() * colors.length)],
  }));

  return (
    <header 
      ref={headerRef}
      style={headerStyle}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setMousePosition({ x: 0, y: 0 })}
      className="funky-header"
    >
      {particles.map((particle) => (
        <div 
          key={particle.id}
          className="particle"
          style={{
            position: 'absolute',
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            background: particle.color,
            borderRadius: '50%',
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            opacity: 0.6,
            animation: `float ${particle.speed}s ease-in-out ${particle.delay}s infinite alternate`,
            transform: 'translateZ(10px)',
          }}
        />
      ))}
      
      <div style={{ 
        position: 'relative', 
        zIndex: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '150px'
      }}>
        <h1 style={titleStyle}>{fullText}</h1>
        <div 
          className="subtitle"
          style={{
            color: 'rgba(255,255,255,0.8)',
            textAlign: 'center',
            textShadow: `0 0 5px ${glowColor}`,
            transform: 'translateZ(20px)',
            animation: 'fadeIn 2s both',
            marginTop: '1rem',
            width: '100%'
          }}
        >
        </div>
      </div>
      
      <div className="edge edge-top"></div>
      <div className="edge edge-right"></div>
      <div className="edge edge-bottom"></div>
      <div className="edge edge-left"></div>
    </header>
  );
};

export default Header;