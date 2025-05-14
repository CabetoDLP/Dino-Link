import { useEffect, useRef, useState } from 'react';
import run1 from '../sprites/dino/run1.png';
import run2 from '../sprites/dino/run2.png';
import down1 from '../sprites/dino/bendDown1.png';
import down2 from '../sprites/dino/bendDown2.png';
import staticImg from '../sprites/dino/static.png';
import deathImg from '../sprites/dino/death.png';
import floorImg from '../sprites/floor.png';
import cloudImgSrc from '../sprites/cloud.png';
import flying1 from '../sprites/pterodactyl/flying1.png';
import flying2 from '../sprites/pterodactyl/flying2.png';
import cactus1 from '../sprites/cactus/1.png';
import cactus2 from '../sprites/cactus/2.png';
import cactus3 from '../sprites/cactus/3.png';
import cactus4 from '../sprites/cactus/4.png';
import cactus5 from '../sprites/cactus/5.png';
import cactus6 from '../sprites/cactus/6.png';

import '../styles/game.css'

interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  image: HTMLImageElement;
  controls: {
    up: string;
    down: string;
  };
  frame: number;
  frameTick: number;
  isJumping: boolean;
  isBending: boolean;
  isDead: boolean;
  fastFalling: boolean;
  wantsToCrouch: boolean;
  jumpFrame: number;
  jumpHeight: number;
}

interface Obstacle {
  type: 'cactus' | 'pterodactyl';
  x: number;
  y: number;
  width: number;
  height: number;
  img: HTMLImageElement;
  frameIndex?: number; // solo para pterodáctilo
}

interface Cloud {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
}

