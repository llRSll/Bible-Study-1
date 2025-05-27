"use server"

import { anthropic } from "@ai-sdk/anthropic"
import { generateText } from "ai"
import { createClient } from "@/utils/supabase/server"

// Cache for storing fetched verses to avoid duplicate requests
const verseCache = new Map<string, { text: string; copyright: string }>()

// Interface for verse response
export interface VerseResponse {
  reference: string;
  text: string;
  translation: string;
  copyright?: string;
  error?: string;
}

// API.Bible configuration
const API_KEY = process.env.BIBLE_API_KEY!
const API_URL = process.env.BIBLE_API_URL!

// Bible IDs for different translations
const BIBLE_IDS = {
  ESV: process.env.ESV!, // English Standard Version
  KJV: process.env.KJV!, // King James Version
  NIV: process.env.NIV!, // New International Version
  NASB: process.env.NASB!, // New American Standard Bible
  NLT: process.env.NLT!, // New Living Translation
}

// Default Bible ID if translation not found
const DEFAULT_BIBLE_ID = BIBLE_IDS.ESV

// Common verses for fallback and search matching
const commonVerses: Record<string, string> = {
  "John 3:16":
    "For God so loved the world, that he gave his only Son, that whoever believes in him should not perish but have eternal life.",
  "Romans 8:28":
    "And we know that for those who love God all things work together for good, for those who are called according to his purpose.",
  "Philippians 4:13": "I can do all things through him who strengthens me.",
  "Psalm 23:1": "The LORD is my shepherd; I shall not want.",
  "Matthew 6:33": 
      "But seek first the kingdom of God and his righteousness, and all these things will be added to you.",
  "Proverbs 3:5-6":
    "Trust in the LORD with all your heart, and do not lean on your own understanding. In all your ways acknowledge him, and he will make straight your paths.",
  "1 John 4:7-8":
    "Beloved, let us love one another, for love is from God, and whoever loves has been born of God and knows God. Anyone who does not love does not know God, because God is love.",
  "Matthew 5:3-4":
    "Blessed are the poor in spirit, for theirs is the kingdom of heaven. Blessed are those who mourn, for they will be comforted.",
  "Matthew 5:5-6":
    "Blessed are the meek, for they will inherit the earth. Blessed are those who hunger and thirst for righteousness, for they will be filled.",
  "Matthew 5:7-8":
    "Blessed are the merciful, for they will be shown mercy. Blessed are the pure in heart, for they will see God.",
  "Matthew 6:14-15":
    "For if you forgive others their trespasses, your heavenly Father will also forgive you, but if you do not forgive others their trespasses, neither will your Father forgive your trespasses.",
  "Colossians 3:13":
    "Bearing with one another and, if one has a complaint against another, forgiving each other; as the Lord has forgiven you, so you also must forgive.",
  "Hebrews 11:1":
   "Now faith is the assurance of things hoped for, the conviction of things not seen.",
  "Romans 10:17": 
  "So faith comes from hearing, and hearing through the word of Christ.",
  "Galatians 5:22-23":
    "But the fruit of the Spirit is love, joy, peace, patience, kindness, goodness, faithfulness, gentleness, self-control; against such things there is no law.",
  // Add more verses related to forgiveness for the forgiveness study
  "Matthew 18:21-22":
    'Then Peter came up and said to him, "Lord, how often will my brother sin against me, and I forgive him? As many as seven times?" Jesus said to him, "I do not say to you seven times, but seventy-seven times."',
  "Ephesians 4:32": 
       "Be kind to one another, tenderhearted, forgiving one another, as God in Christ forgave you.",
  "Mark 11:25":
    "And whenever you stand praying, forgive, if you have anything against anyone, so that your Father also who is in heaven may forgive you your trespasses.",
  "Luke 6:37":
    "Judge not, and you will not be judged; condemn not, and you will not be condemned; forgive, and you will be forgiven.",
  "1 John 1:9":
    "If we confess our sins, he is faithful and just to forgive us our sins and to cleanse us from all unrighteousness.",
  "Acts 3:19": 
      "Repent therefore, and turn back, that your sins may be blotted out.",
  // Add more verses for common topics
  "Matthew 11:28-30":
    "Come to me, all who labor and are heavy laden, and I will give you rest. Take my yoke upon you, and learn from me, for I am gentle and lowly in heart, and you will find rest for your souls. For my yoke is easy, and my burden is light.",
  "Isaiah 41:10":
    "Fear not, for I am with you; be not dismayed, for I am your God; I will strengthen you, I will help you, I will uphold you with my righteous right hand.",
  "Philippians 4:6-7":
    "Do not be anxious about anything, but in everything by prayer and supplication with thanksgiving let your requests be made known to God. And the peace of God, which surpasses all understanding, will guard your hearts and your minds in Christ Jesus.",
  "Joshua 1:9":
    "Have I not commanded you? Be strong and courageous. Do not be frightened, and do not be dismayed, for the LORD your God is with you wherever you go.",
  "Romans 12:2":
    "Do not be conformed to this world, but be transformed by the renewal of your mind, that by testing you may discern what is the will of God, what is good and acceptable and perfect.",
  "2 Corinthians 5:17":
    "Therefore, if anyone is in Christ, he is a new creation. The old has passed away; behold, the new has come.",
  "Psalm 46:1":
     "God is our refuge and strength, a very present help in trouble.",
  "Psalm 27:1":
    "The LORD is my light and my salvation; whom shall I fear? The LORD is the stronghold of my life; of whom shall I be afraid?",
  "Psalm 34:17-18":
    "When the righteous cry for help, the LORD hears and delivers them out of all their troubles. The LORD is near to the brokenhearted and saves the crushed in spirit.",
  "Psalm 55:22":
    "Cast your burden on the LORD, and he will sustain you; he will never permit the righteous to be moved.",
  "Psalm 91:1-2":
    "He who dwells in the shelter of the Most High will abide in the shadow of the Almighty. I will say to the LORD, 'My refuge and my fortress, my God, in whom I trust.'",
  "Psalm 121:1-2":
    "I lift up my eyes to the hills. From where does my help come? My help comes from the LORD, who made heaven and earth.",
  "Psalm 139:23-24":
    "Search me, O God, and know my heart! Try me and know my thoughts! And see if there be any grievous way in me, and lead me in the way everlasting!",
  "Psalm 147:3": "He heals the brokenhearted and binds up their wounds.",
  "Lamentations 3:22-23":
    "The steadfast love of the LORD never ceases; his mercies never come to an end; they are new every morning; great is your faithfulness.",
  "Matthew 28:19-20":
    "Go therefore and make disciples of all nations, baptizing them in the name of the Father and of the Son and of the Holy Spirit, teaching them to observe all that I have commanded you. And behold, I am with you always, to the end of the age.",
  "John 14:6":
    "Jesus said to him, 'I am the way, and the truth, and the life. No one comes to the Father except through me.'",
  "John 15:13": 
      "Greater love has no one than this, that someone lay down his life for his friends.",
  "Romans 5:8": 
        "But God shows his love for us in that while we were still sinners, Christ died for us.",
  "Romans 8:38-39":
    "For I am sure that neither death nor life, nor angels nor rulers, nor things present nor things to come, nor powers, nor height nor depth, nor anything else in all creation, will be able to separate us from the love of God in Christ Jesus our Lord.",
  "1 Corinthians 10:13":
    "No temptation has overtaken you that is not common to man. God is faithful, and he will not let you be tempted beyond your ability, but with the temptation he will also provide the way of escape, that you may be able to endure it.",
  "2 Corinthians 12:9":
    "But he said to me, 'My grace is sufficient for you, for my power is made perfect in weakness.' Therefore I will boast all the more gladly of my weaknesses, so that the power of Christ may rest upon me.",
  "Galatians 2:20":
    "I have been crucified with Christ. It is no longer I who live, but Christ who lives in me. And the life I now live in the flesh I live by faith in the Son of God, who loved me and gave himself for me.",
  "Ephesians 2:8-9":
    "For by grace you have been saved through faith. And this is not your own doing; it is the gift of God, not a result of works, so that no one may boast.",
  "Philippians 1:6":
    "And I am sure of this, that he who began a good work in you will bring it to completion at the day of Jesus Christ.",
  "Philippians 4:8":
    "Finally, brothers, whatever is true, whatever is honorable, whatever is just, whatever is pure, whatever is lovely, whatever is commendable, if there is any excellence, if there is anything worthy of praise, think about these things.",
  "Colossians 3:23-24":
    "Whatever you do, work heartily, as for the Lord and not for men, knowing that from the Lord you will receive the inheritance as your reward. You are serving the Lord Christ.",
  "2 Timothy 1:7":
       "For God gave us a spirit not of fear but of power and love and self-control.",
  "Hebrews 4:16":
    "Let us then with confidence draw near to the throne of grace, that we may receive mercy and find grace to help in time of need.",
  "Hebrews 13:5":
    "Keep your life free from love of money, and be content with what you have, for he has said, 'I will never leave you nor forsake you.'",
  "James 1:2-4":
    "Count it all joy, my brothers, when you meet trials of various kinds, for you know that the testing of your faith produces steadfastness. And let steadfastness have its full effect, that you may be perfect and complete, lacking in nothing.",
  "James 4:7": 
     "Submit yourselves therefore to God. Resist the devil, and he will flee from you.",
  "1 Peter 5:7": "Casting all your anxieties on him, because he cares for you.",
  "1 John 3:16":
    "By this we know love, that he laid down his life for us, and we ought to lay down our lives for the brothers.",
  "Revelation 21:4":
    "He will wipe away every tear from their eyes, and death shall be no more, neither shall there be mourning, nor crying, nor pain anymore, for the former things have passed away.",
}

