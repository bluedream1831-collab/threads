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
  TRENDING = "時事跟風"
}

export enum ImageStyle {
  DEFAULT = "預設氛圍",
  ANIMATED = "動態迷因 (GIF)",
  JAPANESE = "日系空氣感",
  KOREAN = "韓系奶油",
  REALISTIC = "超寫實攝影",
  ILLUSTRATION = "溫馨插畫",
  CYBERPUNK = "賽博龐克",
  VINTAGE = "復古底片"
}

export interface ThreadPost {
  content: string;
  tags: string[];
}

export interface ScheduledPost extends ThreadPost {
  id: string;
  scheduledTime: string; // e.g., "明天早上 9:00"
  createdAt: number;
}

export interface GenerateRequest {
  mood: Mood;
  scene: Scene;
  customTopic?: string;
}

// Schema definition for the AI response
export const threadResponseSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      content: {
        type: Type.STRING,
        description: "The main text content of the Threads post. Should be engaging and natural.",
      },
      tags: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "Relevant hashtags without the # symbol.",
      },
    },
    required: ["content", "tags"],
  },
};