# EternalMazesRPG

EternalMazesRPG es un juego de estilo RPG basado en la estructura de RPG Maker MV, con recursos y datos del juego alojados en la carpeta `www`.

## Descripción del juego

El proyecto está compuesto por:

- `www/index.html`: entrada principal de la aplicación web.
- `www/js/`: scripts del motor y lógica del juego.
- `www/data/`: archivos de configuración, mapas, actores, enemigos, habilidades y sistema del juego.
- `www/img/`: gráficos del juego.
- `www/audio/`: música y efectos de sonido.
- `www/Game.rpgproject`: proyecto RPG Maker utilizado para el desarrollo del contenido.

La aplicación se ejecuta como una web app y luego se empaqueta para Android mediante Cordova.

## Tecnologías utilizadas

- Apache Cordova
- HTML, JavaScript y CSS
- RPG Maker MV / RPG Maker compatible project structure
- Android platform support

<img width="1551" height="873" alt="image" src="https://github.com/user-attachments/assets/1fa1f491-66f4-4b64-81f0-f56c8a3ede8f" />


## Estructura principal

```text
www/
├── index.html
├── Game.rpgproject
├── data/
├── js/
├── img/
├── audio/
└── fonts/
```

## Requisitos

Antes de compilar para Android, asegúrate de tener instalado:

- Node.js
- npm
- Java JDK
- Android SDK
- Apache Cordova CLI

## Instalar dependencias

```bash
npm install
```

## Agregar la plataforma Android

```bash
npx cordova platform add android
```

## Compilar la aplicación Android

```bash
npx cordova build android
```

## Ejecutar en un emulador o dispositivo

```bash
npx cordova run android
```

## Comandos útiles

### Verificar versión de Cordova

```bash
npx cordova --version
```

### Limpiar la plataforma Android

```bash
npx cordova clean android
```

### Reinstalar la plataforma Android

```bash
npx cordova platform remove android
npx cordova platform add android
```

## Nota

El proyecto ya está configurado para Android en el archivo `package.json` y `config.xml`, por lo que la compilación se basa en la plataforma Android habilitada por Cordova.
