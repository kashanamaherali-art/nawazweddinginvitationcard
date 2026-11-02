# RSVP backend: Azure Function → Power Automate → Excel

```
Website (GitHub Pages) → Azure Function (validates, protects) → Power Automate flow → Excel table WeddingRSVP
```

The website only knows the Azure Function URL. The Power Automate URL (which works like a password) lives in the Function's settings, never in the website files.

**Status: written and unit-tested, but not deployed or connected to your Microsoft account.** Do not tell guests RSVP works until step 9 succeeds. You need a Microsoft 365 account with OneDrive or SharePoint, an Azure subscription, and a Power Automate licence that includes the **"When an HTTP request is received"** trigger (a premium trigger).

## 1. Create the workbook
Use `Muhammad_Nawaz_Bhatti_Wedding_RSVP.xlsx` from this folder. The `RSVP` sheet holds a table named **`WeddingRSVP`** with the ten columns (Submission ID, Submission Date, Guest Name, Contact Number, Total Guests, Rasm-e-Hina, Sehra Bandi, Departure of Barat, Walima, Additional Message). The `Summary` sheet counts attendees automatically.

## 2. Upload it
Upload the file to OneDrive for Business or a SharePoint document library. Keep the file name, the table name and the column names unchanged.

## 3. Create the table
It is already created. To confirm: open the file in Excel, click inside the data, and check **Table Design → Table Name = WeddingRSVP**.

## 4. Build the Power Automate flow
1. Go to make.powerautomate.com → **Create → Instant cloud flow** → trigger **When an HTTP request is received**.
2. *Who can trigger the flow*: **Anyone**. Paste `power-automate/request-schema.json` as the Request Body JSON Schema.
3. Add **Excel Online (Business) → Add a row into a table**. Choose the Location, Document Library, File and Table `WeddingRSVP`, then map each column to the matching field from the trigger: Submission ID ← submissionId, Submission Date ← submissionDate, Guest Name ← guestName, Contact Number ← contactNumber, Total Guests ← totalGuests, Rasm-e-Hina ← rasmEHina, Sehra Bandi ← sehraBandi, Departure of Barat ← departureOfBarat, Walima ← walima, Additional Message ← additionalMessage.
4. Add a **Response** action after it: status `200`, body `{"ok":true}`.
5. Add a second **Response** action (status `500`, body `{"ok":false}`) and set its **Configure run after** to *has failed* and *has timed out* on the Excel step, so a failed save is reported honestly.
6. Save, then copy the **HTTP POST URL**.

## 5. Deploy the backend
```bash
cd backend/azure-function
npm install
npm test
func azure functionapp publish <YOUR-FUNCTION-APP-NAME>
```
(Create a Function App first: Node.js 20, Functions v4. The VS Code Azure Functions extension can also deploy this folder.)

## 6. Configure environment variables
In the Azure portal: Function App → **Settings → Environment variables**, add the values listed in `.env.example`: `ALLOWED_ORIGINS` (your website origin, e.g. `https://username.github.io`), `POWER_AUTOMATE_URL` (from step 4), `RATE_LIMIT_MAX`, `RATE_LIMIT_WINDOW_MS`. For local runs copy `local.settings.sample.json` to `local.settings.json` (it is git-ignored).

## 7. Connect the website
Edit `js/config.js` in the website: `rsvpEndpoint: "https://<YOUR-FUNCTION-APP>.azurewebsites.net/api/rsvp"`. This URL is public by design; it holds no secret.

## 8. Test an RSVP
Open the live site, tap an RSVP button, fill the form and send. You should see the thank-you animation. You can also test from a terminal (use a real allowed origin; `elapsedMs` must be above 2500):
```bash
curl -X POST https://<APP>.azurewebsites.net/api/rsvp -H "Origin: https://username.github.io" -H "Content-Type: application/json" \
 -d '{"requestId":"test-12345678","name":"Test Guest","phone":"03001234567","guests":2,"events":{"hina":"Attending","sehra":"Not Attending","barat":"Attending","walima":"Attending"},"message":"","website":"","elapsedMs":9000}'
```

## 9. Check Excel
Open the workbook: a new row must appear in `WeddingRSVP` with the Pakistan time in *Submission Date*. Then delete the `EXAMPLE-DELETE-ME` row and your test rows.

## Managing guest responses later
- **View all**: open the workbook on OneDrive or SharePoint (Excel for the web works).
- **Filter by occasion**: on the `RSVP` sheet use the filter arrow on *Walima* (or any event column) and tick **Attending**.
- **Count attendees**: the `Summary` sheet shows, for each occasion, the number of responses attending and the total headcount (sum of Total Guests). With a filter applied you can also select the *Total Guests* column and read the Sum in Excel's status bar.
- You never need to edit website code to read responses.

## Protection built in
Origin allow-list (CORS), input validation and length limits, a hidden honeypot field, a minimum fill time, a per-IP rate limit, duplicate-submit protection, spreadsheet formula-injection protection, and no personal data in logs. The rate limit is held in memory per server instance, which is fine for a family invitation; for stronger protection put Azure Front Door or API Management in front. Add a CAPTCHA such as Cloudflare Turnstile if you ever see spam.
