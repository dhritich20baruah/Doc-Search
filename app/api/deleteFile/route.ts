import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    console.log(request.json)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
        return NextResponse.json({ message: "Server-side Supabase keys not configured." }, { status: 500 });
    }

    // Initialize with Service Role Key to bypass RLS for administrative deletion
    const supabaseService = createClient(supabaseUrl, serviceRoleKey);

    try {
        const { docId, fileUrl } = await request.json();

        if (!docId || !fileUrl) {
            return NextResponse.json({ message: "Missing docId or fileUrl." }, { status: 400 });
        }

        // 1. Parse the storage path from the URL
        // Example URL: .../storage/v1/object/public/documents/ORG_A1/user_123/file.pdf
        const bucketName = 'documents';
        const urlParts = fileUrl.split(`${bucketName}/`);
        
        if (urlParts.length < 2) {
            return NextResponse.json({ message: "Invalid file URL format for this bucket." }, { status: 400 });
        }

        const filePath = urlParts[1];
        console.log(`Attempting administrative delete for: ${filePath}`);

        // 2. Delete from Storage (Bypassing RLS)
        const { data: storageData, error: storageError } = await supabaseService
            .storage
            .from(bucketName)
            .remove([filePath]);

        if (storageError) {
            throw new Error(`Storage Error: ${storageError.message}`);
        }

        // Check if file was actually deleted
        if (!storageData || storageData.length === 0) {
            console.warn("File not found in storage, proceeding to delete DB record anyway.");
        }

        // 3. Delete from Database
        const { error: dbError } = await supabaseService
            .from('documents')
            .delete()
            .eq('id', docId);

        if (dbError) {
            throw new Error(`Database Error: ${dbError.message}`);
        }

        return NextResponse.json({ 
            success: true, 
            message: "Document and storage file deleted successfully." 
        });

    } catch (error: any) {
        console.error("Delete API Error:", error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}