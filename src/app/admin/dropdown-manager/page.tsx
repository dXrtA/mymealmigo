"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, doc, setDoc, deleteDoc, getDocs } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Trash, Plus, ExternalLink } from "lucide-react";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import { useAuth } from "@/context/AuthContext";

interface Option {
  name: string;
  icon?: string;        // Optional
  description?: string; // Optional, used for dietTypes
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
  const [newOptions, setNewOptions] = useState<{ [key: string]: { name: string; icon?: string; description?: string } }>({});
  const { user, loading: authLoading, isAdmin } = useAuth();
  const router = useRouter();

  // dropdowns that require icons
  const iconRequiredDropdowns = ["allergies", "dietTypes"];

  useEffect(() => {
    if (authLoading) return;
    if (!user || !isAdmin) {
      router.push("/login");
    }
  }, [user, authLoading, isAdmin, router]);

  // Loader (non-streaming)
  const loadDropdowns = async () => {
    try {
      const snap = await getDocs(collection(db, "dropDownOptions"));
      const dropdownList: DropdownOption[] = snap.docs.map((d) => ({
        id: d.id,
        options: (d.data() as any)?.options || [],
      }));
      setDropdowns(dropdownList);
    } catch (error: any) {
      console.error("Error fetching dropDownOptions:", error);
      setSaveMessage(`Error: Failed to fetch dropdowns. ${error.message}`);
    }
  };

  useEffect(() => {
    if (!user || !isAdmin) return;
    loadDropdowns();
  }, [user, isAdmin]);

  const handleAddOption = async (dropdownId: string) => {
    const newOption = newOptions[dropdownId];
    if (!newOption?.name?.trim()) {
      setSaveMessage("Error: Option name cannot be empty.");
      return;
    }

    setIsSaving(true);
    try {
      const current = dropdowns.find((d) => d.id === dropdownId);
      if (!current) {
        setSaveMessage("Error: Dropdown not found.");
        return;
      }
      const newOptionData: Option = {
        name: newOption.name.trim(),
        ...(newOption.icon ? { icon: newOption.icon.trim() } : {}),
        ...(dropdownId === "dietTypes" && newOption.description ? { description: newOption.description.trim() } : {}),
      };
      const updatedOptions = [...current.options, newOptionData];
      await setDoc(doc(db, "dropDownOptions", dropdownId), { options: updatedOptions }, { merge: true });

      // clear input
      setNewOptions((prev) => ({ ...prev, [dropdownId]: { name: "", icon: "", description: "" } }));

      setSaveMessage("Option added successfully!");
      loadDropdowns();
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (error: any) {
      console.error("Error adding option:", error);
      setSaveMessage(`Error: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateOption = async (dropdownId: string, index: number, field: keyof Option, value: string) => {
    setIsSaving(true);
    try {
      const current = dropdowns.find((d) => d.id === dropdownId);
      if (!current) {
        setSaveMessage("Error: Dropdown not found.");
        return;
      }
      const updatedOptions = [...current.options];
      updatedOptions[index] = { ...updatedOptions[index], [field]: value || undefined }; // empty -> undefined
      await setDoc(doc(db, "dropDownOptions", dropdownId), { options: updatedOptions }, { merge: true });

      setSaveMessage("Option updated successfully!");
      loadDropdowns();
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (error: any) {
      console.error("Error updating option:", error);
      setSaveMessage(`Error: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteOption = async (dropdownId: string, index: number) => {
    setIsSaving(true);
    try {
      const current = dropdowns.find((d) => d.id === dropdownId);
      if (!current) {
        setSaveMessage("Error: Dropdown not found.");
        return;
      }
      const updatedOptions = current.options.filter((_, i) => i !== index);
      await setDoc(doc(db, "dropDownOptions", dropdownId), { options: updatedOptions }, { merge: true });

      setSaveMessage("Option deleted successfully!");
      loadDropdowns();
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (error: any) {
      console.error("Error deleting option:", error);
      setSaveMessage(`Error: ${error.message}`);
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
      loadDropdowns();
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (error: any) {
      console.error("Error deleting dropdown:", error);
      setSaveMessage(`Error: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

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
              to browse and copy valid MaterialCommunityIcons names (e.g., {'peanut'}, {'carrot'}).
              Ensure the icon name is supported by the mobile app. Icons are optional for other
              categories like activityLevel.
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
                          placeholder="Icon name (e.g., peanut)"
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
                        setNewOptions((prev) => ({
                          ...prev,
                          [dropdown.id]: { ...prev[dropdown.id], name: e.target.value },
                        }))
                      }
                      placeholder="Add new option name"
                      className="flex-1 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6F61]"
                    />

                    {dropdown.id === "dietTypes" && (
                      <input
                        value={newOptions[dropdown.id]?.description || ""}
                        onChange={(e) =>
                          setNewOptions((prev) => ({
                            ...prev,
                            [dropdown.id]: { ...prev[dropdown.id], description: e.target.value },
                          }))
                        }
                        placeholder="Add description"
                        className="flex-1 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6F61]"
                      />
                    )}

                    {iconRequiredDropdowns.includes(dropdown.id) && (
                      <input
                        value={newOptions[dropdown.id]?.icon || ""}
                        onChange={(e) =>
                          setNewOptions((prev) => ({
                            ...prev,
                            [dropdown.id]: { ...prev[dropdown.id], icon: e.target.value },
                          }))
                        }
                        placeholder="Add icon name (e.g., carrot)"
                        className="flex-1 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6F61]"
                      />
                    )}

                    <Button variant="outline" size="sm" onClick={() => handleAddOption(dropdown.id)} disabled={isSaving}>
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
        onConfirm={handleDeleteDropdown}
        itemName="dropdown"
      />
    </div>
  );
}
