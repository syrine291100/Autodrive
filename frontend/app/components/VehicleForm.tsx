"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function VehicleForm() {
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSubmitting(true);
    setError("");

    const form = event.currentTarget;
    const formData = new FormData(form);

    const vehicle = {
      brand: formData.get("brand"),
      model: formData.get("model"),
      year: Number(formData.get("year")),
      registration: formData.get("registration"),
      mileage: Number(formData.get("mileage")),
      fuel_type: formData.get("fuel_type"),
    };

    try {
      const response = await fetch("http://127.0.0.1:8000/vehicles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(vehicle),
      });

      if (!response.ok) {
        const data = await response.json();

        throw new Error(
          data.detail || "Impossible d'ajouter le véhicule."
        );
      }

      form.reset();
      setIsOpen(false);

      router.refresh();
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
      <button
        onClick={() => setIsOpen(true)}
        className="rounded-lg bg-white px-4 py-2 font-medium text-black transition hover:bg-zinc-200"
      >
        + Ajouter un véhicule
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">
                  Ajouter un véhicule
                </h2>

                <p className="mt-1 text-sm text-zinc-400">
                  Renseignez les informations de votre véhicule.
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
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm text-zinc-300">
                  Marque
                  <input
                    required
                    name="brand"
                    placeholder="Renault"
                    className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-white outline-none focus:border-zinc-500"
                  />
                </label>

                <label className="text-sm text-zinc-300">
                  Modèle
                  <input
                    required
                    name="model"
                    placeholder="Clio"
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
                    placeholder="2022"
                    className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-white outline-none focus:border-zinc-500"
                  />
                </label>

                <label className="text-sm text-zinc-300">
                  Immatriculation
                  <input
                    required
                    name="registration"
                    placeholder="AB-123-CD"
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
                    placeholder="35000"
                    className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-white outline-none focus:border-zinc-500"
                  />
                </label>

                <label className="text-sm text-zinc-300">
                  Carburant
                  <select
                    required
                    name="fuel_type"
                    defaultValue=""
                    className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-white outline-none focus:border-zinc-500"
                  >
                    <option value="" disabled>
                      Sélectionner
                    </option>
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
                    setIsOpen(false);
                    setError("");
                  }}
                  className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:bg-zinc-800"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? "Ajout..." : "Ajouter"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}