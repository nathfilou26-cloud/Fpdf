# Fpdf-vercel

Une application web pour **créer et lire des PDF** avec **Node.js** et **PDF-Lib**, optimisée pour **Vercel**.

## ✨ Fonctionnalités

- ✅ **Création de PDF** : Générer des PDF à partir de texte, avec titre et auteur
- ✅ **Lecture de PDF** : Visualiser les PDF avec PDF.js (navigation, zoom, extraction de texte)
- ✅ **Hébergement Vercel** : Prêt à déployer sans configuration
- ✅ **Backend Node.js** : Utilise `pdf-lib` pour la génération
- ✅ **Frontend moderne** : Interface responsive avec CSS/JS

## 🚀 Déploiement sur Vercel

### Méthode 1 : Déploiement automatique
1. **Pousse ce repo sur GitHub**
2. **Importe-le sur Vercel** : [https://vercel.com/new](https://vercel.com/new)
3. **Vercel détectera automatiquement** la configuration (`vercel.json`)

### Méthode 2 : En local
```bash
# Cloner le repo
git clone https://github.com/nathfilou26-cloud/Fpdf-vercel.git
cd Fpdf-vercel

# Installer les dépendances
npm install

# Démarrer le serveur
npm start

# Ou en mode développement
npm run dev
```

Accède à : [http://localhost:3000](http://localhost:3000)

## 📁 Structure du projet

```
Fpdf-vercel/
├── api/
│   └── index.js          # Backend Express avec pdf-lib
├── public/
│   ├── index.html        # Page principale
│   ├── css/
│   │   └── style.css     # Styles
│   └── js/
│       └── app.js        # Logique frontend
├── uploads/              # PDF générés
├── package.json          # Dépendances Node.js
├── vercel.json           # Configuration Vercel
└── README.md
```

## 🛠 API Endpoints

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/generate-pdf` | Génère un PDF à partir de JSON |
| GET | `/api/read-pdf/:filename` | Lit les métadonnées d'un PDF |
| GET | `/api/list-pdf` | Liste tous les PDF uploadés |
| GET | `/uploads/:filename` | Télécharge un PDF |

### Exemple de requête pour générer un PDF
```javascript
fetch('/api/generate-pdf', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Mon Document',
    content: 'Ceci est un test de génération de PDF avec Node.js',
    author: 'Moi'
  })
})
.then(res => res.json())
.then(data => console.log(data));
```

## 📦 Dépendances

- **Backend** :
  - `express` : Serveur web
  - `pdf-lib` : Génération de PDF
  - `multer` : Gestion des uploads
  - `cors` : CORS middleware

- **Frontend** :
  - `pdf.js` (CDN) : Lecteur de PDF

## 🌍 Déploiement

### Sur Vercel
1. **Importe le repo** depuis GitHub
2. **Vercel configure automatiquement** :
   - Runtime : Node.js
   - Entrypoint : `api/index.js`
   - Static files : `public/`

### Sur d'autres plateformes
- **Netlify** : Ajoute un `netlify.toml` avec les fonctions serverless
- **Heroku** : Ajoute un `Procfile` avec `web: npm start`
- **Render** : Sélectionne "Node.js" comme type de service

## 🎨 Personnalisation

### Modifier les styles
Édite `public/css/style.css` pour changer l'apparence.

### Ajouter des fonctionnalités
- **Édition de PDF** : Utilise `pdf-lib` pour modifier des PDF existants
- **Authentification** : Ajoute `jsonwebtoken` ou `next-auth`
- **Base de données** : Ajoute `mongodb` ou `postgresql` pour stocker les PDF

## 📄 Licence

MIT
