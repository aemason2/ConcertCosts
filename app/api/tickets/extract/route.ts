import { NextRequest, NextResponse } from "next/server";
import {
  extractTicketCostsFromText,
  htmlToText,
  isSupportedTicketUrl,
} from "@/lib/ticket-extract";

export async function POST(request: NextRequest) {
  let body: { url?: string; text?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const url = body.url?.trim() ?? "";
  const pastedText = body.text?.trim() ?? "";

  if (!url && !pastedText) {
    return NextResponse.json(
      { error: "Paste a Ticketmaster, AXS, or SeatGeek link — or paste the order summary text." },
      { status: 400 }
    );
  }

  if (url && !isSupportedTicketUrl(url)) {
    return NextResponse.json(
      {
        error:
          "That link doesn’t look like Ticketmaster, AXS, or SeatGeek. You can still paste the price breakdown text below.",
      },
      { status: 400 }
    );
  }

  let pageText = pastedText;
  const warnings: string[] = [];

  if (url) {
    try {
      const res = await fetch(url, {
        redirect: "follow",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
        },
        signal: AbortSignal.timeout(12000),
      });

      if (!res.ok) {
        warnings.push(
          `Could not open the link (status ${res.status}). Paste the order summary text instead.`
        );
      } else {
        const html = await res.text();
        const extracted = htmlToText(html);
        // Many ticket sites return a login/bot wall with almost no price text
        const moneyCount = (extracted.match(/\$\s*[\d,]+(?:\.\d{2})?/g) ?? []).length;
        if (moneyCount < 1) {
          warnings.push(
            "The ticket site didn’t share price details with our app (common for login/checkout pages). Paste the Fees / Tax / Delivery lines from your order email or checkout screen."
          );
        }
        pageText = [extracted, pastedText].filter(Boolean).join("\n");
      }
    } catch {
      warnings.push(
        "Could not reach that link. Paste the order summary text from your confirmation email or checkout page."
      );
    }
  }

  const result = extractTicketCostsFromText(pageText || url, url);
  result.warnings = [...warnings, ...result.warnings];

  return NextResponse.json({
    ...result,
    source: url || "pasted-text",
  });
}
