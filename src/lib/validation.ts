/**
 * Validation utilities for email and password
 */

// Email regex - standardni email format
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validira email adresu
 * @param email - Email adresa za validaciju
 * @returns true ako je email validan, false inače
 */
export function isValidEmail(email: string): boolean {
    if (!email || typeof email !== 'string') {
        return false;
    }
    
    // Provjeri osnovnu strukturu
    if (email.length > 254) { // RFC 5321 maksimalna duljina
        return false;
    }
    
    return EMAIL_REGEX.test(email.trim().toLowerCase());
}

/**
 * Validira lozinku prema sigurnosnim standardima
 * Zahtjevi:
 * - Najmanje 8 znakova
 * - Najmanje jedan broj (0-9)
 * - Najmanje jedno veliko slovo (A-Z)
 * - Najmanje jedno malo slovo (a-z)
 * 
 * @param password - Lozinka za validaciju
 * @returns Object s isValid (boolean) i errors (string[])
 */
export function validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!password || typeof password !== 'string') {
        return { isValid: false, errors: ['Lozinka je obavezna'] };
    }
    
    // Provjeri minimalnu duljinu
    if (password.length < 8) {
        errors.push('Lozinka mora imati najmanje 8 znakova');
    }
    
    // Provjeri postojanje broja
    if (!/\d/.test(password)) {
        errors.push('Lozinka mora sadržavati najmanje jedan broj');
    }
    
    // Provjeri postojanje velikog slova
    if (!/[A-Z]/.test(password)) {
        errors.push('Lozinka mora sadržavati najmanje jedno veliko slovo');
    }
    
    // Provjeri postojanje malog slova
    if (!/[a-z]/.test(password)) {
        errors.push('Lozinka mora sadržavati najmanje jedno malo slovo');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Validira ime (name)
 * @param name - Ime za validaciju
 * @returns true ako je ime validno, false inače
 */
export function isValidName(name: string): boolean {
    if (!name || typeof name !== 'string') {
        return false;
    }
    
    const trimmed = name.trim();
    
    // Ime mora imati najmanje 2 znaka
    if (trimmed.length < 2) {
        return false;
    }
    
    // Ime ne smije biti duže od 100 znakova
    if (trimmed.length > 100) {
        return false;
    }
    
    // Ime smije sadržavati slova, razmake, apostrofe i crtice
    return /^[a-zA-ZčćđšžČĆĐŠŽ\s'-]+$/.test(trimmed);
}

