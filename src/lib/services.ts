/**
 * Centralna konfiguracija usluga
 * Sadrži duration, price i maxConcurrent za svaku uslugu
 */

export interface ServiceConfig {
    duration: number; // u minutama
    price: number; // u kunama
    maxConcurrent: number; // maksimalan broj istovremenih rezervacija
}

export const SERVICES_CONFIG: { [key: string]: ServiceConfig } = {
    "Manikura": { duration: 45, price: 35, maxConcurrent: 2 },
    "Gel nokti": { duration: 90, price: 55, maxConcurrent: 2 },
    "Pedikura": { duration: 60, price: 45, maxConcurrent: 1 },
    "Depilacija - noge": { duration: 45, price: 40, maxConcurrent: 1 },
    "Depilacija - bikini": { duration: 30, price: 30, maxConcurrent: 1 },
    "Masaža": { duration: 60, price: 60, maxConcurrent: 1 }
};

export const SERVICES = Object.keys(SERVICES_CONFIG);

/**
 * Dohvati konfiguraciju za određenu uslugu
 */
export function getServiceConfig(service: string): ServiceConfig | undefined {
    return SERVICES_CONFIG[service];
}

/**
 * Provjeri da li usluga postoji
 */
export function isValidService(service: string): boolean {
    return service in SERVICES_CONFIG;
}





