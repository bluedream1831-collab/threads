import { Type } from "@google/genai";

export enum Mood {
  CYNICAL = "厭世吐槽",
  CHILL = "Chill 放鬆",
  EMO = "深夜 Emo",
  FUNNY = "幽默搞笑",
  MOTIVATIONAL = "正能量/雞湯",
  NONSENSE = "純廢文"
}

export enum Scene {
  WORK = "職場社畜",
  RELATIONSHIP = "感情生活",
  DAILY = "日常生活",
  WEEKEND = "週末假期",
  TRENDING = "時事跟風",
  POLICY = "台灣政策",
  WELFARE = "社會福利",
  LABOR = "勞保/勞權",
  RETIREMENT = "退休/退休金",
  FOOD_KH = "高雄美食",
  FOOD_TW = "台灣美食",
  TW_EVENTS = "台灣大事",
  KH_EVENTS = "高雄大事",
  KH_CLIMATE = "高雄氣候",
  INTL_EVENTS = "國際大事",
  ASIA_EVENTS = "亞洲大事"
}

export enum ModelVersion {
  V3_FLASH = "gemini-3-flash-preview",
  V2_5_FLASH = "gemini-2.5-flash"
}

export interface ThreadPost {
  content: string;
  tags: string[];
  visualPrompt: string; // 用於生圖的 AI 提示詞
}

export interface ScheduledPost extends ThreadPost {
  id: string;
  scheduledTime: string;
  createdAt: number;
}

export interface GenerateRequest {
  mood: Mood;
  scene: Scene;
  keywords?: string[];
  modelVersion: ModelVersion;
}

export const threadResponseSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      content: {
        type: Type.STRING,
        description: "The main text content of the Threads post.",
      },
      tags: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "Relevant hashtags.",
      },
      visualPrompt: {
        type: Type.STRING,
        description: "A detailed English prompt for AI image generators (like Midjourney) that matches the post's mood and scene.",
      }
    },
    required: ["content", "tags", "visualPrompt"],
  },
};