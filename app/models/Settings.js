import { createPostgresModel } from "@/app/lib/postgres-model";

const Settings = createPostgresModel({
  table: "settings",
  defaults: {
    dropDate: null,
    shippingReleaseDate: null, // fin de la période de drop : les commandes ne partent chez le transporteur qu'à partir de cette date
    bandeauText: "",
    maintenanceMode: false,
  },
});

export default Settings;
