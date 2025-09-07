// ConnectionGuide.js - Visual guide for n8n-style connections

import React, { useState } from 'react';
import { X, Info } from 'lucide-react';

export const ConnectionGuide = () => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          background: '#4ecdc4',
          border: 'none',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          color: 'white',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        title="Show connection guide"
      >
        <Info size={20} />
      </button>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      background: 'rgba(255, 255, 255, 0.98)',
      border: '2px solid #4ecdc4',
      borderRadius: '12px',
      padding: '16px',
      maxWidth: '300px',
      boxShadow: '0 8px 25px rgba(0, 0, 0, 0.2)',
      zIndex: 1000,
      backdropFilter: 'blur(10px)',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px',
      }}>
        <h3 style={{
          margin: 0,
          color: '#2d3748',
          fontSize: '14px',
          fontWeight: '700',
        }}>
          🔗 n8n-Style Workflow Guide
        </h3>
        <button
          onClick={() => setIsVisible(false)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#64748b',
            padding: '4px',
            borderRadius: '4px',
          }}
        >
          <X size={16} />
        </button>
      </div>
      
      <div style={{
        fontSize: '12px',
        color: '#4a5568',
        lineHeight: '1.4',
      }}>
        <div style={{ marginBottom: '8px' }}>
          <strong style={{ color: '#2d3748' }}>How to create workflows:</strong>
        </div>
        
        <div style={{ marginBottom: '6px' }}>
          🎯 <strong>1. Add Event Trigger:</strong> Drag from toolbar
        </div>
        
        <div style={{ marginBottom: '6px' }}>
          ⚡ <strong>2. Add Aptos Action:</strong> What happens when triggered
        </div>
        
        <div style={{ marginBottom: '6px' }}>
          🔗 <strong>3. Connect Nodes:</strong> Drag from output handle ● to input handle ●
        </div>
        
        <div style={{ marginBottom: '8px' }}>
          🚀 <strong>4. Launch:</strong> Click "Launch Aptos Workflow"
        </div>
        
        <div style={{
          background: '#f7fafc',
          padding: '8px',
          borderRadius: '6px',
          border: '1px solid #e2e8f0',
          marginTop: '8px',
        }}>
          <div style={{ fontSize: '11px', color: '#4a5568' }}>
            <strong>Connection Handles:</strong><br/>
            ● <span style={{ color: '#ff6b6b' }}>Red</span> = Triggers<br/>
            ● <span style={{ color: '#4ecdc4' }}>Teal</span> = Data<br/>
            ● <span style={{ color: '#26de81' }}>Green</span> = Success<br/>
            ● <span style={{ color: '#fc5c65' }}>Red</span> = Error
          </div>
        </div>
      </div>
    </div>
  );
};
