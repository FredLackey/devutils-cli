#!/usr/bin/env node

// Test the display environment check
console.log('DISPLAY:', process.env.DISPLAY || 'not set');
console.log('WAYLAND_DISPLAY:', process.env.WAYLAND_DISPLAY || 'not set');
console.log('XDG_CURRENT_DESKTOP:', process.env.XDG_CURRENT_DESKTOP || 'not set');

const hasDisplay = !!(process.env.DISPLAY || process.env.WAYLAND_DISPLAY || process.env.XDG_CURRENT_DESKTOP);
console.log('hasDisplayEnvironment():', hasDisplay);
