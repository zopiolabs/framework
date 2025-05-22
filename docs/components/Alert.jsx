import React from 'react';

/**
 * Alert component for displaying tips, warnings, or important information
 * @param {Object} props - Component props
 * @param {'tip'|'warning'|'info'|'danger'} props.type - Type of alert
 * @param {React.ReactNode} props.children - Alert content
 */
export default function Alert({ type = 'info', children }) {
  const styles = {
    tip: {
      backgroundColor: '#f0fff4',
      borderColor: '#68d391',
      color: '#2f855a'
    },
    warning: {
      backgroundColor: '#fffaf0',
      borderColor: '#f6ad55',
      color: '#c05621'
    },
    info: {
      backgroundColor: '#ebf8ff',
      borderColor: '#63b3ed',
      color: '#2b6cb0'
    },
    danger: {
      backgroundColor: '#fff5f5',
      borderColor: '#fc8181',
      color: '#c53030'
    }
  };

  const icons = {
    tip: '💡',
    warning: '⚠️',
    info: 'ℹ️',
    danger: '🚫'
  };

  return (
    <div
      style={{
        padding: '1rem',
        marginBottom: '1rem',
        borderLeft: '4px solid',
        borderRadius: '0.25rem',
        ...styles[type]
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span style={{ marginRight: '0.5rem', fontSize: '1.25rem' }}>
          {icons[type]}
        </span>
        <div>{children}</div>
      </div>
    </div>
  );
}
