"use client";

import { FormEvent, useEffect, useState } from "react";
import MaintenanceActions from "./MaintenanceActions";

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
  vehicleId: number;
};

export default function MaintenancePanel({ vehicleId }: Props) {
  const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const totalCost = maintenances.reduce(
  (total, maintenance) => total + Number(maintenance.cost),0);

  async function loadMaintenances() {
    const response = await fetch(
      `http://127.0.0.1:8000/vehicles/${vehicleId}/maintenances`
    );

    if (!response.ok) {
      throw new Error("Impossible de récupérer les entretiens.");
    }

    const data = await response.json();
    setMaintenances(data);
  }

  useEffect(() => {
    loadMaintenances().catch(() => {
      setError("Impossible de charger les entretiens.");
    });
  }, [vehicleId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSubmitting(true);
    setError("");

    const form = event.currentTarget;
    const formData = new FormData(form);

    const maintenance = {
      type: formData.get("type"),
      date: formData.get("date"),
      mileage: Number(formData.get("mileage")),
      cost: Number(formData.get("cost")),
      notes: formData.get("notes") || null,
    };

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/vehicles/${vehicleId}/maintenances`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(maintenance),
        }
      );

      if (!response.ok) {
        throw new Error("Impossible d'ajouter l'entretien.");
      }

      form.reset();
      setIsOpen(false);
      await loadMaintenances();
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
          <h4 className="font-semibold text-white">Entretien</h4>

          <p className="text-sm text-zinc-500">
            {maintenances.length} opération
            {maintenances.length > 1 ? "s" : ""}
            {" • "}
            {totalCost.toLocaleString("fr-FR", {
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

      {maintenances.length === 0 ? (
        <p className="text-sm text-zinc-500">
          Aucun entretien enregistré.
        </p>
      ) : (
        <div className="space-y-3">
          {maintenances.map((maintenance) => (
            <div
              key={maintenance.id}
              className="rounded-xl bg-zinc-950 p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-white">
                    {maintenance.type}
                  </p>

                  <p className="mt-1 text-sm text-zinc-400">
                    {new Date(
                      `${maintenance.date}T00:00:00`
                    ).toLocaleDateString("fr-FR")}
                    {" • "}
                    {maintenance.mileage.toLocaleString("fr-FR")} km
                  </p>
                </div>

                <p className="font-semibold">
                  {Number(maintenance.cost).toLocaleString("fr-FR", {
                    style: "currency",
                    currency: "EUR",
                  })}
                </p>
              </div>

              {maintenance.notes && (
                <p className="mt-3 text-sm text-zinc-500">
                  {maintenance.notes}
                </p>
              )}
              <MaintenanceActions
                maintenance={maintenance}
                onChanged={loadMaintenances}
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
                  Ajouter un entretien
                </h2>

                <p className="mt-1 text-sm text-zinc-400">
                  Enregistrez une intervention sur ce véhicule.
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
                Type d'entretien
                <select
                  required
                  name="type"
                  defaultValue=""
                  className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5"
                >
                  <option value="" disabled>
                    Sélectionner
                  </option>
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
                    placeholder="43500"
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
                    placeholder="99.90"
                    className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5"
                  />
                </label>
              </div>

              <label className="block text-sm text-zinc-300">
                Notes
                <textarea
                  name="notes"
                  rows={3}
                  placeholder="Filtre à huile, contrôle des niveaux..."
                  className="mt-2 w-full resize-none rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5"
                />
              </label>

              {error && (
                <p className="text-sm text-red-400">{error}</p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
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