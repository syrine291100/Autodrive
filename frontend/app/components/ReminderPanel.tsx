"use client";

import { apiFetch } from "../lib/auth";
import ReminderActions from "./ReminderActions";
import {
  FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";

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
  vehicleId: number;
  vehicleMileage: number;
};

function getReminderStatus(
  reminder: Reminder,
  vehicleMileage: number
) {
  if (reminder.completed) {
    return "Terminé";
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let overdueByDate = false;
  let soonByDate = false;

  if (reminder.due_date) {
    const dueDate = new Date(
      `${reminder.due_date}T00:00:00`
    );

    const difference =
      dueDate.getTime() - today.getTime();

    const daysRemaining = Math.ceil(
      difference / (1000 * 60 * 60 * 24)
    );

    overdueByDate = daysRemaining < 0;
    soonByDate =
      daysRemaining >= 0 && daysRemaining <= 30;
  }

  let overdueByMileage = false;
  let soonByMileage = false;

  if (reminder.due_mileage !== null) {
    const mileageRemaining =
      reminder.due_mileage - vehicleMileage;

    overdueByMileage = mileageRemaining <= 0;

    soonByMileage =
      mileageRemaining > 0 &&
      mileageRemaining <= 1000;
  }

  if (overdueByDate || overdueByMileage) {
    return "En retard";
  }

  if (soonByDate || soonByMileage) {
    return "Bientôt";
  }

  return "À venir";
}

export default function ReminderPanel({
  vehicleId,
  vehicleMileage,
}: Props) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const loadReminders = useCallback(async () => {
    const response = await apiFetch(
      `/vehicles/${vehicleId}/reminders`
    );

    if (!response.ok) {
      throw new Error(
        "Impossible de récupérer les rappels."
      );
    }

    const data = await response.json();
    setReminders(data);
  }, [vehicleId]);

  useEffect(() => {
    let cancelled = false;

    async function initialLoad() {
      try {
        const response = await apiFetch(
          `/vehicles/${vehicleId}/reminders`
        );

        if (!response.ok) {
          throw new Error(
            "Impossible de récupérer les rappels."
          );
        }

        const data = await response.json();

        if (!cancelled) {
          setReminders(data);
        }
      } catch {
        if (!cancelled) {
          setError(
            "Impossible de charger les rappels."
          );
        }
      }
    }

    void initialLoad();

    return () => {
      cancelled = true;
    };
  }, [vehicleId]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setIsSubmitting(true);
    setError("");

    const form = event.currentTarget;
    const formData = new FormData(form);

    const dueDateValue = formData.get("due_date");
    const dueMileageValue = formData.get("due_mileage");

    if (!dueDateValue && !dueMileageValue) {
      setError(
        "Indiquez une date ou un kilométrage d'échéance."
      );
      setIsSubmitting(false);
      return;
    }

    const reminder = {
      title: formData.get("title"),
      due_date: dueDateValue || null,
      due_mileage: dueMileageValue
        ? Number(dueMileageValue)
        : null,
      notes: formData.get("notes") || null,
      completed: false,
    };

    try {
      const response = await apiFetch(
        `/vehicles/${vehicleId}/reminders`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(reminder),
        }
      );

      if (!response.ok) {
        throw new Error(
          "Impossible d'ajouter le rappel."
        );
      }

      form.reset();
      setIsOpen(false);

      await loadReminders();
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
          <h4 className="font-semibold text-white">
            Rappels
          </h4>

          <p className="text-sm text-zinc-500">
            {reminders.length} rappel
            {reminders.length > 1 ? "s" : ""}
          </p>
        </div>

        <button
          onClick={() => setIsOpen(true)}
          className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 transition hover:bg-zinc-800"
        >
          + Ajouter
        </button>
      </div>

      {reminders.length === 0 ? (
        <p className="text-sm text-zinc-500">
          Aucun rappel enregistré.
        </p>
      ) : (
        <div className="space-y-3">
          {reminders.map((reminder) => {
            const status = getReminderStatus(
              reminder,
              vehicleMileage
            );

            return (
              <div
                key={reminder.id}
                className="rounded-xl bg-zinc-950 p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-white">
                      {reminder.title}
                    </p>

                    <div className="mt-2 space-y-1 text-sm text-zinc-400">
                      {reminder.due_date && (
                        <p>
                          Échéance :{" "}
                          {new Date(
                            `${reminder.due_date}T00:00:00`
                          ).toLocaleDateString("fr-FR")}
                        </p>
                      )}

                      {reminder.due_mileage !== null && (
                        <p>
                          Kilométrage :{" "}
                          {reminder.due_mileage.toLocaleString(
                            "fr-FR"
                          )}{" "}
                          km
                        </p>
                      )}
                    </div>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      status === "Terminé"
                        ? "bg-emerald-950 text-emerald-400"
                        : status === "En retard"
                        ? "bg-red-950 text-red-400"
                        : status === "Bientôt"
                        ? "bg-amber-950 text-amber-400"
                        : "bg-zinc-800 text-zinc-300"
                    }`}
                  >
                    {status}
                  </span>
                </div>

                {reminder.notes && (
                  <p className="mt-3 text-sm text-zinc-500">
                    {reminder.notes}
                  </p>
                )}

                <ReminderActions
                    reminder={reminder}
                    onChanged={loadReminders}
                    />
              </div>
            );
          })}
        </div>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold">
                  Ajouter un rappel
                </h2>

                <p className="mt-1 text-sm text-zinc-400">
                  Définissez une prochaine échéance.
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

            <form
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              <label className="block text-sm text-zinc-300">
                Type de rappel
                <select
                  required
                  name="title"
                  defaultValue=""
                  className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5"
                >
                  <option value="" disabled>
                    Sélectionner
                  </option>

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
                    className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5"
                  />
                </label>

                <label className="text-sm text-zinc-300">
                  Kilométrage cible
                  <input
                    type="number"
                    min="0"
                    name="due_mileage"
                    placeholder="50000"
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
                  placeholder="Rendez-vous à prévoir..."
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
                  {isSubmitting
                    ? "Ajout..."
                    : "Ajouter"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}