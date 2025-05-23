"use server"

import { anthropic } from "@ai-sdk/anthropic"
import { generateText } from "ai"

// Define types for our responses
export interface ScriptureReference {
  reference: string
  translation: string
  text: string
}

export interface BibleAnswer {
  content: string
  scriptures: ScriptureReference[]
  application?: string
  isApiError?: boolean
  cannotAnswer?: boolean
  reason?: string
}

// System prompt to guide Claude in providing biblical answers - updated to emphasize JSON formatting
const BIBLE_SYSTEM_PROMPT = `You are a knowledgeable biblical scholar assistant for a Bible study app called "Faithful Study".
Your purpose is to answer questions about the Bible, theology, and Christian living with accuracy and wisdom.

When responding to questions:
1. Always base your answers on biblical teachings and scripture.
2. Include 2-4 relevant scripture references with each answer.
3. For each scripture reference, provide:
   - The full reference (e.g., "John 3:16")
   - The translation (default to "NIV" unless specified)
   - The complete text of the verse
4. Structure your response in this format:
   - Main answer (1-3 paragraphs explaining the biblical perspective)
   - Scripture references (formatted as described above)
   - Application (1 paragraph on how to apply this teaching)
5. Maintain a respectful, pastoral tone that encourages spiritual growth.
6. If a question is outside the scope of biblical teaching, gently redirect to relevant biblical principles.
7. Avoid political commentary or denominational bias.
8. For controversial topics, present the main biblical perspectives fairly.

EXTREMELY IMPORTANT: Your response MUST be ONLY valid JSON with NO preamble, NO explanations, and NO text before or after the JSON. Start your response with "{" and end with "}". Do not include any markdown formatting, control characters, or non-printable characters.

Your responses should be formatted to be parsed into JSON with these fields:
- content: The main explanation
- scriptures: Array of scripture references, each with reference, translation, and text
- application: Practical application of the teaching

Example format:
{
  "content": "Your explanation here...",
  "scriptures": [
    {
      "reference": "John 3:16",
      "translation": "NIV",
      "text": "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life."
    }
  ],
  "application": "How to apply this teaching..."
}`

// Fallback responses for when parsing fails
const DEFAULT_FALLBACK_RESPONSE: BibleAnswer = {
  content:
    "I apologize, but I encountered an issue processing your question. The Bible offers wisdom on many topics, and I encourage you to explore Scripture for insights related to your question.",
  scriptures: [
    {
      reference: "Psalm 119:105",
      translation: "NIV",
      text: "Your word is a lamp for my feet, a light on my path.",
    },
    {
      reference: "Proverbs 2:6",
      translation: "NIV",
      text: "For the LORD gives wisdom; from his mouth come knowledge and understanding.",
    },
  ],
  application:
    "Consider discussing this question with your pastor or in a Bible study group. Different perspectives can help deepen your understanding. As you search Scripture, pray for God's guidance to reveal His truth about this topic.",
  isApiError: true,
  cannotAnswer: true,
  reason: "There was an error processing the AI response. This could be due to formatting issues.",
}

// Helper function to extract only the JSON part from a response
function extractJsonFromText(text: string): string {
  // Log the first 50 characters to see what might be causing issues
  console.log("First 50 chars of response:", text.substring(0, 50).replace(/\n/g, "\\n"))

  // Find the first '{' and last '}' to extract just the JSON part
  const startIndex = text.indexOf("{")
  const endIndex = text.lastIndexOf("}")

  if (startIndex === -1 || endIndex === -1 || startIndex > endIndex) {
    console.error("Could not find valid JSON delimiters in the response")
    return "{}"
  }

  // Extract just the JSON part
  return text.substring(startIndex, endIndex + 1)
}

