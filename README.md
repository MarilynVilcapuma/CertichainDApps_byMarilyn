# CertiChain Perú

DApp de certificados verificables en blockchain. Proyecto de Innovación Blockchain (PIB) del Instituto Valle Grande.

**Stack:** Svelte 5 + Vite + JavaScript · Tailwind CSS 4 · ethers v6 · Font Awesome (iconos).

## Desarrollo

```bash
npm install
npm run dev
```

Copia `.env.example` a `.env` y completa `VITE_ETHERSCAN_KEY` (se usará en el Historial).

## Credenciales de Etherscan

La DApp usa una clave de la API V2 de Etherscan (una sola sirve para Sepolia y Hoodi). Se crea gratis en https://etherscan.io/myapikey. Vite la incrusta al compilar, por eso debe estar disponible **en el momento del build**.

| Dónde | Cómo se configura |
|---|---|
| Local | Archivo `.env` con `VITE_ETHERSCAN_KEY=tu_clave`. Está en `.gitignore`: no se sube. |
| Docker | `docker build --build-arg VITE_ETHERSCAN_KEY=tu_clave -t certichain .` |
| GitHub Actions | Secreto `VITE_ETHERSCAN_KEY` en Settings → Secrets and variables → Actions. |
| Railway | Variable `VITE_ETHERSCAN_KEY` en Variables del servicio, antes de desplegar. |

Nunca escribas la clave en el repositorio. Solo `.env.example` (sin valor) se versiona.

## Redes

Configuradas en `src/lib/redes.js`: Sepolia, Hoodi y zkSYS Testnet (contrato pendiente de desplegar).

## Estado

En construcción (ver el orden de trabajo del encargo). Las secciones **Evidencias** y la guía del video se completan al final.
