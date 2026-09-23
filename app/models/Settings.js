import { createPostgresModel } from "@/app/lib/postgres-model";

const Settings = createPostgresModel({
  table: "settings",
  defaults: {
    dropDate: null,
    bandeauText: "",
    badgeText: "",
    maintenanceMode: false,
  },
});

export default Settings;
