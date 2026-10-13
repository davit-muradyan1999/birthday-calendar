# 🎂 Ծննդյան օրերի օրացույց

Vue 3 + Tailwind CSS կայք, որտեղ յուրաքանչյուրը առանց գրանցվելու նշում է իր անունը, ազգանունը և ծննդյան օրը։
Բոլորը տեսնում են ընդհանուր ցուցակը, իսկ ամբողջ ցուցակը կարելի է ներբեռնել PDF-ով։

Կայքն աշխատում է **Cloudflare Pages**-ում (անվճար), տվյալները պահվում են **Cloudflare D1** տվյալների բազայում։

## Լոկալ գործարկում

```bash
nvm use
npm install
npm run dev        # http://localhost:5173
```

Լոկալ տվյալները պահվում են `.wrangler/` թղթապանակում։

## Կառուցվածք

- `src/` — Vue կայքը
- `functions/api/` — API (Cloudflare Pages Functions)
- `server/db.js` — D1-ի հետ աշխատանքի ընդհանուր կոդը (աղյուսակը ստեղծվում է ինքնաշխատ)

## Տեղադրում Cloudflare-ում (GitHub-ի միջոցով)

1. Կոդը վերբեռնել GitHub ռեպոզիտորիա։
2. Cloudflare Dashboard → **Storage & Databases → D1** → Create database (օր.՝ `birthdays-db`)։
3. **Workers & Pages → Create → Pages → Connect to Git** → ընտրել ռեպոզիտորիան։
   - Framework preset: `Vue` (կամ None)
   - Build command: `npm run build`
   - Build output directory: `dist`
4. Ստեղծելուց հետո՝ նախագծի **Settings → Bindings → Add → D1 database**.
   - Variable name: `DB`
   - D1 database: `birthdays-db`
5. **Deployments** → վերջին deployment-ի մոտ `⋯` → **Retry deployment**, որպեսզի binding-ը կիրառվի։

Այսուհետ ամեն `git push`-ից հետո կայքը ինքնաշխատ թարմանում է։

## Հնարավորություններ

- Անուն/ազգանուն + օրացույցից օրվա ընտրություն (տարին չի պահանջվում)
- Օրացույցում 🎂 նշանով երևում են բոլորի ծննդյան օրերը
- «Մոտակա ծննդյան օրեր»՝ առաջիկա 30 օրը
- Ամսերով խմբավորված ցուցակ և որոնում
- Մարդը կարող է ջնջել միայն իր ավելացրած գրառումը (բանալին պահվում է իր բրաուզերում)
- PDF արտահանում՝ ամսերով, հայերեն տառերի ճիշտ ցուցադրմամբ
- Ցուցակը թարմանում է ամեն 15 վայրկյանը մեկ
