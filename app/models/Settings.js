import mongoose from "mongoose";

const SettingsSchema = new mongoose.Schema(
  {
    dropDate:        { type: Date,    default: null },
    bandeauText:     { type: String,  default: "" },
    badgeText:       { type: String,  default: "" },
    maintenanceMode: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.Settings || mongoose.model("Settings", SettingsSchema);
