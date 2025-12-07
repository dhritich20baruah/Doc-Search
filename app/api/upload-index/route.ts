import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { MarketingDocument } from "../../../types/document";

export const dynamic = "force-dynamic";

const getContentType = (fileName: string): string => {
  if (fileName.endsWith(".pdf")) return "application/pdf";
  if (fileName.endsWith(".docx"))
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  return "application/octet-stream";
};

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    // If keys are missing, exit gracefully
    return NextResponse.json(
      {
        message:
          "Server-side Supabase keys not configured (Check SUPABASE_SERVICE_ROLE_KEY).",
      },
      { status: 500 }
    );
  }

  const supabaseService = createClient(
    supabaseUrl as string,
    serviceRoleKey as string
  );

  try {
    const { fileName, base64Content, content, title, category, topic, userId } = await request.json();

    if (!fileName || !base64Content || !content || !title || !userId) {
      return NextResponse.json(
        { message: "Missing required fields (file, content, or title)." },
        { status: 400 }
      );
    }

    // const categorization = await categorizeDocumentContent(content);

    const fileBuffer = Buffer.from(base64Content, "base64");
    const uniqueFileName = `${Date.now()}_${fileName}`;
    const contentType = getContentType(fileName);

    const { error: uploadError } = await supabaseService.storage
      .from("documents") // Ensure this bucket exists
      .upload(uniqueFileName, fileBuffer, {
        cacheControl: "3600",
        upsert: false,
        contentType: "application/pdf", // Assuming most files are PDFs/DOCXs
      });

    if (uploadError) {
      console.error("Storage Upload Error:", uploadError);
      return NextResponse.json(
        { message: "File upload failed", details: uploadError.message },
        { status: 500 }
      );
    }

    const { data: publicUrlData } = supabaseService.storage
      .from("documents")
      .getPublicUrl(uniqueFileName);

    const publicUrl = publicUrlData.publicUrl;

    const newDoc: Omit<MarketingDocument, "id" | "created_at"> = {
      file_name: title,
      file_url: publicUrl,
      content: content,
      topic: topic,
      category: category,
      user_id: userId,
    };

    const { data: insertData, error: insertError } = await supabaseService
      .from("documents")
      .insert([newDoc])
      .select("*"); // Select the required fields

    if (insertError) {
      console.error("Postgres Error:", insertError);
      return NextResponse.json(
        { message: "Indexing failed", details: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Document indexed successfully", document: insertData[0] },
      { status: 201 }
    );
  } catch (error) {
    console.error("Overall API Error:", error);
    return NextResponse.json(
      { message: "Internal Server Error during processing." },
      { status: 500 }
    );
  }
}
