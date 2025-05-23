import type { Metadata } from 'next';
import { Apps } from './components/apps';
import { CallToAction } from './components/cta';
import { Features } from './components/features';
import { Hero } from './components/hero';
import { OpenSource } from './components/open-source';
import { Review } from './components/review';
import { Social } from './components/social';

export const metadata: Metadata = {
  title: 'From idea to enterprise: The Next.js Turborepo template built for growth',
  description:
    "A full-featured monorepo template built to accelerate your Next.js app with authentication, billing, analytics, SEO, database ORM, and more — all out of the box..",
};

const Home = () => (
  <>
    <Hero />
    <div className="grid divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0">
      <div className="sm:col-span-2">
        <Review />
      </div>
      <div className="sm:col-span-1">
        <OpenSource />
      </div>
    </div>
    <div className="h-8 bg-dashed" />
    <Apps />
    <div className="h-8 bg-dashed" />
    <Features />
    <div className="h-8 bg-dashed" />
    <Social />
    <CallToAction />
  </>
);

export default Home;
