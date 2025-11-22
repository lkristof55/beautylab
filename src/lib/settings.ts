import prisma from "./prisma";

export async function getSettings() {
    let settings = await prisma.settings.findFirst();
    
    if (!settings) {
        settings = await prisma.settings.create({
            data: {}
        });
    }
    
    return settings;
}

export function calculateTierFromSettings(points: number, settings: any): string {
    if (points >= settings.platinumThreshold) return "Platinum";
    if (points >= settings.goldThreshold) return "Gold";
    if (points >= settings.silverThreshold) return "Silver";
    return "Bronze";
}

