"use client";

import { useMemo, useState } from "react";

type AssetKind =
  | "desktopBanner"
  | "mobileBanner"
  | "contentImage"
  | "doc"
  | "pdf"
  | "other";

type AssetItem = {
  id: string;
  name: string;
  size?: string;
  type: AssetKind;
  folder: string;
  confidence: number;
  match: string;
  status?: "accessible" | "restricted" | "unknown";
  reason?: string;
  previewUrl?: string;
  downloadUrl?: string;
  fileId?: string;
  mimeType?: string;
  convertedFormat?: "webp";
  convertedDimensions?: string;
  outputLabel?: string;
  targetFileName?: string;
  authorName?: string;
  displayLabel?: string;
};

type BackendResponse = {
  success: boolean;
  message?: string;
  data?: {
    valid: boolean;
    message: string;
    folderId: string | null;
    normalizedUrl: string;
    assets: AssetItem[];
    categories: Record<AssetKind, AssetItem[]>;
    insightTitle?: string;
    authorName?: string;
    authorImage?: AssetItem | null;
    authorDescription?: AssetItem | null;
  };
};

const categoryMap: Record<AssetKind, { title: string; accent: string }> = {
  desktopBanner: { title: "Desktop Banner Image", accent: "bg-blue-500/10 text-blue-700 ring-blue-200" },
  mobileBanner: { title: "Mobile Banner Image", accent: "bg-violet-500/10 text-violet-700 ring-violet-200" },
  contentImage: { title: "Content Image", accent: "bg-emerald-500/10 text-emerald-700 ring-emerald-200" },
  doc: { title: "Document File", accent: "bg-amber-500/10 text-amber-700 ring-amber-200" },
  pdf: { title: "PDF File", accent: "bg-rose-500/10 text-rose-700 ring-rose-200" },
  other: { title: "Other Assets", accent: "bg-slate-500/10 text-slate-700 ring-slate-200" },
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

export default function Home() {
  const [driveUrl, setDriveUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<AssetItem | null>(null);
  const [result, setResult] = useState<BackendResponse["data"] | null>(null);

  const assets = useMemo(() => result?.assets ?? [], [result?.assets]);
  const restrictedAssets = useMemo(
    () => assets.filter((asset) => asset.status === "restricted" || asset.reason),
    [assets]
  );
  const visibleAssets = useMemo(
    () => assets.filter((asset) => asset.status !== "restricted" && !asset.reason),
    [assets]
  );

  const categorizedAssets = useMemo(() => {
    return Object.keys(categoryMap).reduce<Record<string, AssetItem[]>>((acc, key) => {
      acc[key] = visibleAssets.filter((asset) => asset.type === key);
      return acc;
    }, {});
  }, [visibleAssets]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!driveUrl.trim()) return;

    setIsLoading(true);
    setHasFetched(false);
    setError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/insights/scan-drive`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ driveUrl }),
      });

      const payload: BackendResponse = await res.json();

      if (!res.ok || !payload.success || !payload.data) {
        throw new Error(payload.message || "Unable to scan the Drive folder.");
      }

      setResult(payload.data);
      setSelectedAsset(payload.data.assets[0] ?? null);
      setHasFetched(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong while scanning the Drive folder.";
      setError(message);
      setResult(null);
      setHasFetched(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-blue-700">Insight Automation</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">Drive Source Review</h1>
          </div>
          <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm">
            Draft pipeline
          </div>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ring-1 ring-slate-100">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 lg:flex-row">
            <div className="flex-1">
              <label htmlFor="drive-url" className="mb-2 block text-sm font-semibold text-slate-700">
                Google Drive folder URL
              </label>
              <input
                id="drive-url"
                type="url"
                value={driveUrl}
                onChange={(e) => setDriveUrl(e.target.value)}
                placeholder="https://drive.google.com/drive/folders/..."
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={isLoading || !driveUrl.trim()}
                className="inline-flex h-[52px] min-w-[160px] items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-base font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {isLoading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Fetching...
                  </>
                ) : (
                  "Submit"
                )}
              </button>
            </div>
          </form>
        </section>

        {error && (
          <section className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </section>
        )}

        {isLoading && (
          <section className="mt-8 rounded-2xl border border-blue-100 bg-blue-50 p-8 shadow-sm">
            <div className="flex items-center justify-center gap-4">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
              <div>
                <p className="text-lg font-semibold text-blue-900">Scanning Drive folder</p>
                <p className="text-sm text-blue-700">Analyzing files, detecting asset types, and mapping content categories...</p>
              </div>
            </div>
          </section>
        )}

        {!isLoading && hasFetched && result && (
          <main className="mt-8 space-y-6">
            {result.message && (
              <section
                className={`rounded-2xl border p-4 shadow-sm ${
                  /GOOGLE_DRIVE_API_KEY|missing/i.test(result.message)
                    ? "border-amber-200 bg-amber-50"
                    : "border-slate-200 bg-white"
                }`}
              >
                <p className="text-sm font-medium text-slate-700">Backend status</p>
                <p className="mt-1 text-sm text-slate-600">{result.message}</p>
              </section>
            )}

            {assets.length === 0 && (
              <section className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
                No Drive assets were returned for this folder. This usually means the folder URL is invalid, the folder is not publicly shared, or it contains files that are not readable through the Drive API.
              </section>
            )}

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Drive folder</p>
                  <h2 className="text-xl font-bold text-slate-900">{result.folderId ?? "Scanned source"}</h2>
                </div>
                <div className="flex flex-wrap gap-2 text-xs font-medium">
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">
                    {assets.length} assets found
                  </span>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-emerald-700">
                    {visibleAssets.length} accessible
                  </span>
                  <span className="rounded-full bg-amber-100 px-2.5 py-1 text-amber-700">
                    {restrictedAssets.length} restricted
                  </span>
                </div>
              </div>
            </section>

            {result.insightTitle && (
              <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">Insight title</p>
                <h2 className="mt-2 text-2xl font-bold text-blue-900">{result.insightTitle}</h2>
              </section>
            )}

            {(result.authorImage || result.authorDescription || result.authorName) && (
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-center">
                  {result.authorImage?.previewUrl && (
                    <img
                      src={result.authorImage.previewUrl}
                      alt={result.authorImage.name || "Author image"}
                      className="h-24 w-24 rounded-full object-cover ring-2 ring-slate-200"
                    />
                  )}

                  <div className="flex-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Author</p>
                    <h3 className="mt-2 text-xl font-bold text-slate-900">
                      {result.authorName || result.authorImage?.authorName || "Author"}
                    </h3>

                    {result.authorDescription && (
                      <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Description source</p>
                        <p className="mt-2 text-sm font-medium text-slate-800">{result.authorDescription.name}</p>
                        <a
                          href={result.authorDescription.previewUrl || result.authorDescription.downloadUrl || "#"}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-flex text-sm font-semibold text-blue-700 underline"
                        >
                          Open author description
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}

            {selectedAsset && (
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Selected file</p>
                    <h3 className="mt-1 text-lg font-semibold text-slate-900">{selectedAsset.name}</h3>
                  </div>
                  <a
                    href={selectedAsset.previewUrl || selectedAsset.downloadUrl || "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                  >
                    Open source
                  </a>
                </div>

                <div className="mb-4 flex flex-wrap gap-2 text-xs text-slate-600">
                  {selectedAsset.outputLabel && (
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 ring-1 ring-slate-200">{selectedAsset.outputLabel}</span>
                  )}
                  {selectedAsset.convertedDimensions && (
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 ring-1 ring-slate-200">{selectedAsset.convertedDimensions}</span>
                  )}
                  {selectedAsset.convertedFormat && (
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 ring-1 ring-slate-200">{selectedAsset.convertedFormat}</span>
                  )}
                </div>

                <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                  {selectedAsset.type === "contentImage" || selectedAsset.type === "desktopBanner" || selectedAsset.type === "mobileBanner" || selectedAsset.type === "other" ? (
                    selectedAsset.previewUrl ? (
                      <img src={selectedAsset.previewUrl} alt={selectedAsset.name} className="max-h-[500px] w-full object-contain" />
                    ) : (
                      <div className="p-6 text-sm text-slate-500">No image preview available.</div>
                    )
                  ) : selectedAsset.type === "pdf" ? (
                    selectedAsset.previewUrl ? (
                      <iframe src={selectedAsset.previewUrl} className="h-[500px] w-full" title={selectedAsset.name} />
                    ) : (
                      <div className="p-6 text-sm text-slate-500">No PDF preview available.</div>
                    )
                  ) : selectedAsset.type === "doc" ? (
                    selectedAsset.previewUrl ? (
                      <iframe src={selectedAsset.previewUrl} className="h-[500px] w-full" title={selectedAsset.name} />
                    ) : (
                      <div className="p-6 text-sm text-slate-500">No document preview available.</div>
                    )
                  ) : (
                    <div className="p-6 text-sm text-slate-500">Preview not available for this file type.</div>
                  )}
                </div>
              </section>
            )}

            {restrictedAssets.length > 0 && (
              <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold text-amber-900">Files hidden by access rules</h3>
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-200">
                    {restrictedAssets.length} items
                  </span>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {restrictedAssets.map((item) => (
                    <div key={item.id} className="rounded-xl border border-amber-200 bg-white p-3">
                      <p className="font-semibold text-slate-900">{item.name}</p>
                      <p className="mt-1 text-xs text-slate-500">{item.folder}</p>
                      <p className="mt-2 text-xs text-amber-800">{item.reason || "This item is not visible to the current user."}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <div className="grid gap-6 xl:grid-cols-2">
              {Object.entries(categorizedAssets).map(([key, items]) => {
                const details = categoryMap[key as AssetKind];
                if (!items.length) return null;

                return (
                  <section key={key} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${details.accent}`}>
                        {details.title}
                      </div>
                      <span className="text-sm font-medium text-slate-500">{items.length} items</span>
                    </div>

                    <div className="space-y-3">
                      {items.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setSelectedAsset(item)}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-left transition hover:border-blue-300 hover:bg-blue-50"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                              <p className="mt-1 text-xs text-slate-500">{item.folder}</p>
                            </div>
                            <span className="rounded-full bg-white px-2 py-1 text-[11px] font-medium text-slate-600 ring-1 ring-slate-200">
                              {item.confidence}%
                            </span>
                          </div>

                          <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
                            <span>{item.size || "Unknown size"}</span>
                            <span>{item.match}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          </main>
        )}
      </div>
    </div>
  );
}
