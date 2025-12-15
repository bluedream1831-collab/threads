import React, { useState, useEffect } from 'react';
import { ThreadPost, Mood, Scene, ImageStyle } from '../types';
import { generateImage } from '../services/geminiService';

interface ThreadCardProps {
  post: ThreadPost;
  mood: Mood;
  scene: Scene;
  onCopy: (text: string) => void;
  onSchedule?: (post: ThreadPost, time: string) => void;
}

const ThreadCard: React.FC<ThreadCardProps> = ({ post, mood, scene, onCopy, onSchedule }) => {
  // Local state to handle edits
  const [currentPost, setCurrentPost] = useState<ThreadPost>(post);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [editTags, setEditTags] = useState("");

  // State for image generation
  const [showImageInput, setShowImageInput] = useState(false);
  const [imagePrompt, setImagePrompt] = useState("");
  const [imageStyle, setImageStyle] = useState<ImageStyle>(ImageStyle.DEFAULT);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGeneratingImg, setIsGeneratingImg] = useState(false);

  // State for copy feedback
  const [hasCopied, setHasCopied] = useState(false);
  
  // State for schedule feedback & modal
  const [isScheduled, setIsScheduled] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("09:00");

  // --- Interaction States ---
  const [likeCount, setLikeCount] = useState(() => Math.floor(Math.random() * 450) + 12);
  const [isLiked, setIsLiked] = useState(false);
  
  const [repostCount, setRepostCount] = useState(() => Math.floor(Math.random() * 50) + 1);
  const [isReposted, setIsReposted] = useState(false);

  const [showComments, setShowComments] = useState(false);
  const [commentInput, setCommentInput] = useState("");
  const [comments, setComments] = useState<string[]>([]);

  const [shareFeedback, setShareFeedback] = useState(false);

  // Sync local state when prop changes
  useEffect(() => {
    setCurrentPost(post);
    setIsEditing(false);
    setGeneratedImage(null);
    setHasCopied(false);
    setIsScheduled(false);
    setShowScheduleModal(false);
    
    // Reset Interactions
    setIsLiked(false);
    setLikeCount(Math.floor(Math.random() * 450) + 12);
    setIsReposted(false);
    setRepostCount(Math.floor(Math.random() * 50) + 1);
    setShowComments(false);
    setComments([]);
    
    // Reset Image Style
    setImageStyle(ImageStyle.DEFAULT);
  }, [post]);

  const fullText = `${currentPost.content}\n\n${currentPost.tags.map(t => `#${t}`).join(' ')}`;
  
  const handleShare = () => {
    const shareUrl = `https://www.threads.net/intent/post?text=${encodeURIComponent(fullText)}`;
    const newWindow = window.open(shareUrl, '_blank');
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      alert("無法直接開啟 Threads 分享頁面。");
    }
  };

  const handleCopyClick = () => {
    onCopy(fullText);
    setHasCopied(true);
    setTimeout(() => {
        setHasCopied(false);
    }, 2000);
  };

  // Open the custom schedule modal with default values (Tomorrow 9:00)
  const handleScheduleClick = () => {
    if (!onSchedule) return;
    
    // Calculate "Tomorrow" based on local time to avoid UTC timezone issues
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    
    // Manual formatting to ensure YYYY-MM-DD in local time
    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const day = String(tomorrow.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    setScheduleDate(dateStr);
    setScheduleTime("09:00");
    setShowScheduleModal(true);
  };

  const confirmSchedule = () => {
    if (!onSchedule || !scheduleDate || !scheduleTime) return;
    
    // Format: "2023-10-27 09:00"
    const formattedTime = `${scheduleDate} ${scheduleTime}`;
    
    onSchedule(currentPost, formattedTime);
    setIsScheduled(true);
    setShowScheduleModal(false);
    setTimeout(() => setIsScheduled(false), 2000);
  };

  // --- Interaction Handlers ---
  const toggleLike = () => {
    setIsLiked(!isLiked);
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
  };

  const toggleRepost = () => {
    setIsReposted(!isReposted);
    setRepostCount(prev => isReposted ? prev - 1 : prev + 1);
  };

  const toggleComments = () => {
    setShowComments(!showComments);
  };

  const submitComment = () => {
    if (!commentInput.trim()) return;
    setComments([...comments, commentInput]);
    setCommentInput("");
  };

  const triggerShareFeedback = () => {
    setShareFeedback(true);
    setTimeout(() => setShareFeedback(false), 2000);
  };

  const handleImageGenerate = async () => {
    if (!imagePrompt.trim()) return;
    setIsGeneratingImg(true);
    try {
        const imgData = await generateImage(imagePrompt, mood, scene, imageStyle);
        if (imgData) {
            setGeneratedImage(imgData);
            setShowImageInput(false);
        } else {
            alert("無法生成圖片，請重試。");
        }
    } catch (e) {
        alert("生成圖片時發生錯誤。");
    } finally {
        setIsGeneratingImg(false);
    }
  };

  const toggleImageInput = () => {
      if (generatedImage) {
          setGeneratedImage(null);
          setShowImageInput(true);
          if (!imagePrompt) setImagePrompt(currentPost.content);
      } else {
          if (!showImageInput) {
              if (!imagePrompt) setImagePrompt(currentPost.content);
          }
          setShowImageInput(!showImageInput);
      }
  };

  const startEditing = () => {
    setEditContent(currentPost.content);
    setEditTags(currentPost.tags.join(' '));
    setIsEditing(true);
    setShowImageInput(false);
    setShowComments(false);
  };

  const saveEdit = () => {
    const newTags = editTags
      .split(/[\s,]+/)
      .filter(t => t.trim().length > 0)
      .map(t => t.replace(/^#/, ''));

    setCurrentPost({
      content: editContent,
      tags: newTags
    });
    setIsEditing(false);
  };

  const cancelEdit = () => {
    setIsEditing(false);
  };

  // Helper to detect if the generated content is a video (Blob URL)
  const isVideo = (url: string) => {
      return url.startsWith('blob:');
  };

  return (
    <>
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 mb-4 transition-all hover:border-neutral-700 shadow-sm relative group">
      <div className="flex gap-3">
        {/* Avatar Placeholder */}
        <div className="flex-shrink-0">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-500 to-orange-400 p-[2px]">
            <div className="w-full h-full rounded-full bg-neutral-800 flex items-center justify-center text-xs text-white font-bold">
              Me
            </div>
          </div>
          <div className="h-full w-[2px] bg-neutral-800 mx-auto mt-2 rounded-full opacity-50"></div>
        </div>

        <div className="flex-grow min-w-0">
          {/* Header */}
          <div className="flex justify-between items-start mb-1">
            <h3 className="text-white font-semibold text-sm">my_daily_life <span className="text-blue-400 ml-1">✓</span></h3>
            <div className="flex gap-2 text-neutral-500 text-xs">
              <span>剛剛</span>
              <button className="hover:text-white">•••</button>
            </div>
          </div>

          {/* Content Area - Toggle between View and Edit */}
          {isEditing ? (
            <div className="mb-3 animate-fade-in">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full bg-black border border-neutral-700 rounded-lg p-3 text-sm text-white mb-2 focus:border-neutral-500 outline-none resize-none h-32 leading-relaxed"
                placeholder="輸入貼文內容..."
              />
              <div className="flex items-center gap-2 mb-3">
                <span className="text-neutral-500 text-sm">#</span>
                <input
                  type="text"
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  className="flex-1 bg-black border border-neutral-700 rounded-lg p-2 text-sm text-blue-400 focus:border-neutral-500 outline-none"
                  placeholder="標籤 (以空白分隔)"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button 
                  onClick={cancelEdit}
                  className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white transition-colors"
                >
                  取消
                </button>
                <button 
                  onClick={saveEdit}
                  className="bg-white text-black text-xs font-bold px-4 py-1.5 rounded-full hover:bg-neutral-200 transition-colors"
                >
                  儲存變更
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Normal View Mode */}
              <div className="text-neutral-200 text-sm leading-relaxed whitespace-pre-wrap mb-2 font-sans">
                {currentPost.content}
              </div>

              {/* Generated Image/Video Display */}
              {generatedImage && (
                <div className="mt-2 mb-3 rounded-xl overflow-hidden border border-neutral-800 bg-black">
                    {isVideo(generatedImage) ? (
                        <video 
                            src={generatedImage} 
                            autoPlay 
                            loop 
                            muted 
                            playsInline 
                            className="w-full h-auto object-cover max-h-80"
                        />
                    ) : (
                        <img 
                            src={generatedImage} 
                            alt="Generated visual" 
                            className="w-full h-auto object-cover max-h-80" 
                        />
                    )}
                </div>
              )}

              {/* Image Generation Input Panel */}
              {showImageInput && !generatedImage && (
                <div className="mt-2 mb-3 bg-neutral-900 border border-neutral-800 p-3 rounded-lg animate-fade-in relative z-20">
                    <label className="text-xs text-neutral-400 mb-1 block">圖片描述</label>
                    <textarea 
                        value={imagePrompt}
                        onChange={(e) => setImagePrompt(e.target.value)}
                        placeholder="輸入想要生成的圖片畫面..."
                        className="w-full bg-black border border-neutral-700 rounded-md p-2 text-sm text-white mb-3 focus:border-neutral-500 outline-none resize-none h-20"
                    />
                    
                    {/* Style Selector */}
                    <label className="text-xs text-neutral-400 mb-1 block">圖片風格</label>
                    <div className="flex gap-2 overflow-x-auto pb-2 mb-2 scrollbar-hide">
                        {Object.values(ImageStyle).map((s) => (
                            <button
                                key={s}
                                onClick={() => setImageStyle(s)}
                                className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition-colors border ${
                                    imageStyle === s 
                                    ? 'bg-neutral-800 text-white border-neutral-600' 
                                    : 'bg-black text-neutral-500 border-neutral-800 hover:border-neutral-700'
                                }`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>

                    <div className="flex gap-2 justify-end pt-2 border-t border-neutral-800">
                        <button 
                            onClick={() => setShowImageInput(false)}
                            className="text-xs text-neutral-400 hover:text-white px-2 py-1"
                        >
                            取消
                        </button>
                        <button 
                            onClick={handleImageGenerate}
                            disabled={isGeneratingImg || !imagePrompt.trim()}
                            className="bg-white text-black text-xs font-bold px-3 py-1.5 rounded-full disabled:opacity-50 hover:bg-neutral-200 transition-colors"
                        >
                            {isGeneratingImg 
                                ? (imageStyle === ImageStyle.ANIMATED ? '製作動圖中...' : '繪製中...') 
                                : (imageStyle === ImageStyle.ANIMATED ? '生成動圖' : '生成圖片')
                            }
                        </button>
                    </div>
                </div>
              )}
              
              <div className="flex flex-wrap gap-2 mb-3">
                 {currentPost.tags.map((tag, idx) => (
                    <span key={idx} className="text-blue-400 text-sm hover:underline cursor-pointer">#{tag}</span>
                 ))}
              </div>
            </>
          )}

          {/* Action Icons */}
          <div className="flex gap-4 mt-2 items-center relative">
            <ActionIcon 
                icon="heart" 
                count={likeCount} 
                isActive={isLiked} 
                activeColor="text-red-500 fill-red-500"
                onClick={toggleLike}
            />
            <ActionIcon 
                icon="comment" 
                count={comments.length > 0 ? comments.length : undefined}
                onClick={toggleComments}
                isActive={showComments}
            />
            <ActionIcon 
                icon="refresh" 
                count={repostCount} 
                isActive={isReposted} 
                activeColor="text-green-500"
                className={isReposted ? "rotate-180" : ""}
                onClick={toggleRepost}
            />
            <div className="relative">
                <ActionIcon 
                    icon="send" 
                    onClick={triggerShareFeedback}
                />
                {shareFeedback && (
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-black text-[10px] font-bold px-2 py-1 rounded-md shadow-lg animate-fade-in whitespace-nowrap">
                        已分享!
                    </div>
                )}
            </div>
          </div>

          {/* Comments Section */}
          {showComments && (
              <div className="mt-4 pt-3 border-t border-neutral-800 animate-fade-in">
                  <div className="space-y-3 mb-3">
                      {comments.map((c, i) => (
                          <div key={i} className="flex gap-2 text-sm">
                              <div className="w-6 h-6 rounded-full bg-neutral-700 flex-shrink-0"></div>
                              <div className="bg-neutral-800/50 rounded-lg px-3 py-1.5 text-neutral-200 text-xs w-full">
                                  {c}
                              </div>
                          </div>
                      ))}
                  </div>
                  <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={commentInput}
                        onChange={(e) => setCommentInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && submitComment()}
                        placeholder="回覆..."
                        className="flex-1 bg-black border border-neutral-800 rounded-full px-4 py-1.5 text-xs text-white focus:border-neutral-600 outline-none"
                      />
                      <button 
                        onClick={submitComment}
                        disabled={!commentInput.trim()}
                        className="text-blue-400 text-xs font-bold disabled:opacity-50"
                      >
                        發佈
                      </button>
                  </div>
              </div>
          )}
        </div>
      </div>

      {/* Actions Overlay (Hidden when editing) */}
      {!isEditing && (
        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0 z-10 bg-black/60 backdrop-blur-sm p-1 rounded-full">
          <button 
            onClick={startEditing}
            className="bg-black text-white border border-neutral-700 hover:border-neutral-500 text-xs font-bold px-3 py-1.5 rounded-full shadow-lg transition-all"
          >
            編輯
          </button>
          <button 
            onClick={toggleImageInput}
            className="bg-black text-white border border-neutral-700 hover:border-neutral-500 text-xs font-bold px-3 py-1.5 rounded-full shadow-lg transition-all"
            title="為此貼文配圖"
          >
            {generatedImage ? '重製圖片' : '配圖'}
          </button>
          {onSchedule && (
              <button 
                onClick={handleScheduleClick}
                className={`${
                    isScheduled
                    ? "bg-purple-500 text-white border-purple-500"
                    : "bg-black text-white border-neutral-700 hover:border-neutral-500"
                } text-xs font-bold px-3 py-1.5 rounded-full shadow-lg transition-all`}
                title="加入排程"
              >
                {isScheduled ? "已加入" : "排程"}
              </button>
          )}
          <button 
            onClick={handleShare}
            className="bg-black text-white border border-neutral-700 hover:border-neutral-500 text-xs font-bold px-3 py-1.5 rounded-full shadow-lg transition-all"
          >
            分享
          </button>
          <div className="relative">
            <button 
                onClick={handleCopyClick}
                className={`${
                hasCopied 
                    ? "bg-green-500 text-white hover:bg-green-600 border-green-500" 
                    : "bg-white text-black hover:bg-neutral-200 border-transparent"
                } border text-xs font-bold px-3 py-1.5 rounded-full shadow-lg transition-all duration-200`}
            >
                {hasCopied ? "已複製！" : "複製"}
            </button>
            {hasCopied && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-neutral-800 text-white text-[10px] font-bold rounded-md shadow-lg whitespace-nowrap animate-fade-in pointer-events-none">
                    已複製！
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-neutral-800"></div>
                </div>
            )}
          </div>
        </div>
      )}
    </div>

    {/* Schedule Modal */}
    {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in" onClick={() => setShowScheduleModal(false)}>
            <div className="bg-neutral-900 border border-neutral-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl relative" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-5">
                    <h3 className="text-white font-bold text-lg">📅 排程發佈</h3>
                    <button onClick={() => setShowScheduleModal(false)} className="text-neutral-500 hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
                
                <div className="space-y-4 mb-6">
                    <div>
                        <label className="text-xs text-neutral-400 mb-1.5 block font-bold">日期</label>
                        <input 
                            type="date" 
                            value={scheduleDate}
                            onChange={(e) => setScheduleDate(e.target.value)}
                            className="w-full bg-black border border-neutral-700 rounded-lg px-3 py-2.5 text-white focus:border-neutral-500 outline-none text-sm [color-scheme:dark]"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-neutral-400 mb-1.5 block font-bold">時間</label>
                        <input 
                            type="time" 
                            value={scheduleTime}
                            onChange={(e) => setScheduleTime(e.target.value)}
                            className="w-full bg-black border border-neutral-700 rounded-lg px-3 py-2.5 text-white focus:border-neutral-500 outline-none text-sm [color-scheme:dark]"
                        />
                    </div>
                </div>
                
                <div className="flex gap-2 justify-end pt-2">
                    <button 
                        onClick={() => setShowScheduleModal(false)}
                        className="px-4 py-2 text-sm text-neutral-400 hover:text-white transition-colors"
                    >
                        取消
                    </button>
                    <button 
                        onClick={confirmSchedule}
                        className="bg-white text-black text-sm font-bold px-5 py-2 rounded-full hover:bg-neutral-200 transition-colors"
                    >
                        確認加入
                    </button>
                </div>
            </div>
        </div>
    )}
    </>
  );
};

interface ActionIconProps {
    icon: string;
    count?: number;
    isActive?: boolean;
    activeColor?: string;
    onClick?: () => void;
    className?: string;
}

const ActionIcon: React.FC<ActionIconProps> = ({ 
    icon, 
    count, 
    isActive, 
    activeColor = "text-white", 
    onClick,
    className = ""
}) => {
    // Simple SVG placeholders for aesthetics
    const paths: Record<string, string> = {
        heart: "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z",
        comment: "M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z",
        refresh: "M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15",
        send: "M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"
    };

    return (
        <button 
            onClick={onClick}
            className={`group flex items-center gap-1.5 transition-all active:scale-90 ${className}`}
        >
            <div className={`p-1.5 -ml-1.5 rounded-full transition-colors group-hover:bg-neutral-800 ${isActive ? activeColor : "text-neutral-500"}`}>
                <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="18" 
                    height="18" 
                    viewBox="0 0 24 24" 
                    fill={isActive && icon === 'heart' ? 'currentColor' : 'none'} 
                    stroke="currentColor" 
                    strokeWidth={isActive && icon === 'repost' ? "2.5" : "2"}
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                >
                    <path d={paths[icon] || ""} />
                </svg>
            </div>
            {count !== undefined && (
                <span className={`text-xs ${isActive && icon !== 'heart' ? 'text-white' : 'text-neutral-500'}`}>
                    {count}
                </span>
            )}
        </button>
    );
}

export default ThreadCard;