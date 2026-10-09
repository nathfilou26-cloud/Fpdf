const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { PDFDocument, rgb } = require('pdf-lib');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Configuration Multer pour uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Route pour générer un PDF
app.post('/api/generate-pdf', async (req, res) => {
  try {
    const { title, content, author } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ 
        success: false, 
        error: 'Titre et contenu sont requis' 
      });
    }

    // Créer un nouveau document PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([550, 750]);
    
    // Ajouter le titre
    page.drawText(title || 'Document sans titre', {
      x: 50,
      y: 700,
      size: 24,
      color: rgb(0, 0, 0),
      font: await pdfDoc.embedFont('Helvetica-Bold'),
    });

    // Ajouter le contenu
    const lines = splitTextIntoLines(content, 45);
    let yPosition = 650;
    
    for (const line of lines) {
      page.drawText(line, {
        x: 50,
        y: yPosition,
        size: 12,
        color: rgb(0, 0, 0),
        font: await pdfDoc.embedFont('Helvetica'),
      });
      yPosition -= 15;
      
      // Nouvelle page si on arrive en bas
      if (yPosition < 50) {
        const newPage = pdfDoc.addPage([550, 750]);
        yPosition = 700;
        newPage.drawText(line, {
          x: 50,
          y: yPosition,
          size: 12,
          color: rgb(0, 0, 0),
          font: await pdfDoc.embedFont('Helvetica'),
        });
        yPosition -= 15;
      }
    }

    // Ajouter le pied de page
    const pages = pdfDoc.getPages();
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      page.drawText(`Généré par Fpdf-vercel - Page ${i + 1}/${pages.length}`, {
        x: 50,
        y: 30,
        size: 8,
        color: rgb(0.5, 0.5, 0.5),
        font: await pdfDoc.embedFont('Helvetica'),
      });
    }

    // Sauvegarder le PDF
    const pdfBytes = await pdfDoc.save();
    const filename = `document_${Date.now()}.pdf`;
    const filepath = path.join(__dirname, '../uploads', filename);
    
    fs.writeFileSync(filepath, pdfBytes);

    // Retourner le lien
    const publicUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}/uploads/${filename}`
      : `/uploads/${filename}`;

    res.json({
      success: true,
      filename,
      url: publicUrl,
      path: `/uploads/${filename}`
    });
  } catch (error) {
    console.error('Erreur lors de la génération du PDF:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la génération du PDF',
      details: error.message
    });
  }
});

// Route pour lire un PDF (métadonnées)
app.get('/api/read-pdf/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const filepath = path.join(__dirname, '../uploads', filename);
    
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ success: false, error: 'Fichier non trouvé' });
    }

    // Lire le fichier PDF
    const pdfBytes = fs.readFileSync(filepath);
    const pdfDoc = await PDFDocument.load(pdfBytes);

    res.json({
      success: true,
      filename,
      pages: pdfDoc.getPageCount(),
      size: fs.statSync(filepath).size,
      url: `/uploads/${filename}`
    });
  } catch (error) {
    console.error('Erreur lors de la lecture du PDF:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la lecture du PDF',
      details: error.message
    });
  }
});

// Route pour lister les PDF
app.get('/api/list-pdf', (req, res) => {
  try {
    const uploadDir = path.join(__dirname, '../uploads');
    const files = fs.readdirSync(uploadDir);
    
    const pdfFiles = files.filter(file => file.endsWith('.pdf')).map(file => ({
      filename: file,
      url: `/uploads/${file}`,
      size: fs.statSync(path.join(uploadDir, file)).size
    }));

    res.json({ success: true, files: pdfFiles });
  } catch (error) {
    res.json({ success: true, files: [] });
  }
});

// Route pour servir les fichiers uploadés
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Fonction utilitaire pour diviser le texte en lignes
function splitTextIntoLines(text, maxChars) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';

  for (const word of words) {
    if (currentLine.length + word.length + 1 <= maxChars) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

// Démarrer le serveur
app.listen(port, () => {
  console.log(`Serveur démarré sur le port ${port}`);
});

module.exports = app;