// Helper function to clean JSON string of control characters and other problematic characters
function cleanJsonString(jsonString: string): string {
  // First, extract only the JSON part
  const extractedJson = extractJsonFromText(jsonString)

  // Replace control characters and other problematic characters
  return (
    extractedJson
      // Remove control characters (0x00-0x1F) except for allowed whitespace (\n, \r, \t)
      .replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, "")
      // Fix common JSON syntax issues
      .replace(/\\'/g, "'") // Replace \' with just '
      .replace(/\\"/g, '\\"') // Ensure \" is properly escaped
      .replace(/\n/g, "\\n") // Properly escape newlines
      .replace(/\r/g, "\\r") // Properly escape carriage returns
      .replace(/\t/g, "\\t")
  ) // Properly escape tabs
}

// Manually construct a response from the text when JSON parsing fails
function constructManualResponse(text: string, question: string): BibleAnswer {
  console.log("Attempting to manually construct response from text")

  // Try to extract content (main explanation)
  let content = "Unable to extract a proper response."
  const contentMatch =
    text.match(/content["']?\s*:\s*["']([^"']+)["']/) ||
    text.match(/content["']?\s*:\s*["'](.+?)["']/) ||
    text.match(/content["']?\s*:\s*["']([\s\S]+?)["']/)

  if (contentMatch && contentMatch[1]) {
    content = contentMatch[1].trim()
  } else {
    // Try to find paragraphs that might be the content
    const paragraphs = text.split(/\n\n|\r\n\r\n/)
    if (paragraphs.length > 1) {
      // Use the first substantial paragraph that's not JSON syntax
      for (const para of paragraphs) {
        const trimmed = para.trim()
        if (trimmed.length > 50 && !trimmed.startsWith("{") && !trimmed.includes('":"')) {
          content = trimmed
          break
        }
      }
    }
  }

  // Try to extract scripture references
  const scriptures: ScriptureReference[] = []

  // Look for patterns that might indicate scripture references
  const referenceMatches = text.match(/reference["']?\s*:\s*["']([^"']+)["']/g) || []
  const translationMatches = text.match(/translation["']?\s*:\s*["']([^"']+)["']/g) || []
  const textMatches = text.match(/text["']?\s*:\s*["']([^"']+)["']/g) || []

  // If we found at least one reference, try to construct scripture objects
  for (let i = 0; i < Math.min(referenceMatches.length, 4); i++) {
    try {
      const reference = referenceMatches[i].split(":")[1].trim().replace(/["']/g, "")
      const translation = (translationMatches[i] || 'translation: "NIV"').split(":")[1].trim().replace(/["']/g, "")
      const text = (textMatches[i] || 'text: "Scripture text not available"').split(":")[1].trim().replace(/["']/g, "")

      scriptures.push({ reference, translation, text })
    } catch (e) {
      console.error("Error constructing scripture reference:", e)
    }
  }

  // If we couldn't extract any scriptures, add a default one
  if (scriptures.length === 0) {
    scriptures.push({
      reference: "Psalm 119:105",
      translation: "NIV",
      text: "Your word is a lamp for my feet, a light on my path.",
    })
  }

  // Try to extract application
  let application = "Consider studying this topic further in Scripture and discussing it with your faith community."
  const applicationMatch =
    text.match(/application["']?\s*:\s*["']([^"']+)["']/) ||
    text.match(/application["']?\s*:\s*["'](.+?)["']/) ||
    text.match(/application["']?\s*:\s*["']([\s\S]+?)["']/)

  if (applicationMatch && applicationMatch[1]) {
    application = applicationMatch[1].trim()
  }

  return {
    content,
    scriptures,
    application,
    isApiError: true,
    cannotAnswer: false,
    reason: "The response had formatting issues, but we extracted the key information.",
  }
}

export async function askBibleQuestion(question: string): Promise<BibleAnswer> {
  try {
    // Construct the prompt for Claude with explicit JSON formatting instructions
    const prompt = `Question about the Bible: ${question}

Please provide a biblically-based answer with scripture references. Remember to respond ONLY with valid JSON.`

    console.log("Calling Claude API with question:", question)

    // Generate response using Claude
    const { text } = await generateText({
      model: anthropic("claude-3-haiku-20240307"),
      system: BIBLE_SYSTEM_PROMPT,
      prompt: prompt,
      temperature: 0.7,
      maxTokens: 1000,
    })

    console.log("Received response from Claude API")

    // Try to parse the response as JSON
    try {
      // First, extract and clean the JSON part
      const extractedJson = extractJsonFromText(text)
      console.log("Extracted JSON part, length:", extractedJson.length)

      // Try to parse the extracted JSON directly
      try {
        const parsedResponse = JSON.parse(extractedJson)
        console.log("Successfully parsed extracted JSON response")
        return parsedResponse
      } catch (directParseError) {
        console.error("Direct JSON parsing failed:", directParseError)

        // Clean the extracted JSON and try again
        const cleanedJson = cleanJsonString(extractedJson)
        console.log("Cleaned JSON, length:", cleanedJson.length)

        try {
          const parsedCleanedResponse = JSON.parse(cleanedJson)
          console.log("Successfully parsed cleaned JSON response")
          return parsedCleanedResponse
        } catch (cleanedParseError) {
          console.error("Cleaned JSON parsing failed:", cleanedParseError)

          // If all parsing attempts fail, try to manually construct a response
          const manualResponse = constructManualResponse(text, question)
          if (manualResponse.content !== "Unable to extract a proper response.") {
            console.log("Successfully constructed manual response")
            return manualResponse
          }

          // If even manual construction fails, throw an error to trigger the fallback
          throw new Error("All JSON parsing and extraction attempts failed")
        }
      }
    } catch (parseError) {
      console.error("All JSON parsing methods failed:", parseError)

      // Create a custom error response that includes the original question
      return {
        ...DEFAULT_FALLBACK_RESPONSE,
        content: `I apologize, but I encountered an issue processing your question about "${question}". The Bible offers wisdom on many topics, and I encourage you to explore Scripture for insights related to your question.`,
      }
    }
  } catch (error) {
    console.error("Error calling Claude API:", error)

    // Check for credit balance error
    const errorMessage = error instanceof Error ? error.message : String(error)
    const isCreditError =
      errorMessage.includes("credit balance") || errorMessage.includes("billing") || errorMessage.includes("upgrade")

    const reason = isCreditError
      ? "The app requires additional API credits to generate more responses."
      : "There was an error connecting to the AI service. This could be due to network issues or service unavailability."

    return {
      content: `I'm currently unable to provide a specific answer to your question about "${question}".`,
      scriptures: [
        {
          reference: "Proverbs 3:5-6",
          translation: "NIV",
          text: "Trust in the LORD with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.",
        },
      ],
      application:
        "While I can't answer your specific question right now, I encourage you to explore this topic in Scripture and discuss it with your pastor or Bible study group.",
      isApiError: true,
      cannotAnswer: true,
      reason: reason,
    }
  }
}

// System prompt to guide Claude in creating Bible studies - updated to emphasize JSON formatting
const STUDY_SYSTEM_PROMPT = `You are a helpful assistant for creating Bible study materials.
Your purpose is to generate well-structured and insightful Bible studies based on a given topic, verse, or question.

When creating Bible studies:
1.  Provide a clear and engaging title for the study.
2.  List 2-4 relevant scripture verses that support the study's theme.
3.  Write a concise context paragraph that introduces the topic and verses.
4.  Identify 3-5 key points or insights from the verses and context.
5.  Include a practical application paragraph that encourages personal reflection and action.

EXTREMELY IMPORTANT: Your response MUST be ONLY valid JSON with NO preamble, NO explanations, and NO text before or after the JSON. Start your response with "{" and end with "}". Do not include any markdown formatting, control characters, or non-printable characters.

Structure your response in this format:
- title: The title of the Bible study
- verses: Array of scripture references used in the study
- context: A paragraph providing context for the verses
- keyPoints: Array of key insights or points from the verses
- application: Practical steps for applying the study to daily life

Example format:
{
"title": "The Power of Prayer",
"verses": ["Matthew 6:6", "Philippians 4:6-7", "1 Thessalonians 5:16-18"],
"context": "Prayer is a vital part of the Christian life...",
"keyPoints": ["Prayer is communication with God...", "Prayer brings peace...", "We should pray without ceasing..."],
"application": "Set aside time each day to pray..."
}`

// Default fallback study when parsing fails
const DEFAULT_FALLBACK_STUDY: BibleStudy = {
  title: "Understanding Biblical Wisdom",
  verses: ["Proverbs 2:1-6", "James 1:5", "Psalm 119:105"],
  context:
    "The Bible is filled with wisdom for every aspect of life. The book of Proverbs particularly focuses on practical wisdom for daily living. Scripture teaches that true wisdom comes from God and is available to those who seek it. These passages highlight the importance of seeking wisdom and how it guides our path.",
  keyPoints: [
    "Biblical wisdom begins with reverence for God",
    "Wisdom is available to all who ask God for it",
    "Scripture provides guidance for making wise decisions",
    "Wisdom affects every area of life: relationships, work, speech, and more",
  ],
  application:
    "To grow in biblical wisdom, make Scripture reading a daily habit. When facing decisions, look for biblical principles that apply to your situation. Seek counsel from mature Christians who demonstrate wisdom in their own lives. Pray specifically for wisdom, trusting God's promise to provide it. Remember that wisdom is not just knowledge but the application of truth in daily life. Practice what you learn from Scripture, allowing God's wisdom to transform your choices and character.",
  isApiError: true,
  cannotGenerate: true,
  reason: "There was an error processing the AI response. This could be due to formatting issues.",
}

// Similar changes for the Bible study generation function
export interface BibleStudy {
  title: string
  verses: string[]
  context: string
  keyPoints: string[]
  application: string
  isApiError?: boolean
  cannotGenerate?: boolean
  reason?: string
}

// Manually construct a study from the text when JSON parsing fails
function constructManualStudy(text: string, topic: string): BibleStudy {
  console.log("Attempting to manually construct study from text")

  // Try to extract title
  let title = `Study on ${topic}`
  const titleMatch = text.match(/title["']?\s*:\s*["']([^"']+)["']/) || text.match(/title["']?\s*:\s*["'](.+?)["']/)

  if (titleMatch && titleMatch[1]) {
    title = titleMatch[1].trim()
  }

  // Try to extract verses
  let verses: string[] = ["John 3:16", "Romans 8:28"]
  const versesMatch = text.match(/verses["']?\s*:\s*\[(.*?)\]/)

  if (versesMatch && versesMatch[1]) {
    const versesText = versesMatch[1]
    // Extract quoted strings from the array
    const verseMatches = versesText.match(/["']([^"']+)["']/g)
    if (verseMatches && verseMatches.length > 0) {
      verses = verseMatches.map((v) => v.replace(/["']/g, ""))
    }
  }

  // Try to extract context
  let context = "This study explores biblical teachings related to this topic."
  const contextMatch =
    text.match(/context["']?\s*:\s*["']([^"']+)["']/) ||
    text.match(/context["']?\s*:\s*["'](.+?)["']/) ||
    text.match(/context["']?\s*:\s*["']([\s\S]+?)["']/)

  if (contextMatch && contextMatch[1]) {
    context = contextMatch[1].trim()
  }

  // Try to extract key points
  let keyPoints: string[] = [
    "Understanding biblical principles",
    "Applying God's Word to daily life",
    "Growing in faith through Scripture",
  ]

  const keyPointsMatch = text.match(/keyPoints["']?\s*:\s*\[(.*?)\]/)

  if (keyPointsMatch && keyPointsMatch[1]) {
    const keyPointsText = keyPointsMatch[1]
    // Extract quoted strings from the array
    const pointMatches = keyPointsText.match(/["']([^"']+)["']/g)
    if (pointMatches && pointMatches.length > 0) {
      keyPoints = pointMatches.map((p) => p.replace(/["']/g, ""))
    }
  }

  // Try to extract application
  let application = "Apply these biblical principles to your daily life through prayer and reflection."
  const applicationMatch =
    text.match(/application["']?\s*:\s*["']([^"']+)["']/) ||
    text.match(/application["']?\s*:\s*["'](.+?)["']/) ||
    text.match(/application["']?\s*:\s*["']([\s\S]+?)["']/)

  if (applicationMatch && applicationMatch[1]) {
    application = applicationMatch[1].trim()
  }

  return {
    title,
    verses,
    context,
    keyPoints,
    application,
    isApiError: true,
    cannotGenerate: false,
    reason: "The response had formatting issues, but we extracted the key information.",
  }
}

export async function generateBibleStudy(topic: string, type = "topic"): Promise<BibleStudy> {
  try {
    let prompt = ""

    if (type === "topic") {
      prompt = `Create a Bible study on the topic: ${topic}. Remember to respond ONLY with valid JSON.`
    } else if (type === "verse") {
      prompt = `Create a Bible study based on this scripture passage: ${topic}. Remember to respond ONLY with valid JSON.`
    } else if (type === "question") {
      prompt = `Create a Bible study that addresses this question: ${topic}. Remember to respond ONLY with valid JSON.`
    }

    console.log("Calling Claude API for study generation:", topic)

    // Generate response using Claude
    const { text } = await generateText({
      model: anthropic("claude-3-haiku-20240307"),
      system: STUDY_SYSTEM_PROMPT,
      prompt: prompt,
      temperature: 0.7,
      maxTokens: 1500,
    })

    console.log("Received study response from Claude API")

    // Try to parse the response as JSON
    try {
      // First, extract and clean the JSON part
      const extractedJson = extractJsonFromText(text)
      console.log("Extracted study JSON part, length:", extractedJson.length)

      // Try to parse the extracted JSON directly
      try {
        const parsedResponse = JSON.parse(extractedJson)
        console.log("Successfully parsed extracted study JSON response")
        return parsedResponse
      } catch (directParseError) {
        console.error("Direct study JSON parsing failed:", directParseError)

        // Clean the extracted JSON and try again
        const cleanedJson = cleanJsonString(extractedJson)
        console.log("Cleaned study JSON, length:", cleanedJson.length)

        try {
          const parsedCleanedResponse = JSON.parse(cleanedJson)
          console.log("Successfully parsed cleaned study JSON response")
          return parsedCleanedResponse
        } catch (cleanedParseError) {
          console.error("Cleaned study JSON parsing failed:", cleanedParseError)

          // If all parsing attempts fail, try to manually construct a study
          const manualStudy = constructManualStudy(text, topic)
          console.log("Successfully constructed manual study")
          return manualStudy
        }
      }
    } catch (parseError) {
      console.error("All study JSON parsing methods failed:", parseError)

      // Create a custom error response that includes the original topic
      return {
        ...DEFAULT_FALLBACK_STUDY,
        title: `Study on ${topic} (Limited)`,
        context: `We encountered an issue generating a complete study on "${topic}". The Bible offers wisdom on many topics, and we encourage you to explore Scripture for insights related to this topic.`,
        cannotGenerate: true,
        reason: "There was an error processing the AI response. This could be due to formatting issues.",
      }
    }
  } catch (error) {
    console.error("Error calling Claude API for study:", error)

    // Check for credit balance error
    const errorMessage = error instanceof Error ? error.message : String(error)
    const isCreditError =
      errorMessage.includes("credit balance") || errorMessage.includes("billing") || errorMessage.includes("upgrade")

    const reason = isCreditError
      ? "The app requires additional API credits to generate more studies."
      : "There was an error connecting to the AI service. This could be due to network issues or service unavailability."

    return {
      title: `Study on ${topic} (Unavailable)`,
      verses: ["Psalm 119:105", "Proverbs 2:6"],
      context: `We're currently unable to generate a complete study on "${topic}".`,
      keyPoints: [
        "The full version would provide detailed insights on your topic",
        "Technical limitations prevented generating the complete study",
        "We apologize for the inconvenience",
      ],
      application: "We encourage you to explore this topic in Scripture directly.",
      isApiError: true,
      cannotGenerate: true,
      reason: reason,
    }
  }
}
