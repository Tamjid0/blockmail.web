"use client";

import { useState } from "react";
import { codeExamples } from "./data";

export function CodeExamples() {
  const [activeTab, setActiveTab] = useState("curl");

  return (
    <section id="sdks">
      <h2 className="text-xl font-semibold text-gray-900">Code Examples</h2>
      <p className="mt-2 text-sm text-gray-500">
        Copy-paste ready examples in your preferred language.
      </p>
      <div className="mt-6">
        <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
          {Object.keys(codeExamples).map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => setActiveTab(lang)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
                activeTab === lang
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {lang === "node" ? "Node.js" : lang}
            </button>
          ))}
        </div>
        <div className="mt-4 rounded-xl border border-gray-100 bg-white p-4">
          <pre className="overflow-x-auto text-sm text-gray-700">
            <code>{codeExamples[activeTab]?.[0]?.code}</code>
          </pre>
        </div>
      </div>
    </section>
  );
}
