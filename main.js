import { apiKey } from './config.js';

// Validar que la API key esté configurada
if (!apiKey || apiKey === '***' || apiKey.length < 10) {
    document.addEventListener('DOMContentLoaded', () => {
        document.getElementById("result").innerHTML = 
            "<div class='alert alert-danger'>⚠️ Por favor, configura tu API key en el archivo config.js</div>";
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById("ocrForm");
    const fileInput = document.getElementById("fileInput");
    const submitBtn = document.getElementById("submitBtn");
    const buttonText = document.getElementById("buttonText");
    const spinner = document.getElementById("spinner");
    const resultDiv = document.getElementById("result");
    const previewDiv = document.getElementById("preview");

    // Preview del archivo seleccionado
    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                previewDiv.innerHTML = `
                    <div class="mt-3">
                        <h6>Vista previa:</h6>
                        <img src="${e.target.result}" class="img-fluid" style="max-height: 300px; border: 1px solid #ddd; border-radius: 4px;">
                    </div>
                `;
            };
            reader.readAsDataURL(file);
        } else {
            previewDiv.innerHTML = '';
        }
    });

    form.addEventListener("submit", async function (e) {
        e.preventDefault();
        
        const file = fileInput.files[0];
        if (!file) {
            showResult("Por favor, selecciona un archivo.", "danger");
            return;
        }

        // Validar tamaño del archivo (máximo 1MB para la API gratuita)
        if (file.size > 1024 * 1024) {
            showResult("El archivo es demasiado grande. El tamaño máximo es 1MB.", "danger");
            return;
        }

        setLoading(true);

        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("language", document.getElementById("languageSelect").value);
            formData.append("isOverlayRequired", "false");
            formData.append("isTable", document.getElementById("isTableCheck").checked.toString());
            formData.append("OCREngine", "2");
            formData.append("apikey", apiKey);

            showResult("Procesando imagen... Por favor espera.", "info");

            const response = await fetch("https://api.ocr.space/parse/image", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const data = await response.json();
            console.log("Respuesta completa:", data);

            if (data.IsErroredOnProcessing) {
                throw new Error(data.ErrorMessage || "Error al procesar la imagen");
            }

            const parsedText = data?.ParsedResults?.[0]?.ParsedText;

            if (!parsedText || parsedText.trim() === "") {
                showResult("No se pudo extraer texto de la imagen. Intenta con una imagen más clara o de mejor calidad.", "warning");
                return;
            }

            // Mostrar el texto extraído completo
            showExtractedText(parsedText);

            // Procesar y generar Excel solo con las tablas detectadas
            processAndGenerateExcel(parsedText);

        } catch (error) {
            console.error("Error:", error);
            showResult(`Error: ${error.message}`, "danger");
        } finally {
            setLoading(false);
        }
    });

    function setLoading(isLoading) {
        submitBtn.disabled = isLoading;
        if (isLoading) {
            buttonText.textContent = "Procesando...";
            spinner.classList.remove("d-none");
        } else {
            buttonText.textContent = "Extraer tabla y generar Excel";
            spinner.classList.add("d-none");
        }
    }

    function showResult(message, type) {
        resultDiv.innerHTML = `<div class='alert alert-${type}'>${message}</div>`;
    }

    function showExtractedText(text) {
        const textPreview = text.length > 500 ? text.substring(0, 500) + "..." : text;
        resultDiv.innerHTML = `
            <div class='alert alert-info'>
                <h6>Texto extraído completo:</h6>
                <pre style="white-space: pre-wrap; max-height: 200px; overflow-y: auto; font-size: 12px;">${textPreview}</pre>
                ${text.length > 500 ? '<small class="text-muted">Texto truncado para vista previa</small>' : ''}
            </div>
        `;
    }

    function showTablePreview(tableLines) {
        const previewText = tableLines.slice(0, 10).join('\n'); // Mostrar solo las primeras 10 líneas
        const currentContent = resultDiv.innerHTML;
        resultDiv.innerHTML = currentContent + `
            <div class='alert alert-warning mt-2'>
                <h6>Texto detectado como tabla:</h6>
                <pre style="white-space: pre-wrap; max-height: 150px; overflow-y: auto; font-size: 12px; background: #f8f9fa; padding: 10px; border-radius: 4px;">${previewText}</pre>
                ${tableLines.length > 10 ? `<small class="text-muted">Mostrando 10 de ${tableLines.length} líneas detectadas</small>` : ''}
            </div>
        `;
    }

    function processAndGenerateExcel(parsedText) {
        try {
            // Limpiar y dividir el texto en líneas
            const lines = parsedText
                .trim()
                .split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0);

            if (lines.length === 0) {
                showResult("No se encontraron datos para procesar.", "warning");
                return;
            }

            // Detectar y extraer solo las líneas que parecen ser parte de una tabla
            const tableLines = detectTableLines(lines);

            if (tableLines.length === 0) {
                showResult("No se detectaron tablas en el texto extraído. Asegúrate de que la imagen contenga una tabla clara.", "warning");
                return;
            }

            // Mostrar vista previa del contenido detectado como tabla
            showTablePreview(tableLines);

            let tableData = [];

            // Procesar las líneas de tabla detectadas
            tableData = tableLines.map(line => {
                // Intentar diferentes tipos de separadores
                if (line.includes('\t')) {
                    return line.split('\t').map(cell => cell.trim());
                } else if (/\s{2,}/.test(line)) {
                    return line.split(/\s{2,}/).map(cell => cell.trim());
                } else if (/\|/.test(line)) {
                    return line.split('|').map(cell => cell.trim()).filter(cell => cell !== '');
                } else {
                    // Para líneas con separación menos clara, intentar detectar columnas por patrones
                    return splitByPattern(line);
                }
            });

            // Filtrar filas vacías y normalizar el número de columnas
            tableData = normalizeTableData(tableData);

            if (tableData.length === 0) {
                showResult("No se pudo estructurar la información como tabla válida.", "warning");
                return;
            }

            // Crear el archivo Excel
            const worksheet = XLSX.utils.aoa_to_sheet(tableData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Datos_OCR");

            // Generar nombre de archivo con timestamp
            const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
            const filename = `tabla_extraida_${timestamp}.xlsx`;

            XLSX.writeFile(workbook, filename);

            showResult(`
                <div class='alert alert-success'>
                    <h6>¡Excel generado correctamente!</h6>
                    <p>Archivo descargado: <strong>${filename}</strong></p>
                    <p>Filas procesadas: <strong>${tableData.length}</strong></p>
                    <p>Columnas detectadas: <strong>${Math.max(...tableData.map(row => row.length))}</strong></p>
                </div>
            `, "success");

        } catch (error) {
            console.error("Error al generar Excel:", error);
            showResult("Error al generar el archivo Excel. Intenta de nuevo.", "danger");
        }
    }

    function detectTableLines(lines) {
        const tableLines = [];
        let consecutiveTableLines = 0;
        const minConsecutiveLines = 2; // Mínimo de líneas consecutivas para considerar una tabla

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // Criterios para detectar si una línea pertenece a una tabla:
            const hasMultipleColumns = /\t/.test(line) || /\s{2,}/.test(line) || /\|/.test(line);
            const hasNumbers = /\d/.test(line);
            const hasTabularPattern = /^\s*[A-Za-z0-9\s]+\s{2,}[A-Za-z0-9\s]+/.test(line);
            const isShortLine = line.length < 200; // Evitar párrafos largos
            const hasRepeatedStructure = checkRepeatedStructure(line, lines, i);
            
            // Evitar líneas que claramente son párrafos de texto
            const isParagraph = line.length > 150 && !hasMultipleColumns;
            const isTitle = /^[A-Z\s]+$/.test(line) && line.length < 50;
            const isSingleWord = line.split(/\s+/).length === 1;
            
            if ((hasMultipleColumns || (hasTabularPattern && hasNumbers && isShortLine) || hasRepeatedStructure) 
                && !isParagraph && !isTitle && !isSingleWord) {
                
                tableLines.push(line);
                consecutiveTableLines++;
            } else {
                // Si encontramos una secuencia de líneas de tabla, las mantenemos
                if (consecutiveTableLines >= minConsecutiveLines) {
                    // Ya están agregadas las líneas anteriores
                }
                consecutiveTableLines = 0;
            }
        }

        return tableLines;
    }

    function checkRepeatedStructure(currentLine, allLines, currentIndex) {
        // Verificar si la línea actual tiene una estructura similar a líneas cercanas
        const pattern = currentLine.replace(/[0-9]/g, 'N').replace(/[a-zA-Z]/g, 'A');
        let similarLines = 0;
        
        for (let i = Math.max(0, currentIndex - 3); i <= Math.min(allLines.length - 1, currentIndex + 3); i++) {
            if (i === currentIndex) continue;
            const comparePattern = allLines[i].replace(/[0-9]/g, 'N').replace(/[a-zA-Z]/g, 'A');
            if (pattern === comparePattern || calculateSimilarity(pattern, comparePattern) > 0.7) {
                similarLines++;
            }
        }
        
        return similarLines >= 1;
    }

    function calculateSimilarity(str1, str2) {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
        if (longer.length === 0) return 1.0;
        return (longer.length - editDistance(longer, shorter)) / longer.length;
    }

    function editDistance(str1, str2) {
        const matrix = [];
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        return matrix[str2.length][str1.length];
    }

    function splitByPattern(line) {
        // Intentar detectar columnas por patrones comunes
        const words = line.split(/\s+/).filter(word => word.length > 0);
        
        // Si hay números, intentar agrupar por posición
        if (words.some(word => /^\d+([.,]\d+)?$/.test(word))) {
            const result = [];
            let currentGroup = [];
            
            for (const word of words) {
                if (/^\d+([.,]\d+)?$/.test(word) && currentGroup.length > 0) {
                    result.push(currentGroup.join(' '));
                    currentGroup = [word];
                } else {
                    currentGroup.push(word);
                }
            }
            
            if (currentGroup.length > 0) {
                result.push(currentGroup.join(' '));
            }
            
            return result.length > 1 ? result : [line];
        }
        
        return [line];
    }

    function normalizeTableData(tableData) {
        // Filtrar filas vacías
        const filtered = tableData.filter(row => 
            row.length > 0 && 
            row.some(cell => cell.trim() !== '') &&
            row.length > 1 // Al menos 2 columnas
        );

        if (filtered.length === 0) return [];

        // Encontrar el número máximo de columnas
        const maxColumns = Math.max(...filtered.map(row => row.length));

        // Normalizar todas las filas al mismo número de columnas
        return filtered.map(row => {
            const normalized = [...row];
            while (normalized.length < maxColumns) {
                normalized.push('');
            }
            return normalized.slice(0, maxColumns);
        });
    }
});
