import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { FileClock, FileUp, Loader2 } from "lucide-react";
import { ChangeEvent, useEffect, useState } from "react";

function readAsBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("The selected version could not be read."));
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.readAsDataURL(file);
  });
}

export default function StudioAssetVersionHistory({ workspaceId, projectId }: { workspaceId: number; projectId: number }) {
  const assets = trpc.asset.list.useQuery({ workspaceId, projectId });
  const [assetId, setAssetId] = useState<number | undefined>();
  const [fileError, setFileError] = useState<string | null>(null);
  useEffect(() => { if (!assetId && assets.data?.[0]) setAssetId(assets.data[0].id); }, [assetId, assets.data]);
  const history = trpc.asset.versionHistory.useQuery({ workspaceId, assetId: assetId ?? 0 }, { enabled: Boolean(assetId) });
  const uploadVersion = trpc.asset.uploadVersionBase64.useMutation({ onSuccess: () => { setFileError(null); assets.refetch(); history.refetch(); } });
  const onFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !assetId) return;
    if (file.size > 5 * 1024 * 1024) { setFileError("Choose a version smaller than 5 MiB."); return; }
    try { uploadVersion.mutate({ workspaceId, assetId, name: file.name, mediaType: file.type || "application/octet-stream", base64: await readAsBase64(file) }); }
    catch (error) { setFileError(error instanceof Error ? error.message : "The file could not be prepared."); }
  };

  return <Card className="border-border bg-white"><CardHeader><div className="flex items-start gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#e4eee6] text-[#405c4c]"><FileClock className="h-5 w-5" /></span><div><CardTitle>Asset version history</CardTitle><CardDescription>Upload a governed revision for an existing asset. The latest version becomes the current governed file while earlier version records remain traceable.</CardDescription></div></div></CardHeader><CardContent className="space-y-4">{assets.error ? <p role="alert" className="text-sm text-destructive">We could not load project assets for versioning.</p> : null}{assets.data?.length ? <><div className="flex flex-col gap-3 sm:flex-row"><label className="sr-only" htmlFor="studio-version-asset">Asset to version</label><select id="studio-version-asset" className="h-10 min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-sm" value={assetId ?? ""} onChange={event => setAssetId(Number(event.target.value))}>{assets.data.map(asset => <option key={asset.id} value={asset.id}>{asset.name}</option>)}</select><label className="inline-flex h-10 cursor-pointer items-center justify-center rounded-lg bg-[#17202b] px-3 text-sm font-medium text-white hover:bg-[#2a3746]"><FileUp className="mr-2 h-4 w-4" />{uploadVersion.isPending ? "Uploading revision…" : "Upload revision"}<Input type="file" className="sr-only" onChange={onFile} disabled={uploadVersion.isPending} /></label></div>{fileError ? <p role="alert" className="text-sm text-destructive">{fileError}</p> : null}{uploadVersion.error ? <p role="alert" className="text-sm text-destructive">We could not save the new version. Try again with a file smaller than 5 MiB.</p> : null}{history.error ? <p role="alert" className="text-sm text-destructive">We could not load version history.</p> : null}{history.isLoading ? <p className="text-sm text-muted-foreground">Loading version history…</p> : null}{history.data?.versions.map(version => <div key={version.id} className="flex items-center justify-between gap-3 rounded-xl border border-border p-3"><div><p className="text-sm font-medium">Version {version.versionNumber}</p><p className="mt-1 text-xs text-muted-foreground">{(version.sizeBytes / 1024).toFixed(1)} KB · {new Date(version.createdAt).toLocaleString()}</p></div>{version.versionNumber === history.data.versions[0]?.versionNumber ? <span className="rounded-full bg-[#e4eee6] px-2.5 py-1 text-xs font-medium text-[#405c4c]">Current</span> : null}</div>)}</> : <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">Upload a project asset before creating a new version.</p>}</CardContent></Card>;
}
