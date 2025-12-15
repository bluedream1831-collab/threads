import React, { useState } from 'react';
import { generateThreadsContent } from './services/geminiService';
import { Mood, Scene, ThreadPost, ScheduledPost } from './types';
import ThreadCard from './components/ThreadCard';

const App: React.FC = () => {
  const [mood, setMood] = useState<Mood>(Mood.CYNICAL);
  const [scene, setScene] = useState<Scene>(Scene.WORK);
  const [customTopic, setCustomTopic] = useState<string>('');
  const [results, setResults] = useState<ThreadPost[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Scheduled Posts State
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setResults([]);
    setSearchQuery(''); // Reset search on new generation
    
    try {
      const posts = await generateThreadsContent({
        mood,
        scene,
        customTopic: customTopic.trim() || undefined
      });
      setResults(posts);
    } catch (err) {
      setError("生成失敗，請稍後再試。");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setToast("已複製到剪貼簿！");
    setTimeout(() => setToast(null), 2000);
  };

  const handleAddToSchedule = (post: ThreadPost, time: string) => {
    const newScheduledPost: ScheduledPost = {
      ...post,
      id: Date.now().toString(),
      scheduledTime: time,
      createdAt: Date.now()
    };
    setScheduledPosts(prev => [newScheduledPost, ...prev]);
    setToast(`已加入排程：${time}`);
    setTimeout(() => setToast(null), 2000);
  };

  const removeScheduledPost = (id: string) => {
      setScheduledPosts(prev => prev.filter(p => p.id !== id));
  };

  // Filter results based on search query
  const filteredResults = results.filter(post => {
    const query = searchQuery.toLowerCase();
    const contentMatch = post.content.toLowerCase().includes(query);
    const tagMatch = post.tags.some(tag => tag.toLowerCase().includes(query));
    return contentMatch || tagMatch;
  });

  // Dynamic placeholder based on scene
  const getPlaceholder = (s: Scene) => {
    switch (s) {
      case Scene.WORK: return "例如：週一症候群、慣老闆、想離職...";
      case Scene.RELATIONSHIP: return "例如：曖昧對象、前任、單身...";
      case Scene.DAILY: return "例如：天氣、晚餐吃什麼、失眠...";
      case Scene.WEEKEND: return "例如：宅在家、咖啡廳、不想收假...";
      case Scene.TRENDING: return "例如：奧運、AI話題、最新迷因、颱風...";
      default: return "例如：生活瑣事...";
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-neutral-700 selection:text-white pb-20">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 bg-white text-black px-6 py-2 rounded-full font-medium shadow-2xl z-50 animate-fade-in-down">
          {toast}
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-md border-b border-neutral-800">
        <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-center relative">
          {/* Logo / Title */}
          <h1 className="font-bold text-xl tracking-tight">Threads 靈感生成器</h1>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center">
            <svg viewBox="0 0 192 192" className="w-6 h-6 fill-white">
              <path d="M141.537 88.9883C140.71 88.5919 139.87 88.2104 139.019 87.8451C137.537 60.5382 122.616 44.905 97.5619 44.745C97.4484 44.7443 97.3355 44.7443 97.222 44.7443C82.3585 44.7443 69.0714 53.3579 61.993 67.5252C55.6359 80.252 56.766 96.6457 65.0232 108.625C73.3106 120.653 87.6444 127.973 102.731 127.973C116.363 127.973 128.847 122.186 136.621 112.222L149.261 121.751C138.857 135.539 121.906 143.763 102.731 143.763C79.8887 143.763 58.1752 132.678 45.6292 114.464C33.1118 96.294 31.3976 71.4397 41.0336 52.1627C51.756 30.7077 71.8863 17.6534 94.3941 17.6534C128.775 17.6534 149.349 37.3888 153.916 71.4704C154.551 76.1956 154.887 81.334 154.887 86.8291C154.887 114.364 139.141 133.053 111.458 133.053C95.2754 133.053 84.1814 121.725 84.1814 105.744C84.1814 88.0061 96.2255 77.1009 110.899 77.1009C119.554 77.1009 126.541 81.0118 130.457 87.2023C131.258 87.2104 132.054 87.2272 132.846 87.2529C132.96 82.5649 133.032 77.8769 132.553 73.1931C131.656 64.4445 130.134 56.4173 127.994 49.3431L143.504 44.8211C145.719 52.2858 147.306 60.6722 148.243 69.8315C148.736 75.0519 148.775 80.3155 148.647 85.5804C148.337 98.4061 147.16 111.026 145.106 123.411L129.539 120.373C131.512 108.653 132.535 96.9038 132.827 88.9883H141.537ZM109.846 91.5034C104.538 91.5034 100.276 95.5396 100.276 103.743C100.276 111.235 103.951 118.652 110.275 118.652C116.126 118.652 120.013 113.155 120.013 105.074C120.013 96.9388 116.149 91.5034 109.846 91.5034Z"></path>
            </svg>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">
        
        {/* Controls Section */}
        <div className="space-y-6 mb-8">
          
          {/* Mood Selector */}
          <div>
            <label className="text-neutral-500 text-xs font-bold uppercase tracking-wider mb-2 block">心情基調</label>
            <div className="grid grid-cols-3 gap-2">
              {Object.values(Mood).map((m) => (
                <button
                  key={m}
                  onClick={() => setMood(m)}
                  className={`py-2 px-1 rounded-lg text-sm font-medium transition-all duration-200 border ${
                    mood === m 
                    ? 'bg-white text-black border-white' 
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
            <label className="text-neutral-500 text-xs font-bold uppercase tracking-wider mb-2 block">應用場景</label>
            <div className="flex flex-wrap gap-2">
              {Object.values(Scene).map((s) => (
                <button
                  key={s}
                  onClick={() => setScene(s)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border ${
                    scene === s
                    ? 'bg-neutral-800 text-white border-neutral-600'
                    : 'bg-black text-neutral-500 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Topic Input */}
          <div>
             <label className="text-neutral-500 text-xs font-bold uppercase tracking-wider mb-2 block">自訂主題 (選填)</label>
             <input 
                type="text" 
                placeholder={getPlaceholder(scene)}
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-500 transition-colors"
             />
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full bg-white text-black font-bold text-lg py-3 rounded-xl hover:bg-neutral-200 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                思考廢文中...
              </>
            ) : (
              '✨ 生成靈感'
            )}
          </button>
        </div>

        {/* Results Section */}
        {error && (
            <div className="p-4 bg-red-900/30 border border-red-800 rounded-lg text-red-200 text-center text-sm mb-6">
                {error}
            </div>
        )}

        {results.length > 0 && (
          <div className="animate-fade-in mb-12">
             <div className="mb-4">
                 <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <h2 className="text-white font-bold text-lg">生成結果</h2>
                        <span className="text-neutral-500 text-xs font-normal bg-neutral-900 px-2 py-0.5 rounded-full">{filteredResults.length} / {results.length}</span>
                    </div>
                 </div>

                 {/* Search Bar */}
                 <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-white transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    </div>
                    <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="搜尋關鍵字或標籤..."
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-500 transition-colors"
                    />
                    {searchQuery && (
                        <button 
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    )}
                 </div>
             </div>
             
             <div className="space-y-4">
               {filteredResults.length > 0 ? (
                   filteredResults.map((post, index) => (
                     <ThreadCard 
                        key={index} 
                        post={post} 
                        mood={mood} 
                        scene={scene} 
                        onCopy={copyToClipboard}
                        onSchedule={handleAddToSchedule}
                     />
                   ))
               ) : (
                   <div className="text-center py-10 border border-neutral-800 border-dashed rounded-xl">
                       <p className="text-neutral-400 text-sm">找不到符合「{searchQuery}」的結果</p>
                       <button onClick={() => setSearchQuery('')} className="mt-2 text-blue-400 text-xs hover:underline">清除搜尋</button>
                   </div>
               )}
             </div>
          </div>
        )}

        {/* Scheduled Posts Section */}
        {scheduledPosts.length > 0 && (
            <div className="animate-fade-in border-t border-neutral-800 pt-8 mt-8">
                <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                    <span>📅</span> 排程清單 ({scheduledPosts.length})
                </h2>
                <div className="space-y-4">
                    {scheduledPosts.map((post) => (
                        <div key={post.id} className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4 relative">
                             <div className="flex justify-between items-center mb-2">
                                 <span className="text-purple-400 text-xs font-bold border border-purple-500/30 bg-purple-500/10 px-2 py-0.5 rounded-full">
                                    {post.scheduledTime}
                                 </span>
                                 <button 
                                    onClick={() => removeScheduledPost(post.id)}
                                    className="text-neutral-500 hover:text-red-400 text-xs"
                                 >
                                    刪除
                                 </button>
                             </div>
                             <p className="text-neutral-300 text-sm mb-2">{post.content}</p>
                             <div className="flex gap-2 mb-3">
                                {post.tags.map(t => <span key={t} className="text-neutral-500 text-xs">#{t}</span>)}
                             </div>
                             <button 
                                onClick={() => copyToClipboard(`${post.content}\n\n${post.tags.map(t => `#${t}`).join(' ')}`)}
                                className="w-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs py-2 rounded-lg transition-colors"
                             >
                                複製內容
                             </button>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {results.length === 0 && !loading && !error && scheduledPosts.length === 0 && (
            <div className="text-center py-12 opacity-30">
                <div className="w-16 h-16 bg-neutral-800 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <span className="text-2xl">💭</span>
                </div>
                <p className="text-neutral-400">選擇心情與場景，<br/>開始產生你的 Threads 生活語錄</p>
            </div>
        )}

      </main>
    </div>
  );
};

export default App;