import { GoogleGenAI } from "@google/genai";
import { GenerateRequest, ThreadPost, threadResponseSchema, ModelVersion, Mood, Scene } from "../types";

const getAi = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateThreadsContent = async (request: GenerateRequest): Promise<ThreadPost[]> => {
  const ai = getAi();
  const model = request.modelVersion;

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

  // 根據場景提供特定的視覺建議
  const getSceneVisualGuidance = (scene: Scene) => {
    if (scene === Scene.FOOD_KH || scene === Scene.FOOD_TW) {
      return "Food photography, close-up, steam rising, vibrant colors, street food vibe, bokeh background, macro details, appetizing lighting.";
    }
    if ([Scene.LABOR, Scene.POLICY, Scene.RETIREMENT, Scene.TW_EVENTS, Scene.KH_EVENTS, Scene.INTL_EVENTS, Scene.ASIA_EVENTS].includes(scene)) {
      return "Global news atmosphere, cinematic lighting, editorial photography, metaphorical imagery of global connection, urban architecture, high-quality documentary style.";
    }
    if (scene === Scene.KH_CLIMATE) {
      return "Bright intense sunlight, heat haze over the asphalt, palm trees, Kaohsiung harbor silhouette, blue sky, golden hour, tropical humid atmosphere.";
    }
    return "Balanced composition, modern aesthetic, natural lighting.";
  };

  const getMoodVisualGuidance = (mood: Mood) => {
    switch (mood) {
      case Mood.CYNICAL: return "Harsh shadows, urban street photography, high contrast, gritty textures, cold color grading.";
      case Mood.CHILL: return "Soft natural sunlight, airy composition, pastel color palette, minimalist interior, dreamy atmosphere.";
      case Mood.EMO: return "Blue hour lighting, rainy window reflections, cinematic bokeh, lonely atmosphere, moody neon hints.";
      case Mood.FUNNY: return "Vibrant colors, wide-angle lens, expressive subjects, pop-art aesthetic, dynamic composition.";
      case Mood.MOTIVATIONAL: return "Golden hour glow, clean lines, inspiring landscape or cozy morning desk, uplifting lighting.";
      case Mood.NONSENSE: return "Lo-fi aesthetic, flash photography, random daily objects, nostalgic film grain, snapshot style.";
      default: return "";
    }
  };

  const visualStyle = `${getSceneVisualGuidance(request.scene)} ${getMoodVisualGuidance(request.mood)}`;

  const keywordsPrompt = request.keywords && request.keywords.length > 0 
    ? `\n    **必須包含的關鍵字**: ${request.keywords.join(', ')} (請將這些關鍵字自然地融入內容中)` 
    : "";

  const prompt = `
    角色設定：你是一位 20-30 歲、住在台灣、Threads (脆) 重度成癮者。你的個性帶點幽默，說話非常在地，懂時事但更愛發廢文。

    任務：根據以下設定產出 8 則貼文供選擇。

    1.  **場景**: ${request.scene} 
    2.  **心情**: ${request.mood}
    3.  **當下時間**: ${timeString}${keywordsPrompt}

    **文字內容要求 (台灣在地 Threads 味)**：
    - **國際/亞洲大事**：要像在 Threads 上看到大新聞的第一反應。例如：「剛剛看到那個...真的假的我傻眼」、「雖然在台灣但看到日本/美國那個新聞還是覺得很誇張」、「全世界都在關注這個吧」。
    - **內容風格**：不要像 AI 寫的。多用「救命」、「確」、「真的會謝」、「暈掉」、「懂的都懂」。
    - **高雄/台灣大事**：要像在跟朋友聊八卦。
    - **排版**：句子短、多換行、不使用標題、少用句號。

    **視覺提示詞 (visualPrompt)**：
    - 英文撰寫，必須符合風格：${visualStyle}。

    請直接回傳 JSON 格式。
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: threadResponseSchema,
        systemInstruction: "你是一位精通台灣社群文化、Threads 語言風格的專家。你擅長以第一人稱視角，將各種新聞與生活瑣事轉化為極具吸引力的脆文。這次請提供 8 個不同的切入點與版本。如果使用者提供關鍵字，請優先並自然地使用它們。",
        temperature: 1.25,
      },
    });

    const text = response.text;
    if (!text) return [];

    return JSON.parse(text) as ThreadPost[];
  } catch (error: any) {
    if (error?.message?.includes("Requested entity was not found")) {
      throw new Error("KEY_NOT_FOUND");
    }
    console.error("Error generating content:", error);
    throw error;
  }
};