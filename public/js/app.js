// Variables globales
let currentPdf = null;
let currentPage = 1;
let totalPages = 1;
let zoom = 1.0;

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initPDFForm();
    initPDFReader();
    
    // Initialiser PDF.js
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js';
});

// Gestion des onglets
function initTabs() {
    const tabs = document.querySelectorAll('nav button');
    const sections = document.querySelectorAll('.section');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));
            
            tab.classList.add('active');
            const sectionId = tab.id.replace('-tab', '-section');
            document.getElementById(sectionId).classList.add('active');
            
            if (tab.id === 'read-tab') {
                resetPDFReader();
            }
        });
    });
}

// Gestion du formulaire de création de PDF
function initPDFForm() {
    const form = document.getElementById('pdf-form');
    const result = document.getElementById('generate-result');
    const submitBtn = form.querySelector('button[type="submit"]');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        submitBtn.classList.add('loading');
        result.style.display = 'none';
        
        const formData = {
            title: form.elements.title.value,
            content: form.elements.content.value,
            author: form.elements.author.value
        };
        
        try {
            const response = await fetch('/api/generate-pdf', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });
            
            const data = await response.json();
            
            if (data.success) {
                result.className = 'result success';
                result.innerHTML = `
                    <h3>✅ PDF généré avec succès !</h3>
                    <p>Votre PDF a été créé : <strong>${data.filename}</strong></p>
                    <p><a href="${data.url || data.path}" download>Télécharger le PDF</a></p>
                `;
                result.style.display = 'block';
                form.reset();
            } else {
                throw new Error(data.error || 'Erreur inconnue');
            }
        } catch (error) {
            result.className = 'result error';
            result.innerHTML = `
                <h3>❌ Erreur</h3>
                <p>${error.message}</p>
            `;
            result.style.display = 'block';
        } finally {
            submitBtn.classList.remove('loading');
        }
    });
}

// Gestion du lecteur de PDF
function initPDFReader() {
    const fileInput = document.getElementById('pdf-file');
    const uploadArea = document.getElementById('upload-area');
    const canvas = document.getElementById('pdf-canvas');
    const ctx = canvas.getContext('2d');
    const pageInfo = document.getElementById('page-info');
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');
    const zoomInBtn = document.getElementById('zoom-in');
    const zoomOutBtn = document.getElementById('zoom-out');
    const pdfText = document.getElementById('pdf-text');
    
    // Gestion du glisser-déposer
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => {
            uploadArea.classList.add('drag-over');
        }, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => {
            uploadArea.classList.remove('drag-over');
        }, false);
    });
    
    uploadArea.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    }, false);
    
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFiles(e.target.files);
        }
    });
    
    prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderPage(currentPdf, currentPage, canvas, ctx, zoom);
            updateControls();
        }
    });
    
    nextBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            renderPage(currentPdf, currentPage, canvas, ctx, zoom);
            updateControls();
        }
    });
    
    zoomInBtn.addEventListener('click', () => {
        zoom = Math.min(zoom + 0.25, 3.0);
        renderPage(currentPdf, currentPage, canvas, ctx, zoom);
    });
    
    zoomOutBtn.addEventListener('click', () => {
        zoom = Math.max(zoom - 0.25, 0.5);
        renderPage(currentPdf, currentPage, canvas, ctx, zoom);
    });
    
    function handleFiles(files) {
        const file = files[0];
        if (!file || !file.type.includes('pdf')) {
            alert('Veuillez sélectionner un fichier PDF');
            return;
        }
        
        const fileReader = new FileReader();
        fileReader.onload = async function() {
            try {
                const typedArray = new Uint8Array(this.result);
                await loadPDF(typedArray, file.name);
            } catch (error) {
                console.error('Erreur lors du chargement du PDF:', error);
                alert('Erreur lors du chargement du PDF');
            }
        };
        fileReader.readAsArrayBuffer(file);
    }
    
    async function loadPDF(data, filename) {
        if (currentPdf) {
            currentPdf.destroy();
        }
        
        currentPdf = await pdfjsLib.getDocument(data).promise;
        totalPages = currentPdf.numPages;
        currentPage = 1;
        zoom = 1.0;
        
        updateControls();
        renderPage(currentPdf, currentPage, canvas, ctx, zoom);
        
        const result = document.getElementById('read-result');
        result.className = 'result success';
        result.innerHTML = `
            <h3>📄 ${filename}</h3>
            <p>Pages: ${totalPages}</p>
        `;
        result.style.display = 'block';
        
        try {
            const page = await currentPdf.getPage(1);
            const textContent = await page.getTextContent();
            const text = textContent.items.map(item => item.str).join(' ');
            pdfText.textContent = text;
        } catch (error) {
            pdfText.textContent = 'Extraction de texte non disponible pour ce PDF.';
        }
    }
    
    function renderPage(pdf, pageNum, canvas, ctx, scale) {
        pdf.getPage(pageNum).then(function(page) {
            const viewport = page.getViewport({ scale: scale });
            
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            
            const renderContext = {
                canvasContext: ctx,
                viewport: viewport
            };
            
            page.render(renderContext).promise.then(function() {
                pageInfo.textContent = `Page ${pageNum} / ${totalPages}`;
            });
        });
    }
    
    function updateControls() {
        prevBtn.disabled = currentPage <= 1;
        nextBtn.disabled = currentPage >= totalPages;
        pageInfo.textContent = `Page ${currentPage} / ${totalPages}`;
    }
}

// Réinitialiser le lecteur de PDF
function resetPDFReader() {
    const canvas = document.getElementById('pdf-canvas');
    const ctx = canvas.getContext('2d');
    const pdfText = document.getElementById('pdf-text');
    const result = document.getElementById('read-result');
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas.width = 0;
    canvas.height = 0;
    
    if (currentPdf) {
        currentPdf.destroy();
        currentPdf = null;
    }
    currentPage = 1;
    totalPages = 1;
    zoom = 1.0;
    
    pdfText.textContent = '';
    result.style.display = 'none';
    
    document.getElementById('page-info').textContent = 'Page 1 / 1';
    document.getElementById('prev-page').disabled = true;
    document.getElementById('next-page').disabled = true;
    
    document.getElementById('pdf-file').value = '';
}
