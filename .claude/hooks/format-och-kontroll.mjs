// Hämtar execFileSync, som kör ett kommando i terminalen och väntar på svaret
import { execFileSync } from "node:child_process";
// Hämtar process, som har stdin, stderr och exit
import process from "node:process";

// Läser informationen som Claude Code skickar till hooken
let indata = "";
for await (const del of process.stdin) indata += del;

// En tom låda för objektet
let anrop;
// Försök göra om texten till ett objekt. Trasig text: avsluta tyst
try {
  anrop = JSON.parse(indata);
} catch {
  process.exit(0);
}

// Vilken fil ändrade Claude? Tom text om det inte finns någon
const fil = anrop.tool_input?.file_path ?? "";

// Är filen inte en TypeScript-fil? Då kontrollerar vi inget. Avsluta med kod 0
if (!fil.endsWith(".ts")) process.exit(0);

// Försök köra de tre verktygen, ett i taget
try {
  // 1. Prettier formaterar filen: indrag, citattecken, semikolon
  execFileSync("npx", ["prettier", "--write", fil], { stdio: "pipe" });
  // 2. tsc kontrollerar typerna i hela projektet
  execFileSync("npx", ["tsc", "--noEmit"], { stdio: "pipe" });
  // 3. ESLint kontrollerar kodstandarden i filen som ändrades
  execFileSync("npx", ["eslint", fil], { stdio: "pipe" });
} catch (fel) {
  // Felmeddelandet som verktyget skrev ut
  const felText = fel.stdout.toString() + fel.stderr.toString();
  // Skicka felet till Claude, med en uppmaning att rätta
  process.stderr.write("Kontrollen hittade fel. Rätta dem innan du går vidare:\n" + felText);
  // Kod 2: Claude får se felet och måste rätta
  process.exit(2);
}

// Inga fel: allt är okej
process.exit(0);
