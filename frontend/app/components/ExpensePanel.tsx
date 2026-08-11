"use client";

import { apiFetch } from "../lib/auth";

import { FormEvent, useEffect, useState } from "react";
import ExpenseActions from "./ExpenseActions";


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
  vehicleId: number;
};

export default function ExpensePanel({ vehicleId }: Props) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function loadExpenses() {
    const response = await apiFetch(
      `/vehicles/${vehicleId}/expenses`
    );

    if (!response.ok) {
      throw new Error("Impossible de récupérer les dépenses.");
    }

    const data = await response.json();
    setExpenses(data);
  }

  useEffect(() => {
    let cancelled = false;

    async function initialLoad() {
      try {
        const response = await apiFetch(
          `/vehicles/${vehicleId}/expenses`
        );

        if (!response.ok) {
          throw new Error(
            "Impossible de récupérer les dépenses."
          );
        }

        const data = await response.json();

        if (!cancelled) {
          setExpenses(data);
        }
      } catch {
        if (!cancelled) {
          setError(
            "Impossible de charger les dépenses."
          );
        }
      }
    }

    void initialLoad();

    return () => {
      cancelled = true;
    };
  }, [vehicleId]);

  const totalAmount = expenses.reduce(
    (total, expense) => total + Number(expense.amount),
    0
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSubmitting(true);
    setError("");

    const form = event.currentTarget;
    const formData = new FormData(form);

    const mileageValue = formData.get("mileage");

    const expense = {
      category: formData.get("category"),
      date: formData.get("date"),
      amount: Number(formData.get("amount")),
      mileage: mileageValue ? Number(mileageValue) : null,
      notes: formData.get("notes") || null,
    };

    try {
      const response = await apiFetch(
        `/vehicles/${vehicleId}/expenses`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(expense),
        }
      );

      if (!response.ok) {
        throw new Error("Impossible d'ajouter la dépense.");
      }

      form.reset();
      setIsOpen(false);
      await loadExpenses();
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
    <div className="mt-6 border-t border-zinc-800 pt-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h4 className="font-semibold text-white">Dépenses</h4>

          <p className="text-sm text-zinc-500">
            {expenses.length} dépense
            {expenses.length > 1 ? "s" : ""}
            {" • "}
            {totalAmount.toLocaleString("fr-FR", {
              style: "currency",
              currency: "EUR",
            })}
          </p>
        </div>

        <button
          onClick={() => setIsOpen(true)}
          className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 transition hover:bg-zinc-800"
        >
          + Ajouter
        </button>
      </div>

      {expenses.length === 0 ? (
        <p className="text-sm text-zinc-500">
          Aucune dépense enregistrée.
        </p>
      ) : (
        <div className="space-y-3">
          {expenses.map((expense) => (
            <div
              key={expense.id}
              className="rounded-xl bg-zinc-950 p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-white">
                    {expense.category}
                  </p>

                  <p className="mt-1 text-sm text-zinc-400">
                    {new Date(
                      `${expense.date}T00:00:00`
                    ).toLocaleDateString("fr-FR")}

                    {expense.mileage !== null && (
                      <>
                        {" • "}
                        {expense.mileage.toLocaleString("fr-FR")} km
                      </>
                    )}
                  </p>
                </div>

                <p className="font-semibold">
                  {Number(expense.amount).toLocaleString("fr-FR", {
                    style: "currency",
                    currency: "EUR",
                  })}
                </p>
              </div>

              {expense.notes && (
                <p className="mt-3 text-sm text-zinc-500">
                  {expense.notes}
                </p>
              )}

              <ExpenseActions
                expense={expense}
                onChanged={loadExpenses}
                />
            </div>
          ))}
        </div>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold">
                  Ajouter une dépense
                </h2>

                <p className="mt-1 text-sm text-zinc-400">
                  Enregistrez une dépense liée à ce véhicule.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setError("");
                }}
                className="text-xl text-zinc-400 hover:text-white"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block text-sm text-zinc-300">
                Catégorie
                <select
                  required
                  name="category"
                  defaultValue=""
                  className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5"
                >
                  <option value="" disabled>
                    Sélectionner
                  </option>
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
                    placeholder="75.20"
                    className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5"
                  />
                </label>

                <label className="text-sm text-zinc-300">
                  Kilométrage
                  <input
                    type="number"
                    min="0"
                    name="mileage"
                    placeholder="43100"
                    className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5"
                  />
                </label>
              </div>

              <label className="block text-sm text-zinc-300">
                Notes
                <textarea
                  name="notes"
                  rows={3}
                  placeholder="Plein d'essence, parking..."
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
                    setIsOpen(false);
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
                  {isSubmitting ? "Ajout..." : "Ajouter"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}