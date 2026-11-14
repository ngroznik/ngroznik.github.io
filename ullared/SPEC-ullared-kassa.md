# Spec: Ullared-kassan, nästa version

Underlag för Claude Code. Appen finns redan som en fungerande fil (`index.html`, tidigare `ullared-kassa.html`). Uppdraget är att bygga vidare på den, inte skriva om den.

## 1. Nuläge

**Vad appen är:** en mobilvänlig webbapp för shopping på Gekås Ullared. En enda HTML-fil med inbyggd CSS och vanlig JavaScript, utan byggsteg och utan server. Den ligger på GitHub Pages (https krävs för kameran).

**Vad den kan idag**
- Läser av pris med kameran (Tesseract.js från jsdelivr, siffror får man rätta för hand).
- Korg med namn, pris, antal, valfri bild- eller produktlänk. Total överst.
- Märkning av varor under en prisgräns (standard 200 kr, kan ändras).
- Budget med återstående belopp.
- Ångra (upp till 40 steg), redigera och ta bort varor.
- Fliken "Att köpa": önskelista per person, bocka av, "Köp"-knapp som skickar varan till skanningen, klistra in flera, dela som text.
- Dela korgen som text.

**Lagring:** `localStorage`, nyckel `ullared-kassa-v2`. Formen:

```json
{
  "items":   [{ "id": "", "name": "", "price": 0, "qty": 1, "img": "" }],
  "wishes":  [{ "id": "", "text": "", "person": "", "done": false, "img": "" }],
  "budget":  0,
  "limit":   200
}
```

Ångra-historiken ligger i minnet (`history`) och sparas inte.

## 2. Mål för den här versionen

Tre funktioner, i den här ordningen:

1. Avdelningar på varor och önskningar.
2. Kundvagnsnummer och parkering.
3. Backup (export och import).

## 3. Villkor som inte får brytas

- Ingen server, inget konto, ingen inloggning, inga tredjepartstjänster för data. Allt stannar på telefonen.
- Allt ska fungera på telefon först (390 px bred), med stora tryckytor (minst 44 px).
- Befintlig data får inte gå förlorad. Det behövs en migrering från `ullared-kassa-v2`.
- Ångra ska fungera för alla nya ändringar.
- Svenska i gränssnittet. Följ tillgänglighetsreglerna (WCAG 2.2 AA): synlig fokus, kontrast, riktiga knappar och etiketter.
- Skriv aldrig användarens text rakt in i HTML. Använd `textContent`.

## 4. Steg 0: hämta avdelningarna från Ditt Gekås

Avdelningarna finns på användarens konto på Ditt Gekås. Claude Code (eller Claude in Chrome) ska läsa dem från en sida som användaren redan har öppen och är inloggad på.

**Regler för det steget**
- Läs bara. Klicka inte på något som ändrar något, och gör inga köp.
- Öppna inte köphistorik, kvitton eller personuppgifter. Avdelningarna räcker.
- Be aldrig om lösenord och spara inga inloggningsuppgifter, cookies eller personuppgifter någonstans, varken i koden eller i repot.
- Om avdelningarna inte går att läsa av, be användaren klistra in dem som text eller skärmbilder.

**Resultatet:** en fil `avdelningar.json` som läggs i repot och bakas in som standarddata i appen:

```json
[
  { "id": "barnklader", "name": "Barnkläder", "floor": 1, "order": 1, "keywords": ["barn", "baby", "pyjamas"] }
]
```

- `id`: kort, utan mellanslag eller å/ä/ö.
- `order`: standardordning genom varuhuset, 1 är först.
- `keywords`: ord som får en vara att hamna här. Börja enkelt, användaren kan utöka dem.
- Om våning eller ordning inte går att hämta, lämna `floor` som `null` och sätt ordningen alfabetiskt. Användaren ändrar den sedan i appen.

## 5. Funktion 1: Avdelningar

**Datamodell**
- `state.departments`: lista enligt formatet ovan. Fylls från `avdelningar.json` första gången.
- Varje vara och önskning får `dept` (id på avdelningen, eller tomt).
- `state.deptLearn`: objekt som kopplar ett ord till en avdelning, som appen lär sig när användaren rättar en gissning.

**Beteende**
- När en vara eller önskning läggs till gissar appen avdelning utifrån `deptLearn` först, sedan `keywords`. Jämför på små bokstäver och prova enkel pluralhantering ("byxor" och "byxa"). Hittas ingen, sätt tomt.
- Användaren kan alltid byta avdelning på en vara (i redigeringsrutan) och även direkt från raden med ett tryck. Ett byte sparas i `deptLearn`.
- Önskelistan och korgen kan visas **grupperade efter avdelning i vandringsordning**. Våning visas vid varje avdelning om den finns. Det som saknar avdelning hamnar sist under "Övrigt".
- Vyn växlas med en tydlig knapp: "Per person" (som idag) och "Per avdelning".
- Inställning: ändra avdelningarnas ordning (flytta upp och ner), byt namn, lägg till och ta bort egna avdelningar, återställ standard.
- Klistra in flera ska också gissa avdelning.

