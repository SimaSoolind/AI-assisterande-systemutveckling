// Hämtar process, som har stdin, stderr och exit
import process from "node:process";

// Läser informationen som Claude Code skickar till hooken
let indata = "";
for await (const del of process.stdin) indata += del;

// En tom låda för objektet
let anrop;
// Försök göra om texten till ett objekt. Trasig text: släpp igenom
try {
  anrop = JSON.parse(indata);
} catch {
  process.exit(0);
}

// Var texten null? Då finns inget att kontrollera. Släpp igenom
if (anrop === null) process.exit(0);

// Uppgifterna om ändringen. Saknas de? Släpp igenom
const andring = anrop.tool_input;
if (andring === undefined) process.exit(0);

// Vilken fil vill Claude ändra? Tom text om den saknas
let fil = "";
if (andring.file_path !== undefined) fil = andring.file_path;

// Dela upp sökvägen vid varje /
const delar = fil.split("/");
// Sista delen är filens namn, till exempel .env.local
const filnamn = delar[delar.length - 1];
// Är det en .env-fil? Till exempel .env, .env.local eller .env.production
const arEnvFil = filnamn === ".env" || filnamn.startsWith(".env.");
// .env.example är en mall utan hemligheter. Den får ändras
const arMall = filnamn === ".env.example";
// En .env-fil som inte är mallen? Stoppa. Där ligger hemligheterna
if (arEnvFil && !arMall) {
  process.stderr.write("Stoppad: .env får inte ändras av agenten. Sima ändrar .env själv.\n");
  process.exit(2);
}

// Den nya texten. Tom från början
let nyText = "";
// Edit skickar den nya delen i new_string
if (andring.new_string !== undefined) {
  nyText = andring.new_string;
} else if (andring.content !== undefined) {
  // Write skickar hela den nya filen i content
  nyText = andring.content;
}

// Början på vanliga hemligheter
const hemligheter = [
  "-----BEGIN", // privat nyckel
  "AKIA", // nyckel till Amazon (AWS)
  "ghp_", // nyckel till GitHub
  "sk-ant-", // nyckel till Anthropic
  "sk-proj-", // nyckel till OpenAI
];

// Gå igenom hemligheterna, en i taget
for (const hemlighet of hemligheter) {
  // Finns den i den nya texten? Stoppa
  if (nyText.includes(hemlighet)) {
    process.stderr.write(
      "Stoppad: texten ser ut att innehålla en hemlighet (" + hemlighet + "). " +
      "Lägg hemligheter i .env och läs dem med process.env.\n"
    );
    process.exit(2);
  }
}

// Ingen hemlighet hittades: släpp igenom
process.exit(0);
