
import { GoogleGenAI } from "@google/genai";
import { SubjectResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateStudentReport = async (
  studentName: string, 
  results: SubjectResult[], 
  average?: number, 
  totalScore?: number
): Promise<string> => {
  const resultString = results.map(r => `${r.subject}: ${r.total} (${r.grade})`).join(', ');

  const prompt = `
    Role: You are an academic counselor at Imam Malik Science & Tahfiz College.
    Task: Write a short, encouraging report card comment for ${studentName}.
    
    Data: 
    - Average Score: ${average}%
    - Total Marks: ${totalScore}
    - Subject Breakdown: ${resultString}

    STRICT GUIDELINES:
    1. Even if the average is low (e.g., 25% - 40%), start with a positive and encouraging note. 
    2. Focus on potential, effort, and specific areas where the student showed strength or interest.
    3. Use a growth-mindset approach: treat low marks as a "stepping stone" rather than a failure.
    4. Maintain a professional, motivating, and Islamic tone (mentioning "Barakallahu feek" or similar prayers where appropriate).
    5. Keep the remark to 2-3 warm sentences.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Could not generate report.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error connecting to AI service.";
  }
};
