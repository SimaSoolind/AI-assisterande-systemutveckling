# Kursprojekt: En rigg för en kodbas
AI-assisterad systemutveckling · individuellt · riggen i repot, dokumentation enligt mallen och muntlig redovisning

---

## Min checklista (bocka av med x)

### Riggen
- [X] Behörigheter med `allow`, `ask` och `deny` i `.claude/settings.json`
- [ ] Kodstandard som kontrolleras automatiskt: linter
- [ ] Kodstandard som kontrolleras automatiskt: formatering
- [ ] Kodstandard som kontrolleras automatiskt: typkontroll
- [ ] Felmeddelandena säger hur felet rättas
- [X] Skill 1: `/tdd`
- [ ] Skill 2:
- [ ] Skill 3:
- [X] Subagent 1 (beskrivning, verktyg, modell)
- [X] Subagent 2
- [X] Subagent 3
- [X] Subagent 4
- [ ] Hook 1: minneskedjan sparar sessionens läge
- [X] Hook 2: minneskedjan laddar sessionens läge
- [X] Hook 3: stoppar att tester tas bort eller stängs av
- [ ] Hook 4:
- [ ] Hook 5:
- [ ] Sessionslogg efter varje arbetspass i `sessions/`

### Arbete 1: Ny funktion
- [ ] Välj user story
- [ ] Acceptanskriterier i formen Givet/När/Så
- [ ] Research (fil)
- [ ] Plan (fil)
- [ ] Bygg med tester först
- [ ] Granska (fil)
- [ ] Verifiera (fil)
- [ ] En ADR för det viktigaste beslutet
- [ ] Små commits med spårbara meddelanden

### Arbete 2: Granskning av kursledarens pull request
- [ ] Minst en säkerhetsbrist
- [ ] Minst en strukturbrist
- [ ] Minst en brist mot kodstandarden
- [ ] Vilken kontroll i riggen som hade stoppat varje brist

### Arbete 3: Modernisering av `src/legacy/price_calc.py`
- [ ] Codemap
- [ ] Minst 5 karakteriseringstester
- [ ] Refaktoreringssteg 1, gröna tester
- [ ] Refaktoreringssteg 2, gröna tester
- [ ] Refaktoreringssteg 3, gröna tester
- [ ] Migreringsplan för databasen i reversibla steg

### Inlämning
- [ ] Mallen ifylld som PDF (sidorna 4 till 9 i kursmaterialet)
- [ ] Repot taggat `inlamning`
- [ ] Redovisning förberedd (19 nov)

---

## Betygsättning

**GODKÄNT**
Du har en rigg som fungerar och som du har använt på riktigt arbete i kodbasen.

**VÄL GODKÄNT**
Du har en rigg som fungerar, och du har identifierat styrkor och svagheter hos de alternativ du kunde ha valt, argumenterat för dina val med mätningar, och följt kursens arbetssätt hela vägen så att varje commit går att förklara ur repot.

**I praktiken**
Varje ruta i mallen har plats för ett svar. För godkänt fyller du i svaret och visar var i repot det finns. För väl godkänt skriver du också vilket alternativ du valde bort och varför, och stöder valet med en siffra: tokens, tid, kronor eller antal fel som en kontroll fångade.

## Tre leveranser

| Leverans | Vad det är |
|---|---|
| 1 Riggen | Repot med kodbasen och allt som styr agenten: skills och kommandon, hooks, subagenter, behörigheter, kodstandard som kontrolleras automatiskt och sessionsloggar. Repot taggas inlamning. |
| 2 Dokumentation | Mallen på sidorna 4 till 9, ifylld och inlämnad som PDF. Varje svar pekar på den fil, commit eller sessionslogg i repot där det syns. |
| 3 Redovisning | En kort presentation, en uppgift som löses på plats och frågor. |

## Redovisning
Du börjar med resultatet: vad riggen består av och vad mätningarna visar. Sedan löser du en uppgift på plats som kursledaren väljer, till exempel att få en hook att stoppa en ändring, återuppta arbetet från en sessionslogg, köra en skill på ny kod eller förklara en godtycklig commit. Frågorna kan gälla vilken del av riggen som helst, så du behöver kunna helheten.

## Uppgiften
Du är utvecklare i ett team som ska börja arbeta med en kodagent. Teamet vill inte att var och en skriver egna instruktioner i chatten, utan vill ha en gemensam rigg i repot som gör att agenten arbetar på samma sätt för alla, att fel stoppas automatiskt och att det i efterhand går att se vad som hänt och varför.

