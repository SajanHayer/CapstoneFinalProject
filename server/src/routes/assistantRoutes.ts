import { Router } from "express";
import { and, desc, eq, gte, ilike, lte, sql } from "drizzle-orm";
import { db } from "../db/db";
import { listings, vehicles } from "../db/schema";
import { model } from "../services/googleapi";

export const assistantRouter = Router();

type IncomingMessage = {
  role: "user" | "assistant";
  content: string;
};

type ExtractedPrefs = {
  make: string | null;
  maxPrice: number | null;
  minYear: number | null;
  condition: "new" | "used" | null;
  listingType: "auction" | "fixed" | null;
  wantsNavigation: boolean;
};

function cleanJsonText(text: string) {
  return text.replace(/```json/gi, "").replace(/```/g, "").trim();
}

async function getAvailableMakes(): Promise<string[]> {
  const rows = await db
    .select({
      make: vehicles.make,
    })
    .from(vehicles)
    .groupBy(vehicles.make);

  return rows
    .map((r) => r.make?.trim())
    .filter((m): m is string => Boolean(m))
    .sort((a, b) => a.localeCompare(b));
}

async function extractPreferencesWithAI(
  latestUserMessage: string,
  availableMakes: string[],
): Promise<ExtractedPrefs> {
  try {
    const extractionPrompt =
      `Extract vehicle search preferences from the user's message.\n` +
      `Only use a make if it matches one of these database makes:\n` +
      `${availableMakes.join(", ")}\n\n` +
      `Return ONLY valid JSON with this exact shape:\n` +
      `{"make":string|null,"maxPrice":number|null,"minYear":number|null,"condition":"new"|"used"|null,"listingType":"auction"|"fixed"|null,"wantsNavigation":boolean}\n\n` +
      `Rules:\n` +
      `- If the user does not clearly mention a field, use null.\n` +
      `- wantsNavigation should be true if the user is asking to open, go to, view, see, take me to, or show the listing.\n` +
      `- If the message says "harley" and the database has "Harley-Davidson", use the closest matching database make.\n` +
      `- Return JSON only.\n\n` +
      `User message: ${latestUserMessage}`;

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: extractionPrompt }],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 220,
      },
    });

    const raw = cleanJsonText(result.response.text());

    let parsed: any = {};
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      console.log("⚠️ JSON parse failed:", raw);
      parsed = {};
    }

    return {
      make: typeof parsed.make === "string" ? parsed.make : null,
      maxPrice: typeof parsed.maxPrice === "number" ? parsed.maxPrice : null,
      minYear: typeof parsed.minYear === "number" ? parsed.minYear : null,
      condition:
        parsed.condition === "new" || parsed.condition === "used"
          ? parsed.condition
          : null,
      listingType:
        parsed.listingType === "auction" || parsed.listingType === "fixed"
          ? parsed.listingType
          : null,
      wantsNavigation: Boolean(parsed.wantsNavigation),
    };
  } catch (error) {
    console.error("Preference extraction error:", error);
    return {
      make: null,
      maxPrice: null,
      minYear: null,
      condition: null,
      listingType: null,
      wantsNavigation: false,
    };
  }
}

assistantRouter.post("/chat", async (req, res) => {
  try {
    console.log("🔥 DB-driven assistant route running");

    const { messages } = req.body as { messages: IncomingMessage[] };

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ message: "messages[] is required" });
    }

    const latestUserMessage =
      [...messages].reverse().find((m) => m.role === "user")?.content ?? "";

    const availableMakes = await getAvailableMakes();
    const prefs = await extractPreferencesWithAI(
      latestUserMessage,
      availableMakes,
    );

    const filters = [eq(listings.status, "active")];

    if (prefs.maxPrice !== null) {
      filters.push(lte(listings.current_price, prefs.maxPrice.toString()));
    }

    if (prefs.minYear !== null) {
      filters.push(gte(vehicles.year, prefs.minYear));
    }

    if (prefs.make) {
      filters.push(ilike(vehicles.make, `%${prefs.make}%`));
    }

    if (prefs.condition) {
      filters.push(eq(vehicles.condition, prefs.condition));
    }

    if (prefs.listingType) {
      filters.push(eq(listings.type, prefs.listingType));
    }

    const matchedListings = await db
      .select({
        id: listings.id,
        vehicle_id: listings.vehicle_id,
        make: vehicles.make,
        model: vehicles.model,
        year: vehicles.year,
        condition: vehicles.condition,
        price: listings.current_price,
        location: listings.location,
        image_url: vehicles.image_url,
        listing_type: listings.type,
      })
      .from(listings)
      .innerJoin(vehicles, eq(listings.vehicle_id, vehicles.id))
      .where(and(...filters))
      .orderBy(desc(listings.created_at))
      .limit(5);

    const listingSummary =
      matchedListings.length > 0
        ? matchedListings
            .map(
              (l, i) =>
                `${i + 1}. Listing ${l.id}: ${l.year} ${l.make} ${l.model} - $${l.price} - ${l.condition} - ${l.location ?? "No location"} - ${l.listing_type}`,
            )
            .join("\n")
        : "No matching active listings found.";

    const contents = messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: String(m.content ?? "") }],
    }));

    const result = await model.generateContent({
      contents,
      generationConfig: {
        temperature: 0.35,
        maxOutputTokens: 180,
      },
      systemInstruction: {
        role: "system",
        parts: [
          {
            text:
              "You are the Lets Ride Canada assistant. " +
              "Talk like a real person texting. " +
              "Keep replies short, but not awkwardly short. " +
              "Use 2 to 3 short natural sentences. " +
              "Answer clearly and completely. " +
              "Only use the real listings provided below. " +
              "Do not tell users to use the search bar, filters, homepage, or browse page. " +
              "Do not give generic website advice. " +
              "If listings exist, mention the best 1 or 2 matches briefly. " +
              "If no listings match, say that clearly and ask one short follow-up question. " +
              "Sound casual and direct.\n\n" +
              `Real active listings:\n${listingSummary}`,
          },
        ],
      },
    });

    const reply = result.response.text().trim();

    const targetListingId =
      prefs.wantsNavigation && matchedListings.length > 0
        ? matchedListings[0].id
        : null;

    return res.json({
      reply,
      matchedListings,
      action: targetListingId ? "open_listing" : null,
      targetListingId,
    });
  } catch (err) {
    console.error("Assistant (Gemini) error:", err);
    return res.status(500).json({ message: "Assistant error" });
  }
});