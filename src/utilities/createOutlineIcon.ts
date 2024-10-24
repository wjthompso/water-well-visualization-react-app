// src/utilities/createOutlineIcon.ts

/**
 * Creates a circular SVG outline as a data URL.
 * @returns A data URL representing the circular outline.
 */
export function createOutlineIcon(): string {
    const radius = 32; // Adjust size as needed (larger than the well icon)
    const strokeWidth = 3;
    const strokeColor = "yellow"; // Adjust color as needed

    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${radius * 2}" height="${
        radius * 2
    }">
            <circle cx="${radius}" cy="${radius}" r="${
        radius - strokeWidth / 2
    }" stroke="${strokeColor}" stroke-width="${strokeWidth}" fill="none" />
        </svg>
    `;
    const encoded = encodeURIComponent(svg)
        .replace(/'/g, "%27")
        .replace(/"/g, "%22");
    const dataUrl = `data:image/svg+xml,${encoded}`;

    return dataUrl;
}