// Flag to track if we've logged the API issue
let apiIssueLogged = false

// Cache for storing daily verses with stable keys
const CACHE_VERSION = 'v1';

// Cache for the daily verse with 24-hour expiration
interface DailyVerseCache {
  verse: VerseResponse;
  timestamp: number;
}

interface DailyVerse {
  id: string;
  reference: string;
  text: string;
  translation: string;
  copyright: string;
  date: string;
}

// Get daily verse from Supabase or create it if it doesn't exist for today
export async function getDailyVerse(translation = "ESV"): Promise<VerseResponse> {
  try {
    // Create a stable date key for today in ISO format (YYYY-MM-DD)
    const today = new Date();
    const dateKey = today.toISOString().split('T')[0];
    
    // Check client-side cache first (if we're in a browser environment)
    if (typeof window !== 'undefined') {
      try {
        const cachedData = localStorage.getItem(`dailyVerse_${dateKey}_${translation}`);
        if (cachedData) {
          const cache = JSON.parse(cachedData) as DailyVerseCache;
          const now = new Date();
          const cachedDate = new Date(cache.timestamp);
          
          // Check if the cached verse is from today (same date)
          // This ensures the cache expires at midnight
          if (now.toDateString() === cachedDate.toDateString()) {
            console.log("Using client-side cached daily verse");
            return cache.verse;
          } else {
            // Cache is from a previous day, remove it
            localStorage.removeItem(`dailyVerse_${dateKey}_${translation}`);
          }
        }
      } catch (cacheError) {
        console.log("Error reading from client cache:", cacheError);
        // Continue with server-side logic if client cache fails
      }
    }
    
    // Initialize Supabase client
    const supabase = await createClient();
    
    // Try to get today's verse from the database
    const { data: dailyVerse, error } = await supabase
      .from('daily_verses')
      .select('*')
      .eq('date', dateKey)
      .single();
    
    // If we found today's verse in the database, return it
    if (dailyVerse && !error) {
      const verseResponse = {
        reference: dailyVerse.reference,
        text: dailyVerse.text,
        translation: dailyVerse.translation,
        copyright: dailyVerse.copyright,
      };
      
      // Save to client-side cache if in browser
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(`dailyVerse_${dateKey}_${translation}`, JSON.stringify({
            verse: verseResponse,
            timestamp: Date.now()
          }));
        } catch (storageError) {
          console.log("Error saving to client cache:", storageError);
          // Continue even if we can't cache
        }
      }
      
      return verseResponse;
    }
    
    // If we don't have today's verse, generate a new one using a consistent method
    // Use the date to generate a deterministic verse reference
    
    // Create a deterministic hash based on today's date
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
    const year = today.getFullYear();
    
    // Generate a verse reference using the date
    // This creates a specific book, chapter, and verse pattern that changes daily
    
    // Define Bible book structure for more dynamic verse selection
    const bibleBooks = [
      // Old Testament books with approximate chapter counts
      { name: "Genesis", chapters: 50 },
      { name: "Matthew", chapters: 28 },
      { name: "Exodus", chapters: 40 },
      { name: "Mark", chapters: 16 },
      { name: "Leviticus", chapters: 27 },
      { name: "Luke", chapters: 24 },
      { name: "Numbers", chapters: 36 },
      { name: "John", chapters: 21 },
      { name: "Deuteronomy", chapters: 34 },
      { name: "Acts", chapters: 28 },
      { name: "Joshua", chapters: 24 },
      { name: "Romans", chapters: 16 },
      { name: "Judges", chapters: 21 },
      { name: "1 Corinthians", chapters: 16 },
      { name: "Ruth", chapters: 4 },
      { name: "2 Corinthians", chapters: 13 },
      { name: "1 Samuel", chapters: 31 },
      { name: "Galatians", chapters: 6 },
      { name: "2 Samuel", chapters: 24 },
      { name: "Ephesians", chapters: 6 },
      { name: "1 Kings", chapters: 22 },
      { name: "Philippians", chapters: 4 },
      { name: "2 Kings", chapters: 25 },
      { name: "Colossians", chapters: 4 },
      { name: "1 Chronicles", chapters: 29 },
      { name: "1 Thessalonians", chapters: 5 },
      { name: "2 Chronicles", chapters: 36 },
      { name: "2 Thessalonians", chapters: 3 },
      { name: "Ezra", chapters: 10 },
      { name: "1 Timothy", chapters: 6 },
      { name: "Nehemiah", chapters: 13 },
      { name: "2 Timothy", chapters: 4 },
      { name: "Esther", chapters: 10 },
      { name: "Titus", chapters: 3 },
      { name: "Job", chapters: 42 },
      { name: "Philemon", chapters: 1 },
      { name: "Psalms", chapters: 150 },
      { name: "Hebrews", chapters: 13 },
      { name: "Proverbs", chapters: 31 },
      { name: "James", chapters: 5 },
      { name: "Ecclesiastes", chapters: 12 },
      { name: "1 Peter", chapters: 5 },
      { name: "Song of Solomon", chapters: 8 },
      { name: "2 Peter", chapters: 3 },
      { name: "Isaiah", chapters: 66 },
      { name: "1 John", chapters: 5 },
      { name: "Jeremiah", chapters: 52 },
      { name: "2 John", chapters: 1 },
      { name: "Lamentations", chapters: 5 },
      { name: "3 John", chapters: 1 },
      { name: "Ezekiel", chapters: 48 },
      { name: "Jude", chapters: 1 },
      { name: "Daniel", chapters: 12 },
      { name: "Revelation", chapters: 22 },
      { name: "Hosea", chapters: 14 },
      { name: "Joel", chapters: 3 },
      { name: "Amos", chapters: 9 },
      { name: "Obadiah", chapters: 1 },
      { name: "Jonah", chapters: 4 },
      { name: "Micah", chapters: 7 },
      { name: "Nahum", chapters: 3 },
      { name: "Habakkuk", chapters: 3 },
      { name: "Zephaniah", chapters: 3 },
      { name: "Haggai", chapters: 2 },
      { name: "Zechariah", chapters: 14 },
      { name: "Malachi", chapters: 4 },
    ];
    
    // Function to get a randomized list of Bible books
    function getRandomizedBibleBooks() {
      // Create a copy of the bibleBooks array to avoid modifying the original
      const books = [...bibleBooks];
      
      // Fisher-Yates shuffle algorithm to randomize the order
      for (let i = books.length - 1; i > 0; i--) {
        // Generate a random index between 0 and i
        const j = Math.floor(Math.random() * (i + 1));
        // Swap elements at indices i and j
        [books[i], books[j]] = [books[j], books[i]];
      }
      
      return books;
    }
    
    // Generate a hash value from the date
    const dateHash = (dayOfYear + year) % 366;
    
    // Get randomized Bible books
    const randomizedBooks = getRandomizedBibleBooks();
    
    // Use the hash to select a book
    const bookIndex = dateHash % randomizedBooks.length;
    const book = randomizedBooks[bookIndex];
    
    // Generate a chapter number (1-based)
    const chapterHash = (dateHash * 31) % book.chapters + 1;
    
    // Generate a verse number (typically 1-30, but might exceed actual verses in some chapters)
    // We'll limit to a reasonable range to avoid invalid references
    const verseNumber = (dateHash * 13) % 30 + 1;
    
    // Create the reference
    const reference = `${book.name} ${chapterHash}:${verseNumber}`;
    
    // Try to fetch this verse from the Bible API
    let verseResponse: VerseResponse;
    try {
      verseResponse = await fetchVerse(reference, translation);
    } catch (fetchError) {
      console.error("Error fetching daily verse from API:", fetchError);
      // If fetching fails, fall back to a well-known verse based on the date
      const fallbackVerses = Object.keys(commonVerses);
      const fallbackIndex = dateHash % fallbackVerses.length;
      const fallbackReference = fallbackVerses[fallbackIndex];
      
      verseResponse = {
        reference: fallbackReference,
        text: commonVerses[fallbackReference],
        translation,
        copyright: `Scripture from ${translation}`,
      };
    }
    
    // Store the verse in the database for future requests
    await storeNewDailyVerse(verseResponse, dateKey);
    
    // Save to client-side cache if in browser
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`dailyVerse_${dateKey}_${translation}`, JSON.stringify({
          verse: verseResponse,
          timestamp: Date.now()
        }));
      } catch (storageError) {
        console.log("Error saving to client cache:", storageError);
        // Continue even if we can't cache
      }
    }
    
    return verseResponse;
  } catch (error) {
    console.error("Error getting daily verse:", error);
    
    // If there's an error with the database, fall back to the local implementation
    // Create a stable cache key that changes only once per day
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
    const year = today.getFullYear();
    const dateHash = (dayOfYear + year) % 366;
    
    // Use the daily key to select a consistent verse
    const availableVerses = Object.keys(commonVerses);
    const index = dateHash % availableVerses.length;
    const reference = availableVerses[index];
    
    // Return the verse from our common verses
    const fallbackVerseResponse = {
      reference,
      text: commonVerses[reference],
      translation,
      copyright: `Scripture from ${translation}`,
    };
    
    // Save fallback verse to client-side cache if in browser
    if (typeof window !== 'undefined') {
      try {
        const dateKey = today.toISOString().split('T')[0];
        localStorage.setItem(`dailyVerse_${dateKey}_${translation}`, JSON.stringify({
          verse: fallbackVerseResponse,
          timestamp: Date.now()
        }));
      } catch (storageError) {
        console.log("Error saving fallback verse to client cache:", storageError);
      }
    }
    
    return fallbackVerseResponse;
  }
}

