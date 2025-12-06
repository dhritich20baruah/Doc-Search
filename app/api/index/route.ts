import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-client";
import { NewDocument } from "@/types/document";

export async function POST(request: Request) {
  try {
    const newDoc: NewDocument = await request.json();

    const { data, error } = await supabase
      .from("documents")
      .insert([newDoc])
      .select();

    if (error) {
      console.error("Supabase Ingestion Error:", error);
      return NextResponse.json(
        { message: "Database insertion failed", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Document indexed successfully", document: data[0] },
      { status: 201 }
    );
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
