import { Component, ViewChild, ElementRef, AfterViewInit, OnDestroy, effect, inject } from '@angular/core';
import { WheelComponent } from './wheel/wheel.component';
import { InputPanelComponent } from './input-panel/input-panel.component';
import { WheelService, ConfettiParticle } from './services/wheel.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [WheelComponent, InputPanelComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements AfterViewInit, OnDestroy {
  @ViewChild('confettiCanvas') confettiCanvasRef!: ElementRef<HTMLCanvasElement>;

  title = 'Spin The Wheel';
  wheelService = inject(WheelService);

  private confettiCtx!: CanvasRenderingContext2D;
  private confettiParticles: ConfettiParticle[] = [];
  private confettiAnimationId: number | null = null;

  constructor() {
    effect(() => {
      const showConfetti = this.wheelService.showConfetti();
      if (showConfetti) {
        this.startConfetti();
      } else {
        this.stopConfetti();
      }
    });
  }

  ngAfterViewInit() {
    if (this.confettiCanvasRef) {
      const canvas = this.confettiCanvasRef.nativeElement;
      this.confettiCtx = canvas.getContext('2d')!;
      this.resizeConfettiCanvas();
      window.addEventListener('resize', () => this.resizeConfettiCanvas());
    }
  }

  ngOnDestroy() {
    this.stopConfetti();
    window.removeEventListener('resize', () => this.resizeConfettiCanvas());
  }

  private resizeConfettiCanvas() {
    if (this.confettiCanvasRef) {
      const canvas = this.confettiCanvasRef.nativeElement;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
  }

  private startConfetti() {
    this.resizeConfettiCanvas();
    this.confettiParticles = this.wheelService.generateConfetti(300);
    this.animateConfetti();
  }

  private stopConfetti() {
    if (this.confettiAnimationId) {
      cancelAnimationFrame(this.confettiAnimationId);
      this.confettiAnimationId = null;
    }
    if (this.confettiCtx && this.confettiCanvasRef) {
      const canvas = this.confettiCanvasRef.nativeElement;
      this.confettiCtx.clearRect(0, 0, canvas.width, canvas.height);
    }
    this.confettiParticles = [];
  }

  private animateConfetti() {
    if (!this.confettiCtx || !this.confettiCanvasRef) return;

    const canvas = this.confettiCanvasRef.nativeElement;
    this.confettiCtx.clearRect(0, 0, canvas.width, canvas.height);

    let activeParticles = 0;

    this.confettiParticles.forEach(particle => {
      if (particle.y < canvas.height + 50) {
        activeParticles++;

        // Update wobble
        particle.wobble += particle.wobbleSpeed;

        // Update position with wobble effect
        particle.x += particle.speedX + Math.sin(particle.wobble) * 0.5;
        particle.y += particle.speedY;
        particle.rotation += particle.rotationSpeed;

        // Gravity and air resistance
        particle.speedY += 0.08;
        particle.speedX *= 0.99;

        // Slow down rotation over time
        particle.rotationSpeed *= 0.995;

        // Fade out near bottom
        if (particle.y > canvas.height * 0.7) {
          particle.opacity *= 0.98;
        }

        // Draw particle
        const x = (particle.x / 100) * canvas.width;
        const y = particle.y;

        this.confettiCtx.save();
        this.confettiCtx.translate(x, y);
        this.confettiCtx.rotate((particle.rotation * Math.PI) / 180);
        this.confettiCtx.globalAlpha = particle.opacity;
        this.confettiCtx.fillStyle = particle.color;

        // Draw different shapes
        switch (particle.shape) {
          case 'rect':
            this.confettiCtx.fillRect(
              -particle.size / 2,
              -particle.size / 4,
              particle.size,
              particle.size / 2
            );
            break;
          case 'circle':
            this.confettiCtx.beginPath();
            this.confettiCtx.arc(0, 0, particle.size / 3, 0, Math.PI * 2);
            this.confettiCtx.fill();
            break;
          case 'star':
            this.drawStar(0, 0, 5, particle.size / 2, particle.size / 4);
            break;
        }

        this.confettiCtx.restore();
      }
    });

    if (activeParticles > 0 && this.wheelService.showConfetti()) {
      this.confettiAnimationId = requestAnimationFrame(() => this.animateConfetti());
    }
  }

  private drawStar(cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number) {
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;

    this.confettiCtx.beginPath();
    this.confettiCtx.moveTo(cx, cy - outerRadius);

    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      this.confettiCtx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      this.confettiCtx.lineTo(x, y);
      rot += step;
    }

    this.confettiCtx.lineTo(cx, cy - outerRadius);
    this.confettiCtx.closePath();
    this.confettiCtx.fill();
  }
}
