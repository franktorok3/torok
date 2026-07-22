import { composeByTeachingId, composeWisdom } from "@/lib/wisdom";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

interface WisdomRequestBody {
  situation?: unknown;
  teachingId?: unknown;
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

  if (typeof body.teachingId === "string" && body.teachingId) {
    const byId = composeByTeachingId(body.teachingId);
    if (!byId) {
      return NextResponse.json({ error: "Unknown teaching." }, { status: 404 });
    }
    return NextResponse.json({ ...byId, provider: "local-curated" });
  }

  const situation =
    typeof body.situation === "string" ? body.situation : "";

  const useProvider =
    process.env.TOROK_PROVIDER === "enabled" &&
    Boolean(process.env.TOROK_API_KEY);

  if (useProvider) {
    // Reserved for a future free/user-supplied inference provider.
  }

  const response = composeWisdom(situation);

  return NextResponse.json({
    ...response,
    provider: useProvider ? "optional-provider" : "local-curated",
  });
}
