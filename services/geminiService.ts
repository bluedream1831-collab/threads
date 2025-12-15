import { GoogleGenAI } from "@google/genai";
import { GenerateRequest, Mood, Scene, ThreadPost, threadResponseSchema, ImageStyle } from "../types";

const apiKey = process.env.API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey });

export const generateThreadsContent = async (request: GenerateRequest): Promise<ThreadPost[]> => {
  const model = "gemini-2.5-flash";

  // 獲取當前時間，格式範例：2023年10月27日 星期五 22:30
  const now = new Date();
  const timeString = now.toLocaleString('zh-TW', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  const prompt = `
    角色設定：你是一位住在台灣、年輕且重度成癮的 Threads (脆) 使用者。
    任務：請根據以下設定，寫出 4 則「原生感」極強的廢文或心情小語。

    1.  **心情基調**: ${request.mood}
    2.  **應用場景**: ${request.scene}
    3.  **當下時間情境**: ${timeString} (僅供參考氛圍，不用每次都提到時間)
    4.  **補充主題**: ${request.customTopic || "無特定主題，生活碎碎念"}

    **關於「台灣在地口語化」的嚴格要求**：
    -   **拒絕翻譯腔**：不要寫得像翻譯小說，要像台灣人平常講話。
    -   **拒絕標題與敬語**：不要有「標題：xxx」或「大家好」，直接開始說話。
    -   **善用語助詞**：適度加入「蛤」、「欸不是」、「笑死」、「吧」、「耶」、「喔」來增加真實感。
    -   **Threads 文化 (Murmur)**：內容可以稍微沒頭沒尾，像是心裡的碎碎念，不用完整的起承轉合。句式要短，喜歡換行。

    **時間感與情境優化 (隱性融入)**：
    -   請判斷「當下時間」與「星期幾」對台灣人的意義，**轉化為當下的狀態或心情，而非生硬地報時**。
    -   例如週一早上是「眼神死」而不是「現在是週一早上」。
    -   **不需要**每則貼文都明確提到日期或時間，除非那是抱怨或慶祝的重點。
    -   **平日早上**：眼神死、想離職、路怒症、買咖啡。
    -   **平日下午**：薪水小偷、想訂飲料、愛睏。
    -   **週五/週末**：復活、微醺、廢在家、不想面對下週一。
    -   **深夜 (23:00後)**：容易感性 Emo、或是肚子餓想吃宵夜、突然想發瘋。

    **輸出格式要求**：
    -   長度：每則 20-80 字，短促有力。
    -   標籤：每則貼文附上 1-3 個適合的 hashtag (不用太多)。
    -   直接回傳 JSON 陣列。
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: threadResponseSchema,
        systemInstruction: "You are a native Taiwanese. You speak fluent, casual, and slang-heavy Taiwanese Mandarin. You capture the specific cynical yet humorous vibe of the 'Threads' social media platform in Taiwan.",
        temperature: 1.3, // Slightly higher for more creative/varied/slang usage
      },
    });

    const text = response.text;
    if (!text) return [];

    const data = JSON.parse(text) as ThreadPost[];
    return data;
  } catch (error) {
    console.error("Error generating content:", error);
    throw error;
  }
};

export const generateImage = async (prompt: string, mood?: string, scene?: string, style: ImageStyle = ImageStyle.DEFAULT): Promise<string | null> => {
  // --- Video/GIF Generation Logic (Veo) ---
  if (style === ImageStyle.ANIMATED) {
    const model = 'veo-3.1-fast-generate-preview';
    // Enhance prompt for video to ensure it loops well and looks like a social media GIF
    const videoPrompt = `Cinematic, looping motion, high quality, ${mood || ''} vibe, ${scene || ''} setting. ${prompt}`;
    
    try {
      let operation = await ai.models.generateVideos({
        model: model,
        prompt: videoPrompt,
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: '16:9' // Landscape fits well in cards without taking too much vertical space
        }
      });

      // Poll until operation is done
      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Poll every 5 seconds
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }

      const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (videoUri) {
        // Fetch the video content securely using the API key
        // We convert it to a Blob URL to avoid exposing the API key in the DOM src attribute
        const response = await fetch(`${videoUri}&key=${apiKey}`);
        if (!response.ok) throw new Error("Failed to download generated video");
        
        const blob = await response.blob();
        return URL.createObjectURL(blob);
      }
      return null;

    } catch (error) {
      console.error("Video generation error:", error);
      throw error;
    }
  }

  // --- Static Image Generation Logic (Imagen/Gemini) ---
  const model = "gemini-2.5-flash-image";
  let styleModifier = "";

  // If a specific style is selected (not DEFAULT), it overrides the Mood-based style.
  if (style && style !== ImageStyle.DEFAULT) {
      switch (style) {
          case ImageStyle.JAPANESE:
              styleModifier = "風格：日系攝影，自然光，過曝高光，青藍色調(Cyan bias)，低對比，清新空氣感，膠片質感。";
              break;
          case ImageStyle.KOREAN:
              styleModifier = "風格：韓系IG質感，低飽和度，米色/奶油色調(Beige tone)，乾淨簡約，柔光，極簡構圖。";
              break;
          case ImageStyle.REALISTIC:
              styleModifier = "風格：高畫質寫實攝影，4K解析度，銳利清晰，光影細節豐富，像國家地理雜誌或專業商業攝影，真實感。";
              break;
          case ImageStyle.ILLUSTRATION:
              styleModifier = "風格：溫馨手繪插畫，柔和線條，水彩或色鉛筆質感，療癒系，色彩粉嫩，非寫實。";
              break;
          case ImageStyle.CYBERPUNK:
              styleModifier = "風格：賽博龐克(Cyberpunk)，霓虹燈光，藍紫色與洋紅色系，高科技低生活，未來感，夜晚城市，強烈對比。";
              break;
          case ImageStyle.VINTAGE:
              styleModifier = "風格：90年代復古底片，顆粒感(Grainy)，漏光效果，暖黃色調，懷舊氛圍，Lomo風格。";
              break;
          default:
              styleModifier = "風格：台灣日常質感，生活化。";
      }
  } else {
      // Fallback to Mood-based styling if style is DEFAULT
      switch (mood) {
        case Mood.CYNICAL: // 厭世吐槽
          styleModifier = "風格：低飽和度、冷色調、黑白攝影或青藍色濾鏡、高對比、孤寂感、陰影強烈、底片顆粒感。";
          break;
        case Mood.CHILL: // Chill 放鬆
          styleModifier = "風格：柔和自然光、暖色調、低對比、日系空氣感、像是在咖啡廳或戶外的愜意氛圍、莫蘭迪色系。";
          break;
        case Mood.EMO: // 深夜 Emo
          styleModifier = "風格：暗色調、藍紫色系、霓虹燈光、模糊失焦(Bokeh)、雨天或夜晚窗景、王家衛電影風格、孤獨感。";
          break;
        case Mood.FUNNY: // 幽默搞笑
          styleModifier = "風格：高飽和度、鮮豔色彩、迷因(Meme)風格、誇張構圖、像漫畫或普普藝術(Pop Art)、清晰明亮。";
          break;
        case Mood.MOTIVATIONAL: // 正能量
          styleModifier = "風格：明亮採光、黃金時刻(Golden Hour)、清新簡約、充滿希望的感覺、由下往上的視角、乾淨的背景。";
          break;
        case Mood.NONSENSE: // 純廢文
          styleModifier = "風格：隨手拍質感、低畫質復古感(Lo-fi)、生活碎片、不經意的構圖、真實不做作。";
          break;
        default:
          styleModifier = "風格：台灣日常質感、生活化、真實感。";
      }
  }

  // Define scene context
  const sceneContext = scene ? `場景背景：${scene}。` : "";

  // 自動附加風格指令，確保生成的圖片具有繁體中文與台灣在地語境
  const enhancedPrompt = `
  畫面描述：${prompt}。
  ${sceneContext}
  ${styleModifier}
  
  通用要求：
  1. 若畫面中出現文字（如招牌、螢幕、手寫筆記），**必須是繁體中文**。
  2. 視覺元素應貼近亞洲/台灣現代生活日常。
  3. 圖片比例為 1:1 (Instagram/Threads 風格)。
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          { text: enhancedPrompt }
        ]
      },
      // gemini-2.5-flash-image does not support responseMimeType or responseSchema
    });

    if (response.candidates && response.candidates.length > 0) {
      const content = response.candidates[0].content;
      if (content && content.parts) {
        for (const part of content.parts) {
          if (part.inlineData) {
            return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          }
        }
      }
    }
    return null;
  } catch (error) {
    console.error("Image generation error:", error);
    throw error;
  }
};