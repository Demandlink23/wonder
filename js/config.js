export const CONFIG = {
    CANVAS_WIDTH: 450,
    CANVAS_HEIGHT: 800,
    WALL_THICKNESS: 20,
    FRICTION: 0.5,
    BOUNCINESS: 0.1,
    GRAVITY_Y: -1,
    DANGER_LINE_Y: 650,
    LAUNCHER_Y: 750,
};

// Stage definitions with difficulty
// Goal: goalVegIndex = the vegetable index to create for stage clear
export const STAGES = [
    {
        id: 1,
        name: '아주 쉬움',
        nameEn: 'Very Easy',
        spawnRange: 3,           // Only spawn corn, bean, chestnut (0-2)
        gravityMultiplier: 0.8,  // 80%
        goalVegIndex: 6,         // Make Cabbage (양배추) to clear
        goalCount: 1,
        dangerLineY: 650,        // Same for all stages
    },
    {
        id: 2,
        name: '쉬움',
        nameEn: 'Easy',
        spawnRange: 4,           // Spawn up to eggplant (0-3)
        gravityMultiplier: 0.9,  // 90%
        goalVegIndex: 7,         // Make Lettuce (상추) to clear
        goalCount: 1,
        dangerLineY: 650,        // Same for all stages
    },
    {
        id: 3,
        name: '보통',
        nameEn: 'Normal',
        spawnRange: 5,           // Spawn up to carrot (0-4)
        gravityMultiplier: 1.0,  // 100%
        goalVegIndex: 8,         // Make Napa (배추) to clear
        goalCount: 1,
        dangerLineY: 650,        // Same for all stages
    },
    {
        id: 4,
        name: '어려움',
        nameEn: 'Hard',
        spawnRange: 5,           // Same spawn but faster
        gravityMultiplier: 1.1,  // 110%
        goalVegIndex: 9,         // Make Pumpkin (호박)!
        goalCount: 1,
        dangerLineY: 650,        // Same for all stages
    },
    {
        id: 5,
        name: '엔드리스',
        nameEn: 'Endless',
        spawnRange: 5,           // Full range
        gravityMultiplier: 1.0,  // 100% normal
        goalVegIndex: -1,        // No goal - play forever!
        goalCount: 0,
        dangerLineY: 650,
        endless: true,           // Flag for endless mode
    },
];

export const VEGETABLES = [
    { name: 'corn', radius: 15, score: 10, img: 'assets/corn.png' },
    { name: 'bean', radius: 25, score: 20, img: 'assets/bean.png' },
    { name: 'chestnut', radius: 35, score: 30, img: 'assets/chestnut.png' },
    { name: 'eggplant', radius: 45, score: 40, img: 'assets/eggplant.png' },
    { name: 'carrot', radius: 55, score: 50, img: 'assets/carrot.png' },
    { name: 'cucumber', radius: 65, score: 60, img: 'assets/cucumber.png' },
    { name: 'cabbage', radius: 75, score: 70, img: 'assets/cabbage.png' },
    { name: 'lettuce', radius: 85, score: 80, img: 'assets/lettuce.png' },
    { name: 'napa', radius: 95, score: 90, img: 'assets/napa.png' },
    { name: 'pumpkin', radius: 110, score: 100, img: 'assets/pumpkin.png' }
];
