// Contract Reader Agent
// Reads PDF contracts and extracts key information using PDF.js

(function () {
    'use strict';

    // ── PDF.js worker setup ──────────────────────────────────────────────────
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'vendor/pdfjs/pdf.worker.min.js';

    // ── DOM references ───────────────────────────────────────────────────────
    const pdfInput       = document.getElementById('pdf-input');
    const uploadArea     = document.getElementById('upload-area');
    const fileNameEl     = document.getElementById('file-name');
    const analyzeBtn     = document.getElementById('analyze-btn');
    const uploadSection  = document.getElementById('upload-section');
    const progressSection = document.getElementById('progress-section');
    const progressMsg    = document.getElementById('progress-message');
    const resultsSection = document.getElementById('results-section');
    const resetBtn       = document.getElementById('reset-btn');
    const toggleTextBtn  = document.getElementById('toggle-text-btn');
    const fullTextContainer = document.getElementById('full-text-container');
    const fullTextEl     = document.getElementById('full-text');

    let selectedFile = null;

    // ── File selection ───────────────────────────────────────────────────────
    pdfInput.addEventListener('change', () => {
        const file = pdfInput.files[0];
        if (file && file.type === 'application/pdf') {
            selectedFile = file;
            fileNameEl.textContent = `Archivo seleccionado: ${file.name}`;
            analyzeBtn.disabled = false;
        }
    });

    // Drag-and-drop support
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file && file.type === 'application/pdf') {
            selectedFile = file;
            fileNameEl.textContent = `Archivo seleccionado: ${file.name}`;
            analyzeBtn.disabled = false;
        } else {
            alert('Por favor, sube un archivo en formato PDF.');
        }
    });

    // Click on the label-styled upload area
    uploadArea.addEventListener('click', (e) => {
        if (e.target.tagName !== 'LABEL') {
            pdfInput.click();
        }
    });

    // ── Analyze button ───────────────────────────────────────────────────────
    analyzeBtn.addEventListener('click', () => {
        if (!selectedFile) return;
        showProgress('Leyendo el archivo PDF...');
        readPDF(selectedFile);
    });

    // ── Toggle full text ─────────────────────────────────────────────────────
    toggleTextBtn.addEventListener('click', () => {
        fullTextContainer.classList.toggle('hidden');
    });

    // ── Reset ────────────────────────────────────────────────────────────────
    resetBtn.addEventListener('click', () => {
        selectedFile = null;
        pdfInput.value = '';
        fileNameEl.textContent = '';
        analyzeBtn.disabled = true;
        resultsSection.classList.add('hidden');
        uploadSection.classList.remove('hidden');
        fullTextContainer.classList.add('hidden');
    });

    // ── UI helpers ───────────────────────────────────────────────────────────
    function showProgress(message) {
        uploadSection.classList.add('hidden');
        progressMsg.textContent = message;
        progressSection.classList.remove('hidden');
        resultsSection.classList.add('hidden');
    }

    function showResults() {
        progressSection.classList.add('hidden');
        resultsSection.classList.remove('hidden');
    }

    // ── PDF reading ──────────────────────────────────────────────────────────
    function readPDF(file) {
        const reader = new FileReader();
        reader.onload = function (event) {
            const typedArray = new Uint8Array(event.target.result);
            pdfjsLib.getDocument({ data: typedArray }).promise
                .then((pdfDoc) => extractText(pdfDoc))
                .catch((err) => {
                    console.error('Error al leer el PDF:', err);
                    alert('Error al procesar el PDF. Asegúrate de que el archivo no esté protegido con contraseña.');
                    resetBtn.click();
                });
        };
        reader.readAsArrayBuffer(file);
    }

    async function extractText(pdfDoc) {
        showProgress(`Extrayendo texto (0 / ${pdfDoc.numPages} páginas)...`);
        let fullText = '';

        for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
            progressMsg.textContent = `Extrayendo texto (${pageNum} / ${pdfDoc.numPages} páginas)...`;
            const page = await pdfDoc.getPage(pageNum);
            const content = await page.getTextContent();
            const pageText = content.items.map((item) => item.str).join(' ');
            fullText += pageText + '\n\n';
        }

        showProgress('Analizando información del contrato...');
        setTimeout(() => {
            analyzeContract(fullText.trim());
        }, 300);
    }

    // ── Information extraction ───────────────────────────────────────────────
    function analyzeContract(text) {
        fullTextEl.textContent = text;

        populateList('parties-list',     extractParties(text));
        populateList('dates-list',       extractDates(text));
        populateList('amounts-list',     extractAmounts(text));
        populateList('obligations-list', extractObligations(text));
        populateList('duration-list',    extractDuration(text));

        const contractType = detectContractType(text);
        document.getElementById('contract-type').textContent = contractType;

        showResults();
    }

    /** Populate a <ul> element with items, or show an "empty" message */
    function populateList(listId, items) {
        const ul = document.getElementById(listId);
        ul.innerHTML = '';
        if (items.length === 0) {
            ul.innerHTML = '<li class="empty">No identificado/a</li>';
            return;
        }
        items.forEach((item) => {
            const li = document.createElement('li');
            li.textContent = item;
            ul.appendChild(li);
        });
    }

    // ── Extraction patterns ──────────────────────────────────────────────────

    /** Extract parties (people / companies) from the contract text */
    function extractParties(text) {
        const parties = new Set();

        // Role labels commonly found at the start of a party clause
        const roleLabels = [
            'CONTRATANTE', 'CONTRATADO', 'EMPLEADOR', 'EMPLEADO',
            'ARRENDADOR', 'ARRENDATARIO', 'VENDEDOR', 'COMPRADOR',
            'PROVEEDOR', 'CLIENTE', 'PARTE\\s+\\w+',
        ].join('|');

        const patterns = [
            // "EL CONTRATANTE: Nombre Apellido" or similar role-label introductions
            new RegExp(
                '(?:El |La |Los |Las )?(?:' + roleLabels + ')[:\\s]+([^\\n,;.]{3,60})',
                'gi'
            ),
            // Party names enclosed in quotation marks after "denominado como"
            /(?:denominad[oa]\s+(?:en\s+adelante\s+)?(?:como\s+)?)["«»"]([^"«»"]{3,60})["«»"]/gi,
            // Proper names following "entre" or "suscrito por"
            /(?:entre\s+(?:nosotros\s+)?(?:los?\s+)?(?:señores?\s+)?|suscrito\s+(?:por\s+)?)([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){1,4})/g,
        ];

        patterns.forEach((re) => {
            let match;
            re.lastIndex = 0;
            while ((match = re.exec(text)) !== null && parties.size < 8) {
                const candidate = match[1].trim().replace(/\s+/g, ' ');
                if (candidate.length >= 3 && candidate.length <= 80) {
                    parties.add(candidate);
                }
            }
        });

        return Array.from(parties).slice(0, 6);
    }

    /** Extract dates from the contract text */
    function extractDates(text) {
        const dates = new Set();

        const datePatterns = [
            // dd/mm/yyyy or dd-mm-yyyy
            /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\b/g,
            // dd de <month> de yyyy
            /\b(\d{1,2}\s+de\s+(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s+de\s+\d{4})\b/gi,
            // <month> de yyyy
            /\b((?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s+de\s+\d{4})\b/gi,
            // yyyy-mm-dd
            /\b(\d{4}-\d{2}-\d{2})\b/g,
        ];

        datePatterns.forEach((re) => {
            let match;
            re.lastIndex = 0;
            while ((match = re.exec(text)) !== null && dates.size < 10) {
                dates.add(match[1].trim());
            }
        });

        return Array.from(dates).slice(0, 8);
    }

    /** Extract monetary amounts from the contract text */
    function extractAmounts(text) {
        const amounts = new Set();

        const amountPatterns = [
            // Currency symbols followed by numbers
            /(?:S\/\.?|USD|EUR|PEN|MXN|\$|€|£)\s*[\d,.']+(?:\.\d{2})?/gi,
            // Numbers followed by currency words
            /[\d,.']+(?:\.\d{2})?\s*(?:soles?|dólares?|euros?|pesos?)/gi,
            // Written amounts
            /(?:la\s+suma\s+de|el\s+monto\s+de|por\s+un\s+valor\s+de|precio\s+de)\s+[^,.;]{3,50}/gi,
        ];

        amountPatterns.forEach((re) => {
            let match;
            re.lastIndex = 0;
            while ((match = re.exec(text)) !== null && amounts.size < 8) {
                amounts.add(match[0].trim().replace(/\s+/g, ' '));
            }
        });

        return Array.from(amounts).slice(0, 6);
    }

    /** Extract key obligations mentioned in the contract */
    function extractObligations(text) {
        const obligations = [];

        // Verbs / phrases that introduce an obligation
        const obligationVerbs = [
            'se\\s+obliga(?:n)?\\s+a',
            'tiene(?:n)?\\s+la\\s+obligaci[oó]n\\s+de',
            'debe(?:n)?\\s+(?:de\\s+)?',
            'est[aá](?:n)?\\s+obligad[oa]s?\\s+a',
        ].join('|');

        // Clause ordinals in Spanish
        const ordinals = 'PRIMERO|SEGUNDO|TERCERO|CUARTO|QUINTO|SEXTO';

        const obligationPatterns = [
            // "se obliga a …" style obligation sentences
            new RegExp('(?:' + obligationVerbs + ')\\s+([^.;]{10,100})', 'gi'),
            // Numbered / named clause headings: "Cláusula 3: …"
            /(?:cl[aá]usula\s+(?:\w+\s+)?[\dIVXivx]+)[:\s.\-–]+([^.]{10,120})/gi,
            // Ordinal clause headings: "PRIMERO: …"
            new RegExp('(?:' + ordinals + ')[:\\s.\\-–]+([^.]{10,120})', 'g'),
        ];

        obligationPatterns.forEach((re) => {
            let match;
            re.lastIndex = 0;
            while ((match = re.exec(text)) !== null && obligations.length < 6) {
                const item = match[1].trim().replace(/\s+/g, ' ');
                if (item.length >= 10) {
                    obligations.push(item);
                }
            }
        });

        return obligations.slice(0, 5);
    }

    /** Extract duration / validity information */
    function extractDuration(text) {
        const items = new Set();

        const durationPatterns = [
            /(?:por\s+un\s+per[ií]odo\s+de|vigencia\s+de|duraci[oó]n\s+de|plazo\s+de)\s+([^,.;]{3,60})/gi,
            /(?:iniciar[aá]|iniciar[aá]\s+el|vigente\s+(?:a\s+partir\s+)?(?:del?|desde)?)[^,.;]{3,60}/gi,
            /\d+\s*(?:días?|meses?|años?|semanas?)[^,.;]{0,40}/gi,
        ];

        durationPatterns.forEach((re) => {
            let match;
            re.lastIndex = 0;
            while ((match = re.exec(text)) !== null && items.size < 4) {
                items.add(match[0].trim().replace(/\s+/g, ' '));
            }
        });

        return Array.from(items).slice(0, 4);
    }

    /** Detect the type of contract based on keywords */
    function detectContractType(text) {
        const lowerText = text.toLowerCase();

        const types = [
            { keywords: ['arrendamiento', 'arrendar', 'arriendo', 'inquilino', 'arrendatario'], label: 'Contrato de Arrendamiento' },
            { keywords: ['trabajo', 'laboral', 'empleado', 'empleador', 'salario', 'remuneración', 'jornada'], label: 'Contrato Laboral / de Trabajo' },
            { keywords: ['compraventa', 'compra-venta', 'vendedor', 'comprador', 'precio de venta'], label: 'Contrato de Compraventa' },
            { keywords: ['servicio', 'prestación de servicios', 'honorario', 'proveedor de servicios'], label: 'Contrato de Prestación de Servicios' },
            { keywords: ['préstamo', 'crédito', 'deudor', 'acreedor', 'interés', 'cuota'], label: 'Contrato de Préstamo / Crédito' },
            { keywords: ['sociedad', 'socio', 'capital social', 'participación'], label: 'Contrato de Sociedad' },
            { keywords: ['confidencialidad', 'nda', 'información confidencial', 'secreto comercial'], label: 'Acuerdo de Confidencialidad (NDA)' },
            { keywords: ['licencia', 'licenciar', 'uso del software', 'derechos de uso'], label: 'Contrato de Licencia' },
            { keywords: ['consultoría', 'consultor', 'asesoría'], label: 'Contrato de Consultoría' },
            { keywords: ['obra', 'construcción', 'contratista', 'subcontratista'], label: 'Contrato de Obra o Construcción' },
        ];

        for (const type of types) {
            if (type.keywords.some((kw) => lowerText.includes(kw))) {
                return type.label;
            }
        }

        return 'Contrato (tipo no identificado)';
    }
})();
