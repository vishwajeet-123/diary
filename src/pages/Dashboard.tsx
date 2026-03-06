import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Calendar, Save, Tag, Heart, Info, AlertTriangle, CheckCircle2, ChevronRight, Edit3 } from "lucide-react";
import { format } from "date-fns";

const TAGS = [
  { id: "Special Moment", icon: Heart, color: "text-pink-600", bg: "bg-pink-50", border: "border-pink-200" },
  { id: "Important Information", icon: Info, color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-200" },
  { id: "Bad News", icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
];

export default function Dashboard() {
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [content, setContent] = useState("");
  const [selectedTag, setSelectedTag] = useState(TAGS[0].id);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [entryId, setEntryId] = useState<number | null>(null);

  useEffect(() => {
    fetchEntry(date);
  }, [date]);

  const fetchEntry = async (selectedDate: string) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/diary/date/${selectedDate}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data) {
        setContent(data.content);
        setSelectedTag(data.tag);
        setEntryId(data.id);
      } else {
        setContent("");
        setSelectedTag(TAGS[0].id);
        setEntryId(null);
      }
    } catch (err) {
      console.error("Failed to fetch entry", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!content.trim()) return;
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const method = entryId ? "PUT" : "POST";
      const url = entryId ? `/api/diary/${entryId}` : "/api/diary";
      
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ date, content, tag: selectedTag }),
      });
      
      if (res.ok) {
        const data = await res.json();
        if (!entryId) setEntryId(data.id);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Failed to save entry", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 pb-24">
      <header className="mb-8">
        <motion.h1 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-3xl font-serif font-bold text-slate-900"
        >
          Dear Diary,
        </motion.h1>
        <p className="text-slate-500">Capture your thoughts for today.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Editor */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 space-y-6"
        >
          <div className="glass rounded-3xl p-1 overflow-hidden">
            <div className="bg-white rounded-[1.4rem] p-6 notebook-bg min-h-[400px] flex flex-col">
              <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-50 p-2 rounded-xl text-indigo-600">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <input
                    type="date"
                    className="bg-transparent font-bold text-slate-700 outline-none focus:text-indigo-600 transition-colors"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
                {entryId && (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                    <Edit3 className="w-3 h-3" />
                    Editing
                  </div>
                )}
              </div>

              {loading ? (
                <div className="flex-grow flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <textarea
                  className="flex-grow w-full bg-transparent resize-none outline-none text-lg leading-relaxed text-slate-800 placeholder:text-slate-300 font-serif"
                  placeholder="Start writing your thoughts here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              )}
            </div>
          </div>
        </motion.div>

        {/* Sidebar Controls */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          <div className="glass rounded-3xl p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Tag className="w-4 h-4 text-indigo-600" />
              Select Category
            </h3>
            <div className="space-y-3">
              {TAGS.map((tag) => {
                const Icon = tag.icon;
                const isSelected = selectedTag === tag.id;
                return (
                  <button
                    key={tag.id}
                    onClick={() => setSelectedTag(tag.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all ${
                      isSelected 
                        ? `${tag.bg} ${tag.border} shadow-sm` 
                        : "bg-white border-slate-100 hover:border-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${isSelected ? "bg-white shadow-sm" : "bg-slate-50"}`}>
                        <Icon className={`w-4 h-4 ${tag.color}`} />
                      </div>
                      <span className={`text-sm font-semibold ${isSelected ? tag.color : "text-slate-600"}`}>
                        {tag.id}
                      </span>
                    </div>
                    {isSelected && <ChevronRight className={`w-4 h-4 ${tag.color}`} />}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving || !content.trim()}
            className="w-full bg-indigo-600 text-white py-4 rounded-3xl font-bold shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-5 h-5" />
                {entryId ? "Update Entry" : "Save Entry"}
              </>
            )}
          </button>

          <AnimatePresence>
            {showSuccess && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-emerald-500 text-white p-4 rounded-2xl flex items-center gap-3 shadow-lg shadow-emerald-100"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-bold text-sm">Diary entry saved!</span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
