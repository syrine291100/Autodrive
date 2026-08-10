"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

type CategoryStat = {
  category: string;
  amount: string;
};

type MonthlyStat = {
  month: string;
  expenses: string;
  maintenance: string;
  total: string;
};

type DashboardData = {
  vehicles_count: number;
  expenses_count: number;
  maintenances_count: number;

  total_expenses: string;
  total_maintenance: string;
  total_spending: string;

  active_reminders: number;
  overdue_reminders: number;

  expenses_by_category: CategoryStat[];
  monthly_spending: MonthlyStat[];
};

function formatCurrency(value: string | number) {
  return Number(value).toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR",
  });
}

function formatMonth(month: string) {
  const [year, monthNumber] = month.split("-");

  return new Date(
    Number(year),
    Number(monthNumber) - 1,
    1
  ).toLocaleDateString("fr-FR", {
    month: "short",
    year: "numeric",
  });
}

export default function DashboardPanel() {
  const [dashboard, setDashboard] =
    useState<DashboardData | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    setError("");

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/dashboard"
      );

      if (!response.ok) {
        throw new Error(
          "Impossible de récupérer les statistiques."
        );
      }

      const data = await response.json();

      setDashboard(data);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Une erreur est survenue."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  if (isLoading) {
    return (
      <section className="mb-12">
        <p className="text-sm text-zinc-500">
          Chargement du tableau de bord...
        </p>
      </section>
    );
  }

  if (error || !dashboard) {
    return (
      <section className="mb-12">
        <div className="rounded-2xl border border-red-900 bg-red-950/30 p-5">
          <p className="text-sm text-red-400">
            {error || "Dashboard indisponible."}
          </p>

          <button
            onClick={loadDashboard}
            className="mt-3 rounded-lg border border-red-900 px-3 py-2 text-sm text-red-300"
          >
            Réessayer
          </button>
        </div>
      </section>
    );
  }

  const maxCategoryAmount = Math.max(
    ...dashboard.expenses_by_category.map(
      (item) => Number(item.amount)
    ),
    1
  );

  const maxMonthlyAmount = Math.max(
    ...dashboard.monthly_spending.map(
      (item) => Number(item.total)
    ),
    1
  );

  return (
    <section className="mb-12">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-widest text-zinc-500">
            Vue d&apos;ensemble
          </p>

          <h2 className="mt-1 text-2xl font-semibold">
            Tableau de bord
          </h2>
        </div>

        <button
          onClick={loadDashboard}
          className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 transition hover:bg-zinc-800"
        >
          Actualiser
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-sm text-zinc-500">
            Coût total
          </p>

          <p className="mt-2 text-2xl font-semibold">
            {formatCurrency(
              dashboard.total_spending
            )}
          </p>

          <p className="mt-2 text-xs text-zinc-500">
            Toutes dépenses confondues
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-sm text-zinc-500">
            Dépenses
          </p>

          <p className="mt-2 text-2xl font-semibold">
            {formatCurrency(
              dashboard.total_expenses
            )}
          </p>

          <p className="mt-2 text-xs text-zinc-500">
            {dashboard.expenses_count} opération
            {dashboard.expenses_count > 1
              ? "s"
              : ""}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-sm text-zinc-500">
            Entretien
          </p>

          <p className="mt-2 text-2xl font-semibold">
            {formatCurrency(
              dashboard.total_maintenance
            )}
          </p>

          <p className="mt-2 text-xs text-zinc-500">
            {dashboard.maintenances_count} opération
            {dashboard.maintenances_count > 1
              ? "s"
              : ""}
          </p>
        </div>

        <div
          className={`rounded-2xl border p-5 ${
            dashboard.overdue_reminders > 0
              ? "border-red-900 bg-red-950/20"
              : "border-zinc-800 bg-zinc-900"
          }`}
        >
          <p className="text-sm text-zinc-500">
            Rappels actifs
          </p>

          <p className="mt-2 text-2xl font-semibold">
            {dashboard.active_reminders}
          </p>

          <p
            className={`mt-2 text-xs ${
              dashboard.overdue_reminders > 0
                ? "text-red-400"
                : "text-zinc-500"
            }`}
          >
            {dashboard.overdue_reminders} en retard
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="mb-6">
            <h3 className="font-semibold">
              Dépenses par catégorie
            </h3>

            <p className="mt-1 text-sm text-zinc-500">
              Répartition des dépenses enregistrées
            </p>
          </div>

          {dashboard.expenses_by_category.length ===
          0 ? (
            <p className="text-sm text-zinc-500">
              Aucune dépense enregistrée.
            </p>
          ) : (
            <div className="space-y-5">
              {dashboard.expenses_by_category.map(
                (item) => {
                  const percentage =
                    (Number(item.amount) /
                      maxCategoryAmount) *
                    100;

                  return (
                    <div key={item.category}>
                      <div className="mb-2 flex items-center justify-between gap-4 text-sm">
                        <span className="text-zinc-300">
                          {item.category}
                        </span>

                        <span className="font-medium">
                          {formatCurrency(
                            item.amount
                          )}
                        </span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
                        <div
                          className="h-full rounded-full bg-white"
                          style={{
                            width: `${percentage}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="mb-6">
            <h3 className="font-semibold">
              Coûts mensuels
            </h3>

            <p className="mt-1 text-sm text-zinc-500">
              Dépenses et entretiens par mois
            </p>
          </div>

          {dashboard.monthly_spending.length ===
          0 ? (
            <p className="text-sm text-zinc-500">
              Aucune donnée mensuelle.
            </p>
          ) : (
            <div className="space-y-5">
              {dashboard.monthly_spending.map(
                (item) => {
                  const percentage =
                    (Number(item.total) /
                      maxMonthlyAmount) *
                    100;

                  return (
                    <div key={item.month}>
                      <div className="mb-2 flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-medium capitalize text-zinc-300">
                            {formatMonth(
                              item.month
                            )}
                          </p>

                          <p className="mt-1 text-xs text-zinc-500">
                            Dépenses{" "}
                            {formatCurrency(
                              item.expenses
                            )}
                            {" • "}
                            Entretien{" "}
                            {formatCurrency(
                              item.maintenance
                            )}
                          </p>
                        </div>

                        <p className="text-sm font-semibold">
                          {formatCurrency(
                            item.total
                          )}
                        </p>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
                        <div
                          className="h-full rounded-full bg-white"
                          style={{
                            width: `${percentage}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-900 px-5 py-4">
        <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
          <p className="text-zinc-400">
            Véhicules{" "}
            <span className="font-semibold text-white">
              {dashboard.vehicles_count}
            </span>
          </p>

          <p className="text-zinc-400">
            Dépenses enregistrées{" "}
            <span className="font-semibold text-white">
              {dashboard.expenses_count}
            </span>
          </p>

          <p className="text-zinc-400">
            Entretiens enregistrés{" "}
            <span className="font-semibold text-white">
              {dashboard.maintenances_count}
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}