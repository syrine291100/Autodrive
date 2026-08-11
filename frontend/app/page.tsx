"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import DashboardPanel from "./components/DashboardPanel";
import ExpensePanel from "./components/ExpensePanel";
import MaintenancePanel from "./components/MaintenancePanel";
import ReminderPanel from "./components/ReminderPanel";
import VehicleActions from "./components/VehicleActions";
import VehicleForm from "./components/VehicleForm";
import {
  apiFetch,
  getToken,
  removeToken,
} from "./lib/auth";

type User = {
  id: number;
  name: string;
  email: string;
  created_at: string;
};

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

export default function Home() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadHome = useCallback(async () => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const [userResponse, vehiclesResponse] =
        await Promise.all([
          apiFetch("/auth/me"),
          apiFetch("/vehicles"),
        ]);

      if (!userResponse.ok) {
        throw new Error(
          "Impossible de récupérer votre profil."
        );
      }

      if (!vehiclesResponse.ok) {
        throw new Error(
          "Impossible de récupérer les véhicules."
        );
      }

      const [userData, vehiclesData] =
        await Promise.all([
          userResponse.json(),
          vehiclesResponse.json(),
        ]);

      setUser(userData);
      setVehicles(vehiclesData);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Une erreur est survenue."
      );
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    let cancelled = false;

    async function initialLoad() {
      if (!getToken()) {
        router.replace("/login");
        return;
      }

      try {
        const [userResponse, vehiclesResponse] =
          await Promise.all([
            apiFetch("/auth/me"),
            apiFetch("/vehicles"),
          ]);

        if (!userResponse.ok) {
          throw new Error(
            "Impossible de récupérer votre profil."
          );
        }

        if (!vehiclesResponse.ok) {
          throw new Error(
            "Impossible de récupérer les véhicules."
          );
        }

        const [userData, vehiclesData] =
          await Promise.all([
            userResponse.json(),
            vehiclesResponse.json(),
          ]);

        if (cancelled) {
          return;
        }

        setUser(userData);
        setVehicles(vehiclesData);
      } catch (error) {
        if (!cancelled) {
          setError(
            error instanceof Error
              ? error.message
              : "Une erreur est survenue."
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void initialLoad();

    return () => {
      cancelled = true;
    };
  }, [router]);

  function handleLogout() {
    removeToken();
    router.replace("/login");
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 text-white">
        <p className="text-sm text-zinc-400">
          Chargement de votre espace AutoDrive...
        </p>
      </main>
    );
  }

  if (error || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 text-white">
        <div className="w-full max-w-md rounded-2xl border border-red-900 bg-red-950/20 p-6">
          <h1 className="text-xl font-semibold">
            Impossible de charger AutoDrive
          </h1>

          <p className="mt-2 text-sm text-red-300">
            {error || "Session indisponible."}
          </p>

          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={loadHome}
              className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black"
            >
              Réessayer
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300"
            >
              Se reconnecter
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-5xl">
        <header className="mb-12 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="mb-2 text-sm font-medium uppercase tracking-widest text-zinc-400">
              Gestion automobile
            </p>

            <h1 className="text-4xl font-bold tracking-tight">
              AutoDrive
            </h1>

            <p className="mt-3 text-zinc-400">
              Gérez vos véhicules, leur entretien et vos dépenses.
            </p>
          </div>

          <div className="flex items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3">
            <div className="text-right">
              <p className="text-sm font-medium text-white">
                {user.name}
              </p>

              <p className="text-xs text-zinc-500">
                {user.email}
              </p>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 transition hover:bg-zinc-800"
            >
              Déconnexion
            </button>
          </div>
        </header>

        <DashboardPanel />

        <section>
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold">
                Mes véhicules
              </h2>

              <p className="mt-1 text-sm text-zinc-400">
                {vehicles.length} véhicule
                {vehicles.length > 1 ? "s" : ""}
              </p>
            </div>

            <VehicleForm />
          </div>

          {vehicles.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/40 p-10 text-center">
              <h3 className="text-lg font-medium">
                Aucun véhicule
              </h3>

              <p className="mt-2 text-sm text-zinc-500">
                Ajoutez votre premier véhicule pour commencer.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {vehicles.map((vehicle) => (
                <article
                  key={vehicle.id}
                  className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6"
                >
                  <div className="mb-6 flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-semibold">
                        {vehicle.brand} {vehicle.model}
                      </h3>

                      <p className="mt-1 text-sm text-zinc-400">
                        {vehicle.year} • {vehicle.fuel_type}
                      </p>
                    </div>

                    <span className="rounded-md bg-zinc-800 px-3 py-1 text-sm text-zinc-300">
                      {vehicle.registration}
                    </span>
                  </div>

                  <div>
                    <p className="text-sm text-zinc-500">
                      Kilométrage
                    </p>

                    <p className="mt-1 text-2xl font-semibold">
                      {vehicle.mileage.toLocaleString(
                        "fr-FR"
                      )}{" "}
                      km
                    </p>
                  </div>

                  <div className="mt-6 border-t border-zinc-800 pt-4">
                    <VehicleActions vehicle={vehicle} />
                  </div>

                  <MaintenancePanel
                    vehicleId={vehicle.id}
                  />

                  <ExpensePanel
                    vehicleId={vehicle.id}
                  />

                  <ReminderPanel
                    vehicleId={vehicle.id}
                    vehicleMileage={vehicle.mileage}
                  />
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
