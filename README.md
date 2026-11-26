# Synapse — Portal de Precios de Referencia del INE

[![React](https://img.shields.io/badge/React-19-149eca?logo=react&logoColor=white)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-7-646cff?logo=vite&logoColor=white)](https://vite.dev/)

**Synapse** es un prototipo funcional para consultar precios de referencia y digitalizar la gestión de solicitudes de investigación de precios del Instituto Nacional de Estadística (INE) de Guatemala.

**Demostración en línea:** [synapse.realiquezisaac.workers.dev](https://synapse.realiquezisaac.workers.dev/)

> **Antes de probar la demo:** La API puede suspenderse tras un período de inactividad. Por eso, la primera solicitud puede tardar hasta un minuto mientras el sistema se reactiva; espere y vuelva a cargar la página si es necesario.
>
> **Correo electrónico:** El proveedor bloqueó temporalmente el envío por motivos de seguridad, así que los correos no están funcionando en la demo. En pruebas comprobamos que el sistema sí puede enviarlos cuando SMTP está configurado. Para habilitarlo, el equipo del INE o el cliente debe configurar las variables de entorno SMTP del backend.

## Problema y propuesta de valor

La consulta de precios de referencia y el seguimiento de las solicitudes de investigación requieren información accesible, trazable y organizada por rol. Synapse concentra estos procesos en una interfaz web: permite consultar el catálogo público de precios de referencia, solicitar investigaciones y dar seguimiento a los expedientes generados.

La solución está dirigida a:

- Entidades públicas solicitantes que requieren precios de referencia.
- Personal del INE: administración, jefaturas y analistas.
- Proveedores que actualizan su catálogo y precios vigentes.

El portal facilita la consulta y la gestión operativa; no sustituye el criterio técnico del INE ni calcula o declara automáticamente un precio oficial.

## Avance funcional

| Área | Funcionalidades implementadas |
|---|---|
| Consulta pública | Búsqueda del catálogo por texto, producto, categoría, NOG y fecha; listado paginado, filtros, indicadores y visualizaciones descriptivas. |
| Publicación de precios | Consulta de renglones, categorías, precios de referencia, fechas de publicación y vigencias provenientes de la API. |
| Solicitudes | Registro de cuenta, inicio de sesión, creación de solicitudes de precio, carga de documentos PDF y consulta del historial personal. |
| Gestión interna | Bandeja de expedientes para jefatura y analistas, asignación de responsables, seguimiento por etapas, boletas de investigación, análisis, informe y entrega. |
| Proveedores | Catálogo propio de productos, altas, edición, historial, confirmación y vigencia semestral de precios. |
| Administración | Gestión de usuarios e invitaciones, revisión de cuentas, actividad y vistas administrativas protegidas por rol. |
| Experiencia de uso | Diseño adaptable a móvil y escritorio, menús accesibles, estados de carga y recorridos guiados para los principales perfiles. |

## Conjuntos de datos utilizados

| Conjunto | Uso en Synapse | Fuente y fecha de descarga |
|---|---|---|
| Catálogo oficial de precios de referencia del INE, formato Excel | Fuente principal de las consultas de productos y precios de referencia publicadas en el portal. | [Instituto Nacional de Estadística de Guatemala](https://www.ine.gob.gt/). Archivo descargado el **23 de noviembre de 2026**. |
| Registros de evaluación | Cuentas y expedientes sintéticos para demostrar los flujos y permisos de los distintos roles. | Base de evaluación del proyecto; no representan personas, instituciones ni empresas reales. |

Los resultados se muestran como referencias de consulta. La interpretación de los precios, modalidades y vigencias corresponde a las definiciones y metadatos de la publicación del INE.

## Arquitectura

```text
Usuario
  │
  ▼
Frontend React + Vite
  │  Interfaz, rutas, formularios, sesiones y visualizaciones
  ▼
Cloudflare Workers + Static Assets
  │  Publica la aplicación y reenvía /api/*
  ▼
API NestJS
  │  Autenticación, reglas de negocio, catálogo y expedientes
  ▼
PostgreSQL + Prisma
  └─ Catálogo de precios, usuarios, solicitudes y trazabilidad
```

En producción, el Worker sirve la aplicación de página única y reenvía las solicitudes `/api/*` a la API. Este diseño mantiene la interfaz y la API bajo el mismo origen, permitiendo el uso de cookies de sesión con protección CSRF.

## Tecnologías

| Tecnología | Uso |
|---|---|
| React 19 | Construcción de la interfaz basada en componentes. |
| Vite 7 | Entorno de desarrollo y compilación del frontend. |
| React Router 7 | Navegación y protección de rutas por rol. |
| Driver.js | Recorridos guiados dentro de la aplicación. |
| Cloudflare Workers y Static Assets | Despliegue del frontend y proxy de las rutas API. |
| NestJS, PostgreSQL y Prisma | API, persistencia y reglas de negocio del proyecto. |

Las dependencias de JavaScript se encuentran declaradas y fijadas en `package.json` y `package-lock.json`.

## Instalación y ejecución local

### Requisitos

- Node.js 20 o superior.
- npm 10 o superior.
- Una instancia de la API de Synapse en ejecución. Por defecto, el frontend consulta `http://localhost:3000`.

### Pasos

```powershell
git clone <URL-DEL-REPOSITORIO>
cd Frontend-Synapse
npm ci
Copy-Item .env.example .env
npm run dev
```

Vite inicia la aplicación en `http://localhost:5173`.

### Variables de entorno

El archivo `.env.example` contiene las variables públicas utilizadas por el frontend:

```dotenv
# API de Synapse para desarrollo local
VITE_API_URL=http://localhost:3000

# Clave pública de Cloudflare Turnstile; vacía usa la clave de pruebas
VITE_TURNSTILE_SITE_KEY=
```

Las variables con el prefijo `VITE_` se incorporan al cliente durante la compilación; por ello, el archivo no contiene contraseñas, cadenas de conexión ni claves privadas.

## Uso de la aplicación

1. Abra la página principal para consultar el resumen del catálogo y realizar búsquedas rápidas.
2. Visite **Lista de precios** para filtrar renglones por producto, categoría, NOG o fecha.
3. Registre una cuenta de entidad solicitante e ingrese para crear una solicitud de precios.
4. Según el perfil asignado, acceda a **Mis solicitudes**, **Mis productos**, **Personal** o **Administración** desde el menú de cuenta.
5. Utilice el botón **Tutorial** disponible en las vistas operativas para recorrer las acciones principales de cada perfil.

## Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Inicia el servidor de desarrollo de Vite. |
| `npm run build` | Genera la versión de producción en `dist/`. |
| `npm run preview` | Sirve localmente la compilación de producción. |
| `npm run catalogo:limpiar` | Normaliza el archivo de categorías y genera el catálogo utilizado por la interfaz. |

Para comprobar la compilación de producción:

```powershell
npm run build
npm run preview
```

## Despliegue

El frontend se publica en Cloudflare Workers con Static Assets. La configuración de [wrangler.jsonc](wrangler.jsonc) mantiene el comportamiento de aplicación de página única y dirige las rutas `/api/*` al Worker.

```powershell
npm ci
npm run build
npx wrangler login
npx wrangler deploy
```

El Worker de producción reenvía las solicitudes API al servicio desplegado de Synapse. No se almacenan credenciales en este repositorio.

## Seguridad y uso responsable de datos

- El frontend utiliza rutas protegidas por sesión y envía un token CSRF en las operaciones que modifican información.
- La interfaz no recopila ni procesa datos para identificar personas, hogares o empresas a partir del catálogo público del INE.
- Los datos de demostración usan cuentas con dominios reservados `.invalid` y no corresponden a usuarios reales.
- La información publicada se presenta como referencia; las decisiones y validaciones de precios permanecen bajo responsabilidad del personal autorizado del INE.

## Limitaciones de la demostración

- La demostración depende de servicios con planes gratuitos, por lo que su disponibilidad y tiempo de respuesta pueden variar.
- La integración de Turnstile utiliza una clave de pruebas en el entorno de demostración.
- Los archivos adjuntos de la demostración no cuentan con almacenamiento persistente de producción, por lo que pueden no conservarse después de reinicios del servicio.

## Uso de inteligencia artificial generativa

Durante el desarrollo se utilizaron asistentes de inteligencia artificial generativa como apoyo para tareas de programación, documentación y revisión. El equipo revisó e integró el código resultante y puede explicar la arquitectura, los flujos y las decisiones implementadas.

## Licencias y atribución

Los datos de referencia pertenecen a sus fuentes institucionales. Se reconoce al **Instituto Nacional de Estadística de Guatemala** como fuente principal del catálogo utilizado. Las bibliotecas de terceros conservan sus respectivas licencias, detalladas en sus paquetes de npm.
