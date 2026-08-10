"use client";

import { FormEvent, useState } from "react";

type Expense = {
  id: number;
  vehicle_id: number;
  category: string;
  date: string;
  amount: string;
  mileage: number | null;
  notes: string | null;
  created_at: string;
};

type Props = {
  expense: Expense;
  onChanged: () => Promise<void>;
};

export default function ExpenseActions({
  expense,
  onChanged,
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    const confirmed = window.confirm(
      `Supprimer la dépense "${expense.category}" ?`
    );

    if (!confirmed) return;

    setIsDeleting(true);

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/expenses/${expense.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Impossible de supprimer cette dépense.");
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
    const mileageValue = formData.get("mileage");

    const updatedExpense = {
      category: formData.get("category"),
      date: formData.get("date"),
      amount: Number(formData.get("amount")),
      mileage: mileageValue ? Number(mileageValue) : null,
      notes: formData.get("notes") || null,
    };

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/expenses/${expense.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedExpense),
        }
      );

      if (!response.ok) {
        throw new Error("Impossible de modifier cette dépense.");
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
                  Modifier la dépense
                </h2>

                <p className="mt-1 text-sm text-zinc-400">
                  Modifiez les informations puis enregistrez.
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
                Catégorie
                <select
                  required
                  name="category"
                  defaultValue={expense.category}
                  className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5"
                >
                  <option value="Carburant">Carburant</option>
                  <option value="Assurance">Assurance</option>
                  <option value="Réparation">Réparation</option>
                  <option value="Parking">Parking</option>
                  <option value="Péage">Péage</option>
                  <option value="Lavage">Lavage</option>
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
                    defaultValue={expense.date}
                    className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5"
                  />
                </label>

                <label className="text-sm text-zinc-300">
                  Montant (€)
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    name="amount"
                    defaultValue={expense.amount}
                    className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5"
                  />
                </label>

                <label className="text-sm text-zinc-300">
                  Kilométrage
                  <input
                    type="number"
                    min="0"
                    name="mileage"
                    defaultValue={expense.mileage ?? ""}
                    className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5"
                  />
                </label>
              </div>

              <label className="block text-sm text-zinc-300">
                Notes
                <textarea
                  name="notes"
                  rows={3}
                  defaultValue={expense.notes ?? ""}
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