import React from 'react';

const Menu = ({ onClose }) => {
  return (
    <div className="menu">
      <h1>Game Menu</h1>
      <p>Press Escape to close this menu.</p>
      <button onClick={onClose}>Close Menu</button>
    </div>
  );
};

export default Menu; 