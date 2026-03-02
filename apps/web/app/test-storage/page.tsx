"use client";

import { useState } from "react";
import { getUploadUrlAction, getDownloadUrlAction } from "@/actions/storage";

export default function TestStoragePage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");

  const handleUpload = async () => {
    if (!file) return alert("الرجاء اختيار ملف أولاً");

    setUploading(true);
    try {
      // الخطوة 1: طلب رابط الرفع من السيرفر
      const { url, key } = await getUploadUrlAction(file.name, file.type);

      // الخطوة 2: رفع الملف مباشرة من المتصفح إلى MinIO باستخدام PUT
      const response = await fetch(url, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (response.ok) {
        const downloadUrl = await getDownloadUrlAction(key);
        setPreviewUrl(downloadUrl);
        alert("تم الرفع بنجاح إلى MinIO! 🎉");
      } else {
        throw new Error("فشل الرفع إلى السيرفر");
      }
    } catch (error) {
      console.error(error);
      alert("حدث خطأ أثناء الرفع");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-10 max-w-xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">تجربة مكتبة Storage مع MinIO</h1>

      <div className="border-2 border-dashed border-gray-300 p-6 rounded-lg text-center">
        <input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="mb-4 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />

        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className={`px-6 py-2 rounded-md font-bold text-white ${
            uploading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {uploading ? "جاري الرفع..." : "ارفع الآن"}
        </button>
      </div>

      {previewUrl && (
        <div className="mt-6 p-4 border rounded-lg bg-gray-50">
          <p className="mb-2 font-medium">معاينة الملف المرفوع:</p>
          <img
            src={previewUrl}
            alt="Uploaded"
            className="max-w-full h-auto rounded shadow-lg"
          />
          <p className="mt-2 text-xs text-gray-500 break-all">{previewUrl}</p>
        </div>
      )}
    </div>
  );
}
