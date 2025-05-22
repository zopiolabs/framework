import React from 'react';

/**
 * Tab item component to be used within Tabs
 * @param {Object} props - Component props
 * @param {string} props.value - Unique identifier for the tab
 * @param {string} props.label - Display label for the tab
 * @param {React.ReactNode} props.children - Tab content
 */
export default function TabItem({ value, label, children }) {
  return <div>{children}</div>;
}
