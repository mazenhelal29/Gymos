import { Sidebar } from './sidebar';
import { Header } from './header';

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen min-w-0 overflow-x-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        <Header />
        <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 overflow-x-hidden overflow-y-auto min-w-0 safe-bottom">
          {children}
        </main>
      </div>
    </div>
  );
}
