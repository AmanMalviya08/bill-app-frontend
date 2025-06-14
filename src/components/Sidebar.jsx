import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Sidebar = () => {
  // Track active link for highlight effect
  const [activeLink, setActiveLink] = useState('/dashboard');
  // Animation for links sliding in
  const [animationComplete, setAnimationComplete] = useState(false);
  // Hover states for links
  const [hoveredLink, setHoveredLink] = useState(null);
  // Pulse animation for logo
  const [isPulsing, setIsPulsing] = useState(false);
  // Toggle menu state for mobile
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Set active link based on current path
  useEffect(() => {
    const currentPath = window.location.pathname;
    setActiveLink(currentPath);
  }, []);

  // Trigger the slide-in animation for nav items
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationComplete(true);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // Pulse animation for logo
  useEffect(() => {
    const interval = setInterval(() => {
      setIsPulsing(prev => !prev);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Navigation links with their paths and icons
  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    // { path: '/companies', label: 'Companies', icon: '🏢' },
    // { path: '/branches', label: 'Branches', icon: '🏛️' }
  ];

  // Main navigation bar styles
  const navbarStyle = {
    backgroundColor: '#1a3480',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
    transition: 'all 0.3s ease',
    borderRadius: '10px',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    margin: '15px'
  };

  // Brand logo styles with pulse animation
  const brandStyle = {
    fontWeight: 'bold',
    fontSize: '1.3rem',
    letterSpacing: '0.5px',
    transition: 'all 0.3s ease',
    transform: isPulsing ? 'scale(1.05)' : 'scale(1)',
    textShadow: isPulsing ? '0 0 8px rgba(255, 255, 255, 0.7)' : 'none'
  };

  // Custom hamburger menu icon styles
  const hamburgerStyle = {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-around',
    width: '24px',
    height: '24px',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '0',
    boxSizing: 'border-box'
  };

  const hamburgerLineStyle = {
    width: '24px',
    height: '3px',
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    transition: 'all 0.3s linear'
  };

  // Helper function to determine if a link is active
  const isActive = (path) => {
    return path === activeLink;
  };

  // Style for navigation links
  const getLinkStyle = (path) => {
    const active = isActive(path);
    const hovered = hoveredLink === path;
    
    return {
      color: 'white',
      position: 'relative',
      padding: '0.7rem 1rem',
      margin: '0 0.3rem',
      borderRadius: '6px',
      transition: 'all 0.3s ease',
      backgroundColor: active ? 'rgba(255, 255, 255, 0.2)' : 
                     hovered ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
      transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
      opacity: animationComplete ? 1 : 0,
      fontWeight: active ? 'bold' : 'normal'
    };
  };

  // Animation for list items
  const getItemStyle = (index) => {
    return {
      transform: animationComplete ? 'translateX(0)' : 'translateX(20px)',
      opacity: animationComplete ? 1 : 0,
      transition: `all 0.5s ease ${0.1 * index}s`
    };
  };

  // Logout button style
  const logoutButtonStyle = {
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderWidth: '2px',
    fontWeight: 'bold',
    transition: 'all 0.3s ease',
    opacity: animationComplete ? 1 : 0,
    transform: animationComplete ? 'translateX(0)' : 'translateX(20px)',
    transitionDelay: '0.4s'
  };

  // Toggle the mobile menu
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="navbar navbar-expand-lg" style={navbarStyle}>
      <div className="container-fluid">
        <Link 
          className="navbar-brand text-white" 
          to="#" 
          style={brandStyle}
          onMouseEnter={() => setIsPulsing(true)}
          onMouseLeave={() => setIsPulsing(false)}
        >
          <span style={{ marginRight: '8px' }}>💼</span>
          Billing Dashboard
        </Link>
        
        <button
          className="navbar-toggler"
          type="button"
          onClick={toggleMenu}
          aria-controls="navbarNav"
          aria-expanded={isMenuOpen}
          aria-label="Toggle navigation"
          style={{ border: '1px solid rgba(255,255,255,0.5)' }}
        >
          <div style={hamburgerStyle}>
            <div style={hamburgerLineStyle}></div>
            <div style={hamburgerLineStyle}></div>
            <div style={hamburgerLineStyle}></div>
          </div>
        </button>
        
        <div className={`collapse navbar-collapse ${isMenuOpen ? 'show' : ''}`} id="navbarNav">
          <ul className="navbar-nav ms-auto">
            {navItems.map((item, index) => (
              <li className="nav-item" key={item.path} style={getItemStyle(index)}>
                <Link 
                  className="nav-link d-flex align-items-center" 
                  to={item.path}
                  style={getLinkStyle(item.path)}
                  onClick={() => {
                    setActiveLink(item.path);
                    setIsMenuOpen(false); // Close menu when item is clicked
                  }}
                  onMouseEnter={() => setHoveredLink(item.path)}
                  onMouseLeave={() => setHoveredLink(null)}
                >
                  <span style={{ marginRight: '5px' }}>{item.icon}</span>
                  {item.label}
                  {isActive(item.path) && (
                    <span 
                      style={{
                        position: 'absolute',
                        bottom: '0',
                        left: '50%',
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: 'white',
                        transform: 'translateX(-50%)',
                        boxShadow: '0 0 10px rgba(255, 255, 255, 0.8)'
                      }}
                    />
                  )}
                </Link>
              </li>
            ))}
            <li className="nav-item" style={{ marginLeft: '10px' }}>
              <button 
                className="btn btn-outline-light" 
                disabled
                style={logoutButtonStyle}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                }}
              >
                <span style={{ marginRight: '5px' }}>🔒</span>
                Logout
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Sidebar;