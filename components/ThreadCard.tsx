
import React, { useState, useEffect } from 'react';
import { ThreadPost } from '../types';

interface ThreadCardProps {
  post: ThreadPost;
  onCopy: (text: string, toastMsg?: string) => void;
}

const ThreadCard: React.FC<ThreadCardProps> = ({ post, onCopy }) => {
  const [currentPost, setCurrentPost] = useState<ThreadPost>(post);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [isLiked, setIsLiked] = useState(false);
  const [showVisualPrompt, setShowVisualPrompt] = useState(false);
  const [likeCount] = useState(() => Math.floor(Math.random() * 450) + 12);

  useEffect(() => {
    setCurrentPost(post);
    setIsEditing(false);
    setShowVisualPrompt(false);
  }, [post]);

  const fullText = `${currentPost.content}\n\n${currentPost.tags.map(t => `#${t}`).join(' ')}`;

  // 跳轉至 Threads 發布介面
  const handlePublishToThreads = () => {
    const encodedText = encodeURIComponent(fullText);
    const threadsUrl = `https://www.threads.net/intent/post?text=${encodedText}`;
    window.open(threadsUrl, '_blank');
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 mb-4 transition-all hover:border-neutral-700 shadow-xl relative animate-fade-in group">
      <div className="flex gap-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 p-[2px] shadow-lg">
            <div className="w-full h-full rounded-full bg-black flex items-center justify-center text-[10px] text-white font-black">THREADS</div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-grow min-w-0">
          <div className="flex justify-between items-center mb-1.5">
            <h3 className="text-white font-bold text-sm flex items-center gap-1 hover:underline cursor-pointer">
              daily_murmur
              <svg className="w-3.5 h-3.5 text-blue-400 fill-current" viewBox="0 0 24 24"><path d="M22.5 12.5c0-1.58-.88-2.95-2.18-3.65c.3-.85.43-1.78.33-2.73c-.22-2.12-1.88-3.78-4-4c-.95-.1-1.88.03-2.73.33C13.22 1.18 11.85.3 10.27.3c-2.13 0-3.87 1.73-3.87 3.87c0 .17.01.33.03.49c-.83.33-1.55.88-2.07 1.58C3.17 7.55 2.5 9.4 2.5 11.41c0 2.21 1.79 4 4 4c.17 0 .33-.01.49-.03c.33.83.88 1.55 1.58 2.07c1.31.96 3.16 1.63 5.17 1.63c2.21 0 4-1.79 4-4c0-.17-.01-.33-.03-.49c.83-.33 1.55-.88 2.07-1.58c.96-1.31 1.63-3.16 1.63-5.17c0-2.21-1.79-4-4-4c-.17 0-.33.01-.49.03c-.33-.83-.88-1.55-1.58-2.07z"/></svg>
            </h3>
            <span className="text-neutral-600 text-[10px] font-bold">剛剛</span>
          </div>

          {isEditing ? (
            <div className="mb-3">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full bg-black border border-neutral-700 rounded-xl p-3 text-sm text-white mb-2 focus:border-indigo-500 outline-none h-32 transition-colors resize-none"
              />
              <div className="flex gap-2 justify-end">
                <button onClick={() => setIsEditing(false)} className="text-xs text-neutral-500 px-3 hover:text-white transition-colors">取消</button>
                <button onClick={() => {
                  setCurrentPost({ ...currentPost, content: editContent });
                  setIsEditing(false);
                }} className="bg-white text-black text-xs font-bold px-5 py-2 rounded-full hover:bg-neutral-200 transition-colors">儲存修改</button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-neutral-100 text-[15px] leading-relaxed whitespace-pre-wrap font-sans">
                {currentPost.content}
              </p>
              
              <div className="flex flex-wrap gap-2">
                 {currentPost.tags.map((tag, idx) => (
                    <span key={idx} className="text-indigo-400 text-sm hover:text-indigo-300 cursor-pointer">#{tag}</span>
                 ))}
              </div>

              {/* Visual Prompt Section */}
              <div className="bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden transition-all group-hover:border-neutral-700">
                <div 
                  className="px-4 py-2 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/30 cursor-pointer select-none"
                  onClick={() => setShowVisualPrompt(!showVisualPrompt)}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
                    <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest flex items-center gap-1.5">
                      AI Visual Prompt
                      <svg className={`w-2.5 h-2.5 transition-transform duration-300 ${showVisualPrompt ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"></path></svg>
                    </span>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onCopy(currentPost.visualPrompt, "生圖提示詞已複製！");
                    }}
                    className="flex items-center gap-1.5 text-neutral-500 hover:text-white transition-colors group/btn"
                  >
                    <span className="text-[10px] font-bold">COPY</span>
                    <svg className="w-3 h-3 transition-transform group-hover/btn:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"></path></svg>
                  </button>
                </div>
                {showVisualPrompt && (
                  <div className="p-4 bg-gradient-to-br from-black to-neutral-900 animate-fade-in">
                    <p className="text-neutral-300 text-xs italic leading-relaxed font-mono selection:bg-indigo-500/30">
                      {currentPost.visualPrompt}
                    </p>
                  </div>
                )}
              </div>

              {/* Interaction Bar */}
              <div className="flex flex-col sm:flex-row gap-4 pt-2 border-t border-neutral-800/30">
                <div className="flex gap-4 items-center">
                  <button onClick={() => setIsLiked(!isLiked)} className={`flex items-center gap-1.5 text-xs font-bold transition-all ${isLiked ? 'text-rose-500 scale-110' : 'text-neutral-500 hover:text-rose-400'}`}>
                      {isLiked ? '❤️' : '🤍'} {likeCount + (isLiked ? 1 : 0)}
                  </button>
                  <button onClick={() => onCopy(fullText)} className="text-neutral-500 text-xs font-bold hover:text-white flex items-center gap-1.5 transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
                    複製
                  </button>
                  <button onClick={() => { setEditContent(currentPost.content); setIsEditing(true); }} className="text-neutral-500 text-xs font-bold hover:text-white flex items-center gap-1.5 transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                    編輯
                  </button>
                </div>
                
                <button 
                  onClick={handlePublishToThreads}
                  className="sm:ml-auto w-full sm:w-auto bg-white text-black text-xs font-black px-5 py-2.5 rounded-full hover:bg-neutral-200 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 448 512">
                    <path d="M448 209.91a210.06 210.06 0 0 1-122.77-39.25V349.38A162.55 162.55 0 1 1 185 188.31V278.2a74.62 74.62 0 1 0 52.23 71.18V0l88 0a121.18 121.18 0 0 0 122.77 122.77z"/>
                  </svg>
                  發布到 Threads
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ThreadCard;
