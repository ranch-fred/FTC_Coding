import { Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import Shell from '../components/Shell';

const text = Space_Grotesk({ subsets: ['latin'], variable: '--font-text', display: 'swap' });
const code = JetBrains_Mono({ subsets: ['latin'], variable: '--font-code', display: 'swap' });

export const metadata = { title: 'FTC Code Lab', description: 'Learn FTC robot programming in short daily lessons.' };
export const viewport = { width: 'device-width', initialScale: 1 };

// Dark is the default. A saved choice is applied before first paint so the page never flashes.
const themeScript = `try{var t=localStorage.getItem('ftc-theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="dark" className={`${text.variable} ${code.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