// Store a new daily verse in the database
async function storeNewDailyVerse(verse: VerseResponse, dateKey: string): Promise<void> {
  try {
    const supabase = await createClient();
    
    // Insert the new daily verse
    const { error } = await supabase
      .from('daily_verses')
      .insert({
        reference: verse.reference,
        text: verse.text,
        translation: verse.translation,
        copyright: verse.copyright || `Scripture from ${verse.translation}`,
        date: dateKey,
      });
    
    if (error) {
      console.error("Error storing daily verse:", error);
    }
  } catch (error) {
    console.error("Error in storeNewDailyVerse:", error);
  }
}

/**
 * Fetches a Bible verse from the API.Bible service
 * @param reference The Bible verse reference (e.g., "John 3:16", "Romans 8:28-30")
 * @param translation The Bible translation to use (default: "ESV")
 */
export async function fetchVerse(reference: string, translation = "ESV"): Promise<VerseResponse> {
  try {
    // Normalize the reference by removing extra spaces
    const normalizedRef = reference.trim();
    const cacheKey = `${normalizedRef}-${translation}`;

    // Check if we have this verse cached
    if (verseCache.has(cacheKey)) {
      const cached = verseCache.get(cacheKey)!;
      return {
        reference,
        text: cached.text,
        translation,
        copyright: cached.copyright,
      };
    }

    // Check if we have this verse in our local database first
    // This is a faster path and avoids API calls when possible
    if (normalizedRef in commonVerses) {
      const text = commonVerses[normalizedRef];

      // Cache the result
      verseCache.set(cacheKey, {
        text,
        copyright: `Scripture from ${translation}`,
      });

      return {
        reference,
        text,
        translation,
        copyright: `Scripture from ${translation}`,
      };
    }

    // Get the Bible ID for the requested translation
    const bibleId = BIBLE_IDS[translation as keyof typeof BIBLE_IDS] || DEFAULT_BIBLE_ID;

    // First, we need to search for the verse to get its ID
    const searchResponse = await fetch(
      `${API_URL}/bibles/${bibleId}/search?query=${encodeURIComponent(normalizedRef)}`,
      {
        headers: {
          "api-key": API_KEY,
        },
        next: { revalidate: 86400 }, // Cache for 24 hours
      }
    );

    if (!searchResponse.ok) {
      // Log the API issue only once to avoid flooding the console
      if (!apiIssueLogged) {
        console.error(`Bible API error: ${searchResponse.status} ${searchResponse.statusText}`);
        apiIssueLogged = true;
      }

      // If we get a 403 error, the API key is likely invalid or expired
      // Immediately use the fallback without further API attempts
      return await fetchFallbackVerse(reference, translation);
    }

    const searchData = await searchResponse.json();

    if (!searchData.data || !searchData.data.passages || searchData.data.passages.length === 0) {
      console.log("No passages found for reference:", reference)
      return await fetchFallbackVerse(reference, translation)
    }

    // Get the first passage that matches our reference
    const passage = searchData.data.passages[0]
    
    // Use our utility function to extract clean text from the HTML content
    const text = extractTextFromHtml(passage.content)

    // Cache the result
    verseCache.set(cacheKey, {
      text,
      copyright: searchData.data.copyright || `Scripture from ${translation}`,
    })

    return {
      reference,
      text,
      translation,
      copyright: searchData.data.copyright,
    }
  } catch (error) {
    console.error("Error fetching verse:", error)
    return await fetchFallbackVerse(reference, translation)
  }
}