Bygg riggen för en kodbas, använd den på tre verkliga arbeten under delkursen, och fyll i mallen på följande sidor. Riggen ska vara liten och i bruk: fem hooks som fungerar är bättre än femton som ingen kan förklara.

### Välj kodbas
- Delkursens övningsprojekt: ett REST-API för kunder och beställningar i TypeScript med tester, och en äldre, odokumenterad modul för prisberäkning med databas.
- En egen kodbas, om den har tester som går att köra, har en äldre del som behöver moderniseras, inte innehåller kund- eller produktionsdata och är godkänd av kursledaren.

### Välj en user story för den nya funktionen
Gäller övningsprojektet. Med en egen kodbas skriver du en egen user story av samma storlek.

- Kunden kan skicka om en beställning när nätet strular, utan att den läggs två gånger.
- Kunden kan avbryta en beställning inom 30 minuter.
- Beställningar listas med sidindelning och filter på status.
- En rabattkod kan läggas på en beställning.
- Kunden kan byta leveransadress tills beställningen skickats.
- Lagersaldot kontrolleras när en beställning läggs.
- Kunder kan sökas på namn eller e-post.
- Kundens beställningar kan exporteras som CSV.

### Tre arbeten som riggen används på

| Arbete | Vad som ska synas i repot |
|---|---|
| Ny funktion från krav till granskad kod | Din user story genom faserna research, plan, bygg med tester först, granska och verifiera. Varje fas lämnar en fil. Små commits med spårbara meddelanden och en ADR för det viktigaste beslutet. |
| Granskning av agentgenererad kod | Ett pull request som kursledaren delar ut. Du hittar minst en brist av varje typ (säkerhet, struktur, kodstandard) och visar vilken kontroll i riggen som hade stoppat den. |
| Modernisering av en äldre del | Codemap, minst fem karakteriseringstester som säkerhetsnät, minst tre små refaktoreringssteg med gröna tester efter varje, och en migreringsplan för databasen i reversibla steg. |

Du behöver inte göra arbetena klara i alla delar. Det som bedöms är att riggen används och att du kan visa vad den gjorde. Det som inte hanns skriver du i sessionsloggen, med varför.

## Det du lämnar in

### Riggen i repot
- Kodstandard som kontrolleras automatiskt: linter, formatering och typkontroll, med felmeddelanden som säger hur felet rättas.
- Minst tre skills eller kommandon, varav /tdd.
- Minst fyra subagenter, var och en med beskrivning, verktyg och modell.
- Minst fem hooks, varav minneskedjan som sparar och laddar sessionens läge.
- Behörigheter med allow, ask och deny i projektets inställningar.
- En sessionslogg efter varje arbetspass i sessions/: läge, vad som fungerade med bevis, vad som misslyckades, vad som återstår, beslut.

### Dokumentationen: mallens delar

| Del | Innehåll |
|---|---|
| Kodbas, krav och beslut | Vilken kodbas och user story, acceptanskriterier i formen Givet/När/Så, API-kontraktet för funktionen, och den beslutslogg (ADR) du skrev. |
| Riggens delar och varför de finns | För varje skill, subagent och hook: vad den gör, varför den finns, vad som gick fel utan den, och hur man ser att den fungerar. Delar du övervägde men valde bort. |
| Behörigheter och sandlåda | Dina regler med motivering, och var agenten körs. |
| Arbetsslingan och kontexten | Stegen från krav till commit, hur du planerar, rensar och komprimerar, och vad en commit berättar. |
| Orkestrering och modellval | Faserna och filerna emellan, modell per subagent med kostnad, stoppvillkor, och vad du körde parallellt i worktrees. |
| Styrd kodgenerering och granskning | Kodstandarden i verktyg, hooks som stoppar, var människan granskar, och granskningen av det utdelade pull requestet. |
| Modernisering | Codemap, karakteriseringstester, stegen och migreringsplanen. |
| Mätningar | Tokens, tid och kostnad per arbete, vad kontrollerna fångade, och två besparingar med vad de kostar i kvalitet. |
| Riggen i ett team och risker | Hur riggen införs i ett team på fem, vem som äger den och hur den ändras. Fem risker med hur de upptäcks och vad du gör åt dem. |

## Regler under arbetet
- Allt som styr agenten ligger i repot och ändras med commits. Inget ligger bara i en chatt.
- Agenten får föreslå ändringar i tester men aldrig ta bort eller stänga av dem. En hook ska stoppa det.
- Ingen kunddata eller produktionsdata i kod, instruktioner eller sessionsloggar.
- Sessionsloggen är också ditt underlag när ditt arbete bedöms.
