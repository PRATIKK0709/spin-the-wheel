import { Injectable, signal, computed } from '@angular/core';

export interface ConfettiParticle {
  x: number;
  y: number;
  size: number;
  color: string;
  rotation: number;
  speedX: number;
  speedY: number;
  rotationSpeed: number;
  shape: 'rect' | 'circle' | 'star';
  opacity: number;
  wobble: number;
  wobbleSpeed: number;
}

@Injectable({
  providedIn: 'root'
})
export class WheelService {
  private _options = signal<string[]>(['Option 1', 'Option 2', 'Option 3']);
  private _winner = signal<string | null>(null);
  private _isSpinning = signal<boolean>(false);
  private _rotation = signal<number>(0);
  private _showConfetti = signal<boolean>(false);

  private _shouldRemoveWinner = signal<boolean>(false);
  private _isRemoving = signal<boolean>(false);
  private _winnerIndex = signal<number>(-1);

  options = computed(() => this._options());
  winner = computed(() => this._winner());
  isSpinning = computed(() => this._isSpinning());
  rotation = computed(() => this._rotation());
  showConfetti = computed(() => this._showConfetti());
  shouldRemoveWinner = computed(() => this._shouldRemoveWinner());
  isRemoving = computed(() => this._isRemoving());
  winnerIndex = computed(() => this._winnerIndex());

  // Confetti colors - vibrant celebration colors
  private confettiColors = [
    '#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3',
    '#F38181', '#AA96DA', '#FCBAD3', '#A8D8EA',
    '#FF9F43', '#6BCB77', '#4D96FF', '#FFD93D',
    '#FF4757', '#2ED573', '#1E90FF', '#FF6348'
  ];

  setOptions(options: string[]) {
    const filtered = options.filter(opt => opt.trim().length > 0);
    this._options.set(filtered);
    this._winner.set(null);
    this._winnerIndex.set(-1);
  }

  toggleRemoveWinner() {
    this._shouldRemoveWinner.update(v => !v);
  }

  completeRemoval() {
    const idx = this._winnerIndex();
    if (idx !== -1) {
      this._options.update(opts => opts.filter((_, i) => i !== idx));
      this._winner.set(null);
      this._winnerIndex.set(-1);
    }
    this._isRemoving.set(false);
  }

  parseInput(input: string): string[] {
    const delimiters = /[,;\n|]+/;
    return input
      .split(delimiters)
      .map(opt => opt.trim())
      .filter(opt => opt.length > 0);
  }

  spin(): Promise<string> {
    return new Promise((resolve) => {
      if (this._isSpinning() || this._options().length === 0) {
        resolve('');
        return;
      }

      this._isSpinning.set(true);
      this._winner.set(null);
      this._winnerIndex.set(-1);
      this._showConfetti.set(false);
      this._isRemoving.set(false);

      const options = this._options();
      const segmentAngle = 360 / options.length;

      const spins = 6 + Math.floor(Math.random() * 3);
      const randomOffset = Math.random() * 360;
      const totalRotation = this._rotation() + (spins * 360) + randomOffset;

      this._rotation.set(totalRotation);

      setTimeout(() => {
        const normalizedRotation = totalRotation % 360;
        const pointerAngle = (360 - normalizedRotation + 360) % 360;
        let winnerIndex = Math.floor(pointerAngle / segmentAngle);
        winnerIndex = winnerIndex % options.length;

        const winner = options[winnerIndex];

        this._winner.set(winner);
        this._winnerIndex.set(winnerIndex);
        this._isSpinning.set(false);
        this._showConfetti.set(true);

        if (this._shouldRemoveWinner()) {
          // Delay removal start to allow user to see the winner on the wheel
          setTimeout(() => {
            this._isRemoving.set(true);
            // Component will handle animation and call completeRemoval()
          }, 4000);
        }

        setTimeout(() => {
          this._showConfetti.set(false);
        }, 5000);

        resolve(winner);
      }, 5000);
    });
  }

  generateConfetti(count: number = 250): ConfettiParticle[] {
    const particles: ConfettiParticle[] = [];
    const shapes: ('rect' | 'circle' | 'star')[] = ['rect', 'circle', 'star'];

    for (let i = 0; i < count; i++) {
      // Spread particles across the width with some concentration in center
      const xSpread = Math.random() < 0.6
        ? 30 + Math.random() * 40  // 60% in center area
        : Math.random() * 100;      // 40% anywhere

      particles.push({
        x: xSpread,
        y: -20 - Math.random() * 100, // Start above screen at varying heights
        size: 5 + Math.random() * 10,
        color: this.confettiColors[Math.floor(Math.random() * this.confettiColors.length)],
        rotation: Math.random() * 360,
        speedX: (Math.random() - 0.5) * 4,
        speedY: 1 + Math.random() * 3,
        rotationSpeed: (Math.random() - 0.5) * 15,
        shape: shapes[Math.floor(Math.random() * shapes.length)],
        opacity: 0.8 + Math.random() * 0.2,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.05 + Math.random() * 0.1
      });
    }
    return particles;
  }

  reset() {
    this._winner.set(null);
    this._rotation.set(0);
    this._showConfetti.set(false);
  }
}
