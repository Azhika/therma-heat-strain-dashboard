import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'THERMA / Personalized Heat-Strain Wearable',
  description: 'Interactive 3D concept for a screenless edge-AI wearable that detects personal heat strain and verifies recovery.',
  openGraph: {
    title: 'THERMA / Personalized Heat-Strain Wearable',
    description: 'A screenless edge-AI wearable concept for personalized heat-strain detection and recovery verification.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'THERMA / Personalized Heat-Strain Wearable',
    description: 'A screenless edge-AI wearable concept for personalized heat-strain detection and recovery verification.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
