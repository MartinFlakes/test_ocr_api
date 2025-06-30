# OCR a Excel - Extractor de Tablas

Una aplicación web simple que utiliza OCR (Reconocimiento Óptico de Caracteres) para extraer texto de imágenes y convertir tablas a archivos Excel.

## 🚀 Características

- ✅ Extracción de texto desde imágenes (JPG, PNG, GIF, BMP, TIFF)
- ✅ Soporte para múltiples idiomas (Español, Inglés, Francés, Alemán, Italiano, Portugués)
- ✅ Conversión automática a formato Excel (.xlsx)
- ✅ Vista previa de imagen seleccionada
- ✅ Interfaz moderna con Bootstrap
- ✅ Validación de archivos y errores

## 🛠️ Instalación

1. **Clona o descarga el proyecto**
2. **Configura tu API key:**
   - Copia el archivo `config.js.example` a `config.js`
   - Obtén una API key gratuita en [OCR.space](https://ocr.space/ocrapi)
   - Edita `config.js` y reemplaza `'***'` con tu API key real

3. **Ejecuta un servidor web local:**
   ```bash
   # Opción 1: Con Python 3
   python -m http.server 8000
   
   # Opción 2: Con Node.js (si tienes npx)
   npx http-server
   
   # Opción 3: Con cualquier otro servidor web
   ```

4. **Abre tu navegador en:**
   ```
   http://localhost:8000
   ```

## 📝 Uso

1. Selecciona una imagen que contenga una tabla
2. Elige el idioma del texto
3. Haz clic en "Extraer tabla y generar Excel"
4. El archivo Excel se descargará automáticamente

## ⚙️ Configuración

### API Key (config.js)
```javascript
const apiKey = 'TU_API_KEY_AQUI';
export { apiKey };
```

### Limitaciones de la API gratuita
- Máximo 1MB por archivo
- 25,000 solicitudes por mes
- Sin soporte comercial

## 🗂️ Estructura del proyecto

```
├── index.html          # Interfaz principal
├── main.js            # Lógica de la aplicación
├── config.js          # Configuración de API key
├── config.js.example  # Plantilla de configuración
├── .gitignore         # Archivos ignorados por Git
└── README.md          # Documentación
```

## 🔧 Tecnologías utilizadas

- **Frontend:** HTML5, CSS3 (Bootstrap 5), JavaScript ES6+
- **API:** OCR.space API
- **Excel:** SheetJS (xlsx library)
- **Servidor:** Cualquier servidor web estático

## 📋 Requisitos

- Navegador web moderno con soporte para ES6 modules
- Conexión a internet para:
  - Librerías CDN (Bootstrap, jQuery, XLSX)
  - API de OCR.space
- Servidor web local (por restricciones de módulos ES6)

## 🚨 Notas importantes

- **Seguridad:** La API key será visible en el código del frontend
- **Privacidad:** Las imágenes se envían a los servidores de OCR.space
- **Limitaciones:** La precisión depende de la calidad de la imagen

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Consulta el archivo LICENSE para más detalles.

## 🔗 Enlaces útiles

- [OCR.space API Documentation](https://ocr.space/ocrapi)
- [SheetJS Documentation](https://sheetjs.com/)
- [Bootstrap Documentation](https://getbootstrap.com/docs/5.3/getting-started/introduction/)