/**
 * Alternative method to fetch a verse by its ID
 * This is used when we already know the verse ID
 */
async function fetchVerseById(
  bibleId: string,
  verseId: string,
  reference: string,
  translation: string
): Promise<VerseResponse> {
  try {
    // Check if we have this verse in our local database first
    if (reference in commonVerses) {
      const text = commonVerses[reference]

      // Cache the result
      verseCache.set(`${reference}-${translation}`, {
        text,
        copyright: `Scripture from ${translation}`,
      })

      return {
        reference,
        text,
        translation,
        copyright: `Scripture from ${translation}`,
      }
    }

    const response = await fetch(`${API_URL}/bibles/${bibleId}/verses/${verseId}?content-type=text`, {
      headers: {
        "api-key": API_KEY,
      },
      next: { revalidate: 86400 }, // Cache for 24 hours
    }
  );

    if (!response.ok) {
      // If we get a 403 error, immediately use the fallback
      return await fetchFallbackVerse(reference, translation);
    }

    const data = await response.json();

    if (!data.data) {
      throw new Error("Invalid response format");
    }

    const text = data.data.content.replace(/<[^>]*>/g, ""); // Remove HTML tags

    // Cache the result
    const cacheKey = `${reference}-${translation}`;
    verseCache.set(cacheKey, {
      text,
      copyright: data.data.copyright || `Scripture from ${translation}`,
    });

    return {
      reference,
      text,
      translation,
      copyright: data.data.copyright,
    };
  } catch (error) {
    console.error("Error fetching verse by ID:", error);
    return await fetchFallbackVerse(reference, translation);
  }
}

/**
 * Fallback method when the primary API fails or for unsupported translations
 */
async function fetchFallbackVerse(reference: string, translation: string): Promise<VerseResponse> {
  // This is a fallback that uses predefined verses
  // For common verses, we provide the text directly

  // Check if we have this verse in our common verses
  if (reference in commonVerses) {
    const text = commonVerses[reference];

    // Cache the result
    verseCache.set(`${reference}-${translation}`, {
      text,
      copyright: `Scripture from ${translation}`,
    });

    return {
      reference,
      text,
      translation,
      copyright: `Scripture from ${translation}`,
    };
  }

  // For references we don't have, try to parse the reference and fetch from API.Bible
  try {
    // Try a different approach with the API.Bible - using the passages endpoint
    const bibleId = BIBLE_IDS[translation as keyof typeof BIBLE_IDS] || DEFAULT_BIBLE_ID;

    // Only attempt this if we haven't already determined the API is having issues
    if (!apiIssueLogged) {
      const passageResponse = await fetch(`${API_URL}/bibles/${bibleId}/passages?q=${encodeURIComponent(reference)}`, {
        headers: {
          "api-key": API_KEY,
        },
        next: { revalidate: 86400 }, // Cache for 24 hours
      })

      if (passageResponse.ok) {
        const passageData = await passageResponse.json();

        if (passageData.data && passageData.data.length > 0) {
          const passage = passageData.data[0];
          const text = passage.content.replace(/<[^>]*>/g, ""); // Remove HTML tags

          // Cache the result
          verseCache.set(`${reference}-${translation}`, {
            text,
            copyright: passage.copyright || `Scripture from ${translation}`,
          });

          return {
            reference,
            text,
            translation,
            copyright: passage.copyright,
          };
        }
      } else {
        // Mark that we've encountered API issues to avoid further attempts
        apiIssueLogged = true;
      }
    }

    // If all else fails, return a generic message with the reference
    return {
      reference,
      text: `"${reference}" - This verse is available in your Bible. We're currently using offline mode for verse lookup.`,
      translation,
      copyright: "Please refer to your physical Bible for the complete text.",
    };
  } catch (error) {
    console.error("Error in fallback verse fetch:", error);

    // Return a generic message when all attempts fail
    return {
      reference,
      text: `"${reference}" - This verse is available in your Bible. We're currently using offline mode for verse lookup.`,
      translation,
      copyright: "Please refer to your physical Bible for the complete text.",
    };
  }
}

/**
 * Fetches multiple verses at once
 */
export async function fetchVerses(references: string[], translation = "ESV"): Promise<VerseResponse[]> {
  const promises = references.map((ref) => fetchVerse(ref, translation));
  return Promise.all(promises);
}

/**
 * Gets available Bible translations
 */
