import React, { useState } from 'react';

/**
 * Tabs container component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - TabItem components
 */
export default function Tabs({ children }) {
  // Find all child TabItems
  const tabItems = React.Children.toArray(children).filter(
    child => child.type?.name === 'TabItem'
  );

  // Set the first tab as active by default
  const [activeTab, setActiveTab] = useState(
    tabItems.length > 0 ? tabItems[0].props.value : ''
  );

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid #e2e8f0',
          marginBottom: '1rem'
        }}
      >
        {tabItems.map(tab => (
          <button
            key={tab.props.value}
            onClick={() => setActiveTab(tab.props.value)}
            style={{
              padding: '0.5rem 1rem',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              borderBottom: activeTab === tab.props.value ? '2px solid #4299e1' : 'none',
              fontWeight: activeTab === tab.props.value ? 'bold' : 'normal',
              color: activeTab === tab.props.value ? '#4299e1' : 'inherit'
            }}
          >
            {tab.props.label}
          </button>
        ))}
      </div>
      <div>
        {tabItems.find(tab => tab.props.value === activeTab)}
      </div>
    </div>
  );
}
