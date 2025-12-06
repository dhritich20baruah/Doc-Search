"use client";
import { useState } from "react";
import axios from "axios";
import { MarketingDocument } from "@/types/document";
import { Search, Loader2, FileText, Link, Zap, XCircle, Tag, Users, Folder } from "lucide-react";
import { useSession } from "../context/SessionContext";

export default function DocumentSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MarketingDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { session, setSession } = useSession();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);

    try {
      const response = await axios.get("/api/search", { params: { q: query } });
      setResults(response.data as MarketingDocument[]);
      if (response.data.length === 0) {
        setError(
          "No documents matched your search query. Try different keywords."
        );
      }

      setLoading(false)
    } catch (error) {
      console.error("Search API Error:", error);
      setError("An error occurred during search. Check console.");
      setResults([]);
    }
  };

   const handleClear = () => {
    setQuery('');
    setResults([]);
    setError(null);
  }

  return (
   <div className="p-6 rounded-xl shadow-2xl bg-white max-w-2xl mx-auto font-sans">
      <h3 className="text-3xl font-extrabold mb-4 text-gray-800 flex items-center">
        <Zap className="w-6 h-6 mr-2 text-blue-600" />
        Search Internal Documents
      </h3>

      {/* Search Input Form */}
      <form onSubmit={handleSearch} className="flex space-x-2 mb-6">
        <input
          type="text"
          placeholder="Search keywords (e.g., 'Q4 sales report' or 'marketing budget 2025')"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-grow p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 shadow-sm"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-150 disabled:bg-gray-400 flex items-center cursor-pointer"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Search className="h-5 w-5" />
          )}
        </button>
        
        {/* Clear Button */}
        <button
          type="button"
          onClick={handleClear}
          disabled={loading || (!query && results.length === 0)}
          className="p-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition duration-150 disabled:bg-gray-400 flex items-center cursor-pointer"
          title="Clear Search"
        >
          <XCircle className="h-5 w-5" />
        </button>

      </form>

      {/* Results Display */}
      {loading && (
        <p className="text-center text-blue-600 flex items-center justify-center mt-4">
          <Loader2 className="h-4 w-4 animate-spin mr-2" /> Searching...
        </p>
      )}
      {error && <p className="text-center text-red-600 mt-4">{error}</p>}

      {!loading && results.length > 0 && (
        <div className="mt-6 space-y-3">
          <h4 className="text-lg font-semibold text-gray-700 border-b pb-1">
            Found {results.length} Result{results.length !== 1 ? 's' : ''}
          </h4>

          <ul className="space-y-4">
            {results.map((doc) => (
              <li
                key={doc.id}
                className="p-4 border border-gray-100 rounded-lg shadow-md hover:shadow-lg transition duration-200 bg-gray-50"
              >
                <div className="flex items-center space-x-3 mb-1">
                  <FileText className="w-5 h-5 text-gray-600" />
                  <span className="text-base font-bold text-gray-900">
                    {doc.file_name}
                  </span>
                </div>
                
                {/* --- Display Categorization Data --- */}
                <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-medium text-gray-600 mb-3">
                    <span className="flex items-center">
                        <Tag className="w-3 h-3 mr-1 text-purple-500" />
                        Topic: <span className="ml-1 font-semibold">{doc.topic}</span>
                    </span>
                    <span className="flex items-center">
                        <Folder className="w-3 h-3 mr-1 text-green-500" />
                        Project: <span className="ml-1 font-semibold">{doc.category}</span>
                    </span>
                </div>
                {/* ---------------------------------- */}


                <p className="text-sm text-gray-500 mb-2 truncate">
                  Indexed Text Snippet: {doc.content.substring(0, 100)}...
                </p>

                <a
                  href={doc.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium transition duration-150 mt-2"
                >
                  <Link className="w-4 h-4 mr-1" />
                  View Original File
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
