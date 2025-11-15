import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-client";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json(
      { message: "Missing search query", data: [] },
      { status: 400 }
    );
  }

  const searchQuery = query.trim();

  try {
    let baseQuery = supabase
      .from("marketing_documents")
      .select("*")
      .textSearch("tsv_content", searchQuery, {
        type: "websearch",
      });

    const { data, error } = await baseQuery.limit(50);

    if (error) {
      console.error("Search Error:", error);
      return NextResponse.json(
        { message: "Database search failed", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 200 });
    
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
