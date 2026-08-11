"use client";

import { apiFetch } from "../lib/auth";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Vehicle = {
  id: number;
  brand: string;
  model: string;
  year: number;
  registration: string;
  mileage: number;
  fuel_type: string;
  created_at: string;
};

type Props = {
  vehicle: Vehicle;
};

export default function VehicleActions({ vehicle }: Props) {
  const router = useRouter();

  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    const confirmed = window.confirm(
      `Supprimer ${vehicle.brand} ${vehicle.model} ?`
    );

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await apiFetch(
        `/vehicles/${vehicle.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Impossible de supprimer le véhicule.");
      }

      router.refresh();
      window.location.reload();
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

    const updatedVehicle = {
      brand: formData.get("brand"),
      model: formData.get("model"),
      year: Number(formData.get("year")),
      registration: formData.get("registration"),
      mileage: Number(formData.get("mileage")),
      fuel_type: formData.get("fuel_type"),
    };

    try {
      const response = await apiFetch(
        `/vehicles/${vehicle.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedVehicle),
        }
      );

      if (!response.ok) {
        const data = await response.json();

        throw new Error(
          data.detail || "Impossible de modifier le véhicule."
        );
      }

      setIsEditing(false);
      router.refresh();
      window.location.reload();
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Une erreur est survenue.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <div className="flex gap-3">
        <button
          onClick={() => setIsEditing(true)}
          className="rounded-lg border border-zinc-700 px-3 py-2 text-sm font-medium text-zinc-300 transition hover:bg-zinc-800"
        >
          Modifier
        </button>

        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="rounded-lg border border-red-900 px-3 py-2 text-sm font-medium text-red-400 transition hover:bg-red-950 disabled:opacity-50"
        >
          {isDeleting ? "Suppression..." : "Supprimer"}
        </button>
      </div>

      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">
                  Modifier le véhicule
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
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm text-zinc-300">
                  Marque
                  <input
                    required
                    name="brand"
                    defaultValue={vehicle.brand}
                    className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-white outline-none focus:border-zinc-500"
                  />
                </label>

                <label className="text-sm text-zinc-300">
                  Modèle
                  <input
                    required
                    name="model"
                    defaultValue={vehicle.model}
                    className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-white outline-none focus:border-zinc-500"
                  />
                </label>

                <label className="text-sm text-zinc-300">
                  Année
                  <input
                    required
                    name="year"
                    type="number"
                    min="1886"
                    max="2100"
                    defaultValue={vehicle.year}
                    className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-white outline-none focus:border-zinc-500"
                  />
                </label>

                <label className="text-sm text-zinc-300">
                  Immatriculation
                  <input
                    required
                    name="registration"
                    defaultValue={vehicle.registration}
                    className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-white outline-none focus:border-zinc-500"
                  />
                </label>

                <label className="text-sm text-zinc-300">
                  Kilométrage
                  <input
                    required
                    name="mileage"
                    type="number"
                    min="0"
                    defaultValue={vehicle.mileage}
                    className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-white outline-none focus:border-zinc-500"
                  />
                </label>

                <label className="text-sm text-zinc-300">
                  Carburant
                  <select
                    required
                    name="fuel_type"
                    defaultValue={vehicle.fuel_type}
                    className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-white outline-none focus:border-zinc-500"
                  >
                    <option value="Essence">Essence</option>
                    <option value="Diesel">Diesel</option>
                    <option value="Hybride">Hybride</option>
                    <option value="Électrique">Électrique</option>
                    <option value="GPL">GPL</option>
                  </select>
                </label>
              </div>

              {error && (
                <p className="rounded-lg border border-red-900 bg-red-950/50 px-3 py-2 text-sm text-red-300">
                  {error}
                </p>
              )}

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setError("");
                  }}
                  className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black hover:bg-zinc-200 disabled:opacity-50"
                >
                  {isSubmitting ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}