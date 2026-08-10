import ExpensePanel from "./components/ExpensePanel";
import VehicleActions from "./components/VehicleActions";
import VehicleForm from "./components/VehicleForm";
import MaintenancePanel from "./components/MaintenancePanel";
import ReminderPanel from "./components/ReminderPanel";
import DashboardPanel from "./components/DashboardPanel";

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

async function getVehicles(): Promise<Vehicle[]> {
  const response = await fetch("http://127.0.0.1:8000/vehicles", {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Impossible de récupérer les véhicules.");
  }

  return response.json();
}

export default async function Home() {
  const vehicles = await getVehicles();

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-5xl">
        <header className="mb-12">
          <p className="mb-2 text-sm font-medium uppercase tracking-widest text-zinc-400">
            Gestion automobile
          </p>

          <h1 className="text-4xl font-bold tracking-tight">
            AutoDrive
          </h1>

          <p className="mt-3 text-zinc-400">
            Gérez vos véhicules, leur entretien et vos dépenses.
          </p>
        </header>

        <DashboardPanel />

        <section>
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold">
                Mes véhicules
              </h2>

              <p className="mt-1 text-sm text-zinc-400">
                {vehicles.length} véhicule{vehicles.length > 1 ? "s" : ""}
              </p>
            </div>

            <VehicleForm />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {vehicles.map((vehicle) => (
              <article
                key={vehicle.id}
                className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6"
              >
                <div className="mb-6 flex items-start justify-between">
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
                    {vehicle.mileage.toLocaleString("fr-FR")} km
                  </p>
                </div>
                <div className="mt-6 border-t border-zinc-800 pt-4">
                  <VehicleActions vehicle={vehicle} />
                </div>
                <MaintenancePanel vehicleId={vehicle.id} />

                
                <ExpensePanel vehicleId={vehicle.id} />

                <ReminderPanel
                  vehicleId={vehicle.id}
                  vehicleMileage={vehicle.mileage}
                />
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}