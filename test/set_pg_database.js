
if (!process.env.NODE_ENV || process.env.NODE_ENV === "development") {
  console.log("Setting PG_DATABASE=opencollective_test");
  process.env.PG_DATABASE = "opencollective_test";
}
