"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ChecklistItem } from "@prisma/client";
import { CHECKLIST_CATEGORIES } from "@/lib/constants/checklist-categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ChecklistManagerProps {
  initialItems: ChecklistItem[];
}

export function ChecklistManager({ initialItems }: ChecklistManagerProps) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    requirement: "",
    expectedValue: "",
    mandatory: true,
    category: CHECKLIST_CATEGORIES[0],
  });

  const grouped = useMemo(() => {
    return items.reduce<Record<string, ChecklistItem[]>>((acc, item) => {
      if (!item.enabled) {
        return acc;
      }
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {});
  }, [items]);

  function resetForm() {
    setEditingId(null);
    setForm({
      requirement: "",
      expectedValue: "",
      mandatory: true,
      category: CHECKLIST_CATEGORIES[0],
    });
  }

  async function saveItem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const payload = {
      requirement: form.requirement,
      expectedValue: form.expectedValue,
      mandatory: form.mandatory,
      category: form.category,
    };

    try {
      const response = await fetch(
        editingId ? `/api/checklist/${editingId}` : "/api/checklist",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error ?? "Save failed");
      }

      resetForm();
      router.refresh();
      const listResponse = await fetch("/api/checklist");
      const listPayload = await listResponse.json();
      if (listPayload.success) {
        setItems(listPayload.data);
      }
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Save failed");
    }
  }

  async function deleteItem(id: string) {
    setError(null);
    try {
      const response = await fetch(`/api/checklist/${id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error ?? "Delete failed");
      }
      setItems((current) =>
        current.map((item) =>
          item.id === id ? { ...item, enabled: false } : item
        )
      );
      if (editingId === id) {
        resetForm();
      }
      router.refresh();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Delete failed");
    }
  }

  function startEdit(item: ChecklistItem) {
    setEditingId(item.id);
    setForm({
      requirement: item.requirement,
      expectedValue: item.expectedValue,
      mandatory: item.mandatory,
      category: item.category,
    });
  }

  return (
    <div className="space-y-4">
      <Card className="gap-3 py-4">
        <CardHeader className="gap-1 px-4 pb-0">
          <CardTitle className="text-lg">
            {editingId ? "Edit requirement" : "Add requirement"}
          </CardTitle>
          <CardDescription className="text-sm">
            These rules are the source of truth for AI checklist validation in Phase 4.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <form onSubmit={saveItem} className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="requirement">Requirement</Label>
              <Input
                id="requirement"
                value={form.requirement}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    requirement: event.target.value,
                  }))
                }
                placeholder="Landlord named as additional insured"
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="expectedValue">Expected value</Label>
              <Input
                id="expectedValue"
                value={form.expectedValue}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    expectedValue: event.target.value,
                  }))
                }
                placeholder="Property manager on COI"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="category">Category</Label>
              <NativeSelect
                id="category"
                value={form.category}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    category: event.target.value,
                  }))
                }
              >
                {CHECKLIST_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="flex items-end gap-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.mandatory}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      mandatory: event.target.checked,
                    }))
                  }
                />
                Mandatory
              </label>
            </div>
            <div className="flex gap-2 md:col-span-2">
              <Button type="submit" size="sm">
                {editingId ? "Update item" : "Add item"}
              </Button>
              {editingId ? (
                <Button type="button" size="sm" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              ) : null}
            </div>
          </form>
          {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
        </CardContent>
      </Card>

      {Object.entries(grouped).map(([category, categoryItems]) => (
        <Card key={category} className="gap-3 py-4">
          <CardHeader className="gap-1 px-4 pb-0">
            <CardTitle className="text-lg">{category}</CardTitle>
            <CardDescription className="text-sm">
              {categoryItems.length} requirement{categoryItems.length === 1 ? "" : "s"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 px-4 pb-4">
            {categoryItems.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-start justify-between gap-2 rounded-md border px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-medium">{item.requirement}</p>
                  <p className="text-muted-foreground">
                    Expected: {item.expectedValue}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.mandatory ? "Mandatory" : "Optional"}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <Button
                    type="button"
                    size="xs"
                    variant="outline"
                    onClick={() => startEdit(item)}
                  >
                    Edit
                  </Button>
                  <Button
                    type="button"
                    size="xs"
                    variant="ghost"
                    onClick={() => deleteItem(item.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
