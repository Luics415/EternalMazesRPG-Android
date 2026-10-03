# EternalMazesRPG Android

<p align="center">
  <img src="https://img.shields.io/badge/Platform-Android-3DDC84?style=for-the-badge&logo=android&logoColor=white" alt="Android" />
  <img src="https://img.shields.io/badge/Engine-Cordova_%2F_WebView-E8E8E8?style=for-the-badge&logo=apachecordova&logoColor=black" alt="Cordova" />
  <img src="https://img.shields.io/badge/Language-JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License" />
</p>

Adaptación y empaquetado móvil para **Android** del videojuego de rol **Eternal Mazes RPG**, optimizado para ejecución sobre WebView acelerado por hardware mediante Apache Cordova.

<p align="center">
  <img width="800" alt="Vista previa del juego" src="https://github.com/user-attachments/assets/1fa1f491-66f4-4b64-81f0-f56c8a3ede8f" />
</p>

---

## 📱 Características Móviles

* **Controles Táctiles Adaptados:** Interfaz con soporte nativo de gestos táctiles, botones virtuales en pantalla e interacción por toques para movimiento y combate.
* **Aceleración por Hardware:** Renderizado Canvas/WebGL configurado mediante `config.xml` para mantener fluidez constante a 60 FPS en dispositivos móviles.
* **Audio y Assets Optimizados:** Compresión y precarga de archivos de sonido (`.ogg` / `.m4a`) y mapas (`.json`) para reducir latencia de carga en memoria flash de smartphones.

---

## 🏛️ Estructura del Repositorio

```text
EternalMazesRPG-Android/
├── config.xml              # Manifiesto y configuración de plataforma Cordova / Android
├── package.json            # Metadatos de empaquetado y plugins móviles
├── www/                    # Motor web del videojuego
│   ├── index.html          # Punto de entrada de la aplicación
│   ├── js/                 # Scripts del motor RPG y plugins móviles
│   ├── data/               # Archivos JSON de mapas, enemigos y habilidades
│   ├── img/                # Gráficos, tilesets y sprites optimizados
│   └── audio/              # Efectos de sonido y música de fondo
├── platforms/android/      # Proyecto nativo Gradle / Android Studio generado
└── plugins/                # Plugins nativos (pantalla completa, control de orientación, splashscreen)
```

---

## 🛠️ Requisitos y Compilación

### Requisitos:
* [Node.js](https://nodejs.org/) (v18 o v20 LTS).
* [Apache Cordova CLI](https://cordova.apache.org/): `npm install -g cordova`
* [Android SDK](https://developer.android.com/studio) (API 33+) y Java JDK 17.

### Pasos para compilar APK:
```powershell
# 1. Instalar dependencias
npm install

# 2. Agregar plataforma Android si no está vinculada
npx cordova platform add android

# 3. Compilar APK en modo Release
npx cordova build android --release
```

### Comandos útiles de mantenimiento:
```bash
# Limpiar y reconstruir plataforma
npx cordova clean android
npx cordova platform remove android
npx cordova platform add android
```

---

## 📸 Evidencia Visual & Capturas de Pantalla

<p align="center">
  <img width="700" alt="Captura de juego en Android 1" src="https://github.com/user-attachments/assets/14e85b2c-ec13-4a42-aea2-83e6ad146103" />
  <br/><br/>
  <img width="700" alt="Captura de juego en Android 2" src="https://github.com/user-attachments/assets/ad78f784-8284-4e2e-9505-355e36811928" />
</p>

---

## 📄 Licencia

Este proyecto está distribuido bajo la Licencia [MIT](LICENSE).