**Klart när**
- En vara med namnet "strumpor" hamnar på en rimlig avdelning utan att användaren gör något, och byts avdelning kommer appen ihåg det nästa gång.
- Ändrar användaren ordningen syns den direkt i listan.
- Ångra återställer ett byte av avdelning.
- Gammal data från v2 öppnas utan fel och alla varor visas som "Övrigt".

## 6. Funktion 2: Kundvagn och parkering

**Datamodell:** `state.visit = { cartNo: "", parking: "", geo: null }`, där `geo` är `{ lat, lng, ts }` eller `null`.

**Beteende**
- Ett kort högst upp på fliken "Skanna" (hopfällbart): fält för kundvagnsnummer, fält för parkering (fri text, t.ex. "Gul zon, rad 14"), och knappen **Spara plats**.
- Spara plats använder `navigator.geolocation` (kräver https och att användaren tillåter). Spara koordinater och tid. Visa en knapp **Hitta bilen** som öppnar positionen i telefonens kartapp med en vanlig kartlänk (`https://www.google.com/maps?q=LAT,LNG`), i en ny flik.
- Om platsåtkomst nekas ska textfältet fungera som vanligt och användaren få ett kort besked.
- Knapp **Rensa** tömmer kortet efter bekräftelse, med ångra.
- Visa kundvagnsnumret litet i sidhuvudet så det syns hela tiden.
- Positionen skickas aldrig någonstans. Förklara det med en rad under knappen.

**Klart när**
- Värdena finns kvar efter att appen stängts och öppnats igen.
- "Hitta bilen" öppnar rätt plats, och utan sparad plats är knappen inaktiv.
- Nekad platsåtkomst kraschar inte och visar ett begripligt meddelande.

## 7. Funktion 3: Backup

**Beteende**
- **Exportera fil:** laddar ner `ullared-backup-ÅÅÅÅ-MM-DD.json` med hela tillståndet (varor, önskningar, budget, gräns, avdelningar, `deptLearn`, besöksuppgifter) samt `version` och `exportedAt`.
- **Kopiera som kod:** samma innehåll som text (JSON, gärna komprimerat och base64-kodat) som kan klistras in i ett meddelande eller en anteckning.
- **Importera:** från fil eller inklistrad kod. Visa först en sammanfattning ("12 varor, 30 önskningar") och låt användaren välja **Slå ihop** (lägg till det som saknas, bedöm dubbletter på `id`) eller **Ersätt allt**.
- Validera innan något skrivs: rätt struktur, rimliga värden, version som går att läsa. Vid fel, ändra ingenting och förklara vad som är fel.
- Importen går att ångra.
- Påminnelse: visa en liten tips-rad om att ta en backup, till exempel när korgen har mer än 10 varor och ingen export gjorts.
- Gamla v2-filer och gamla koder ska gå att importera.

**Klart när**
- Export följd av "Ersätt allt" ger exakt samma data.
- En trasig fil ger ett tydligt felmeddelande och rör inte befintlig data.
- Sammanslagning skapar inga dubbletter.

## 8. Migrering

- Byt lagringsnyckel till `ullared-kassa-v3` och lägg `version: 3` i tillståndet.
- Vid start: finns v3, använd den. Annars läs v2 (och v1 som tidigare) och konvertera. Låt den gamla nyckeln ligga kvar som skydd.
- Lägg till de nya fälten med säkra standardvärden.

## 9. Utanför den här versionen

Konton, server, livesynk mellan telefoner, inloggning mot Gekås, en officiell kartbild av varuhuset. Dessa kan tas senare (se nedan).

## 10. Test

Prova på en riktig telefon (iPhone Safari och Android Chrome), över https:
1. Starta med gammal v2-data och kontrollera att allt finns kvar.
2. Lägg till varor, bekräfta avdelningsgissningen, rätta den, och kontrollera att den lärs in.
3. Spara plats, stäng appen, öppna den igen och använd "Hitta bilen".
4. Exportera, rensa all webbplatsdata, importera, jämför.
5. Mörkt läge, text i stor storlek (200 %), skärmläsare på nyckelflöden.

## 11. Öppna frågor till användaren

- Vilka avdelningar och vilken ordning har varuhuset idag? (Steg 0 besvarar detta.)
- Ska avdelningsvyn vara standard, eller "Per person"?
- Ska kundvagnsnumret vara siffror eller fri text?

## 12. Senare, om det behövs

Alltid-köp, avsluta besök med historik och avstämning mot kvitto, returlista, delning via länk, och eventuell livesynk (kräver server och konto, och ska då göras som ett eget beslut).
