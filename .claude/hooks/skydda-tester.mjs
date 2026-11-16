// Hämtar verktygen för att läsa filer
import fs from "node:fs";
// Hämtar process, som har stdin och exit
import process from "node:process";

// Läser informationen som Claude Code skickar till hooken
let indata = "";
for await (const del of process.stdin) indata += del;

// En tom låda för objektet. let, eftersom den får ett värde inne i try
let anrop;
// Försök göra om texten till ett objekt
try {
  anrop = JSON.parse(indata);
} catch {
  // Trasig text: stoppa inte Claude, avsluta med kod 0
  process.exit(0);
}

// Vilken fil vill Claude ändra? Tom text om det inte finns någon
const fil = anrop.tool_input?.file_path ?? "";

// Ligger filen inte i tests/? Då är det okej. Avsluta med kod 0
if (!fil.includes("tests/")) process.exit(0);

// Räknar hur många tester en text innehåller
const raknaTester = (text) => (text.match(/\b(it|test)\(/g) ?? []).length;

// Hela testfilen som den ser ut nu, före ändringen
const filenNu = fs.existsSync(fil) ? fs.readFileSync(fil, "utf8") : "";

// Texten före: den del som byts ut, annars hela filen
const fore = anrop.tool_input.old_string ?? filenNu;

// Texten efter: den nya delen, eller hela den nya filen
const efter = anrop.tool_input.new_string ?? anrop.tool_input.content ?? "";

// Stoppa om den nya texten stänger av ett test
if (/\.(skip|only)\(|\bx(it|describe)\(/.test(efter)) {
  process.stderr.write("Stoppad: ett test får inte stängas av (skip, only, xit). Se docs/standard.md.\n");
  process.exit(2);
}

// Stoppa om det blir färre tester än förut
if (raknaTester(efter) < raknaTester(fore)) {
  process.stderr.write("Stoppad: ändringen tar bort ett test. Föreslå ändringen i text i stället.\n");
  process.exit(2);
}

// Inget fel hittades: släpp igenom ändringen
process.exit(0);