export async function getAvailableTranslations(): Promise<{ id: string; name: string; abbreviation: string }[]> {
  // If we've already encountered API issues, return default translations immediately
  if (apiIssueLogged) {
    return [
      { id: BIBLE_IDS.ESV, name: "English Standard Version", abbreviation: "ESV" },
      { id: BIBLE_IDS.KJV, name: "King James Version", abbreviation: "KJV" },
      { id: BIBLE_IDS.NIV, name: "New International Version", abbreviation: "NIV" },
      { id: BIBLE_IDS.NASB, name: "New American Standard Bible", abbreviation: "NASB" },
      { id: BIBLE_IDS.NLT, name: "New Living Translation", abbreviation: "NLT" },
    ]
  }

  try {
    const response = await fetch(`${API_URL}/bibles`, {
      headers: {
        "api-key": API_KEY,
      },
      next: { revalidate: 86400 }, // Cache for 24 hours
    });

    if (!response.ok) {
      // Mark that we've encountered API issues
      apiIssueLogged = true;
      throw new Error(
        `Failed to fetch translations: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    if (!data.data) {
      throw new Error("Invalid response format");
    }

    return data.data.map((bible: any) => ({
      id: bible.id,
      name: bible.name,
      abbreviation: bible.abbreviation,
    }));
  } catch (error) {
    console.error("Error fetching translations:", error);

    // Mark that we've encountered API issues
    apiIssueLogged = true;

    // Return default translations when API fails
    return [
      { id: BIBLE_IDS.ESV, name: "English Standard Version", abbreviation: "ESV" },
      { id: BIBLE_IDS.KJV, name: "King James Version", abbreviation: "KJV" },
      { id: BIBLE_IDS.NIV, name: "New International Version", abbreviation: "NIV" },
      { id: BIBLE_IDS.NASB, name: "New American Standard Bible", abbreviation: "NASB" },
      { id: BIBLE_IDS.NLT, name: "New Living Translation", abbreviation: "NLT" },
    ]
  }
}

// Mock search results for common search terms
const MOCK_SEARCH_RESULTS = {
  love: [
    {
      reference: "John 3:16",
      text: "For God so loved the world, that he gave his only Son, that whoever believes in him should not perish but have eternal life.",
      copyright: "Scripture quotations are from the ESV® Bible, copyright © 2001 by Crossway.",
    },
    {
      reference: "1 Corinthians 13:4-7",
      text: "Love is patient and kind; love does not envy or boast; it is not arrogant or rude. It does not insist on its own way; it is not irritable or resentful; it does not rejoice at wrongdoing, but rejoices with the truth. Love bears all things, believes all things, hopes all things, endures all things.",
      copyright: "Scripture quotations are from the ESV® Bible, copyright © 2001 by Crossway.",
    },
    {
      reference: "1 John 4:7-8",
      text: "Beloved, let us love one another, for love is from God, and whoever loves has been born of God and knows God. Anyone who does not love does not know God, because God is love.",
      copyright: "Scripture quotations are from the ESV® Bible, copyright © 2001 by Crossway.",
    },
  ],
  faith: [
    {
      reference: "Hebrews 11:1",
      text: "Now faith is the assurance of things hoped for, the conviction of things not seen.",
      copyright: "Scripture quotations are from the ESV® Bible, copyright © 2001 by Crossway.",
    },
    {
      reference: "Romans 10:17",
      text: "So faith comes from hearing, and hearing through the word of Christ.",
      copyright: "Scripture quotations are from the ESV® Bible, copyright © 2001 by Crossway.",
    },
    {
      reference: "Ephesians 2:8-9",
      text: "For by grace you have been saved through faith. And this is not your own doing; it is the gift of God, not a result of works, so that no one may boast.",
      copyright: "Scripture quotations are from the ESV® Bible, copyright © 2001 by Crossway.",
    },
  ],
  hope: [
    {
      reference: "Romans 15:13",
      text: "May the God of hope fill you with all joy and peace in believing, so that by the power of the Holy Spirit you may abound in hope.",
      copyright: "Scripture quotations are from the ESV® Bible, copyright © 2001 by Crossway.",
    },
    {
      reference: "Jeremiah 29:11",
      text: "For I know the plans I have for you, declares the LORD, plans for welfare and not for evil, to give you a future and a hope.",
      copyright: "Scripture quotations are from the ESV® Bible, copyright © 2001 by Crossway.",
    },
  ],
  forgiveness: [
    {
      reference: "Matthew 6:14-15",
      text: "For if you forgive others their trespasses, your heavenly Father will also forgive you, but if you do not forgive others their trespasses, neither will your Father forgive your trespasses.",
      copyright: "Scripture quotations are from the ESV® Bible, copyright © 2001 by Crossway.",
    },
    {
      reference: "Colossians 3:13",
      text: "Bearing with one another and, if one has a complaint against another, forgiving each other; as the Lord has forgiven you, so you also must forgive.",
      copyright: "Scripture quotations are from the ESV® Bible, copyright © 2001 by Crossway.",
    },
    {
      reference: "Ephesians 4:32",
      text: "Be kind to one another, tenderhearted, forgiving one another, as God in Christ forgave you.",
      copyright: "Scripture quotations are from the ESV® Bible, copyright © 2001 by Crossway.",
    },
  ],
  prayer: [
    {
      reference: "Philippians 4:6-7",
      text: "Do not be anxious about anything, but in everything by prayer and supplication with thanksgiving let your requests be made known to God. And the peace of God, which surpasses all understanding, will guard your hearts and your minds in Christ Jesus.",
      copyright: "Scripture quotations are from the ESV® Bible, copyright © 2001 by Crossway.",
    },
    {
      reference: "1 Thessalonians 5:16-18",
      text: "Rejoice always, pray without ceasing, give thanks in all circumstances; for this is the will of God in Christ Jesus for you.",
      copyright: "Scripture quotations are from the ESV® Bible, copyright © 2001 by Crossway.",
    },
  ],
  peace: [
    {
      reference: "John 14:27",
      text: "Peace I leave with you; my peace I give to you. Not as the world gives do I give to you. Let not your hearts be troubled, neither let them be afraid.",
      copyright: "Scripture quotations are from the ESV® Bible, copyright © 2001 by Crossway.",
    },
    {
      reference: "Isaiah 26:3",
      text: "You keep him in perfect peace whose mind is stayed on you, because he trusts in you.",
      copyright: "Scripture quotations are from the ESV® Bible, copyright © 2001 by Crossway.",
    },
  ],
  joy: [
    {
      reference: "James 1:2-3",
      text: "Count it all joy, my brothers, when you meet trials of various kinds, for you know that the testing of your faith produces steadfastness.",
      copyright: "Scripture quotations are from the ESV® Bible, copyright © 2001 by Crossway.",
    },
    {
      reference: "Psalm 16:11",
      text: "You make known to me the path of life; in your presence there is fullness of joy; at your right hand are pleasures forevermore.",
      copyright: "Scripture quotations are from the ESV® Bible, copyright © 2001 by Crossway.",
    },
  ],
  wisdom: [
    {
      reference: "Proverbs 1:7",
      text: "The fear of the LORD is the beginning of knowledge; fools despise wisdom and instruction.",
      copyright: "Scripture quotations are from the ESV® Bible, copyright © 2001 by Crossway.",
    },
    {
      reference: "James 1:5",
      text: "If any of you lacks wisdom, let him ask God, who gives generously to all without reproach, and it will be given him.",
      copyright: "Scripture quotations are from the ESV® Bible, copyright © 2001 by Crossway.",
    },
  ],
  strength: [
    {
      reference: "Isaiah 40:31",
      text: "But they who wait for the LORD shall renew their strength; they shall mount up with wings like eagles; they shall run and not be weary; they shall walk and not faint.",
      copyright: "Scripture quotations are from the ESV® Bible, copyright © 2001 by Crossway.",
    },
    {
      reference: "Philippians 4:13",
      text: "I can do all things through him who strengthens me.",
      copyright: "Scripture quotations are from the ESV® Bible, copyright © 2001 by Crossway.",
    },
  ],
  salvation: [
    {
      reference: "Romans 10:9-10",
      text: "Because, if you confess with your mouth that Jesus is Lord and believe in your heart that God raised him from the dead, you will be saved. For with the heart one believes and is justified, and with the mouth one confesses and is saved.",
      copyright: "Scripture quotations are from the ESV® Bible, copyright © 2001 by Crossway.",
    },
    {
      reference: "Ephesians 2:8-9",
      text: "For by grace you have been saved through faith. And this is not your own doing; it is the gift of God, not a result of works, so that no one may boast.",
      copyright: "Scripture quotations are from the ESV® Bible, copyright © 2001 by Crossway.",
    },
  ],
  anxiety: [
    {
      reference: "Philippians 4:6-7",
      text: "Do not be anxious about anything, but in everything by prayer and supplication with thanksgiving let your requests be made known to God. And the peace of God, which surpasses all understanding, will guard your hearts and your minds in Christ Jesus.",
      copyright: "Scripture quotations are from the ESV® Bible, copyright © 2001 by Crossway.",
    },
    {
      reference: "1 Peter 5:7",
      text: "Casting all your anxieties on him, because he cares for you.",
      copyright: "Scripture quotations are from the ESV® Bible, copyright © 2001 by Crossway.",
    },
    {
      reference: "Matthew 6:25-27",
      text: "Therefore I tell you, do not be anxious about your life, what you will eat or what you will drink, nor about your body, what you will put on. Is not life more than food, and the body more than clothing? Look at the birds of the air: they neither sow nor reap nor gather into barns, and yet your heavenly Father feeds them. Are you not of more value than they? And which of you by being anxious can add a single hour to his span of life?",
      copyright: "Scripture quotations are from the ESV® Bible, copyright © 2001 by Crossway.",
    },
  ],
  fear: [
    {
      reference: "2 Timothy 1:7",
      text: "For God gave us a spirit not of fear but of power and love and self-control.",
      copyright: "Scripture quotations are from the ESV® Bible, copyright © 2001 by Crossway.",
    },
    {
      reference: "Isaiah 41:10",
      text: "Fear not, for I am with you; be not dismayed, for I am your God; I will strengthen you, I will help you, I will uphold you with my righteous right hand.",
      copyright: "Scripture quotations are from the ESV® Bible, copyright © 2001 by Crossway.",
    },
    {
      reference: "Psalm 34:4",
      text: "I sought the LORD, and he answered me and delivered me from all my fears.",
      copyright: "Scripture quotations are from the ESV® Bible, copyright © 2001 by Crossway.",
    },
  ],
  healing: [
    {
      reference: "Psalm 147:3",
      text: "He heals the brokenhearted and binds up their wounds.",
      copyright: "Scripture quotations are from the ESV® Bible, copyright © 2001 by Crossway.",
    },
    {
      reference: "Jeremiah 17:14",
      text: "Heal me, O LORD, and I shall be healed; save me, and I shall be saved, for you are my praise.",
      copyright: "Scripture quotations are from the ESV® Bible, copyright © 2001 by Crossway.",
    },
    {
      reference: "James 5:14-15",
      text: "Is anyone among you sick? Let him call for the elders of the church, and let them pray over him, anointing him with oil in the name of the Lord. And the prayer of faith will save the one who is sick, and the Lord will raise him up. And if he has committed sins, he will be forgiven.",
      copyright: "Scripture quotations are from the ESV® Bible, copyright © 2001 by Crossway.",
    },
  ],
  guidance: [
    {
      reference: "Proverbs 3:5-6",
      text: "Trust in the LORD with all your heart, and do not lean on your own understanding. In all your ways acknowledge him, and he will make straight your paths.",
      copyright: "Scripture quotations are from the ESV® Bible, copyright © 2001 by Crossway.",
    },
    {
      reference: "Psalm 32:8",
      text: "I will instruct you and teach you in the way you should go; I will counsel you with my eye upon you.",
      copyright: "Scripture quotations are from the ESV® Bible, copyright © 2001 by Crossway.",
    },
    {
      reference: "James 1:5",
      text: "If any of you lacks wisdom, let him ask God, who gives generously to all without reproach, and it will be given him.",
      copyright: "Scripture quotations are from the ESV® Bible, copyright © 2001 by Crossway.",
    },
  ],
  comfort: [
    {
      reference: "2 Corinthians 1:3-4",
      text: "Blessed be the God and Father of our Lord Jesus Christ, the Father of mercies and God of all comfort, who comforts us in all our affliction, so that we may be able to comfort those who are in any affliction, with the comfort with which we ourselves are comforted by God.",
      copyright: "Scripture quotations are from the ESV® Bible, copyright © 2001 by Crossway.",
    },
    {
      reference: "Psalm 23:4",
      text: "Even though I walk through the valley of the shadow of death, I will fear no evil, for you are with me; your rod and your staff, they comfort me.",
      copyright: "Scripture quotations are from the ESV® Bible, copyright © 2001 by Crossway.",
    },
    {
      reference: "Matthew 5:4",
      text: "Blessed are those who mourn, for they shall be comforted.",
      copyright: "Scripture quotations are from the ESV® Bible, copyright © 2001 by Crossway.",
    },
  ],
  trust: [
    {
      reference: "Proverbs 3:5-6",
      text: "Trust in the LORD with all your heart, and do not lean on your own understanding. In all your ways acknowledge him, and he will make straight your paths.",
      copyright: "Scripture quotations are from the ESV® Bible, copyright © 2001 by Crossway.",
    },
    {
      reference: "Psalm 56:3-4",
      text: "When I am afraid, I put my trust in you. In God, whose word I praise, in God I trust; I shall not be afraid. What can flesh do to me?",
      copyright: "Scripture quotations are from the ESV® Bible, copyright © 2001 by Crossway.",
    },
    {
      reference: "Psalm 9:10",
      text: "And those who know your name put their trust in you, for you, O LORD, have not forsaken those who seek you.",
      copyright: "Scripture quotations are from the ESV® Bible, copyright © 2001 by Crossway.",
    },
  ],
  patience: [
    {
      reference: "James 1:12",
      text: "Blessed is the man who remains steadfast under trial, for when he has stood the test he will receive the crown of life, which God has promised to those who love him.",
      copyright: "Scripture quotations are from the ESV® Bible, copyright © 2001 by Crossway.",
    },
    {
      reference: "Romans 12:12",
      text: "Rejoice in hope, be patient in tribulation, be constant in prayer.",
      copyright: "Scripture quotations are from the ESV® Bible, copyright © 2001 by Crossway.",
    },
    {
      reference: "Galatians 6:9",
      text: "And let us not grow weary of doing good, for in due season we will reap, if we do not give up.",
      copyright: "Scripture quotations are from the ESV® Bible, copyright © 2001 by Crossway.",
    },
  ],
};

/**
 * Search for studies based on a query
 * @param query The search query
 * @param limit Maximum number of results to return
 */
export async function searchStudies(query: string, limit = 5): Promise<any[]> {
  const normalizedQuery = query.toLowerCase().trim()
  const results = []

  // Search through our studies database
  for (const study of STUDIES_DATABASE) {
    // Check if query matches title, description, content, or keywords
    if (
      study.title.toLowerCase().includes(normalizedQuery) ||
      study.description.toLowerCase().includes(normalizedQuery) ||
      study.content.toLowerCase().includes(normalizedQuery) ||
      study.keywords.some((keyword) => normalizedQuery.includes(keyword)) ||
      study.verses.some((verse) => verse.toLowerCase().includes(normalizedQuery))
    ) {
      results.push({
        type: "study",
        id: study.id,
        title: study.title,
        description: study.description,
        verses: study.verses,
        category: study.category,
      });
    }

    // Limit to specified number of results
    if (results.length >= limit) break;
  }

  return results;
}

// New function to get verse recommendations from Claude with better error handling
async function getVerseRecommendationsFromClaude(query: string): Promise<string[]> {
  try {
    // Check if we have the Anthropic API key
    if (!process.env.ANTHROPIC_API_KEY) {
      console.log("Anthropic API key not available, skipping Claude recommendations");
      return []
    }

    // Create a more detailed prompt for Claude
    const prompt = `I'm looking for Bible verses related to this topic or question: "${query}"

As a biblical scholar, please recommend 3-5 specific Bible verse references (like "John 3:16" or "Psalm 23:1-6") that are most relevant to this query.

Consider:
- Key theological themes in the query
- Well-known passages that address this topic
- Both Old and New Testament references when appropriate
- Verses that provide comfort, guidance, or insight on this topic

Return ONLY the verse references in a simple comma-separated list, with no additional text or explanation.
For example: "John 3:16, Romans 8:28, Philippians 4:13"`

    // Call Claude to get verse recommendations
    const { text } = await generateText({
      model: anthropic(process.env.CLAUDE_MODEL!),
      prompt: prompt,
      temperature: 0.2, // Lower temperature for more focused results
      maxTokens: 200,
    })

    // Parse the response to extract verse references
    const verses = text
      .split(",")
      .map((verse) => verse.trim())
      .filter((verse) => verse.length > 0 && /[A-Za-z]+ \d+:\d+/.test(verse)) // Basic validation of verse format

    return verses
  } catch (error) {
    console.error("Error getting verse recommendations from Claude:", error)

    // Instead of returning an empty array, let's return some default verses based on common topics
    // This provides a fallback when Claude is unavailable
    const defaultVerses: Record<string, string[]> = {
      love: ["John 3:16", "1 Corinthians 13:4-7", "1 John 4:7-8"],
      faith: ["Hebrews 11:1", "Romans 10:17", "Ephesians 2:8-9"],
      hope: ["Romans 15:13", "Jeremiah 29:11", "Psalm 71:14"],
      forgiveness: ["Matthew 6:14-15", "Colossians 3:13", "Ephesians 4:32"],
      prayer: ["Philippians 4:6-7", "1 Thessalonians 5:16-18", "James 5:16"],
      peace: ["John 14:27", "Isaiah 26:3", "Philippians 4:7"],
      joy: ["James 1:2-3", "Psalm 16:11", "Galatians 5:22-23"],
      wisdom: ["Proverbs 1:7", "James 1:5", "Proverbs 3:13-18"],
      strength: ["Isaiah 40:31", "Philippians 4:13", "Psalm 46:1"],
      salvation: ["Romans 10:9-10", "Ephesians 2:8-9", "John 3:16-17"],
      anxiety: ["Philippians 4:6-7", "1 Peter 5:7", "Matthew 6:25-34"],
      fear: ["2 Timothy 1:7", "Isaiah 41:10", "Psalm 34:4"],
      healing: ["Psalm 147:3", "Jeremiah 17:14", "James 5:14-15"],
      guidance: ["Proverbs 3:5-6", "Psalm 32:8", "James 1:5"],
      comfort: ["2 Corinthians 1:3-4", "Psalm 23:4", "Matthew 5:4"],
    }

    // Try to find relevant default verses based on the query
    const queryLower = query.toLowerCase()
    for (const [topic, verses] of Object.entries(defaultVerses)) {
      if (queryLower.includes(topic)) {
        console.log(`Using default verses for topic: ${topic}`)
        return verses
      }
    }

    // If no specific topic matches, return general verses
    return ["John 3:16", "Romans 8:28", "Philippians 4:13", "Psalm 23:1", "Proverbs 3:5-6"]
  }
}

/**
 * Searches the Bible for a term or phrase
 * 1. First tries exact search with Bible API
 * 2. If no results, uses Claude to find relevant verses (with fallbacks)
 * 3. Then fetches each verse individually using the Bible API
 */
export async function searchBible(query: string, translation = "ESV", limit = 10): Promise<any> {
  try {
    // Step 1: Check if we have mock results for common search terms
    const normalizedQuery = query.toLowerCase().trim()

    for (const [term, results] of Object.entries(MOCK_SEARCH_RESULTS)) {
      if (normalizedQuery.includes(term.toLowerCase())) {
        console.log(`Using mock results for query containing "${term}"`)
        return {
          passages: results.map((result) => ({
            reference: result.reference,
            text: result.text,
            copyright: result.copyright,
          })),
        }
      }
    }

    // Step 2: If we've already encountered API issues, skip the API search
    let apiSearchSucceeded = false

    if (!apiIssueLogged) {
      try {
        const bibleId = BIBLE_IDS[translation as keyof typeof BIBLE_IDS] || DEFAULT_BIBLE_ID

        console.log("Attempting direct Bible API search")
        const response = await fetch(
          `${API_URL}/bibles/${bibleId}/search?query=${encodeURIComponent(query)}&limit=${limit}`,
          {
            headers: {
              "api-key": API_KEY,
            },
            next: { revalidate: 3600 }, // Cache for 1 hour
          },
        )

        if (response.ok) {
          const data = await response.json()

          // If we got results from the API, return them
          if (data.data && data.data.passages && data.data.passages.length > 0) {
            console.log("Found results from Bible API search")
            apiSearchSucceeded = true
            return {
              passages: data.data.passages.map((passage: any) => ({
                reference: passage.reference,
                text: passage.content.replace(/<[^>]*>/g, ""), // Remove HTML tags
                copyright: data.data.copyright || `Scripture from ${translation}`,
              })),
            }
          } else {
            console.log("Bible API search returned no results")
          }
        } else {
          console.log(`Bible API search failed with status: ${response.status}`)
          // Mark that we've encountered API issues
          apiIssueLogged = true
        }
      } catch (apiError) {
        console.error("Error during Bible API search:", apiError)
        // Mark that we've encountered API issues
        apiIssueLogged = true
      }
    }

    // Step 3: If API search failed or returned no results, use Claude to recommend verses
    // Only if API search didn't succeed
    if (!apiSearchSucceeded) {
      console.log("Using Claude or fallbacks to find relevant verses")
      const verseRecommendations = await getVerseRecommendationsFromClaude(query)

      if (verseRecommendations.length > 0) {
        console.log("Got verse recommendations:", verseRecommendations)

        // Step 4: Fetch each recommended verse individually using the Bible API
        const verses = await Promise.all(
          verseRecommendations.map(async (reference) => {
            try {
              // Try to fetch the verse from the Bible API
              const verse = await fetchVerse(reference, translation)
              return {
                reference: verse.reference,
                text: verse.text,
                copyright: verse.copyright || `Scripture from ${translation}`,
              }
            } catch (verseError) {
              console.error(`Error fetching verse ${reference}:`, verseError)
              // If fetching fails, check if we have it in our local database
              if (reference in commonVerses) {
                return {
                  reference,
                  text: commonVerses[reference],
                  copyright: `Scripture from ${translation}`,
                }
              }
              // If all else fails, return a placeholder
              return {
                reference,
                text: "Verse text unavailable. Please check your Bible for this reference.",
                copyright: `Scripture reference`,
              }
            }
          }),
        )

        return {
          passages: verses,
          isAiRecommended: true,
        }
      }
    }

    // Step 5: If all else fails, check our local database for any matches
    console.log("Checking local database for matches")
    const localMatches = []

    for (const [reference, text] of Object.entries(commonVerses)) {
      if (text.toLowerCase().includes(normalizedQuery) || reference.toLowerCase().includes(normalizedQuery)) {
        localMatches.push({
          reference,
          text,
          copyright: `Scripture from ${translation}`,
        })

        // Limit to 5 results
        if (localMatches.length >= 5) break
      }
    }

    if (localMatches.length > 0) {
      console.log("Found matches in local database")
      return {
        passages: localMatches,
      }
    }

    // Step 6: If absolutely nothing worked, return a helpful message
    return {
      passages: [
        {
          reference: "Search Help",
          text: `We couldn't find exact matches for "${query}". Try searching for specific words like "love", "faith", "hope", or check your spelling.`,
          copyright: "Bible Study App",
        },
      ],
    }
  } catch (error) {
    console.error("Error in searchBible:", error)

    // Final fallback - return a helpful message
    return {
      passages: [
        {
          reference: "Search Error",
          text: `We encountered an issue while searching. Please try again with different search terms or check your connection.`,
          copyright: "Bible Study App",
        },
      ],
    }
  }
}

