# BoxTag 📦

אפליקציית ווב (PWA) לניהול ארגזים במעבר דירה: יצירת ארגז, רשימת פריטים ותמונות, מדבקת QR להדפסה, וסריקה מהירה בזמן פריקה.

כל הנתונים נשמרים **מקומית בדפדפן בלבד** (IndexedDB) — בלי שרת, בלי סנכרון. חשוב: אריזה וסריקה צריכות לקרות **באותו מכשיר/דפדפן**.

## הרצה מקומית

אין צורך ב-Node/Python. יש סקריפט שרת סטטי מוכן:

```
powershell -ExecutionPolicy Bypass -File serve.ps1
```

ואז לפתוח בדפדפן: http://localhost:8080/

## פריסה ל-GitHub Pages (חינם, עם HTTPS)

1. ליצור חשבון חינמי ב-https://github.com/signup (אם עוד אין).
2. ליצור repository חדש וריק: לחיצה על "+" בפינה העליונה → New repository → שם (למשל `box-packer`) → **Public** → Create repository (בלי README/gitignore).
3. בתיקיית הפרויקט, מריצים (מחליפים `<username>` בשם המשתמש שלכם):
   ```
   git remote add origin https://github.com/<username>/box-packer.git
   git branch -M main
   git push -u origin main
   ```
   בפעם הראשונה יפתח חלון דפדפן להתחברות ל-GitHub.
4. ב-GitHub: Settings → Pages → Source: **Deploy from a branch**, Branch: **main**, תיקייה: **/(root)** → Save.
5. אחרי דקה-שתיים האתר יהיה זמין ב: `https://<username>.github.io/box-packer/`
6. פותחים את הכתובת בטלפון, ובתפריט הדפדפן בוחרים "הוסף למסך הבית" כדי להתקין כאפליקציה.

מרגע זה, ה-QR שנוצר לכל ארגז יצביע לכתובת הזו — כך שאפשר לסרוק אותו גם עם מצלמת ברירת המחדל של הטלפון.
