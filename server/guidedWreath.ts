import { invokeLLM, listLLMModels } from "./_core/llm";

export type GroundedDraft = {
  essence: {
    emotionalCenter: string;
    atmosphere: string;
    movement: string;
    visualTension: string;
    paletteDirection: string;
    expression: string;
    avoidances: string[];
  };
  story: {
    excerpt: string;
    body: string;
    designSignals: {
      primaryEmotion: string;
      secondaryEmotion: string;
      atmosphere: string;
      paletteDirection: string;
      textureQualities: string[];
      directionalFlow: string;
      focalCharacter: string;
      negativeSpaceMeaning: string;
      floralFormQualities: string[];
      greeneryMotionQualities: string[];
      avoidances: string[];
    };
  };
  sourceDetails: string[];
  unsupportedClaims: string[];
};

const draftSchema = {
  type: "object",
  properties: {
    essence: {
      type: "object",
      properties: {
        emotionalCenter: { type: "string" },
        atmosphere: { type: "string" },
        movement: { type: "string" },
        visualTension: { type: "string" },
        paletteDirection: { type: "string" },
        expression: { type: "string" },
        avoidances: { type: "array", items: { type: "string" }, maxItems: 6 },
      },
      required: ["emotionalCenter", "atmosphere", "movement", "visualTension", "paletteDirection", "expression", "avoidances"],
      additionalProperties: false,
    },
    story: {
      type: "object",
      properties: {
        excerpt: { type: "string" },
        body: { type: "string" },
        designSignals: {
          type: "object",
          properties: {
            primaryEmotion: { type: "string" },
            secondaryEmotion: { type: "string" },
            atmosphere: { type: "string" },
            paletteDirection: { type: "string" },
            textureQualities: { type: "array", items: { type: "string" }, maxItems: 6 },
            directionalFlow: { type: "string" },
            focalCharacter: { type: "string" },
            negativeSpaceMeaning: { type: "string" },
            floralFormQualities: { type: "array", items: { type: "string" }, maxItems: 6 },
            greeneryMotionQualities: { type: "array", items: { type: "string" }, maxItems: 6 },
            avoidances: { type: "array", items: { type: "string" }, maxItems: 6 },
          },
          required: ["primaryEmotion", "secondaryEmotion", "atmosphere", "paletteDirection", "textureQualities", "directionalFlow", "focalCharacter", "negativeSpaceMeaning", "floralFormQualities", "greeneryMotionQualities", "avoidances"],
          additionalProperties: false,
        },
      },
      required: ["excerpt", "body", "designSignals"],
      additionalProperties: false,
    },
    sourceDetails: { type: "array", items: { type: "string" }, maxItems: 8 },
    unsupportedClaims: { type: "array", items: { type: "string" }, maxItems: 8 },
  },
  required: ["essence", "story", "sourceDetails", "unsupportedClaims"],
  additionalProperties: false,
} as const;

const inventedFactSignals = ["died", "death", "funeral", "widow", "widower", "husband", "wife", "mother", "father", "grandmother", "grandfather", "wedding", "hospital", "grave"];

function normalize(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

export function safeFallback(memory: string): GroundedDraft {
  const excerpt = memory.trim().slice(0, 420);
  return {
    essence: {
      emotionalCenter: "Awaiting your reading",
      atmosphere: "Private and reflective",
      movement: "To be defined with you",
      visualTension: "To be defined with you",
      paletteDirection: "To be defined with you",
      expression: "This draft preserves your words for review before any design direction is set.",
      avoidances: ["Do not invent facts beyond the memory."],
    },
    story: {
      excerpt,
      body: memory.trim(),
      designSignals: {
        primaryEmotion: "Awaiting approval",
        secondaryEmotion: "Awaiting approval",
        atmosphere: "To be defined with you",
        paletteDirection: "To be defined with you",
        textureQualities: [],
        directionalFlow: "To be defined with you",
        focalCharacter: "To be defined with you",
        negativeSpaceMeaning: "To be defined with you",
        floralFormQualities: [],
        greeneryMotionQualities: [],
        avoidances: ["Do not infer materials, people, places, or events."],
      },
    },
    sourceDetails: [excerpt],
    unsupportedClaims: ["Model generation was unavailable. This fallback is preserved as the original memory and requires review."],
  };
}

export function validateGrounding(memory: string, draft: GroundedDraft): GroundedDraft {
  const normalizedMemory = normalize(memory);
  const verifiedDetails = draft.sourceDetails.filter(detail => detail.trim().length > 0 && normalizedMemory.includes(normalize(detail)));
  const unverifiedDetails = draft.sourceDetails
    .filter(detail => detail.trim().length > 0 && !normalizedMemory.includes(normalize(detail)))
    .map(detail => `Unverified source detail: ${detail}`);
  const output = `${draft.story.excerpt} ${draft.story.body}`.toLowerCase();
  const inventionWarnings = inventedFactSignals
    .filter(signal => output.includes(signal) && !normalizedMemory.includes(signal))
    .map(signal => `Potential unsupported biographical claim: ${signal}`);

  return {
    ...draft,
    sourceDetails: verifiedDetails,
    unsupportedClaims: Array.from(new Set([...draft.unsupportedClaims, ...unverifiedDetails, ...inventionWarnings])),
  };
}

export async function createSourceGroundedDraft(memory: string): Promise<{ draft: GroundedDraft; generationSource: "model" | "fallback" }> {
  const trimmedMemory = memory.trim();
  try {
    const { data: models } = await listLLMModels();
    const model = models.find(candidate => candidate.id === "gpt-5-mini")?.id ?? models[0]?.id;
    if (!model) throw new Error("No built-in model is available");
    const response = await invokeLLM({
      model,
      messages: [
        {
          role: "system",
          content: "You are Evercrafted Story Genesis. Return JSON only. You are interpreting a client memory for review, not writing fictional biography or designing a wreath. Use only facts expressly present in the memory. Do not introduce deaths, losses, relationships, family roles, events, locations, dates, seasons, rituals, objects, actions, flowers, greenery, floral roles, quantities, composition, grapevine, or construction unless the client explicitly stated them. Do not select materials. The story may state interpretation using clearly interpretive language, but no invented fact. sourceDetails must be exact short verbatim phrases copied from the memory. designSignals describe abstract qualities only and never list flowers, products, placements, or quantities. If an unsupported fact would be needed, list it in unsupportedClaims instead of writing it.",
        },
        { role: "user", content: `Client memory:\n${trimmedMemory}` },
      ],
      response_format: { type: "json_schema", json_schema: { name: "evercrafted_grounded_draft", strict: true, schema: draftSchema } },
    });
    const content = response.choices[0]?.message?.content;
    if (typeof content !== "string") throw new Error("The model returned no structured draft");
    return { draft: validateGrounding(trimmedMemory, JSON.parse(content) as GroundedDraft), generationSource: "model" };
  } catch (error) {
    console.warn("[GuidedWreath] Source-grounded draft fallback", error);
    return { draft: safeFallback(trimmedMemory), generationSource: "fallback" };
  }
}
