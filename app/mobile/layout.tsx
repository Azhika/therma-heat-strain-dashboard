import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Physiological Dashboard | RESILIO',
  description: 'A calm mobile view of personalized heat strain, physical readings, and recovery status.',
  openGraph: {
    title: 'RESILIO Physiological Dashboard',
    description: 'Personalized heat-strain and recovery monitoring in a simple mobile interface.',
    images: [],
  },
  twitter: {
    card: 'summary',
    title: 'RESILIO Physiological Dashboard',
    description: 'Personalized heat-strain and recovery monitoring in a simple mobile interface.',
    images: [],
  },
};

export default function MobileLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