// Mock studies database for search
const STUDIES_DATABASE = [
  {
    id: "forgiveness",
    title: "Forgiveness",
    description: "Understanding God's forgiveness and how to forgive others",
    verses: ["Matthew 6:14-15", "Colossians 3:13", "Matthew 18:21-22", "Ephesians 4:32"],
    category: "Christian Living",
    content:
      "Forgiveness is a central theme in Christianity. Jesus teaches that our willingness to forgive others is directly connected to receiving God's forgiveness.",
    keywords: ["forgive", "forgiveness", "forgiving", "forgave", "pardon", "mercy", "reconciliation"],
  },
  {
    id: "beatitudes",
    title: "The Beatitudes",
    description: "Jesus' teachings on true blessedness",
    verses: ["Matthew 5:3-12"],
    category: "Teachings of Jesus",
    content:
      "The Beatitudes are declarations of blessedness, describing the ideal disciple and the rewards that will be theirs.",
    keywords: ["beatitude", "blessed", "blessing", "sermon on the mount", "poor in spirit", "meek", "merciful"],
  },
  {
    id: "faith",
    title: "Faith",
    description: "Understanding what it means to live by faith",
    verses: ["Hebrews 11:1-6", "Romans 10:17"],
    category: "Spiritual Growth",
    content:
      "Faith is the assurance of things hoped for, the conviction of things not seen. It is a central aspect of Christian life.",
    keywords: ["faith", "believe", "trust", "confidence", "assurance", "conviction"],
  },
  {
    id: "prayer",
    title: "Prayer",
    description: "Learning how to pray effectively",
    verses: ["Matthew 6:5-15", "Philippians 4:6-7", "1 Thessalonians 5:16-18"],
    category: "Spiritual Disciplines",
    content:
      "Prayer is communication with God. Jesus taught his disciples how to pray and emphasized the importance of regular prayer.",
    keywords: ["prayer", "pray", "praying", "intercession", "supplication", "petition", "thanksgiving"],
  },
  {
    id: "holy-spirit",
    title: "The Holy Spirit",
    description: "Understanding the person and work of the Holy Spirit",
    verses: ["John 14:15-26", "Acts 2:1-13", "Galatians 5:22-23"],
    category: "Theology",
    content:
      "The Holy Spirit is the third person of the Trinity. He empowers believers, guides them into truth, and produces spiritual fruit in their lives.",
    keywords: [
      "holy spirit",
      "spirit",
      "comforter",
      "counselor",
      "advocate",
      "pentecost",
      "spiritual gifts",
      "fruit of the spirit",
    ],
  },
  {
    id: "love",
    title: "God's Love",
    description: "Understanding the depth and breadth of God's love",
    verses: ["John 3:16", "Romans 5:8", "1 John 4:7-12"],
    category: "Theology",
    content:
      "God's love is unconditional and sacrificial, demonstrated most clearly through the gift of His Son, Jesus Christ.",
    keywords: ["love", "loving", "loved", "agape", "charity", "compassion", "affection"],
  },
  {
    id: "salvation",
    title: "Salvation",
    description: "Understanding God's plan for salvation",
    verses: ["Ephesians 2:8-9", "Romans 10:9-10", "John 3:16-17"],
    category: "Theology",
    content: "Salvation is by grace through faith in Jesus Christ. It is a gift from God, not earned by works.",
    keywords: [
      "salvation",
      "saved",
      "save",
      "redemption",
      "justification",
      "sanctification",
      "born again",
      "eternal life",
    ],
  },
  {
    id: "anxiety",
    title: "Overcoming Anxiety",
    description: "Biblical guidance for dealing with worry and anxiety",
    verses: ["Philippians 4:6-7", "1 Peter 5:7", "Matthew 6:25-34"],
    category: "Christian Living",
    content: "The Bible offers guidance on how to overcome anxiety by trusting God and casting our cares upon Him.",
    keywords: ["anxiety", "anxious", "worry", "fear", "stress", "troubled", "peace", "rest"],
  },
  {
    id: "wisdom",
    title: "Biblical Wisdom",
    description: "Understanding and seeking godly wisdom",
    verses: ["Proverbs 1:7", "James 1:5", "Proverbs 3:13-18"],
    category: "Spiritual Growth",
    content:
      "Wisdom begins with the fear of the Lord. God promises to give wisdom generously to those who ask in faith.",
    keywords: ["wisdom", "wise", "understanding", "knowledge", "discernment", "insight", "prudence"],
  },
  {
    id: "suffering",
    title: "Purpose in Suffering",
    description: "Finding meaning and growth through trials",
    verses: ["Romans 5:3-5", "James 1:2-4", "1 Peter 1:6-7"],
    category: "Christian Living",
    content:
      "The Bible teaches that suffering can produce perseverance, character, and hope when viewed through the lens of faith.",
    keywords: ["suffering", "suffer", "trial", "tribulation", "affliction", "hardship", "pain", "persecution"],
  },
]

/**
 * Utility function to extract clean text from HTML content returned by the Bible API
 * @param htmlContent The HTML content from the API response
 * @returns Clean plain text with HTML tags and entities properly handled
 */
function extractTextFromHtml(htmlContent: string): string {
  if (!htmlContent) {
    return '';
  }
  
  // First, remove verse numbers
  let cleanedHtml = htmlContent.replace(/<span data-number="\d+"[^>]*>(\d+)<\/span>/g, "");
  
  // Then remove all remaining HTML tags
  let text = cleanedHtml.replace(/<[^>]*>/g, "");
  
  // Fix common HTML entities
  text = text.replace(/&nbsp;/g, " ")
            .replace(/&ldquo;/g, '"')
            .replace(/&rdquo;/g, '"')
            .replace(/&lsquo;/g, "'")
            .replace(/&rsquo;/g, "'")
            .replace(/&amp;/g, "&")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&mdash;/g, "—")
            .replace(/&ndash;/g, "-");
  
  // Trim extra whitespace and normalize spaces
  return text.replace(/\s+/g, " ").trim();
}
