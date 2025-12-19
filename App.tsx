import React, { useState, useEffect, useRef } from 'react';
import { generateThreadsContent } from './services/geminiService';
import { Mood, Scene, ThreadPost, ScheduledPost, ModelVersion } from './types';
import ThreadCard from './components/ThreadCard';

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    aistudio?: AIStudio;
  }
}

const App: React.FC = () => {
  const [mood, setMood] = useState<Mood>(Mood.CYNICAL);
  const [scene, setScene] = useState<Scene>(Scene.WORK);
  const [modelVersion, setModelVersion] = useState<ModelVersion>(ModelVersion.V3_FLASH);
  const [keywordInput, setKeywordInput] = useState<string>('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [results, setResults] = useState<ThreadPost[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingMsg, setLoadingMsg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState<boolean>(true);
  
  const [searchQuery, setSearchQuery] = useState<string>('');
  const loadingIntervalRef = useRef<number | null>(null);

  const funnyMessages = [
    "正在追蹤國際情勢並思考怎麼發廢文...",
    "正在觀察亞洲鄰居發生了什麼大事...",
    "正在偷聽脆友抱怨社會福利...",
    "正在幫你把關鍵字融入最道地的廢文...",
    "正在高雄路邊排隊買滷肉飯找靈感...",
    "正在跟同事討論勞保到底會不會倒...",
    "正在研究最新政策到底誰看得懂...",
    "正在幫你抗議高雄的太陽也太狂...",
    "正在幫你整理最近台灣發生的大事...",
    "正在醞釀最道地的台灣廢文語氣...",
    "正在幫你思考怎麼在脆上面暈爛...",
    "正在滑 Threads 觀察現在流行什麼..."
  ];

  useEffect(() => {
    checkApiKey();
    return () => {
      if (loadingIntervalRef.current) clearInterval(loadingIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (loading) {
      setLoadingMsg(funnyMessages[0]);
      let i = 1;
      loadingIntervalRef.current = window.setInterval(() => {
        setLoadingMsg(funnyMessages[i % funnyMessages.length]);
        i++;
      }, 1500);
    } else {
      if (loadingIntervalRef.current) clearInterval(loadingIntervalRef.current);
    }
  }, [loading]);

  const checkApiKey = async () => {
    if (window.aistudio) {
      try {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(selected);
      } catch (err) {
        console.error("Error checking API key status", err);
      }
    }
  };

  const handleOpenKeySelector = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setHasApiKey(true);
    }
  };

  const onKeyError = async () => {
    setHasApiKey(false);
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setHasApiKey(true);
    }
  };

  const addKeyword = () => {
    const val = keywordInput.trim();
    if (val && !keywords.includes(val)) {
      setKeywords([...keywords, val]);
      setKeywordInput('');
    }
  };

  const removeKeyword = (tag: string) => {
    setKeywords(keywords.filter(k => k !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addKeyword();
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setResults([]);
    
    try {
      const posts = await generateThreadsContent({
        mood,
        scene,
        modelVersion,
        keywords: keywords.length > 0 ? keywords : undefined
      });
      setResults(posts);
    } catch (err: any) {
      if (err?.message === "KEY_NOT_FOUND") {
        await onKeyError();
      } else {
        setError("生成失敗，請稍後再試。或是檢查 API 金鑰。");
      }
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, msg: string = "已複製到剪貼簿！") => {
    navigator.clipboard.writeText(text);
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  const filteredResults = results.filter(post => {
    const query = searchQuery.toLowerCase();
    return post.content.toLowerCase().includes(query) || post.tags.some(tag => tag.toLowerCase().includes(query));
  });

  if (!hasApiKey) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-neutral-800 rounded-3xl flex items-center justify-center mb-6 text-4xl shadow-2xl border border-neutral-700">🔑</div>
        <h1 className="text-2xl font-bold mb-4">需要設定 API 金鑰</h1>
        <p className="text-neutral-400 mb-8 max-w-sm leading-relaxed">為了使用最新的 Gemini 模型，你需要選取一個已啟用付費項目的 Google Cloud 專案。</p>
        <button onClick={handleOpenKeySelector} className="bg-white text-black font-bold px-8 py-3 rounded-full hover:bg-neutral-200 transition-all mb-4">選取 API 金鑰</button>
        <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-neutral-500 text-sm hover:underline">查看計費說明文件</a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans pb-20 overflow-x-hidden">
      {toast && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 bg-white text-black px-8 py-2.5 rounded-full font-bold shadow-2xl z-50 animate-fade-in-down">
          {toast}
        </div>
      )}

      <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-md border-b border-neutral-800">
        <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="font-black text-xl tracking-tighter italic flex items-center gap-2">
             THREADS <span className="text-indigo-500">GEN</span>
             <span className="text-[10px] bg-neutral-800 px-2 py-0.5 rounded-full text-neutral-400 not-italic font-bold">TW</span>
          </h1>
          <div className="flex bg-neutral-900 p-1 rounded-full border border-neutral-800">
             <button 
                onClick={() => setModelVersion(ModelVersion.V3_FLASH)}
                className={`px-3 py-1 rounded-full text-[10px] font-black transition-all ${modelVersion === ModelVersion.V3_FLASH ? 'bg-indigo-600 text-white' : 'text-neutral-500'}`}
             >V3</button>
             <button 
                onClick={() => setModelVersion(ModelVersion.V2_5_FLASH)}
                className={`px-3 py-1 rounded-full text-[10px] font-black transition-all ${modelVersion === ModelVersion.V2_5_FLASH ? 'bg-emerald-600 text-white' : 'text-neutral-500'}`}
             >V2.5</button>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-8">
        <div className="space-y-8 mb-12">
          {/* Mood Selector */}
          <div>
            <label className="text-neutral-500 text-[10px] font-black uppercase tracking-[0.2em] mb-3 block">Mood 基調</label>
            <div className="grid grid-cols-3 gap-2">
              {Object.values(Mood).map((m) => (
                <button
                  key={m}
                  onClick={() => setMood(m)}
                  className={`py-3 px-1 rounded-xl text-xs font-bold transition-all duration-300 border ${
                    mood === m 
                    ? 'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.2)] scale-[1.02]' 
                    : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:border-neutral-600'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Scene Selector */}
          <div>
            <label className="text-neutral-500 text-[10px] font-black uppercase tracking-[0.2em] mb-3 block">Scene 場景</label>
            <div className="flex flex-wrap gap-2">
              {Object.values(Scene).map((s) => (
                <button
                  key={s}
                  onClick={() => setScene(s)}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 border ${
                    scene === s
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-[0_0_15px_rgba(79,70,229,0.3)]'
                    : 'bg-neutral-900 text-neutral-500 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Keywords Tag System */}
          <div>
             <label className="text-neutral-500 text-[10px] font-black uppercase tracking-[0.2em] mb-3 block flex justify-between">
                <span>自訂關鍵字 (按 Enter 新增)</span>
                <span className="text-indigo-400">{keywords.length}/5</span>
             </label>
             <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-2 min-h-[56px] flex flex-wrap gap-2 transition-all focus-within:border-indigo-500">
                {keywords.map((tag) => (
                   <span key={tag} className="bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 group animate-fade-in">
                      {tag}
                      <button onClick={() => removeKeyword(tag)} className="hover:text-white transition-colors">✕</button>
                   </span>
                ))}
                {keywords.length < 5 && (
                  <input 
                    type="text" 
                    placeholder={keywords.length === 0 ? "輸入關鍵字..." : ""}
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-grow bg-transparent border-none text-white placeholder-neutral-700 focus:outline-none px-2 py-1 text-sm"
                  />
                )}
             </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full bg-white text-black font-black text-lg py-4 rounded-2xl hover:bg-neutral-200 active:scale-[0.97] transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-2xl relative overflow-hidden"
          >
            {loading ? (
              <div className="flex items-center gap-3">
                <div className="animate-spin h-5 w-5 border-3 border-black border-t-transparent rounded-full"></div>
                <span>生成中...</span>
              </div>
            ) : (
              <>✨ 生成 8 則 Threads 靈感</>
            )}
          </button>
        </div>

        {loading && (
          <div className="space-y-6 mb-12 animate-fade-in">
             <div className="flex flex-col items-center justify-center py-4 gap-2">
                <span className="text-indigo-400 font-bold text-sm animate-pulse text-center px-4">{loadingMsg}</span>
             </div>
             {[1, 2, 3].map((i) => (
               <div key={i} className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-5 animate-pulse">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-neutral-800"></div>
                    <div className="flex-grow space-y-3">
                      <div className="h-3 w-1/4 bg-neutral-800 rounded"></div>
                      <div className="h-3 w-full bg-neutral-800 rounded"></div>
                      <div className="h-3 w-5/6 bg-neutral-800 rounded"></div>
                      <div className="pt-4 flex gap-4">
                        <div className="h-3 w-8 bg-neutral-800 rounded"></div>
                        <div className="h-3 w-8 bg-neutral-800 rounded"></div>
                      </div>
                    </div>
                  </div>
               </div>
             ))}
          </div>
        )}

        {error && (
            <div className="p-4 bg-red-900/20 border border-red-800/50 rounded-2xl text-red-400 text-center text-sm mb-8 animate-shake">
                {error}
            </div>
        )}

        {results.length > 0 && !loading && (
          <div className="space-y-6">
             <div className="flex items-center justify-between mb-2">
                <h2 className="text-white font-black text-xl tracking-tight">生成結果 ({filteredResults.length})</h2>
                <div className="relative w-32">
                   <input 
                       type="text" 
                       value={searchQuery}
                       onChange={(e) => setSearchQuery(e.target.value)}
                       placeholder="搜尋..."
                       className="w-full bg-neutral-900 border border-neutral-800 rounded-full px-4 py-1.5 text-[10px] text-white focus:outline-none focus:border-indigo-500"
                   />
                </div>
             </div>
             
             <div className="space-y-4">
               {filteredResults.map((post, index) => (
                 <div key={index} className="animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                   <ThreadCard 
                      post={post} 
                      onCopy={copyToClipboard}
                   />
                 </div>
               ))}
             </div>
          </div>
        )}

        {results.length === 0 && !loading && !error && (
            <div className="text-center py-24 opacity-20">
                <div className="text-5xl mb-6">✍️</div>
                <p className="text-sm font-bold tracking-widest uppercase">選好場景與心情，開始創作</p>
            </div>
        )}
      </main>
    </div>
  );
};

export default App;