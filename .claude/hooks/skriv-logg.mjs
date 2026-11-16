// Hämtar verktyg för att läsa, lista, skriva och kolla filer
import { readFileSync, readdirSync, writeFileSync, existsSync } from "node:fs";
// Hämtar process, som har stdin och exit
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

// Sökvägen till transkriptet: filen med allt som sagts och gjorts i chatten
const transkriptFil = anrop.transcript_path;

// Läs hela transkriptet som text
const transkriptText = readFileSync(transkriptFil, "utf8");
// Dela upp texten i en lista. En rad är en händelse i chatten
const transkriptRader = transkriptText.split("\n");

// Två tomma listor. De fylls på i loopen nedan
const minaMeddelanden = [];
const andradeFiler = [];

// Gå igenom transkriptet, en rad i taget
for (const rad of transkriptRader) {
  // Tom rad? Hoppa till nästa rad
  if (rad === "") continue;

  // Gör om raden till ett objekt
  const handelse = JSON.parse(rad);

  // Är händelsen ett meddelande från mig?
  if (handelse.type === "user") {
    // Texten i meddelandet
    const meddelande = handelse.message.content;

    // Bara vanlig text, och inte en systemrad som börjar med <
    if (typeof meddelande === "string" && !meddelande.startsWith("<")) {
      // Dela upp meddelandet i rader
      const meddelandeRader = meddelande.split("\n");
      // Ta första raden
      const forstaRaden = meddelandeRader[0];
      // Högst 100 tecken
      const kortRad = forstaRaden.slice(0, 100);
      // Lägg till i listan
      minaMeddelanden.push("- " + kortRad);
    }
  }

  // Är händelsen ett svar från Claude?
  if (handelse.type === "assistant") {
    // Ett svar har flera delar. Gå igenom dem en i taget
    for (const svarsdel of handelse.message.content) {
      // Ändrade eller skrev Claude en fil?
      if (svarsdel.name === "Edit" || svarsdel.name === "Write") {
        // Filens namn
        const filnamn = "- " + svarsdel.input.file_path;
        // Lägg bara till filen om den inte redan finns i listan
        if (!andradeFiler.includes(filnamn)) andradeFiler.push(filnamn);
      }
    }
  }
}

// Alla namn i mappen sessions, till exempel pass-1.md, bevis och .gitkeep
const allaNamn = readdirSync("sessions");
// Räknare för hur många loggar som finns
let antalLoggar = 0;
// Gå igenom namnen, ett i taget
for (const namn of allaNamn) {
  // Räkna bara filer som börjar med pass- och slutar med .md
  if (namn.startsWith("pass-") && namn.endsWith(".md")) {
    antalLoggar = antalLoggar + 1;
  }
}

// Nästa nummer: antal loggar plus 1
const nummer = antalLoggar + 1;
// Namnet på den nya loggen
const loggFil = `sessions/pass-${nummer}.md`;

// Finns filen redan? Skriv inte över den. Din egen logg ska aldrig försvinna
if (existsSync(loggFil)) process.exit(0);

// En tom lista. Varje rad i loggen läggs till här, en i taget
const loggRader = [];
// Rubriken överst
loggRader.push(`# Pass ${nummer} (utkast från hooken)`);
// Vad jag bad om
loggRader.push("## Du bad om");
for (const meddelande of minaMeddelanden) {
  loggRader.push(meddelande);
}
// Vilka filer Claude ändrade
loggRader.push("## Ändrade filer");
for (const filnamn of andradeFiler) {
  loggRader.push(filnamn);
}
// De sex rubrikerna som jag fyller i själv
loggRader.push("## Läge");
loggRader.push("## Fungerade (med bevis)");
loggRader.push("## Misslyckades");
loggRader.push("## Återstår");
loggRader.push("## Beslut");
loggRader.push("## Förbrukning");

// Sätt ihop alla rader till en text, med en tom rad emellan
const loggText = loggRader.join("\n\n");
// Skriv loggen till sessions/
writeFileSync(loggFil, loggText);
