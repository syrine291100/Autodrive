"use client";

import { apiFetch } from "../lib/auth";

import { FormEvent, useState } from "react";

type Maintenance = {
  id: number;
  vehicle_id: number;
  type: string;
  date: string;
  mileage: number;
  cost: string;
  notes: string | null;
  created_at: string;
};

type Props = {
  maintenance: Maintenance;
  onChanged: () => Promise<void>;
};

export default function MaintenanceActions({
  maintenance,
  onChanged,
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    const confirmed = window.confirm(
      `Supprimer l'entretien "${maintenance.type}" ?`
    );

    if (!confirmed) return;

    setIsDeleting(true);

    try {
      const response = await apiFetch(
        `/maintenances/${maintenance.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Impossible de supprimer cet entretien.");
      }

      await onChanged();
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Une erreur est survenue."
      );
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSubmitting(true);
    setError("");

    const formData = new FormData(event.currentTarget);

    const updatedMaintenance = {
      type: formData.get("type"),
      date: formData.get("date"),
      mileage: Number(formData.get("mileage")),
      cost: Number(formData.get("cost")),
      notes: formData.get("notes") || null,
    };

    try {
      const response = await apiFetch(
        `/maintenances/${maintenance.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedMaintenance),
        }
      );

      if (!response.ok) {
        throw new Error("Impossible de modifier cet entretien.");
      }

      setIsEditing(false);
      await onChanged();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Une erreur est survenue."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <div className="mt-4 flex gap-2">
        <button
          onClick={() => setIsEditing(true)}
          className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 transition hover:bg-zinc-800"
        >
          Modifier
        </button>

        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="rounded-lg border border-red-900 px-3 py-1.5 text-xs text-red-400 transition hover:bg-red-950 disabled:opacity-50"
        >
          {isDeleting ? "Suppression..." : "Supprimer"}
        </button>
      </div>

      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold">
                  Modifier l&apos;entretien
                </h2>

                <p className="mt-1 text-sm text-zinc-400">
                  Modifiez les informations de cette intervention.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setError("");
                }}
                className="text-xl text-zinc-400 hover:text-white"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <label className="block text-sm text-zinc-300">
                Type d&apos;entretien
                <select
                  required
                  name="type"
                  defaultValue={maintenance.type}
                  className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5"
                >
                  <option value="Vidange">Vidange</option>
                  <option value="Révision">Révision</option>
                  <option value="Pneus">Pneus</option>
                  <option value="Freins">Freins</option>
                  <option value="Contrôle technique">
                    Contrôle technique
                  </option>
                  <option value="Autre">Autre</option>
                </select>
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm text-zinc-300">
                  Date
                  <input
                    required
                    type="date"
                    name="date"
                    defaultValue={maintenance.date}
                    className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5"
                  />
                </label>

                <label className="text-sm text-zinc-300">
                  Kilométrage
                  <input
                    required
                    type="number"
                    min="0"
                    name="mileage"
                    defaultValue={maintenance.mileage}
                    className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5"
                  />
                </label>

                <label className="text-sm text-zinc-300">
                  Coût (€)
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    name="cost"
                    defaultValue={maintenance.cost}
                    className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5"
                  />
                </label>
              </div>

              <label className="block text-sm text-zinc-300">
                Notes
                <textarea
                  name="notes"
                  rows={3}
                  defaultValue={maintenance.notes ?? ""}
                  className="mt-2 w-full resize-none rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5"
                />
              </label>

              {error && (
                <p className="text-sm text-red-400">{error}</p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setError("");
                  }}
                  className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
                >
                  {isSubmitting
                    ? "Enregistrement..."
                    : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}