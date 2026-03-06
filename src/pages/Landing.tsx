import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Book, UserPlus, LogIn, Heart, Info, AlertTriangle } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 overflow-hidden relative">
      {/* Decorative Elements */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-10 right-10 w-48 h-48 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-md w-full glass rounded-3xl p-8 text-center relative z-10"
      >
        <div className="flex justify-center mb-6">
          <div className="bg-indigo-600 p-4 rounded-2xl shadow-lg shadow-indigo-200">
            <Book className="w-12 h-12 text-white" />
          </div>
        </div>

        <h1 className="text-4xl font-serif font-bold text-slate-900 mb-2 tracking-tight uppercase">
          Personal Diary App
        </h1>
        <p className="text-slate-600 mb-8 font-medium italic">"Your secrets, safely stored."</p>

        <div className="space-y-4 mb-10">
          <div className="bg-white/50 p-4 rounded-2xl border border-white/30 text-left">
            <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-2">Team Members</h3>
            <ul className="text-sm text-slate-700 space-y-1 font-medium">
              <li>• Vishwajeet U W</li>
              <li>• Shrinivas M</li>
              <li>• Yashwanth H S</li>
            </ul>
          </div>

          <div className="bg-white/50 p-4 rounded-2xl border border-white/30 text-left">
            <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-2">College</h3>
            <p className="text-sm text-slate-700 font-medium">
              The National Institute of Engineering, Mysuru
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Link
            to="/login"
            className="flex items-center justify-center gap-2 bg-indigo-600 text-white py-3.5 rounded-2xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95"
          >
            <LogIn className="w-5 h-5" />
            Login
          </Link>
          <Link
            to="/signup"
            className="flex items-center justify-center gap-2 bg-white text-indigo-600 border-2 border-indigo-600 py-3.5 rounded-2xl font-bold hover:bg-indigo-50 transition-all active:scale-95"
          >
            <UserPlus className="w-5 h-5" />
            Sign Up
          </Link>
        </div>
      </motion.div>

      {/* Feature Tags Preview */}
      <div className="mt-8 flex gap-4 opacity-70">
        <div className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full text-xs text-white font-medium">
          <Heart className="w-3 h-3" /> Special Moment
        </div>
        <div className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full text-xs text-white font-medium">
          <Info className="w-3 h-3" /> Important
        </div>
        <div className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full text-xs text-white font-medium">
          <AlertTriangle className="w-3 h-3" /> Bad News
        </div>
      </div>
    </div>
  );
}
