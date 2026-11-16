// Hämtar verktyget för att läsa filer
import fs from "node:fs";
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

// Vilken fil vill Claude ändra?
const fil = andring.file_path;
// Saknas filnamnet, eller ligger filen utanför tests/? Släpp igenom
if (fil === undefined || !fil.includes("tests/")) process.exit(0);

// Räknar hur många tester en text innehåller
const raknaTester = (text) => {
  // Räknaren börjar på 0
  let antal = 0;
  // Dela upp texten i rader
  const rader = text.split("\n");
  // Gå igenom raderna, en i taget
  for (const rad of rader) {
    // Ta bort mellanslag i början och slutet av raden
    const rensadRad = rad.trim();
    // Börjar raden med it( eller test(? Då är det ett test
    if (rensadRad.startsWith("it(") || rensadRad.startsWith("test(")) {
      antal = antal + 1;
    }
  }
  // Skicka tillbaka antalet
  return antal;
};

// Texten före ändringen. Tom från början
let fore = "";
// Edit skickar bara den del som byts ut, i old_string
if (andring.old_string !== undefined) {
  fore = andring.old_string;
} else if (fs.existsSync(fil)) {
  // Write byter hela filen. Då läser vi hela filen som den ser ut nu
  fore = fs.readFileSync(fil, "utf8");
}

// Texten efter ändringen. Tom från början
let efter = "";
// Edit skickar den nya delen i new_string
if (andring.new_string !== undefined) {
  efter = andring.new_string;
} else if (andring.content !== undefined) {
  // Write skickar hela den nya filen i content
  efter = andring.content;
}

// Gå igenom den nya texten, en rad i taget
for (const rad of efter.split("\n")) {
  // Ta bort mellanslag i början och slutet av raden
  const rensadRad = rad.trim();
  // Stänger raden av ett test?
  const stangerAv =
    rensadRad.includes(".skip(") ||
    rensadRad.includes(".only(") ||
    rensadRad.startsWith("xit(") ||
    rensadRad.startsWith("xdescribe(");
  // Ja? Stoppa ändringen
  if (stangerAv) {
    process.stderr.write("Stoppad: ett test får inte stängas av (skip, only, xit). Se docs/standard.md.\n");
    process.exit(2);
  }
}

// Färre tester efter ändringen än före? Då har ett test tagits bort. Stoppa
if (raknaTester(efter) < raknaTester(fore)) {
  process.stderr.write("Stoppad: ändringen tar bort ett test. Föreslå ändringen i text i stället.\n");
  process.exit(2);
}

// Inget fel hittades: släpp igenom ändringen
process.exit(0);
