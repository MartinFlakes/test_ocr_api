import { apiKey } from './config.js';

document.getElementById("ocrForm").addEventListener("submit", async function (e) {
    e.preventDefault();
    const file = document.getElementById("fileInput").files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("language", "spa");
    formData.append("isOverlayRequired", "false");
    formData.append("isTable", "true");
    formData.append("OCREngine", "2");
    formData.append("apikey", apiKey);

    document.getElementById("result").innerHTML = "Procesando...";

    const response = await fetch("https://api.ocr.space/parse/image", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    console.log(data);
    const parsedText = data?.ParsedResults?.[0]?.ParsedText;

    if (!parsedText) {
      document.getElementById("result").innerHTML =
        "<div class='alert alert-danger'>No se pudo extraer texto.</div>";
      return;
    }

    const rows = parsedText
      .trim()
      .split("\n")
      .filter((r) => r.includes("\t") || r.includes("  "));
    const tableData = rows.map((r) => r.split(/\t+|\s{2,}/));

    const worksheet = XLSX.utils.aoa_to_sheet(tableData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "TablaOCR");

    XLSX.writeFile(workbook, "tabla_extraida.xlsx");

    document.getElementById("result").innerHTML =
      "<div class='alert alert-success'>¡Excel generado correctamente!</div>";
  });
