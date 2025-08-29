"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, doc, onSnapshot, setDoc, deleteDoc, DocumentData } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Trash, Plus, ExternalLink } from "lucide-react";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import { useAuth } from "@/context/AuthContext";

interface Option {
  name: string;
  icon?: string;
  description?: string;
}

interface DropdownOption {
  id: string;
  options: Option[];
}

export default function DropdownManagerPage() {
  const [dropdowns, setDropdowns] = useState<DropdownOption[]>([]);
  const [saveMessage, setSaveMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [dropdownIdToDelete, setDropdownIdToDelete] = useState<string | null>(null);
  const [newOptions, setNewOptions] = useState<Record<string, { name: string; icon?: string; description?: string }>>({});
  const { user, loading: authLoading, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;
    if (!user || !isAdmin) router.push("/login");
  }, [user, authLoading, isAdmin, router]);

  useEffect(() => {
    if (!user || !isAdmin) return;

    const unsub = onSnapshot(
      collection(db, "dropDownOptions"),
      (snap) => {
        const list: DropdownOption[] = snap.docs.map((d) => {
          const data = d.data() as DocumentData;
          const opts = Array.isArray(data.options) ? (data.options as Option[]) : [];
          return { id: d.id, options: opts };
        });
        setDropdowns(list);
      },
      (error) => {
        const msg = error instanceof Error ? error.message : String(error);
        setSaveMessage(`Error: Failed to fetch dropdowns. ${msg}`);
      }
    );

    return () => unsub();
  }, [user, isAdmin]);

  const handleAddOption = async (dropdownId: string) => {
    const draft = newOptions[dropdownId];
    if (!draft?.name.trim()) {
      setSaveMessage("Error: Option name cannot be empty.");
      return;
    }

    setIsSaving(true);
    try {
      const dropdown = dropdowns.find((d) => d.id === dropdownId);
      if (!dropdown) {
        setSaveMessage("Error: Dropdown not found.");
        return;
      }

      const next: Option = {
        name: draft.name.trim(),
        ...(draft.icon ? { icon: draft.icon.trim() } : {}),
        ...(dropdownId === "dietTypes" && draft.description ? { description: draft.description.trim() } : {}),
      };

      await setDoc(doc(db, "dropDownOptions", dropdownId), { options: [...dropdown.options, next] }, { merge: true });
      setNewOptions((prev) => ({ ...prev, [dropdownId]: { name: "", icon: "", description: "" } }));
      setSaveMessage("Option added successfully!");
      setTimeout(() => setSaveMessage(""), 2000);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      setSaveMessage(`Error: ${msg}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateOption = async (dropdownId: string, index: number, field: keyof Option, value: string) => {
    setIsSaving(true);
    try {
      const dropdown = dropdowns.find((d) => d.id === dropdownId);
      if (!dropdown) {
        setSaveMessage("Error: Dropdown not found.");
        return;
      }
      const updated = [...dropdown.options];
      updated[index] = { ...updated[index], [field]: value || undefined };
      await setDoc(doc(db, "dropDownOptions", dropdownId), { options: updated }, { merge: true });
      setSaveMessage("Option updated successfully!");
      setTimeout(() => setSaveMessage(""), 2000);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      setSaveMessage(`Error: ${msg}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteOption = async (dropdownId: string, index: number) => {
    setIsSaving(true);
    try {
      const dropdown = dropdowns.find((d) => d.id === dropdownId);
      if (!dropdown) {
        setSaveMessage("Error: Dropdown not found.");
        return;
      }
      const updated = dropdown.options.filter((_, i) => i !== index);
      await setDoc(doc(db, "dropDownOptions", dropdownId), { options: updated }, { merge: true });
      setSaveMessage("Option deleted successfully!");
      setTimeout(() => setSaveMessage(""), 2000);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      setSaveMessage(`Error: ${msg}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteDropdown = async () => {
    if (!dropdownIdToDelete) return;
    setIsSaving(true);
    try {
      await deleteDoc(doc(db, "dropDownOptions", dropdownIdToDelete));
      setIsDeleteModalOpen(false);
      setDropdownIdToDelete(null);
      setSaveMessage("Dropdown deleted successfully!");
      setTimeout(() => setSaveMessage(""), 2000);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      setSaveMessage(`Error: ${msg}`);
    } finally {
      setIsSaving(false);
    }
  };

  const iconRequiredDropdowns = ["allergies", "dietTypes"];

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 text-[#FF6F61]" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  if (!user || !isAdmin) return null;

  return (
    <div className="p-6">
      {saveMessage && (
        <Alert className="mb-6" variant={saveMessage.includes("Error") ? "destructive" : "default"}>
          <AlertTitle>{saveMessage.includes("Error") ? "Error" : "Success"}</AlertTitle>
          <AlertDescription>{saveMessage}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Manage Dropdown Options</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 text-sm text-gray-600">
            <p>
              For icon names (used in allergies and dietTypes), visit{" "}
              <a
                href="https://materialdesignicons.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#FF6F61] underline inline-flex items-center"
              >
                materialdesignicons.com <ExternalLink className="h-4 w-4 ml-1" />
              </a>{" "}
              to browse and copy valid MaterialCommunityIcons names (e.g., peanut, carrot).
            </p>
          </div>

          <div className="space-y-6">
            {dropdowns.map((dropdown) => (
              <div key={dropdown.id} className="border p-4 rounded-md">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-md font-semibold capitalize">{dropdown.id}</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setDropdownIdToDelete(dropdown.id);
                      setIsDeleteModalOpen(true);
                    }}
                  >
                    <Trash className="h-4 w-4 text-red-500" />
                  </Button>
                </div>

                <div className="space-y-2">
                  {dropdown.options.map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        value={option.name}
                        onChange={(e) => handleUpdateOption(dropdown.id, index, "name", e.target.value)}
                        placeholder="Option name"
                        className="flex-1 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6F61]"
                      />
                      {dropdown.id === "dietTypes" && (
                        <input
                          value={option.description || ""}
                          onChange={(e) => handleUpdateOption(dropdown.id, index, "description", e.target.value)}
                          placeholder="Description"
                          className="flex-1 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6F61]"
                        />
                      )}
                      {iconRequiredDropdowns.includes(dropdown.id) && (
                        <input
                          value={option.icon || ""}
                          onChange={(e) => handleUpdateOption(dropdown.id, index, "icon", e.target.value)}
                          placeholder="Icon name (e.g., carrot)"
                          className="flex-1 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6F61]"
                        />
                      )}
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteOption(dropdown.id, index)}>
                        <Trash className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}

                  <div className="flex items-center gap-2 mt-2">
                    <input
                      value={newOptions[dropdown.id]?.name || ""}
                      onChange={(e) =>
                        setNewOptions((prev) => ({ ...prev, [dropdown.id]: { ...prev[dropdown.id], name: e.target.value } }))
                      }
                      placeholder="Add new option name"
                      className="flex-1 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6F61]"
                    />
                    {dropdown.id === "dietTypes" && (
                      <input
                        value={newOptions[dropdown.id]?.description || ""}
                        onChange={(e) =>
                          setNewOptions((prev) => ({ ...prev, [dropdown.id]: { ...prev[dropdown.id], description: e.target.value } }))
                        }
                        placeholder="Add description"
                        className="flex-1 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6F61]"
                      />
                    )}
                    {iconRequiredDropdowns.includes(dropdown.id) && (
                      <input
                        value={newOptions[dropdown.id]?.icon || ""}
                        onChange={(e) =>
                          setNewOptions((prev) => ({ ...prev, [dropdown.id]: { ...prev[dropdown.id], icon: e.target.value } }))
                        }
                        placeholder="Add icon name (e.g., carrot)"
                        className="flex-1 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6F61]"
                      />
                    )}
                    <Button variant="outline" size="sm" onClick={() => void handleAddOption(dropdown.id)} disabled={isSaving}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDropdownIdToDelete(null);
        }}
        onConfirm={() => void handleDeleteDropdown()}
        itemName="dropdown"
      />
    </div>
  );
}
