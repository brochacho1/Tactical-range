import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameState, Target, Particle, Gun, Difficulty } from '../types';
import { GAME_CONFIG, GUNS, DIFFICULTIES } from '../constants';
import { motion, AnimatePresence } from 'motion/react';
import { Crosshair, ShieldAlert, Zap, Target as TargetIcon, ShoppingCart, Wallet, Coins, CheckCircle2, Flame, Skull, Activity, Target as AimIcon } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

export const GunRange: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    money: 1000000,
    ammo: GUNS.PISTOL.maxAmmo,
    maxAmmo: GUNS.PISTOL.maxAmmo,
    isReloading: false,
    isGameOver: false,
    targets: [],
    lastShotTime: 0,
    recoil: 0,
    currentGun: GUNS.PISTOL,
    ownedGuns: ['pistol'],
    difficulty: DIFFICULTIES.EASY,
  });

  // Performance Optimization: Move volatile state to refs
  const targetsRef = useRef<Target[]>([]);
  const recoilRef = useRef(0);
  const particlesRef = useRef<Particle[]>([]);
  const gameStateRef = useRef(gameState);
  const lastShotTimeRef = useRef(0);

  // Sync ref with state for access in game loop
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const isMouseDownRef = useRef(false);
  const [showHitmarker, setShowHitmarker] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const gunshotBuffersRef = useRef<Record<string, AudioBuffer | null>>({});
  const reloadBuffersRef = useRef<Record<string, AudioBuffer | null>>({});

  const [hasStarted, setHasStarted] = useState(false);

  // Initialize Audio
  const startAudio = async (difficulty: Difficulty) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const loadSound = async (url: string) => {
        try {
          const response = await fetch(url);
          const arrayBuffer = await response.arrayBuffer();
          return await audioContextRef.current!.decodeAudioData(arrayBuffer);
        } catch (e) {
          console.error('Failed to load sound:', url, e);
          return null;
        }
      };

      gunshotBuffersRef.current['pistol'] = await loadSound(GUNS.PISTOL.gunshotUrl);
      gunshotBuffersRef.current['rifle'] = await loadSound(GUNS.RIFLE.gunshotUrl);
      gunshotBuffersRef.current['lmg'] = await loadSound(GUNS.LMG.gunshotUrl);
      reloadBuffersRef.current['pistol'] = await loadSound(GUNS.PISTOL.reloadUrl);
      reloadBuffersRef.current['rifle'] = await loadSound(GUNS.RIFLE.reloadUrl);
      reloadBuffersRef.current['lmg'] = await loadSound(GUNS.LMG.reloadUrl);
    }

    setGameState(prev => ({
      ...prev,
      difficulty,
      score: 0,
      ammo: prev.currentGun.maxAmmo,
      maxAmmo: prev.currentGun.maxAmmo,
      targets: [],
      isGameOver: false,
    }));
    targetsRef.current = [];
    setHasStarted(true);
  };

  const playSound = (buffer: AudioBuffer | null) => {
    if (!buffer || !audioContextRef.current) return;
    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContextRef.current.destination);
    source.start(0);
  };

  const spawnTarget = useCallback(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const newTarget: Target = {
      id: Math.random().toString(36).substr(2, 9),
      x: Math.random() * (canvas.width - 100) + 50,
      y: Math.random() * (canvas.height - 200) + 50,
      size: 30 + Math.random() * 20,
      speed: 1 + Math.random() * 2,
      direction: Math.random() * Math.PI * 2,
      health: 100,
      maxHealth: 100,
      type: Math.random() > 0.5 ? 'moving' : 'static',
      spawnedAt: Date.now(),
    };

    if (targetsRef.current.length < gameStateRef.current.difficulty.maxTargets) {
      targetsRef.current.push(newTarget);
      // We still update state for targets so React knows about them for hit detection logic 
      // but we'll optimize the loop to not depend on it
      setGameState(prev => ({
        ...prev,
        targets: [...targetsRef.current]
      }));
    }
  }, []);

  const triggerShoot = useCallback(() => {
    const currentGameState = gameStateRef.current;
    if (currentGameState.isReloading || currentGameState.ammo <= 0 || currentGameState.isGameOver || isShopOpen) return;
    
    const now = Date.now();
    if (now - lastShotTimeRef.current < currentGameState.currentGun.fireRate) return;

    lastShotTimeRef.current = now;
    playSound(gunshotBuffersRef.current[currentGameState.currentGun.id]);

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect || !canvasRef.current) return;
    
    // Scale mouse coordinates to canvas internal resolution
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    
    // Use mousePos state which is updated onMouseMove
    const x = mousePos.x * scaleX;
    const y = mousePos.y * scaleY;

    // Check hits
    let hit = false;
    const remainingTargets = targetsRef.current.filter(t => {
      const dist = Math.sqrt((t.x - x) ** 2 + (t.y - y) ** 2);
      if (dist < t.size) {
        hit = true;
        // Create impact particles
        for (let i = 0; i < 15; i++) {
          particlesRef.current.push({
            x,
            y,
            vx: (Math.random() - 0.5) * 15,
            vy: (Math.random() - 0.5) * 15,
            life: 1,
            color: i % 2 === 0 ? '#f87171' : '#ffffff',
          });
        }
        return false;
      }
      return true;
    });

    if (hit) {
      setShowHitmarker(true);
      setTimeout(() => setShowHitmarker(false), 100);
      targetsRef.current = remainingTargets;
    }

    recoilRef.current = currentGameState.currentGun.recoilAmount;

    setGameState(prev => ({
      ...prev,
      ammo: prev.ammo - 1,
      score: hit ? prev.score + prev.difficulty.hitScore : (prev.difficulty.penalty > 0 ? prev.score - prev.difficulty.penalty : prev.score),
      targets: remainingTargets,
      lastShotTime: now,
      recoil: prev.currentGun.recoilAmount,
    }));
  }, [isShopOpen, mousePos]);

  // Game Loop
  useEffect(() => {
    let animationFrameId: number;
    let lastSpawnTime = 0;
    let lastTime = performance.now();

    const update = (time: number) => {
      const currentGameState = gameStateRef.current;
      if (currentGameState.isGameOver) return;

      const deltaTime = time - lastTime;
      lastTime = time;

      if (time - lastSpawnTime > currentGameState.difficulty.spawnRate) {
        spawnTarget();
        lastSpawnTime = time;
      }

      // Handle automatic firing
      if (isMouseDownRef.current) {
        triggerShoot();
      }

      // Update targets in ref
      const now = Date.now();
      targetsRef.current = targetsRef.current
        .filter(t => now - t.spawnedAt < GAME_CONFIG.TARGET_LIFETIME)
        .map(t => {
          if (t.type === 'moving') {
            let nx = t.x + Math.cos(t.direction) * t.speed;
            let ny = t.y + Math.sin(t.direction) * t.speed;
            let nd = t.direction;

            if (nx < 50 || nx > (canvasRef.current?.width || 800) - 50) nd = Math.PI - nd;
            if (ny < 50 || ny > (canvasRef.current?.height || 600) - 150) nd = -nd;

            return { ...t, x: nx, y: ny, direction: nd };
          }
          return t;
        });

      // Update recoil in ref
      recoilRef.current = Math.max(0, recoilRef.current - currentGameState.currentGun.recoilRecovery * deltaTime);

      // Update particles in ref
      particlesRef.current = particlesRef.current
        .map(p => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          life: p.life - 0.02,
        }))
        .filter(p => p.life > 0);

      // Draw
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (ctx && canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw background grid
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        for (let i = 0; i < canvas.width; i += 50) {
          ctx.beginPath();
          ctx.moveTo(i, 0);
          ctx.lineTo(i, canvas.height);
          ctx.stroke();
        }
        for (let i = 0; i < canvas.height; i += 50) {
          ctx.beginPath();
          ctx.moveTo(0, i);
          ctx.lineTo(canvas.width, i);
          ctx.stroke();
        }

        // Draw targets
        const currentNow = Date.now();
        targetsRef.current.forEach(t => {
          const age = currentNow - t.spawnedAt;
          const remaining = GAME_CONFIG.TARGET_LIFETIME - age;
          const opacity = Math.min(1, remaining / 1000);

          ctx.save();
          ctx.translate(t.x, t.y);
          ctx.globalAlpha = opacity;
          
          const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, t.size);
          gradient.addColorStop(0, '#ef4444');
          gradient.addColorStop(0.7, '#991b1b');
          gradient.addColorStop(1, '#450a0a');
          
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(0, 0, t.size, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 0, t.size * 0.7, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(0, 0, t.size * 0.4, 0, Math.PI * 2);
          ctx.stroke();
          
          ctx.fillStyle = '#fff';
          ctx.beginPath();
          ctx.arc(0, 0, 4, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.restore();
        });

        // Draw particles
        particlesRef.current.forEach(p => {
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.life;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        });
      }

      // Update recoil UI via direct DOM if possible or just let React handle it less frequently
      // For now, we'll use a small trick: update the recoil in state only if it's significant
      // but actually, let's just use the ref for the container animation too
      if (canvasRef.current?.parentElement) {
        const recoil = recoilRef.current;
        const rotate = (Math.random() - 0.5) * recoil * 0.2;
        canvasRef.current.parentElement.style.transform = `translateY(${recoil * -1}px) rotate(${rotate}deg)`;
      }

      animationFrameId = requestAnimationFrame(update);
    };

    animationFrameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationFrameId);
  }, [spawnTarget, triggerShoot]); // Added triggerShoot dependency

  const handleReload = useCallback(() => {
    if (gameState.isReloading || gameState.ammo === gameState.currentGun.maxAmmo) return;

    setGameState(prev => ({ ...prev, isReloading: true }));
    playSound(reloadBuffersRef.current[gameState.currentGun.id]);

    setTimeout(() => {
      setGameState(prev => ({
        ...prev,
        ammo: prev.currentGun.maxAmmo,
        isReloading: false,
      }));
    }, gameState.currentGun.reloadTime);
  }, [gameState.isReloading, gameState.ammo, gameState.currentGun]);

  const handleExchange = () => {
    if (gameState.score <= 0) return;
    const moneyGained = Math.floor(gameState.score * GAME_CONFIG.SCORE_TO_MONEY_RATE);
    setGameState(prev => ({
      ...prev,
      score: 0,
      money: prev.money + moneyGained
    }));
  };

  const handleLeaveRange = () => {
    if (gameState.money < 100000) return;
    setGameState(prev => ({
      ...prev,
      money: prev.money - 100000,
    }));
    setHasStarted(false);
  };

  const handleBuyGun = (gun: Gun) => {
    const currentPrice = gun.price * gameState.difficulty.priceMultiplier;
    
    if (gameState.ownedGuns.includes(gun.id)) {
      // Equip if already owned
      setGameState(prev => ({
        ...prev,
        currentGun: gun,
        ammo: gun.maxAmmo,
        maxAmmo: gun.maxAmmo,
        isReloading: false
      }));
      return;
    }

    if (gameState.money >= currentPrice) {
      setGameState(prev => ({
        ...prev,
        money: prev.money - currentPrice,
        ownedGuns: [...prev.ownedGuns, gun.id],
        currentGun: gun,
        ammo: gun.maxAmmo,
        maxAmmo: gun.maxAmmo,
        isReloading: false
      }));
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'r') {
        handleReload();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleReload]);

  if (!hasStarted) {
    return (
      <div className="w-full h-screen bg-[#0a0a0a] flex items-center justify-center p-4 overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center p-8 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-xl max-w-2xl w-full"
        >
          <div className="mb-6 flex justify-center">
            <div className="p-4 bg-white/10 rounded-full">
              <Crosshair size={48} className="text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2 tracking-tighter uppercase">Tactical Range</h1>
          <p className="text-white/50 mb-8 text-sm leading-relaxed max-w-md mx-auto">
            Select your simulation parameters. Harder difficulties increase target density and penalize missed shots.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {Object.values(DIFFICULTIES).map((diff) => (
              <button
                key={diff.id}
                onClick={() => startAudio(diff)}
                className="group relative p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-white/20 transition-all text-left overflow-hidden"
              >
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-1">
                    {diff.id === 'easy' && <Activity size={16} className="text-green-500" />}
                    {diff.id === 'medium' && <AimIcon size={16} className="text-blue-500" />}
                    {diff.id === 'hard' && <Flame size={16} className="text-orange-500" />}
                    {diff.id === 'impossible' && <Skull size={16} className="text-red-500" />}
                    <span className="font-bold text-white uppercase tracking-wider">{diff.name}</span>
                  </div>
                  <div className="text-[10px] text-white/40 uppercase tracking-widest space-y-1">
                    <div>Hit Score: +{diff.hitScore}</div>
                    <div>Targets: {diff.maxTargets} Max</div>
                    <div>Spawn: {diff.spawnRate}ms</div>
                    {diff.penalty > 0 && <div className="text-red-400/60">Miss Penalty: -{diff.penalty}</div>}
                  </div>
                </div>
                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                  {diff.id === 'easy' && <Activity size={48} />}
                  {diff.id === 'medium' && <AimIcon size={48} />}
                  {diff.id === 'hard' && <Flame size={48} />}
                  {diff.id === 'impossible' && <Skull size={48} />}
                </div>
              </button>
            ))}
          </div>

          <div className="flex justify-center gap-6 text-[10px] text-white/30 uppercase tracking-[0.2em]">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-white/40 rounded-full" />
              <span>LMB: Fire</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-white/40 rounded-full" />
              <span>R: Reload</span>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-[#0a0a0a] overflow-hidden flex flex-col items-center justify-center font-sans select-none cursor-none">
      {/* Background Atmosphere */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#1a1a1a_0%,#050505_100%)]" />
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
      </div>

      {/* Game Canvas */}
      <div 
        className="relative z-10 w-full max-w-5xl aspect-video bg-[#111] rounded-xl border border-white/10 shadow-2xl overflow-hidden will-change-transform"
      >
          <canvas
            ref={canvasRef}
            width={1280}
            height={720}
            className="w-full h-full"
            onMouseDown={() => { isMouseDownRef.current = true; }}
            onMouseUp={() => { isMouseDownRef.current = false; }}
            onMouseLeave={() => { isMouseDownRef.current = false; }}
            onMouseMove={(e) => {
              const rect = canvasRef.current?.getBoundingClientRect();
              if (rect) {
                setMousePos({
                  x: e.clientX - rect.left,
                  y: e.clientY - rect.top,
                });
              }
            }}
          />

        {/* Custom Crosshair */}
        <div 
          className="absolute pointer-events-none z-20"
          style={{ 
            left: mousePos.x, 
            top: mousePos.y,
            transform: 'translate(-50%, -50%)'
          }}
        >
          <div
            className="relative"
            style={{
              transform: `scale(${gameState.recoil > 0 ? 1.5 : 1})`,
              opacity: 0.8,
              color: showHitmarker ? '#ef4444' : '#ffffff',
              transition: 'transform 0.1s ease-out'
            }}
          >
            <Crosshair size={32} strokeWidth={1} />
            <AnimatePresence>
              {showHitmarker && (
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1.2, opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <div className="w-4 h-4 border-2 border-red-500 rotate-45" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Reload Overlay */}
        <AnimatePresence>
          {gameState.isReloading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-30 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            >
              <div className="text-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  className="mb-4 inline-block"
                >
                  <Zap className="text-yellow-500" size={48} />
                </motion.div>
                <h2 className="text-2xl font-bold text-white tracking-widest uppercase">Reloading...</h2>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Low Ammo Warning */}
        <AnimatePresence>
          {gameState.ammo === 0 && !gameState.isReloading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30"
            >
              <Badge variant="destructive" className="px-6 py-2 text-lg animate-pulse">
                PRESS 'R' TO RELOAD
              </Badge>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* HUD */}
      <div className="mt-8 w-full max-w-5xl grid grid-cols-4 gap-4 px-4 z-20">
        {/* Score & Exchange */}
        <div className="bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1 text-white/50 uppercase text-[10px] font-bold tracking-widest">
              <TargetIcon size={12} />
              <span>Score</span>
            </div>
            <div className="text-2xl font-mono font-bold text-white">
              {gameState.score.toLocaleString().padStart(6, '0')}
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExchange}
            disabled={gameState.score === 0}
            className="mt-2 bg-white/5 border-white/10 hover:bg-white/10 text-white text-[10px] h-7 uppercase tracking-widest"
          >
            <Coins size={12} className="mr-1" />
            Exchange
          </Button>
        </div>

        {/* Money & Shop */}
        <div className="bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1 text-white/50 uppercase text-[10px] font-bold tracking-widest">
              <Wallet size={12} />
              <span>Credits</span>
            </div>
            <div className="text-2xl font-mono font-bold text-green-500">
              ${gameState.money.toLocaleString()}
            </div>
          </div>
          
          <Dialog open={isShopOpen} onOpenChange={setIsShopOpen}>
            <DialogTrigger 
              render={
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2 bg-green-500/10 border-green-500/20 hover:bg-green-500/20 text-green-500 text-[10px] h-7 uppercase tracking-widest"
                >
                  <ShoppingCart size={12} className="mr-1" />
                  Armory
                </Button>
              }
            />
            <DialogContent className="bg-[#0f0f0f] border-white/10 text-white max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold tracking-tighter uppercase flex items-center gap-2">
                  <ShieldAlert className="text-green-500" />
                  Tactical Armory
                </DialogTitle>
              </DialogHeader>
              <ScrollArea className="h-[400px] pr-4">
                <div className="grid grid-cols-2 gap-4 py-4">
                  {Object.values(GUNS).map((gun) => {
                    const isOwned = gameState.ownedGuns.includes(gun.id);
                    const isEquipped = gameState.currentGun.id === gun.id;
                    const currentPrice = gun.price * gameState.difficulty.priceMultiplier;
                    
                    return (
                      <div 
                        key={gun.id}
                        className={`p-4 rounded-xl border transition-all ${
                          isEquipped 
                            ? 'bg-green-500/10 border-green-500' 
                            : 'bg-white/5 border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold text-lg uppercase tracking-tight">{gun.name}</h3>
                          {isEquipped && <Badge className="bg-green-500 text-black">Equipped</Badge>}
                        </div>
                        
                        <div className="space-y-2 mb-4 text-xs text-white/60">
                          <div className="flex justify-between">
                            <span>Magazine</span>
                            <span className="text-white">{gun.maxAmmo} Rounds</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Fire Rate</span>
                            <span className="text-white">{Math.round(1000 / gun.fireRate)} RPS</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Reload Time</span>
                            <span className="text-white">{(gun.reloadTime / 1000).toFixed(1)}s</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Recoil</span>
                            <span className="text-white">{gun.recoilAmount} Units</span>
                          </div>
                        </div>

                        <Button 
                          className="w-full uppercase tracking-widest text-[10px] font-bold"
                          variant={isOwned ? "outline" : "default"}
                          disabled={!isOwned && gameState.money < currentPrice}
                          onClick={() => handleBuyGun(gun)}
                        >
                          {isOwned ? (
                            isEquipped ? <><CheckCircle2 size={12} className="mr-1" /> Active</> : "Equip"
                          ) : (
                            <><Coins size={12} className="mr-1" /> Buy ${currentPrice.toLocaleString()}</>
                          )}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        </div>

        {/* Ammo */}
        <div className="bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-md relative overflow-hidden">
          <div className="flex items-center gap-2 mb-1 text-white/50 uppercase text-[10px] font-bold tracking-widest">
            <Zap size={12} />
            <span>{gameState.currentGun.name} Ammo</span>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-mono font-bold text-white">{gameState.ammo}</span>
            <span className="text-sm font-mono text-white/30 mb-0.5">/ {gameState.maxAmmo}</span>
          </div>
          <Progress 
            value={(gameState.ammo / gameState.maxAmmo) * 100} 
            className="h-1 mt-3 bg-white/10" 
          />
        </div>

        {/* Leave Range */}
        <div className="bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-md flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-1 text-white/50 uppercase text-[10px] font-bold tracking-widest">
            <ShieldAlert size={12} />
            <span>Exit Simulation</span>
          </div>
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={handleLeaveRange}
            disabled={gameState.money < 100000}
            className="mt-2 bg-red-500/10 border-red-500/20 hover:bg-red-500/20 text-red-500 text-[10px] h-7 uppercase tracking-widest"
          >
            <ShieldAlert size={12} className="mr-1" />
            Leave Range ($100k)
          </Button>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-8 text-white/20 text-[10px] uppercase tracking-[0.3em] font-bold">
        Tactical Range Simulator v1.0.4 // Authorized Personnel Only
      </div>
    </div>
  );
};
