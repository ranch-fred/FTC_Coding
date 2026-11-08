import './globals.css';

export const metadata = { title: 'Robotics Practice', description: 'Practice FTC-style robot programming at home.' };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <main>
          <header><a href="/">🤖 Robotics Practice</a></header>
          {children}
        </main>
      </body>
    </html>
  );
}
