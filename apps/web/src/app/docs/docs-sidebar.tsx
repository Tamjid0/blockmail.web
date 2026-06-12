"use client";

import { Endpoint, methodColors, codeExamples } from "./data";

export function DocsSidebar({ endpoints }: { endpoints: Endpoint[] }) {
  return (
    <aside className="hidden lg:block">
      <div className="sticky top-12 space-y-6">
        <div>
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-400">
            Getting Started
          </h3>
          <ul className="space-y-1">
            <li>
              <a href="#introduction" className="text-sm text-gray-600 hover:text-gray-900">
                Introduction
              </a>
            </li>
            <li>
              <a href="#authentication" className="text-sm text-gray-600 hover:text-gray-900">
                Authentication
              </a>
            </li>
            <li>
              <a href="#base-url" className="text-sm text-gray-600 hover:text-gray-900">
                Base URL
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-400">
            Endpoints
          </h3>
          <ul className="space-y-1">
            {endpoints.map((ep) => (
              <li key={ep.path}>
                <a
                  href={`#${ep.path.replace(/\//g, "-")}`}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                >
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${methodColors[ep.method]}`}>
                    {ep.method}
                  </span>
                  {ep.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-400">
            SDKs
          </h3>
          <ul className="space-y-1">
            {Object.keys(codeExamples).map((lang) => (
              <li key={lang}>
                <a href="#sdks" className="text-sm text-gray-600 hover:text-gray-900 capitalize">
                  {lang === "node" ? "Node.js" : lang}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </aside>
  );
}
