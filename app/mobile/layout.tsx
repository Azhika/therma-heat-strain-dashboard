import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mobile Digital Twin | THERMA',
  description: 'A calm mobile view of personalized heat strain, physical readings, and recovery status.',
  openGraph: {
    title: 'THERMA Mobile Digital Twin',
    description: 'Personalized heat-strain and recovery monitoring in a simple mobile interface.',
    images: [],
  },
  twitter: {
    card: 'summary',
    title: 'THERMA Mobile Digital Twin',
    description: 'Personalized heat-strain and recovery monitoring in a simple mobile interface.',
    images: [],
  },
};

export default function MobileLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
