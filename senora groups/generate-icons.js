// Icon Generator for Tonio & Senora PWA
// This script generates the required 192x192 and 512x512 PNG icons

const fs = require('fs');
const { createCanvas } = require('canvas');

function generateIcon(size) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, '#D4AF37');
    gradient.addColorStop(1, '#4A0E4E');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    
    // Add border radius effect
    ctx.globalCompositeOperation = 'destination-in';
    ctx.beginPath();
    ctx.roundRect(0, 0, size, size, size * 0.2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    
    // Draw gavel icon
    const gavelSize = size * 0.4;
    const gavelX = (size - gavelSize) / 2;
    const gavelY = (size - gavelSize) / 2;
    
    // Gavel handle
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(gavelX + gavelSize * 0.1, gavelY, gavelSize * 0.1, gavelSize * 0.6);
    
    // Gavel head
    ctx.fillRect(gavelX + gavelSize * 0.05, gavelY + gavelSize * 0.6, gavelSize * 0.2, gavelSize * 0.15);
    
    // Text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${size * 0.08}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText('TONIO', size / 2, gavelY + gavelSize * 0.8);
    ctx.fillText('& SENORA', size / 2, gavelY + gavelSize * 0.9);
    
    return canvas.toBuffer('image/png');
}

// Generate icons
try {
    // Create icons directory if it doesn't exist
    if (!fs.existsSync('icons')) {
        fs.mkdirSync('icons');
    }
    
    // Generate 192x192 icon
    const icon192 = generateIcon(192);
    fs.writeFileSync('icons/icon-192x192.png', icon192);
    console.log('✅ Generated icon-192x192.png');
    
    // Generate 512x512 icon
    const icon512 = generateIcon(512);
    fs.writeFileSync('icons/icon-512x512.png', icon512);
    console.log('✅ Generated icon-512x512.png');
    
    console.log('🎉 All PWA icons generated successfully!');
    
} catch (error) {
    console.error('❌ Error generating icons:', error.message);
    console.log('💡 Note: This requires Node.js and the canvas package.');
    console.log('💡 Run: npm install canvas');
}


