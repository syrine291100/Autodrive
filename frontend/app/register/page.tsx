"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { API_URL } from "../lib/auth";

export default function RegisterPage() {
  const router = useRouter();

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);

    const user = {
      name: String(formData.get("name") || ""),
      email: String(formData.get("email") || ""),
      password: String(formData.get("password") || ""),
    };

    try {
      const response = await fetch(
        `${API_URL}/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(user),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Inscription impossible."
        );
      }

      router.push("/login");
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
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 text-white">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="mb-2 text-sm font-medium uppercase tracking-widest text-zinc-500">
            Gestion automobile
          </p>

          <h1 className="text-4xl font-bold">
            AutoDrive
          </h1>

          <p className="mt-3 text-zinc-400">
            Créez votre espace personnel.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-2xl border border-zinc-800 bg-zinc-900 p-7"
        >
          <label className="block text-sm text-zinc-300">
            Nom

            <input
              required
              name="name"
              minLength={2}
              className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-3 text-white outline-none focus:border-zinc-500"
            />
          </label>

          <label className="block text-sm text-zinc-300">
            Adresse e-mail

            <input
              required
              type="email"
              name="email"
              autoComplete="email"
              className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-3 text-white outline-none focus:border-zinc-500"
            />
          </label>

          <label className="block text-sm text-zinc-300">
            Mot de passe

            <input
              required
              type="password"
              name="password"
              minLength={8}
              autoComplete="new-password"
              className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-3 text-white outline-none focus:border-zinc-500"
            />
          </label>

          {error && (
            <p className="rounded-lg border border-red-900 bg-red-950/50 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-white px-4 py-3 font-medium text-black transition hover:bg-zinc-200 disabled:opacity-50"
          >
            {isSubmitting
              ? "Création..."
              : "Créer mon compte"}
          </button>

          <p className="text-center text-sm text-zinc-400">
            Déjà inscrit ?{" "}
            <Link
              href="/login"
              className="font-medium text-white hover:underline"
            >
              Se connecter
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}