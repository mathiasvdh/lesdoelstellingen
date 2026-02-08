# Handleiding: Gemini App Tester

## Wat doet dit programma?

Dit programma opent automatisch jouw Gemini-app in een browser, doet alsof het 10 verschillende leerlingen is (14-17 jaar), en test of jouw app goede feedback geeft. Aan het einde krijg je een rapport met scores.

---

## Wat heb je nodig?

- Een computer (Windows, Mac of Linux)
- Internet
- Jouw Google account (waarmee je Gemini gebruikt)

---

## Stap-voor-stap installatie

### STAP 1: Installeer Node.js

Node.js is het programma dat onze tester laat draaien.

1. Ga naar: https://nodejs.org
2. Klik op de groene knop **"Download Node.js (LTS)"**
3. Open het gedownloade bestand
4. Klik steeds op **"Volgende"** / **"Next"** tot het klaar is
5. Herstart je computer

**Controleren of het gelukt is:**
- Open **Opdrachtprompt** (Windows) of **Terminal** (Mac)
  - Windows: druk op de Windows-toets, typ `cmd`, druk Enter
  - Mac: open Spotlight (Cmd+Spatie), typ `Terminal`, druk Enter
- Typ dit en druk Enter:
  ```
  node --version
  ```
- Als je een nummer ziet (bijv. `v22.1.0`), is het gelukt!

---

### STAP 2: Download dit project

1. Download het project als ZIP van GitHub, of als je het al hebt, open de map
2. Open **Opdrachtprompt** of **Terminal**
3. Ga naar de map van het project. Bijvoorbeeld:
   - Windows: `cd C:\Users\jouwnaam\Downloads\lesdoelstellingen`
   - Mac: `cd ~/Downloads/lesdoelstellingen`

---

### STAP 3: Installeer de benodigdheden

Typ dit in de Opdrachtprompt/Terminal en druk Enter:

```
npm install
```

Wacht tot het klaar is (kan 1-2 minuten duren). Er wordt een browser gedownload die het programma nodig heeft.

---

### STAP 4: Vul je Google-gegevens in

1. In de projectmap vind je een bestand genaamd `.env.example`
2. Maak een **kopie** van dit bestand en noem het `.env` (zonder .example)
   - Windows: in Verkenner, kopieer het bestand en hernoem naar `.env`
   - Mac: in Terminal typ: `cp .env.example .env`
3. Open het `.env` bestand met **Kladblok** (Windows) of **TextEdit** (Mac)
4. Pas deze twee regels aan met jouw Google-gegevens:

```
GOOGLE_EMAIL=jouw-echte-email@gmail.com
GOOGLE_PASSWORD=jouw-echte-wachtwoord
```

5. Sla het bestand op en sluit het

**BELANGRIJK:**
- Dit bestand blijft alleen op jouw computer, het wordt NIET gedeeld
- Als je tweestapsverificatie hebt op Google, moet je mogelijk een "app-wachtwoord" aanmaken (zie stap 4b hieronder)

---

### STAP 4b: (Alleen als je tweestapsverificatie hebt)

De meeste Google-accounts hebben tweestapsverificatie. Dan werkt je gewone wachtwoord niet. Doe dit:

1. Ga naar: https://myaccount.google.com/apppasswords
2. Log in met je Google-account
3. Kies een naam (bijv. "Gemini Tester")
4. Klik op **"Maken"**
5. Je krijgt een wachtwoord van 16 tekens (bijv. `abcd efgh ijkl mnop`)
6. Gebruik DIT wachtwoord in je `.env` bestand (zonder spaties):

```
GOOGLE_PASSWORD=abcdefghijklmnop
```

---

## Het programma gebruiken

### Optie A: Eerst testen ZONDER browser (aanbevolen als eerste stap)

Dit test of alles goed geinstalleerd is, zonder dat het daadwerkelijk naar Gemini gaat:

```
npm run test:dry
```

Je ziet dan scores voor alle 10 leerlingen en er wordt een rapport gemaakt in de map `reports/`.

---

### Optie B: Eenmalig inloggen op Google

Voordat je de echte test draait, moet je eenmalig inloggen:

```
npm run login
```

Er opent een browservenster. Als Google om extra verificatie vraagt (bijv. een code op je telefoon), doe dat dan in het browservenster. De sessie wordt daarna opgeslagen zodat je dit niet elke keer hoeft te doen.

---

### Optie C: De volledige test draaien

Als je succesvol bent ingelogd (stap B), kun je de test starten:

```
npm start
```

**Wat er dan gebeurt:**
1. Er opent een browservenster
2. Het programma gaat naar jouw Gemini-app
3. Het typt de tekst van leerling 1 (Emma, 14 jaar, 3 havo)
4. Het wacht op het antwoord van Gemini
5. Het slaat een screenshot op
6. Het herhaalt dit voor alle 10 leerlingen
7. Aan het einde wordt een rapport gemaakt

**Dit duurt ongeveer 10-15 minuten.** Raak de browser niet aan terwijl het draait!

---

## Het rapport bekijken

Na het draaien vind je de rapporten in de map `reports/`:

- **rapport-[datum].html** - Open dit in je browser (dubbelklik) voor een mooi visueel rapport met kleuren en grafieken
- **rapport-[datum].txt** - Tekstversie die je kunt printen
- **rapport-[datum].json** - Ruwe data (dit heb je waarschijnlijk niet nodig)

In het rapport zie je per leerling:
- Een totaalscore (percentage)
- Scores op 7 criteria (bijv. "Geeft de app constructieve feedback?")
- Een samenvatting
- Aanbevelingen om je app te verbeteren

---

## Veelgestelde vragen

**V: De browser opent maar er gebeurt niets?**
A: Wacht even, soms duurt het laden van Gemini 10-30 seconden.

**V: Ik krijg een foutmelding over credentials?**
A: Controleer of je `.env` bestand correct is ingevuld (zie stap 4).

**V: Google blokkeert de login?**
A: Probeer stap 4b (app-wachtwoord) of voer `npm run login` uit en voltooi de verificatie handmatig in het browservenster.

**V: Kan ik de leerlingprofielen aanpassen?**
A: Ja! Open `src/students.js` met Kladblok en pas de teksten aan.

**V: Ik wil alleen bepaalde leerlingen testen?**
A: Dat kan helaas nog niet via een instelling, maar je kunt het vragen als je wilt dat ik dat toevoeg.

---

## Samenvatting: de 4 commando's die je nodig hebt

| Wat                        | Commando            | Wanneer                        |
|----------------------------|---------------------|-------------------------------|
| Installeren                | `npm install`       | Eenmalig, bij de eerste keer  |
| Testen zonder browser      | `npm run test:dry`  | Om te controleren of het werkt|
| Inloggen op Google         | `npm run login`     | Eenmalig (elke 12 uur opnieuw)|
| Volledige test draaien     | `npm start`         | Zo vaak als je wilt           |
