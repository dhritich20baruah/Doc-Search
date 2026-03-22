import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { metadata } from "@/app/layout";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const userId = formData.get("user");

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: "whisper-1",
    });

    const rawText = transcription.text;

    const { data, error } = await supabase
      .from("documents")
      .insert({
        user_id: userId,
        content: rawText,
        metadata: {
          source_type: "audio",
          original_filename: file.name,
          processed_at: new Date().toISOString(),
        },
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Audio Processing Error:", error);
    return NextResponse.json(
      { error: "Failed to process audio" },
      { status: 500 },
    );
  }
}
