import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search as SearchIcon, Calendar, Tag, Heart, Info, AlertTriangle, ChevronRight, BookOpen, Filter } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

const TAGS = [
  { id: "Special Moment", icon: Heart, color: "text-pink-600", bg: "bg-pink-50", border: "border-pink-200" },
  { id: "Important Information", icon: Info, color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-200" },
  { id: "Bad News", icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
];

export default function Search() {
  const navigate = useNavigate();
  const [searchType, setSearchType] = useState<"date" | "month" | "tag">("date");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [month, setMonth] = useState(format(new Date(), "MM"));
  const [year, setYear] = useState(format(new Date(), "yyyy"));
  const [selectedTag, setSelectedTag] = useState(TAGS[0].id);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const API_URL = "https://diary-bl7x.onrender.com";

const fetchResults = async () => {
  setLoading(true);

  try {

    const token = localStorage.getItem("token");

    if (!token) {
      console.error("User not authenticated");
      return;
    }

    let url = "";

    if (searchType === "date") {
      url = `${API_URL}/api/diary/date/${date}`;
    } 
    else if (searchType === "month") {
      url = `${API_URL}/api/diary/month/${month}/${year}`;
    } 
    else if (searchType === "tag") {
      url = `${API_URL}/api/diary/tag/${selectedTag}`;
    }

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      throw new Error("Server error");
    }

    const data = await res.json();

    if (searchType === "date") {
      setResults(data ? [data] : []);
    } else {
      setResults(data);
    }

  } catch (err) {

    console.error("Search failed", err);

  } finally {

    setLoading(false);

  }
};

  useEffect(() => {
    fetchResults();
  }, [searchType, date, month, year, selectedTag]);

  const getTagInfo = (tagId: string) => TAGS.find(t => t.id === tagId) || TAGS[0];

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 pb-24">
      <header className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-slate-900">Search Diary</h1>
        <p className="text-slate-500">Find your past memories and notes.</p>
      </header>

      {/* Search Filters */}
      <div className="glass rounded-3xl p-6 mb-8">
        <div className="flex flex-wrap gap-2 mb-6">
          {(["date", "month", "tag"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setSearchType(type)}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                searchType === type 
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" 
                  : "bg-white text-slate-600 border border-slate-100 hover:border-slate-200"
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {searchType === "date" && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Select Date</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="date"
                  className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </div>
          )}

          {searchType === "month" && (
            <>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Month</label>
                <select
                  className="w-full bg-white border border-slate-200 rounded-2xl py-3 px-4 outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium appearance-none"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={String(i + 1).padStart(2, '0')}>
                      {format(new Date(2024, i, 1), "MMMM")}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Year</label>
                <input
                  type="number"
                  className="w-full bg-white border border-slate-200 rounded-2xl py-3 px-4 outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                />
              </div>
            </>
          )}

          {searchType === "tag" && (
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Select Category</label>
              <div className="flex flex-wrap gap-3">
                {TAGS.map((tag) => {
                  const Icon = tag.icon;
                  const isSelected = selectedTag === tag.id;
                  return (
                    <button
                      key={tag.id}
                      onClick={() => setSelectedTag(tag.id)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border transition-all ${
                        isSelected 
                          ? `${tag.bg} ${tag.border} shadow-sm` 
                          : "bg-white border-slate-100 hover:border-slate-200"
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${tag.color}`} />
                      <span className={`text-sm font-semibold ${isSelected ? tag.color : "text-slate-600"}`}>
                        {tag.id}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : results.length > 0 ? (
          <div className="grid grid-cols-1 gap-6">
            {results.map((entry) => {
              const tagInfo = getTagInfo(entry.tag);
              const TagIcon = tagInfo.icon;
              const id = entry.id || entry._id;
              return (
                <motion.div
                  key={id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass rounded-3xl overflow-hidden flex flex-col sm:flex-row"
                >
                  <div className={`sm:w-32 flex flex-col items-center justify-center p-6 ${tagInfo.bg} border-b sm:border-b-0 sm:border-r ${tagInfo.border}`}>
                    <span className="text-xs font-bold text-slate-400 uppercase mb-1">
                      {format(new Date(entry.date), "MMM")}
                    </span>
                    <span className="text-3xl font-serif font-bold text-slate-900">
                      {format(new Date(entry.date), "dd")}
                    </span>
                    <span className="text-xs font-medium text-slate-500">
                      {format(new Date(entry.date), "yyyy")}
                    </span>
                  </div>
                  <div className="flex-grow p-6 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${tagInfo.bg} ${tagInfo.color}`}>
                        <TagIcon className="w-3 h-3" />
                        {entry.tag}
                      </div>
                      {searchType === "date" && (
                        <button 
                          onClick={() => navigate("/dashboard")}
                          className="text-indigo-600 hover:text-indigo-700 font-bold text-xs flex items-center gap-1"
                        >
                          Edit Entry <ChevronRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <p className="text-slate-700 leading-relaxed font-serif whitespace-pre-wrap flex-grow">
                      {entry.content}
                    </p>
                    <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                      <span className="text-[10px] text-slate-400 font-medium">
                        Last updated: {format(new Date(entry.updatedAt), "MMM dd, yyyy HH:mm")}
                      </span>
                      <BookOpen className="w-4 h-4 text-slate-200" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 glass rounded-3xl">
            <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <SearchIcon className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No entries found</h3>
            <p className="text-slate-500">Try adjusting your search criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}
