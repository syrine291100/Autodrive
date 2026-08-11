"use client";

import { apiFetch } from "../lib/auth";

import { FormEvent, useState } from "react";

type Reminder = {
  id: number;
  vehicle_id: number;
  title: string;
  due_date: string | null;
  due_mileage: number | null;
  notes: string | null;
  completed: boolean;
  created_at: string;
};

type Props = {
  reminder: Reminder;
  onChanged: () => Promise<void>;
};

export default function ReminderActions({
  reminder,
  onChanged,
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    const confirmed = window.confirm(
      `Supprimer le rappel "${reminder.title}" ?`
    );

    if (!confirmed) return;

    setIsDeleting(true);

    try {
      const response = await apiFetch(
        `/reminders/${reminder.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Impossible de supprimer ce rappel.");
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

  async function handleToggleCompleted() {
    setIsCompleting(true);

    const updatedReminder = {
      title: reminder.title,
      due_date: reminder.due_date,
      due_mileage: reminder.due_mileage,
      notes: reminder.notes,
      completed: !reminder.completed,
    };

    try {
      const response = await apiFetch(
        `/reminders/${reminder.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedReminder),
        }
      );

      if (!response.ok) {
        throw new Error(
          "Impossible de modifier le statut du rappel."
        );
      }

      await onChanged();
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Une erreur est survenue."
      );
    } finally {
      setIsCompleting(false);
    }
  }

  async function handleUpdate(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setIsSubmitting(true);
    setError("");

    const formData = new FormData(event.currentTarget);

    const dueDateValue = formData.get("due_date");
    const dueMileageValue = formData.get("due_mileage");

    if (!dueDateValue && !dueMileageValue) {
      setError(
        "Indiquez une date ou un kilométrage d'échéance."
      );
      setIsSubmitting(false);
      return;
    }

    const updatedReminder = {
      title: formData.get("title"),
      due_date: dueDateValue || null,
      due_mileage: dueMileageValue
        ? Number(dueMileageValue)
        : null,
      notes: formData.get("notes") || null,
      completed: reminder.completed,
    };

    try {
      const response = await apiFetch(
        `/reminders/${reminder.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedReminder),
        }
      );

      if (!response.ok) {
        throw new Error(
          "Impossible de modifier ce rappel."
        );
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
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => setIsEditing(true)}
          className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 transition hover:bg-zinc-800"
        >
          Modifier
        </button>

        <button
          onClick={handleToggleCompleted}
          disabled={isCompleting}
          className="rounded-lg border border-emerald-900 px-3 py-1.5 text-xs text-emerald-400 transition hover:bg-emerald-950 disabled:opacity-50"
        >
          {isCompleting
            ? "Enregistrement..."
            : reminder.completed
            ? "Réouvrir"
            : "Terminer"}
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
                  Modifier le rappel
                </h2>

                <p className="mt-1 text-sm text-zinc-400">
                  Modifiez la prochaine échéance.
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

            <form
              onSubmit={handleUpdate}
              className="space-y-4"
            >
              <label className="block text-sm text-zinc-300">
                Type de rappel

                <select
                  required
                  name="title"
                  defaultValue={reminder.title}
                  className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5"
                >
                  <option value="Contrôle technique">
                    Contrôle technique
                  </option>

                  <option value="Vidange">
                    Vidange
                  </option>

                  <option value="Révision">
                    Révision
                  </option>

                  <option value="Assurance">
                    Assurance
                  </option>

                  <option value="Pneus">
                    Pneus
                  </option>

                  <option value="Freins">
                    Freins
                  </option>

                  <option value="Autre">
                    Autre
                  </option>
                </select>
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm text-zinc-300">
                  Date d&apos;échéance

                  <input
                    type="date"
                    name="due_date"
                    defaultValue={reminder.due_date ?? ""}
                    className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5"
                  />
                </label>

                <label className="text-sm text-zinc-300">
                  Kilométrage cible

                  <input
                    type="number"
                    min="0"
                    name="due_mileage"
                    defaultValue={
                      reminder.due_mileage ?? ""
                    }
                    className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5"
                  />
                </label>
              </div>

              <p className="text-xs text-zinc-500">
                Indique au minimum une date ou un
                kilométrage.
              </p>

              <label className="block text-sm text-zinc-300">
                Notes

                <textarea
                  name="notes"
                  rows={3}
                  defaultValue={reminder.notes ?? ""}
                  className="mt-2 w-full resize-none rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5"
                />
              </label>

              {error && (
                <p className="text-sm text-red-400">
                  {error}
                </p>
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