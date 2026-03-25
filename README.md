# Mini Portfolio

Este es un mini proyecto de portafolio personal que incluye una estructura básica de sitio web utilizando HTML, CSS y JavaScript. El objetivo de este proyecto es demostrar habilidades en la creación de sitios web accesibles, estilizados y dinámicos.

## Estructura del Proyecto

El proyecto tiene la siguiente estructura de archivos:

```
mini-portfolio
├── src
│   ├── index.html              # Estructura básica del sitio web
│   ├── styles.css              # Estilos compartidos
│   ├── script.js               # Interactividad del sitio web
│   ├── contract-reader.html    # Agente lector de contratos PDF
│   ├── contract-reader.css     # Estilos del agente lector
│   └── contract-reader.js      # Lógica de extracción de información
├── images/                     # Imágenes del portafolio
├── .gitignore
└── README.md
```

## Descripción de Archivos

- **index.html**: Estructura del sitio web del portafolio con navegación a proyectos.

- **styles.css**: Estilos globales del sitio.

- **script.js**: Código JavaScript para la interactividad del portafolio.

- **contract-reader.html**: Página del agente lector de contratos PDF.

- **contract-reader.css**: Estilos específicos del agente lector.

- **contract-reader.js**: Lógica de extracción de información de contratos PDF.

## Agente Lector de Contratos PDF

Este agente permite cargar un contrato en formato PDF y extraer automáticamente la siguiente información:

| Campo                  | Descripción                                                      |
|------------------------|------------------------------------------------------------------|
| **Partes Involucradas** | Contratante, contratado, empleador, vendedor, etc.              |
| **Fechas Clave**        | Fechas de inicio, vencimiento y otras relevantes                |
| **Montos y Valores**    | Precios, honorarios, sumas de dinero mencionadas                |
| **Obligaciones**        | Cláusulas y obligaciones principales                            |
| **Duración y Vigencia** | Plazo y período de validez del contrato                         |
| **Tipo de Contrato**    | Clasificación automática (arrendamiento, laboral, compraventa…) |

### Cómo funciona

1. El usuario sube un archivo PDF (o lo arrastra al área de carga).
2. La librería [PDF.js](https://mozilla.github.io/pdf.js/) extrae el texto de cada página del documento.
3. Expresiones regulares especializadas en contratos en español analizan el texto y detectan entidades relevantes.
4. El resultado se muestra en tarjetas organizadas por categoría.

### Uso

1. Abre `index.html` en tu navegador.
2. En la sección **Proyectos**, haz clic en **Ver Agente →** del proyecto *Agente Lector de Contratos PDF*.
3. Sube tu contrato en PDF y haz clic en **Analizar Contrato**.

## Instrucciones de Instalación

1. Clona este repositorio en tu máquina local:
   ```
   git clone <url-del-repositorio>
   ```

2. Navega al directorio del proyecto:
   ```
   cd mini-portfolio
   ```

3. Abre el archivo `index.html` en tu navegador para ver el portafolio en acción.

## Contribuciones

Las contribuciones son bienvenidas. Si deseas mejorar este proyecto, por favor abre un issue o envía un pull request.

## Licencia

Este proyecto está bajo la Licencia MIT.
