import { addData } from "./db";

export async function loadSampleData() {
  // Finansal veriler
  const finance = require("../data/sample-finance.json");
  for (const exp of finance.expenses) {
    await addData("financials", { ...exp, type: "expense" });
  }
  for (const inc of finance.incomes) {
    await addData("financials", { ...inc, type: "income" });
  }

  // Tur satışları
  const tours = require("../data/sample-tours.json");
  for (const tour of tours) {
    await addData("tours", tour);
  }

  // Aktiviteler
  const activities = require("../data/sample-activities.json");
  for (const act of activities) {
    await addData("activities", act);
  }

  // Destinasyonlar
  const destinations = require("../data/sample-destinations.json");
  for (const dest of destinations) {
    await addData("destinations", dest);
  }

  // Ayarlar
  const settings = require("../data/sample-settings.json");
  await addData("settings", settings);
}
