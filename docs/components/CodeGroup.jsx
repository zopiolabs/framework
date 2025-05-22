import React from 'react';
import { Tabs, TabItem } from './';

/**
 * CodeGroup component for displaying code examples in different languages or package managers
 * @param {Object} props - Component props
 * @param {Object[]} props.snippets - Array of code snippets
 * @param {string} props.snippets[].language - Programming language or package manager
 * @param {string} props.snippets[].code - Code content
 */
export default function CodeGroup({ snippets }) {
  return (
    <Tabs>
      {snippets.map((snippet) => (
        <TabItem key={snippet.language} value={snippet.language} label={snippet.language}>
          <pre>
            <code className={`language-${snippet.language}`}>
              {snippet.code}
            </code>
          </pre>
        </TabItem>
      ))}
    </Tabs>
  );
}
