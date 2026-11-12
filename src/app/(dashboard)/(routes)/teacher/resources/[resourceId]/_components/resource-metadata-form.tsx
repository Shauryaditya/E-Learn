"use client";

import axios from "axios";
import { Loader2, Pencil, Save, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EXAM_TYPES, SCHOOL_BOARDS, SCHOOL_CLASSES } from "@/lib/resource-options";

type Metadata = { title: string; board: string; grade: string; subject: string; schoolName: string; examType: string; year: number | null; category: string };

export const ResourceMetadataForm = ({ resourceId, initialData }: { resourceId: string; initialData: Metadata }) => {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [values, setValues] = useState(initialData);
  const update = (key: keyof Metadata, value: string | number | null) => setValues((current) => ({ ...current, [key]: value }));
  const save = async () => {
    try {
      setSaving(true);
      await axios.patch(`/api/resources/${resourceId}`, values);
      toast.success("Paper details updated");
      setEditing(false);
      router.refresh();
    } catch (error) {
      toast.error(axios.isAxiosError(error) ? error.response?.data?.message || "Could not update paper details" : "Could not update paper details");
    } finally {
      setSaving(false);
    }
  };

  if (!editing) return <section className="flex flex-col justify-between gap-3 rounded-lg border bg-card p-4 sm:flex-row sm:items-center"><div><h2 className="text-sm font-semibold">Paper details</h2><p className="mt-1 text-xs text-muted-foreground">{[values.schoolName || "Board paper", values.board, values.grade, values.subject, values.year].filter(Boolean).join(" · ")}</p></div><Button variant="outline" size="sm" onClick={() => setEditing(true)}><Pencil className="mr-2 h-3.5 w-3.5" />Edit details</Button></section>;

  return <section className="rounded-lg border bg-card p-4 sm:p-5"><div className="mb-4"><h2 className="font-semibold">Edit paper details</h2><p className="mt-1 text-xs text-muted-foreground">Changing board, class or subject safely remaps existing questions without deleting attempts.</p></div><div className="grid gap-4 sm:grid-cols-2"><Field label="Title"><Input value={values.title} onChange={(event) => update("title", event.target.value)} /></Field><Field label="Subject"><Input value={values.subject} onChange={(event) => update("subject", event.target.value)} placeholder="Mathematics" /></Field><Field label="Board"><OptionSelect value={values.board} onChange={(value) => update("board", value)} options={SCHOOL_BOARDS} /></Field><Field label="Class"><OptionSelect value={values.grade} onChange={(value) => update("grade", value)} options={SCHOOL_CLASSES} /></Field>{values.category === "SCHOOL" && <Field label="School"><Input value={values.schoolName} onChange={(event) => update("schoolName", event.target.value)} /></Field>}<Field label="Exam"><OptionSelect value={values.examType} onChange={(value) => update("examType", value)} options={EXAM_TYPES} /></Field><Field label="Year"><Input inputMode="numeric" value={values.year || ""} onChange={(event) => update("year", event.target.value ? Number(event.target.value) : null)} /></Field></div><div className="mt-5 flex justify-end gap-2"><Button variant="ghost" onClick={() => { setValues(initialData); setEditing(false); }} disabled={saving}><X className="mr-2 h-4 w-4" />Cancel</Button><Button onClick={save} disabled={saving}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Save details</Button></div></section>;
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => <label className="grid gap-1.5 text-xs font-medium">{label}{children}</label>;
const OptionSelect = ({ value, onChange, options }: { value: string; onChange: (value: string) => void; options: readonly (string | { label: string; value: string })[] }) => <Select value={value} onValueChange={onChange}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{options.map((option) => { const optionValue = typeof option === "string" ? option : option.value; const label = typeof option === "string" ? option : option.label; return <SelectItem key={optionValue} value={optionValue}>{label}</SelectItem>; })}</SelectContent></Select>;
