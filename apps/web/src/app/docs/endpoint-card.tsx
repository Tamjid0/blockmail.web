"use client";

import { Endpoint, methodColors } from "./data";

export function EndpointCard({
  endpoint,
  isExpanded,
  onToggle,
}: {
  endpoint: Endpoint;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const id = endpoint.path.replace(/\//g, "-");

  return (
    <div id={id} className="scroll-mt-20 rounded-xl border border-gray-100 bg-white">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 p-4 text-left"
      >
        <span className={`shrink-0 rounded px-2 py-1 text-xs font-bold ${methodColors[endpoint.method]}`}>
          {endpoint.method}
        </span>
        <span className="font-medium text-gray-900">{endpoint.path}</span>
        <span className="ml-auto text-xs text-gray-400">{endpoint.title}</span>
      </button>
      {isExpanded && (
        <div className="border-t border-gray-50 px-4 pb-4">
          <p className="mt-3 text-sm text-gray-500">{endpoint.description}</p>
          {endpoint.auth && (
            <p className="mt-2 text-xs text-gray-400">
              Requires authentication via <code className="rounded bg-gray-100 px-1 py-0.5">X-API-Key</code> header.
            </p>
          )}
          {endpoint.requestExample && (
            <div className="mt-4">
              <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-400">
                Request Body
              </h4>
              <pre className="overflow-x-auto rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                <code>{endpoint.requestExample}</code>
              </pre>
            </div>
          )}
          <div className="mt-4">
            <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-400">
              Response
            </h4>
            <pre className="overflow-x-auto rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
              <code>{endpoint.responseExample}</code>
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
