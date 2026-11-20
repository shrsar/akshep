
"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase";

type ReportFormProps = {
  communityId: string;
};

const categories = [
  "Infrastructure",
  "Cleanliness",
  "Safety and Security",
  "Facilities",
  "Maintenance",
  "Water and Electricity",
  "Other",
];

const MAX_PHOTOS = 3;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

export default function ReportForm({ communityId }: ReportFormProps) {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Infrastructure");
  const [location, setLocation] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Validate selected photos.
  function handlePhotoChange(files: FileList | null) {
    setError("");
    setPhotos([]);

    if (!files || files.length === 0) {
      return;
    }

    const selected = Array.from(files);

    if (selected.length > MAX_PHOTOS) {
      setError(`You can upload a maximum of ${MAX_PHOTOS} photos.`);
      return;
    }

    for (const photo of selected) {
      if (!ALLOWED_TYPES.includes(photo.type)) {
        setError("Only JPG, PNG and WEBP images are allowed.");
        return;
      }

      if (photo.size > MAX_FILE_SIZE) {
        setError("Each photo must be 5 MB or smaller.");
        return;
      }
    }

    setPhotos(selected);
  }

  // Submit the report.
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading) return;

    setError("");
    setSuccess("");

    // Validate title.
    const cleanTitle = title.trim();

    if (cleanTitle.length < 5) {
      setError("The title must contain at least 5 characters.");
      return;
    }

    if (cleanTitle.length > 150) {
      setError("The title cannot exceed 150 characters.");
      return;
    }

    // Validate description.
    const cleanDescription = description.trim();

    if (cleanDescription.length < 20) {
      setError("Please provide at least 20 characters in the description.");
      return;
    }

    if (cleanDescription.length > 5000) {
      setError("The description cannot exceed 5000 characters.");
      return;
    }

    // Validate category.
    if (!categories.includes(category)) {
      setError("Please select a valid category.");
      return;
    }

    if (location.trim().length > 250) {
      setError("Location cannot exceed 250 characters.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      // 1. Verify the logged-in user.
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        router.replace("/login");
        throw new Error("Your session has expired. Please log in again.");
      }

      // 2. Verify actual community membership.
      const { data: membership, error: membershipError } =
        await supabase
          .from("memberships")
          .select("id, role")
          .eq("user_id", user.id)
          .eq("community_id", communityId)
          .maybeSingle();

      if (membershipError) {
        throw new Error(
          `Unable to verify community membership: ${membershipError.message}`
        );
      }

      if (!membership) {
        throw new Error("You do not have access to this community.");
      }

      // 3. Upload photos to private Supabase Storage.
      const evidencePaths: string[] = [];

      for (const photo of photos) {
        const extension =
          photo.name.split(".").pop()?.toLowerCase() || "jpg";

        const filePath = [
          communityId,
          user.id,
          `${crypto.randomUUID()}.${extension}`,
        ].join("/");

        const { error: uploadError } = await supabase.storage
          .from("community-problem-evidence")
          .upload(filePath, photo, {
            contentType: photo.type,
            upsert: false,
          });

        if (uploadError) {
          throw new Error(
            `Photo upload failed: ${uploadError.message}`
          );
        }

        evidencePaths.push(filePath);
      }

      // 4. Insert the report.
      // The database trigger determines submitted_by_role
      // and routing_target using the user's actual membership.
      const { error: insertError } = await supabase
        .from("problem_reports")
        .insert({
          community_id: communityId,
          created_by: user.id,
          title: cleanTitle,
          description: cleanDescription,
          category,
          location: location.trim() || null,
          evidence_paths: evidencePaths,
        });

      if (insertError) {
        throw new Error(
          `Report submission failed: ${insertError.message}`
        );
      }

      // 5. Show success and return to the dashboard.
      setSuccess("Your problem report has been submitted successfully.");

      setTitle("");
      setDescription("");
      setCategory("Infrastructure");
      setLocation("");
      setPhotos([]);

      router.push(
        `/dashboard?communityId=${encodeURIComponent(communityId)}&reportSubmitted=1`
      );

      router.refresh();
    } catch (err) {
      console.error("Report submission error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Problem title */}
      <div>
        <label
          htmlFor="report-title"
          className="mb-2 block text-sm font-medium"
        >
          Problem title *
        </label>

        <input
          id="report-title"
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={150}
          required
          disabled={loading}
          placeholder="Example: Broken lights near the entrance"
          className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-blue-500 disabled:opacity-60"
        />
      </div>

      {/* Description */}
      <div>
        <label
          htmlFor="report-description"
          className="mb-2 block text-sm font-medium"
        >
          Description *
        </label>

        <textarea
          id="report-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          minLength={20}
          maxLength={5000}
          rows={5}
          required
          disabled={loading}
          placeholder="Explain what happened, where it happened and why it needs attention..."
          className="w-full resize-y rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-blue-500 disabled:opacity-60"
        />

        <p className="mt-1 text-xs text-slate-500">
          Minimum 20 characters. Maximum 5000 characters.
        </p>
      </div>

      {/* Category */}
      <div>
        <label
          htmlFor="report-category"
          className="mb-2 block text-sm font-medium"
        >
          Category *
        </label>

        <select
          id="report-category"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          disabled={loading}
          className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-blue-500 disabled:opacity-60"
        >
          {categories.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      {/* Location */}
      <div>
        <label
          htmlFor="report-location"
          className="mb-2 block text-sm font-medium"
        >
          Location within the community
        </label>

        <input
          id="report-location"
          type="text"
          value={location}
          onChange={(event) => setLocation(event.target.value)}
          maxLength={250}
          disabled={loading}
          placeholder="Example: Main entrance, Block B, Floor 2"
          className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-blue-500 disabled:opacity-60"
        />
      </div>

      {/* Photo evidence */}
      <div>
        <label
          htmlFor="report-photos"
          className="mb-2 block text-sm font-medium"
        >
          Photo evidence (optional)
        </label>

        <input
          id="report-photos"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          disabled={loading}
          onChange={(event) => handlePhotoChange(event.target.files)}
          className="block w-full text-sm text-slate-400 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:font-medium file:text-white hover:file:bg-blue-700"
        />

        <p className="mt-2 text-xs text-slate-500">
          Up to 3 images. JPG, PNG or WEBP. Maximum 5 MB per image.
        </p>

        {photos.length > 0 && (
          <div className="mt-3 rounded-lg border border-white/10 bg-white/5 p-3">
            <p className="text-sm font-medium text-slate-200">
              Selected photos
            </p>

            <ul className="mt-2 space-y-1">
              {photos.map((photo, index) => (
                <li
                  key={`${photo.name}-${index}`}
                  className="text-xs text-slate-400"
                >
                  {photo.name} (
                  {(photo.size / (1024 * 1024)).toFixed(2)} MB)
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300"
        >
          {error}
        </div>
      )}

      {/* Success message */}
      {success && (
        <div
          role="status"
          className="rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-300"
        >
          {success}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Submitting report..." : "Submit Problem Report"}
      </button>

      <p className="text-center text-xs text-slate-500">
        Your report will automatically be routed to the appropriate
        administrator based on your community role.
      </p>
    </form>
  );
}
