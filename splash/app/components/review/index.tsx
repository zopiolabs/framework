import { MessageCircleIcon } from 'lucide-react';
import Image from 'next/image';
import Balancer from 'react-wrap-balancer';
import rauchg from './rauchg.jpg';
import vercel from './vercel.jpg';
import x from './x.svg';

export const Review = () => (
  <section className="flex flex-col gap-8 p-8">
    <div className="flex items-center gap-2 text-neutral-500">
      <MessageCircleIcon size={14} />
      <small>Developer first</small>
    </div>
    <p className="font-semibold text-xl tracking-tight sm:text-2xl">
      <Balancer>
        &ldquo;A production-grade, monorepo-first, full stack Next.js template.
        Very thoughtfully engineered and documented. Covers auth, DB & ORM,
        payments, docs, blog, o11y, analytics, emails, and even feature flags &
        dark mode.&rdquo;
      </Balancer>
    </p>
  </section>
);
