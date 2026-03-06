import { Link, useLocation } from "react-router-dom";
import { Home, Search, LogOut, Book } from "lucide-react";

interface NavbarProps {
  user: any;
  onLogout: () => void;
}

export default function Navbar({ user, onLogout }: NavbarProps) {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 glass px-4 py-3 flex items-center justify-between">
      <Link to="/dashboard" className="flex items-center gap-2">
        <div className="bg-indigo-600 p-1.5 rounded-lg">
          <Book className="w-5 h-5 text-white" />
        </div>
        <span className="font-serif font-bold text-lg hidden sm:block">MyDiary</span>
      </Link>

      <div className="flex items-center gap-1 sm:gap-4">
        <Link
          to="/dashboard"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors ${
            isActive("/dashboard") ? "bg-indigo-100 text-indigo-700 font-medium" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Home className="w-4 h-4" />
          <span className="text-sm">Home</span>
        </Link>
        <Link
          to="/search"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors ${
            isActive("/search") ? "bg-indigo-100 text-indigo-700 font-medium" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Search className="w-4 h-4" />
          <span className="text-sm">Search</span>
        </Link>
        <button
          onClick={onLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm hidden sm:block">Logout</span>
        </button>
      </div>
    </nav>
  );
}