export default function Home() {

  const FPS = 60;  // Frames por segundo objetivo
  const FRAME_TIME = 1000 / FPS;  // Tiempo ideal por frame en ms
  const lastTimeRef = useRef(0);  // Último timestamp
  const deltaTimeRef = useRef(0); // Tiempo entre frames
  const accumulatorRef = useRef(0); // Acumulador para actualización fija

  const titleRef = useRef<HTMLHeadingElement>(null);
  const BASE_SPEED = 7;  // Velocidad inicial constante
  const MAX_SPEED = 12;  // Velocidad máxima
  const GLOBAL_SPEED = useRef(BASE_SPEED); // Velocidad actual mutable
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const floorXRef = useRef(0);
  const animationRef = useRef<number | null>(null);
  const frameRef = useRef(0);
  const cloudSpawnTimerRef = useRef(0);
  const cloudImgRef = useRef<HTMLImageElement | null>(null);
  const cloudsRef = useRef<Cloud[]>([]);

  const [started, setStarted] = useState(false);
  const [cloudImgLoaded, setCloudImgLoaded] = useState(false);

  // Carga de imágenes
  const dinoImages = {
    run: [new Image(), new Image()],
    down: [new Image(), new Image()],
    static: new Image(),
    death: new Image(),
  };
  
  dinoImages.run[0].src = run1;
  dinoImages.run[1].src = run2;
  dinoImages.down[0].src = down1;
  dinoImages.down[1].src = down2;
  dinoImages.static.src = staticImg;
  dinoImages.death.src = deathImg;


  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);
  const [gameOver, setGameOver] = useState(false);
  const gameOverRef = useRef(false);
  const nextObstacleTimeRef = useRef(0);

  // Cactus
  const cactusImgs = [cactus1, cactus2, cactus3, cactus4, cactus5, cactus6].map(src => {
    const img = new Image();
    img.src = src;
    return img;
  });

  // Pterodáctilo
  const pteroImgs = [flying1, flying2].map(src => {
    const img = new Image();
    img.src = src;
    return img;
  });

  const floor = new Image();
  floor.src = floorImg;

  // Cargar imagen de nube
  useEffect(() => {
    const img = new Image();
    img.src = cloudImgSrc;
    img.onload = () => {
      cloudImgRef.current = img;
      setCloudImgLoaded(true);
    };
  }, []);

  // Gradientes
  const gradients = [
  { sky: '#b4b4b4', floor: '#ffffff'}, // Azul muy claro del amanecer temprano

  // Ciclo del día
  { sky: '#b7d6c7', floor: '#ffe2d1'}, // Amanecer original
  { sky: '#ffc4a3', floor: '#ffd8be'}, // Amanecer más cálido/dorado
  { sky: '#87ceeb', floor: '#e8e8e8'}, // Mediodía claro
  { sky: '#4a98d3', floor: '#c9e4f5'}, // Azul intenso de mediodía
  { sky: '#f9c5a8', floor: '#f5dfb5'}, // Atardecer original
  { sky: '#ff7e5f', floor: '#ffa270'}, // Atardecer naranja intenso
  { sky: '#fd5e53', floor: '#f9ad6a'}, // Atardecer rojo fuego
  { sky: '#414a6b', floor: '#32323c'}, // Anochecer original
  { sky: '#2c3e50', floor: '#1e272e'}, // Anochecer más profundo
  
  // Condiciones especiales
  { sky: '#614385', floor: '#516395'}, // Cielo púrpura místico
  { sky: '#23074d', floor: '#cc5333'}, // Noche con toque mágico
  { sky: '#544a7d', floor: '#ffd452'}, // Ocaso con reflejo dorado
  { sky: '#5f2c82', floor: '#49a09d'}, // Inspirado en auroras boreales
  { sky: '#2980b9', floor: '#6dd5fa'}, // Azul cristalino
  { sky: '#5d4157', floor: '#a8caba'}, // Amanecer con bruma
  { sky: '#4ac29a', floor: '#bdfff3'}, // Cielo sobre agua turquesa
  { sky: '#0f2027', floor: '#2c5364'}, // Noche estrellada profunda
  { sky: '#ee9ca7', floor: '#ffdde1'}, // Cielo rosado algodonado
  { sky: '#614385', floor: '#516395'}, // Púrpura intenso
  
  // Fantásticos
  { sky: '#c33764', floor: '#1d2671'}, // cielo fantástico púrpura
  { sky: '#f12711', floor: '#f5af19'}, // Puesta de sol fuego
  { sky: '#59c173', floor: '#5d26c1'}, // Aurora verdosa
  { sky: '#f953c6', floor: '#b91d73'},  // Mundo de fantasía rosado
  { sky: '#3494e6', floor: '#ec6ead'}, // Nebulosa cósmica
  { sky: '#7f00ff', floor: '#e100ff'}, // cielo de galaxia distante
  { sky: '#00b09b', floor: '#96c93d'}, // Mundo alienígena
  { sky: '#ff416c', floor: '#ff4b2b'}, // Planeta rojo
  { sky: '#654ea3', floor: '#eaafc8'}, // Dimensión onírica
  { sky: '#283c86', floor: '#45a247'}, // Mundo paralelo
];

  const [currentGradientIndex, setCurrentGradientIndex] = useState(0);
  const currentGradient = gradients[currentGradientIndex];
  const [targetGradient, setTargetGradient] = useState(0);
  const [gradientProgress, setGradientProgress] = useState(1); // 1 = transición completa

  useEffect(() => {
    if (gameOverRef.current) return; // No hacer nada si el juego terminó
    
    const targetIndex = Math.floor(scoreRef.current / 30) % gradients.length;
    
    if (targetIndex !== targetGradient) {
      setTargetGradient(targetIndex);
      setGradientProgress(0); // Iniciar transición
    }
  }, [score, targetGradient]);

  useEffect(() => {
    if (gradientProgress < 1) {
      const interval = setInterval(() => {
        setGradientProgress(prev => {
          const newProgress = prev + 0.02; // Incremento pequeño
          if (newProgress >= 1) {
            clearInterval(interval);
            setCurrentGradientIndex(targetGradient);
            return 1;
          }
          return newProgress;
        });
      }, 16); // ~60fps
      
      return () => clearInterval(interval);
    }
  }, [gradientProgress, targetGradient]);

  // Función para interpolar colores
  const interpolateColor = (color1: string, color2: string, factor: number) => {
    // Convertir colores hex a RGB
    const hex2rgb = (hex: string) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return [r, g, b];
    };
    
    // Si los colores no son hex, devolver el color destino
    if (!color1.startsWith('#') || !color2.startsWith('#')) {
      return gradientProgress >= 0.5 ? color2 : color1;
    }
    
    const [r1, g1, b1] = hex2rgb(color1);
    const [r2, g2, b2] = hex2rgb(color2);
    
    const r = Math.round(r1 + factor * (r2 - r1));
    const g = Math.round(g1 + factor * (g2 - g1));
    const b = Math.round(b1 + factor * (b2 - b1));
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };

  // Función para generar nubes
  const spawnCloud = (initialPlacement = false) => {
    if (!cloudImgRef.current || !cloudImgLoaded) return;
  
    const height = 30 + Math.random() * 20;
    const aspectRatio = cloudImgRef.current.width / cloudImgRef.current.height;
    const width = height * aspectRatio;
  
    const xPos = initialPlacement ? Math.random() * 920 : 920;
    const yPos = 20 + Math.random() * 100;
    const cloudSpeed = GLOBAL_SPEED.current * (0.3 + Math.random() * 0.2);
    
    const newCloud = {
      x: xPos,
      y: yPos,
      width,
      height,
      speed: cloudSpeed
    };
    
    cloudsRef.current = [...cloudsRef.current, newCloud];
  };

  // Función para actualizar nubes
  const updateClouds = () => {
    if (gameOverRef.current) return;

    cloudsRef.current = cloudsRef.current
      .map(cloud => ({ 
        ...cloud, 
        x: cloud.x - cloud.speed * deltaTimeRef.current 
      }))
      .filter(cloud => cloud.x + cloud.width > 0);

    cloudSpawnTimerRef.current += deltaTimeRef.current;
    if (cloudSpawnTimerRef.current >= 150) {
      cloudSpawnTimerRef.current = 0;
      spawnCloud();
    }
  };

  // Función para dibujar nubes
  const drawClouds = (ctx: CanvasRenderingContext2D) => {
    if (!cloudImgRef.current || !cloudImgLoaded) return;
    
    cloudsRef.current.forEach(cloud => {
      ctx.drawImage(cloudImgRef.current!, cloud.x, cloud.y, cloud.width, cloud.height);
    });
  };

  useEffect(() => {
    const el = titleRef.current;
    if (!el) return;

    const text = '->Dino Link<-';
    el.textContent = '';
    let i = 0;

    const interval = setInterval(() => {
      if (i < text.length) {
        el.textContent += text[i];
        i++;
      } else {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (started && cloudImgLoaded) {
      // Limpiar nubes existentes
      cloudsRef.current = [];
      
      // Iniciar con 3 nubes distribuidas aleatoriamente
      for (let i = 0; i < 3; i++) {
        spawnCloud(true);
      }
      
      console.log("Nubes iniciales creadas:", cloudsRef.current.length);
    }
  }, [started, cloudImgLoaded]);

  //actualizar velocidad
  useEffect(() => {
    if (!started || gameOverRef.current) return;

    // Aumenta 1 punto de velocidad cada 60 puntos
    const speedIncrease = Math.floor(scoreRef.current / 60);
    const newSpeed = Math.min(BASE_SPEED + speedIncrease, MAX_SPEED);
    
    if (newSpeed !== GLOBAL_SPEED.current) {
      GLOBAL_SPEED.current = newSpeed;
    }
  }, [score, started]); // Depende de score para triggerear el efecto

  const obstaclesRef = useRef<Obstacle[]>([]);
  const obstacleTimerRef = useRef(0);

  useEffect(() => {
    if (!started) return;

    // Limpiar estado anterior
    if (gameOverRef.current) {
      obstaclesRef.current = [];
      cloudsRef.current = [];
      floorXRef.current = 0;
      frameRef.current = 0;
    }
    if (!started) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const canvasWidth = 920;
    const canvasHeight = 280;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    const players: Player[] = [
      {
        x: 100,
        y: canvasHeight - 75,
        width: 50,
        height: 50,
        image: dinoImages.run[0],
        controls: { up: 'w', down: 's' },
        frame: 0,
        frameTick: 0,
        isJumping: false,
        isBending: false,
        isDead: false,
        fastFalling: false,
        wantsToCrouch: false,
        jumpFrame: 0,
        jumpHeight: 0,
      },
      {
        x: 200,
        y: canvasHeight - 75,
        width: 50,
        height: 50,
        image: dinoImages.run[0],
        controls: { up: 'ArrowUp', down: 'ArrowDown' },
        frame: 0,
        frameTick: 0,
        isJumping: false,
        isBending: false,
        isDead: false,
        fastFalling: false,
        wantsToCrouch: false,
        jumpFrame: 0,
        jumpHeight: 0,
      },
    ];
  
    const keysPressed = new Set<string>();

    const keyDown = (e: KeyboardEvent) => keysPressed.add(e.key);
    const keyUp = (e: KeyboardEvent) => keysPressed.delete(e.key);
    window.addEventListener('keydown', keyDown);
    window.addEventListener('keyup', keyUp);

    const updatePlayer = (player: Player) => {
      const jumpPeriod = 33;
      const standingHeight = 50;
      const crouchingHeight = 30;
      const baseY = canvasHeight - 75;

      // Iniciar salto
      if (!player.isJumping && keysPressed.has(player.controls.up)) {
        player.isJumping = true;
        player.fastFalling = false;
        player.jumpFrame = 0;
      }

      // Durante salto
      if (player.isJumping) {
        if (keysPressed.has(player.controls.down)) {
          player.fastFalling = true;
          player.wantsToCrouch = true;
        }

        const jumpSpeed = player.fastFalling ? 2 : 1;
        player.jumpFrame += jumpSpeed * deltaTimeRef.current;
        player.jumpHeight = 78 * Math.sin((Math.PI * player.jumpFrame) / jumpPeriod);

        if (player.jumpFrame >= jumpPeriod) {
          player.isJumping = false;
          player.jumpHeight = 0;

          if (player.wantsToCrouch) {
            player.isBending = true;
          }
        }
      }
      
      // Actualizar animación con delta time
      player.frameTick += deltaTimeRef.current;
      if (player.frameTick >= 10) {
        player.frame = (player.frame + 1) % 2;
        player.frameTick = 0;
      }
      
      // Agacharse
      if (!player.isJumping && keysPressed.has(player.controls.down)) {
        player.isBending = true;
      } else if (!keysPressed.has(player.controls.down)) {
        player.isBending = false;
        player.wantsToCrouch = false;
        player.fastFalling = false;
      }
    
      // Actualizar posición vertical
      const height = player.isBending ? crouchingHeight : standingHeight;
      const yOffset = standingHeight - height;
      player.height = height;
      player.y = baseY + yOffset - player.jumpHeight;
    
      // Animación
      player.frameTick++;
      if (player.frameTick >= 10) {
        player.frame = (player.frame + 1) % 2;
        player.frameTick = 0;
      }
    
      // Imagen
      if (player.isBending) {
        player.image = dinoImages.down[player.frame];
      } else {
        player.image = dinoImages.run[player.frame];
      }
    };

    const spawnObstacle = () => {
      const isPtero = Math.random() < 0.25;

      if (isPtero) {
        // Código existente para pterodáctilos...
        const height = 30 + Math.random() * 20;
        const aspect = pteroImgs[0].width / pteroImgs[0].height;
        const width = height * aspect;
        const y = 170 + Math.random() * 40; // Posición aleatoria en el aire

        obstaclesRef.current.push({
          type: 'pterodactyl',
          x: 920,
          y,
          width,
          height,
          img: pteroImgs[0],
          frameIndex: 0,
        });
      } else {
        const img = cactusImgs[Math.floor(Math.random() * cactusImgs.length)];
        const height = 40 + Math.random() * 20;
        const aspect = img.width / img.height;
        const width = height * aspect;
        
        // Asegurar que la base del cactus esté alineada con el suelo
        const groundLevel = canvasHeight - 25; // 25 es la altura desde el suelo donde está el dinosaurio
        const y = groundLevel - height; // Posiciona el cactus desde el suelo hacia arriba

        obstaclesRef.current.push({
          type: 'cactus',
          x: 920,
          y, // Nueva posición calculada
          width,
          height,
          img,
        });
      }
    };

    const drawObstacles = (ctx: CanvasRenderingContext2D) => {
      obstaclesRef.current.forEach(obs => {
        ctx.drawImage(obs.img, obs.x, obs.y, obs.width, obs.height);
      });
    };

    const isColliding = (a: { x: number; y: number; width: number; height: number }, b: { x: number; y: number; width: number; height: number }) => {
      return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
      );
    };
  
    const draw = (timestamp = 0) => {
  // Calcular delta time (tiempo transcurrido desde el último frame)
  if (lastTimeRef.current === 0) {
    lastTimeRef.current = timestamp;
  }
  
  const deltaTime = timestamp - lastTimeRef.current;
  lastTimeRef.current = timestamp;
  
  // Limitar delta time para evitar saltos grandes
  const clampedDelta = Math.min(deltaTime, 100);
  deltaTimeRef.current = clampedDelta / FRAME_TIME; // Normalizado a 1.0 para 60 FPS
  
  // Acumular tiempo para actualizaciones fijas
  accumulatorRef.current += clampedDelta;
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Actualizar lógica a velocidad fija
  let stepsExecuted = 0;
  while (accumulatorRef.current >= FRAME_TIME && stepsExecuted < 3) { // Limitamos a 3 pasos para evitar bloqueos
    if (!gameOverRef.current) {
      frameRef.current++;
      
      // Actualizar puntuación a velocidad constante
      if (frameRef.current % 5 === 0) {
        scoreRef.current += 1;
        setScore(scoreRef.current);
      }
    }
    
    accumulatorRef.current -= FRAME_TIME;
    stepsExecuted++;
  }
  
  // Aplicar movimiento con velocidad normalizada
  const movementSpeed = GLOBAL_SPEED.current * deltaTimeRef.current;
  
  // Mover el suelo exactamente con la misma velocidad que los obstáculos
  if (!gameOverRef.current) {
    floorXRef.current -= movementSpeed;
    if (floorXRef.current <= -canvasWidth) {
      floorXRef.current = 0;
    }
  }
  
  // Actualizar obstáculos con la misma velocidad
  if (!gameOverRef.current) {
    obstaclesRef.current = obstaclesRef.current
      .map((obs) => {
        const newX = obs.x - movementSpeed;
        const newObs = { ...obs, x: newX };
    
        if (obs.type === 'pterodactyl') {
          const frame = Math.floor(frameRef.current / 10) % 2;
          newObs.frameIndex = frame;
          newObs.img = pteroImgs[frame];
        }
  
        return newObs;
      })
      .filter(obs => obs.x + obs.width > 0);
    
    // Gestión del temporizador de obstáculos
    obstacleTimerRef.current += deltaTimeRef.current;
    if (obstacleTimerRef.current >= nextObstacleTimeRef.current) {
      obstacleTimerRef.current = 0;
      nextObstacleTimeRef.current = Math.floor((60 + Math.random() * 60) * (5 / GLOBAL_SPEED.current));
      spawnObstacle();
    }
  }
  
  // Actualizar nubes
  updateClouds();
  
  // Dibujar elementos
  drawClouds(ctx);
  ctx.drawImage(floor, floorXRef.current, canvasHeight - 40, canvasWidth, 40);
  ctx.drawImage(floor, floorXRef.current + canvasWidth, canvasHeight - 40, canvasWidth, 40);
  
  // Actualizar y dibujar jugadores
  players.forEach(player => {
    if (player.isDead) {
      ctx.drawImage(player.image, player.x, player.y, player.width, player.height);
    } else {
      updatePlayer(player);
      ctx.drawImage(player.image, player.x, player.y, player.width, player.height);
    }
    
    // Colisiones
    const hitboxA = {
      x: player.x + 6,
      y: player.y + 6,
      width: player.width - 12,
      height: player.height - 12
    };
  
    obstaclesRef.current.forEach(obs => {
      const hitboxB = {
        x: obs.x + (obs.type === 'pterodactyl' ? obs.width * 0.15 : 4),
        y: obs.y + 4,
        width: obs.type === 'pterodactyl' ? obs.width * 0.7 : obs.width - 8,
        height: obs.height - 8
      };
  
      if (isColliding(hitboxA, hitboxB)) {
        player.isDead = true;
        player.image = dinoImages.death;
      }
    });
  });

  // Comprobar game over
  const allDead = players.every(p => p.isDead);
  if (allDead && !gameOverRef.current) {
    gameOverRef.current = true;
    setGameOver(gameOverRef.current);
    cancelAnimationFrame(animationRef.current!);
    console.log('gameover:' + gameOverRef.current);
  }

  drawObstacles(ctx);
  animationRef.current = requestAnimationFrame(draw);
};
  
    draw();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      window.removeEventListener('keydown', keyDown);
      window.removeEventListener('keyup', keyUp);
    };
  }, [started, cloudImgLoaded]);

  // En la parte del renderizado (return):
  return (
    <main className="w-full h-screen flex flex-col items-center justify-between overflow-hidden p-14 box-border">
      <h1 ref={titleRef} className="pixelify-sans-game" />
      
      <div className={`absolute inset-0 flex flex-col items-center justify-center transition-opacity duration-300 pointer-events-none ${gameOver ? 'opacity-100 z-50' : 'opacity-0 pointer-events-none'}`}>
        <h1 className="pixelify-sans-game mb-4 text-lg md:text-xl lg:text-2xl" style={{ 
    'color': 'yellow'
  }}>GAME OVER</h1>
      </div>

      <div className="flex items-center justify-center w-full h-screen">
          <div className="relative w-full max-w-[920px] aspect-[920/280]">
            <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-500 pointer-events-none ${
              started ? 'opacity-0' : 'opacity-100'
            }`}>
              <svg viewBox="0 0 428 459" className="h-[25vh] object-contain">
                <path d="M86 374v-22H65v-21H43v-21H22v-22H0V160h22v43h21v21h22v22h42v-22h22v-21h32v-21h32v-22h21V22h21V0h171v22h22v96H321v21h64v21h-86v43h43v43h-21v-22h-22v75h-21v32h-21v21h-22v22zM278 32h-21v22h21z" />
                <path id="L" d="M86 352h64v43h-21v21h-21v22h21v21H86z" />
                <path id="R" d="M235 352v86h22v21h-43v-64h-21v-43z" />
              </svg>
            </div>
            <div className="absolute top-2 left-2 sm:left-4 text-white font-bold text-sm sm:text-lg z-10 bg-black/40 px-2 py-1 rounded">
              Score: {score}
            </div>
              <canvas
                ref={canvasRef}
                className="w-full h-full border"
                style={{
                  background: gradientProgress < 1 
                    ? `linear-gradient(${interpolateColor(
                        gradients[currentGradientIndex].sky,
                        gradients[targetGradient].sky,
                        gradientProgress
                      )}, transparent) ${interpolateColor(
                        gradients[currentGradientIndex].floor,
                        gradients[targetGradient].floor,
                        gradientProgress
                      )}`
                    : `linear-gradient(${currentGradient.sky}, transparent) ${currentGradient.floor}`,
                }}
              />
          </div>
        </div>

      <h2 className="pixelify-sans-game mb-4 text-lg md:text-xl lg:text-2xl">
        Player 1: Arrow Up/Down <br/> Player 2: W/S
      </h2>

      <div className="flex flex-col items-center mb-4">
        <button 
          className="button-89 w-full max-w-[280px] sm:max-w-[320px] md:max-w-[360px] h-14 sm:h-16 md:h-20 mb-2" 
          onClick={() => {
            if (started) {
              // Reiniciar todo el estado del juego
              setGameOver(false);
              gameOverRef.current = false;
              setScore(0);
              scoreRef.current = 0;
              obstaclesRef.current = [];
              cloudsRef.current = [];
              floorXRef.current = 0;
              frameRef.current = 0;
              
              // Reiniciar tiempos
              lastTimeRef.current = 0;
              deltaTimeRef.current = 0;
              accumulatorRef.current = 0;
              
              // Forzar un reinicio limpio
              setStarted(false);
              setTimeout(() => setStarted(true), 50);
            } else {
              setStarted(true);
              nextObstacleTimeRef.current = Math.floor((60 + Math.random() * 60) * (5 / GLOBAL_SPEED.current))
            }
          }}
        >
          {started ? "Restart" : "Start"}
        </button>
      </div>
    </main>
  );
}