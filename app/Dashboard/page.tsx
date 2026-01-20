"use client";
import React, { useState } from "react";
import UploadForm from "../component/UploadForm";
import DocumentSearch from "../component/DocumentSearch";
import { Search, Upload } from "lucide-react";

const Dashboard = () => {
  const [visible, setVisible] = useState(true);

  return (
    <div className="">
      {visible ? (
        <div className="shadow-2xl shadow-black">
          <DocumentSearch />
        </div>
      ) : (
        <div className="shadow-2xl shadow-black">
          <UploadForm/>
        </div>
      )}
      <div className="absolute top-20 right-20">
        <div className="flex">
          <button
            className="bg-green-700 text-white p-2 cursor-pointer text-md rounded-md hover:text-red-700 hover:bg-white"
            onClick={() => setVisible((visible) => !visible)}
          >
            {visible ? (
              <Upload className="w-5 h-5" />
            ) : (
              <Search className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
