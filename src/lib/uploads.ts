import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";

export async function uploadRecipeImage(recipeId: string, file: File) {
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  const contentType =
    file.type ||
    (ext === "png" ? "image/png" :
     ext === "webp" ? "image/webp" : "image/jpeg");

  const path = `recipeImages/${recipeId}/${Date.now()}.${ext || "jpg"}`;
  const storageRef = ref(storage, path);

  await uploadBytes(storageRef, file, { contentType: file.type });
  const url = await getDownloadURL(storageRef);
  return { url, storagePath: path };
}
