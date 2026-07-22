import { composeWisdom } from "@/lib/wisdom";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

interface WisdomRequestBody {
  situation?: unknown;
}

export async function POST(request: Request) {
  let body: WisdomRequestBody;

  try {
    body = (await request.json()) as WisdomRequestBody;
  } catch {
    return NextResponse.json(
      { error: "Please send a JSON body with a situation string." },
      { status: 400 },
    );
  }

  const situation =
    typeof body.situation === "string" ? body.situation : "";

  // Optional future provider hook lives server-side only.
  // Free mode is the dependable default and requires no API key.
  const useProvider =
    process.env.TOROK_PROVIDER === "enabled" &&
    Boolean(process.env.TOROK_API_KEY);

  if (useProvider) {
    // Reserved for a future free/user-supplied inference provider.
    // Never required for launch; never expose secrets to the browser.
  }

  const response = composeWisdom(situation);

  return NextResponse.json({
    ...response,
    provider: useProvider ? "optional-provider" : "local-curated",
  });
}
