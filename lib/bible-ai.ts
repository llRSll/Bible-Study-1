"use server"

import { anthropic } from "@ai-sdk/anthropic"
import { generateText } from "ai"

export interface BibleStudy {
  title: string
  verses: string[]
  context: string
  keyPoints: string[]
  application: string
}

const STUDY_SYSTEM_PROMPT = `You are a knowledgeable biblical scholar assistant for a Bible study app called "Faithful Study".
Your purpose is to create in-depth Bible studies that are accurate, insightful, and spiritually enriching.

When creating a Bible study:
1. Always base your content on biblical teachings and scripture.
2. Include relevant scripture references that directly relate to the topic.
3. Provide historical and cultural context to help understand the passages.
4. Include 3-5 key points that highlight important theological insights.
5. End with practical application for how to apply these teachings in daily life.
6. Maintain a respectful, pastoral tone that encourages spiritual growth.
7. If a topic is controversial, present the main biblical perspectives fairly.

Your responses should be formatted to be parsed into JSON with these fields:
- title: A concise, engaging title for the study
- verses: Array of scripture references that are central to the study
- context: Historical and cultural background to understand the passages
- keyPoints: Array of 3-5 important theological insights
- application: Practical ways to apply these teachings

Example format:
{
  "title": "Understanding God's Grace",
  "verses": ["Ephesians 2:8-9", "Romans 5:1-2", "Titus 2:11-14"],
  "context": "Historical and cultural context...",
  "keyPoints": [
    "Key point 1...",
    "Key point 2...",
    "Key point 3..."
  ],
  "application": "How to apply this teaching..."
}`

export async function generateBibleStudy(topic: string, type = "topic"): Promise<BibleStudy> {
  try {
    let prompt = ""

    if (type === "topic") {
      prompt = `Create a Bible study on the topic: ${topic}`
    } else if (type === "verse") {
      prompt = `Create a Bible study based on this scripture passage: ${topic}`
    } else if (type === "question") {
      prompt = `Create a Bible study that addresses this question: ${topic}`
    }

    // Generate response using Claude
    const { text } = await generateText({
      model: anthropic(process.env.CLAUDE_MODEL!),
      system: STUDY_SYSTEM_PROMPT,
      prompt: prompt,
      temperature: 0.7,
      maxTokens: 1500,
    })

    // Parse the response
    try {
      // First try to parse as JSON directly
      const parsedResponse = JSON.parse(text)
      return parsedResponse
    } catch (parseError) {
      // If direct parsing fails, try to extract JSON from the text
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          const extractedJson = JSON.parse(jsonMatch[0])
          return extractedJson
        } catch (extractError) {
          // If extraction fails, return a formatted error response
          console.error("Failed to parse Claude response:", extractError)
          return formatFallbackStudy(topic)
        }
      } else {
        // If no JSON structure is found, return a formatted error response
        return formatFallbackStudy(topic)
      }
    }
  } catch (error) {
    console.error("Error calling Claude API:", error)
    return formatFallbackStudy(topic)
  }
}

// Helper function to format fallback study
function formatFallbackStudy(topic: string): BibleStudy {
  return {
    title: `Understanding ${topic}`,
    verses: ["John 3:16-17", "Romans 5:8", "1 John 4:9-10"],
    context:
      "These passages highlight God's love for humanity as demonstrated through the sacrifice of Jesus Christ. They emphasize that salvation comes through faith in Him.",
    keyPoints: [
      "God's love is demonstrated through the giving of His Son",
      "Salvation is a gift, not earned through works",
      "God's purpose was to save the world, not condemn it",
      "Our response should be to love others as God loved us",
    ],
    application:
      "As we reflect on God's immense love for us, we are called to extend that same love to others. This means forgiving those who wrong us, showing compassion to those in need, and sharing the good news of salvation with those around us.",
  }
}
