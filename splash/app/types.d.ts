// Type declarations for modules without type definitions
declare module 'lucide-react' {
  import type * as React from 'react';
  export const StarIcon: React.FC<{ size?: number }>;
  // Add other icons as needed
}

declare module 'react-tweet' {
  import type * as React from 'react';
  export interface TweetProps {
    id: string;
  }
  export const Tweet: React.FC<TweetProps>;
}

// Add JSX namespace to fix the "JSX element implicitly has type 'any'" errors
declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
  }
}

// Type declarations for the GitHub API responses
interface GitHubRepo {
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
}

interface GitHubContributor {
  id: number;
  avatar_url?: string;
  login?: string;
}
