"use client";

import { useEffect, useState } from "react";

export default function PrivacyPage() {
  const [content, setContent] = useState<string>("");

  useEffect(() => {
    fetch("/privacy-policy.html")
      .then((res) => res.text())
      .then((data) => setContent(data));
  }, []);

  return (
    <main className="prose mx-auto p-6">
      <div className="bg-white p-2 rounded-md">
        <div dangerouslySetInnerHTML={{ __html: content }} />
      </div>
    </main>
  );
}
