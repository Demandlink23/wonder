import { VEGETABLES, CONFIG } from './config.js';

export function createVegetable(x, y, index, isStatic = false) {
    const type = VEGETABLES[index];
    const { Bodies } = Matter;

    // We need to scale the image. 
    // Assuming the generated images are square (likely 1024x1024 or 512x512).
    // Let's assume a standard base size or let Matter handle scaling relative to original.
    // Matter.js needs xScale/yScale.
    // We can't know the exact image size until loaded, but usually we guess or Matter loads it.
    // Matter's render engine lazily loads.
    // To get perfect scaling, we usually define a base texture size.
    // Let's assume we want the sprite to fit the circle diameter (2 * radius).
    // If the image is large, we need a small scale.
    // Let's do a rough scale first: say image is ~512px.
    // target size = radius * 2.
    // scale = (radius * 2) / 1024 (if DALL-E/Gemini gen size).
    // Actually, let's look at the file size, they are ~400KB, likely 1024x1024.

    const spriteBaseSize = 1024; // Approximation
    const scale = (type.radius * 2.2) / spriteBaseSize; // 2.2 to give slightly larger visual than collider

    const body = Bodies.circle(x, y, type.radius, {
        isStatic: isStatic,
        isSensor: isStatic,
        label: 'vegetable',
        restitution: CONFIG.BOUNCINESS,
        friction: CONFIG.FRICTION,
        render: {
            visible: false // STRICTLY manual rendering in game.js
        }
    });

    // Attach custom data
    body.vegIndex = index;
    body.vegName = type.name;

    return body;
}
