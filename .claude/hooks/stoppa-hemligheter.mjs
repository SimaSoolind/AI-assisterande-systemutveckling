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

// Uppgifterna om ändringen. Saknas de? Släpp igenom
const andring = anrop.tool_input;
if (andring === undefined) process.exit(0);

// Vilken fil vill Claude ändra? Tom text om den saknas
let fil = "";
if (andring.file_path !== undefined) fil = andring.file_path;

// Vill Claude ändra en .env-fil? Stoppa. Där ligger hemligheterna
if (fil.endsWith(".env")) {
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
