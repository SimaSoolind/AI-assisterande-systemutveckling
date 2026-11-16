// Hämtar verktyget som kör program i terminalen
import child_process from "node:child_process";
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

// Var texten null? Då finns inget att kontrollera. Avsluta tyst
if (anrop === null) process.exit(0);

// Uppgifterna om ändringen. Saknas de? Avsluta tyst
const andring = anrop.tool_input;
if (andring === undefined) process.exit(0);

// Vilken fil ändrade Claude?
const fil = andring.file_path;
// Saknas filnamnet, eller är det ingen TypeScript-fil? Då kontrollerar vi inget
if (fil === undefined || !fil.endsWith(".ts")) process.exit(0);

// Försök köra de tre verktygen, ett i taget
try {
  // 1. Prettier formaterar filen: indrag, citattecken, semikolon
  child_process.execFileSync("npx", ["prettier", "--write", fil], { stdio: "pipe" });
  // 2. tsc kontrollerar typerna i hela projektet
  child_process.execFileSync("npx", ["tsc", "--noEmit"], { stdio: "pipe" });
  // 3. ESLint kontrollerar kodstandarden i filen som ändrades
  child_process.execFileSync("npx", ["eslint", fil], { stdio: "pipe" });
} catch (fel) {
  // Det verktyget skrev ut, som vanlig text
  const utskrift = fel.stdout.toString();
  // Felmeddelandena från verktyget, som vanlig text
  const felutskrift = fel.stderr.toString();
  // Skicka felet till Claude, med en uppmaning att rätta
  process.stderr.write("Kontrollen hittade fel. Rätta dem innan du går vidare:\n" + utskrift + felutskrift);
  // Kod 2: Claude får se felet och måste rätta
  process.exit(2);
}

// Inga fel: allt är okej
process.exit(0);
