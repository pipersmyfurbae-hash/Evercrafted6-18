import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { FolderPlus, Loader2 } from "lucide-react";
import { FormEvent, useState } from "react";

export default function StudioProjectCreation({ workspaceId, onCreated }: { workspaceId: number; onCreated: (projectId: number) => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const createProject = trpc.project.create.useMutation({
    onSuccess: project => {
      setName("");
      setDescription("");
      onCreated(project.id);
    },
  });
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedName = name.trim();
    if (normalizedName.length < 2) return;
    createProject.mutate({ workspaceId, name: normalizedName, description: description.trim() || undefined });
  };

  return <Card className="border-border bg-white"><CardHeader><div className="flex items-start gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#fff0d7] text-[#a9522d]"><FolderPlus className="h-5 w-5" /></span><div><CardTitle>Start a Studio project</CardTitle><CardDescription>Create the project in the active workspace, then continue directly into its review and delivery workflow.</CardDescription></div></div></CardHeader><CardContent><form className="grid gap-3 sm:grid-cols-[1fr_1.35fr_auto]" onSubmit={submit}><label className="sr-only" htmlFor="studio-project-name">Project name</label><Input id="studio-project-name" value={name} onChange={event => setName(event.target.value)} minLength={2} required placeholder="Project name" /><label className="sr-only" htmlFor="studio-project-description">Project description</label><Input id="studio-project-description" value={description} onChange={event => setDescription(event.target.value)} placeholder="Optional context" /><Button type="submit" disabled={createProject.isPending || name.trim().length < 2} className="bg-[#516f5e] hover:bg-[#405c4c]">{createProject.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating…</> : "Create project"}</Button></form>{createProject.error ? <p role="alert" className="mt-3 text-sm text-destructive">We could not create the Studio project. Check the details and try again.</p> : null}</CardContent></Card>;
}
