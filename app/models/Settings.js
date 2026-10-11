import { createPostgresModel } from "@/app/lib/postgres-model";

const Settings = createPostgresModel({
  table: "settings",
  defaults: {
    dropDate: null,
    bandeauText: "",
    bandeauEnabled: true, // affichage du bandeau en haut du site
    ordersOpen: true, // false : le site reste visible mais personne ne peut commander
    maintenanceMode: false,
  },
});

export default Settings;
