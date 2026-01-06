import { Component, inject, ElementRef, ViewChild, AfterViewInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WheelService } from '../services/wheel.service';

@Component({
    selector: 'app-wheel',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './wheel.component.html',
    styleUrl: './wheel.component.css'
})
export class WheelComponent implements AfterViewInit {
    @ViewChild('wheelCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

    wheelService = inject(WheelService);

    private ctx!: CanvasRenderingContext2D;
    private canvasSize = 380;
    private dpr = 1;
    private dissolveAlpha = 1;
    private collapseProgress = 0;
    private animationFrameId: number | null = null;

    // Vibrant standard wheel colors
    private colors = [
        '#FF6B6B', // Coral Red
        '#4ECDC4', // Teal
        '#FFE66D', // Sunny Yellow
        '#95E1D3', // Mint
        '#F38181', // Salmon
        '#AA96DA', // Lavender
        '#FCBAD3', // Pink
        '#A8D8EA', // Sky Blue
        '#FF9F43', // Orange
        '#6BCB77', // Green
        '#4D96FF', // Blue
        '#FFD93D', // Gold
    ];

    constructor() {
        effect(() => {
            const options = this.wheelService.options();
            const isRemoving = this.wheelService.isRemoving();

            if (this.ctx) {
                if (isRemoving) {
                    this.startDissolveAnimation();
                } else {
                    this.stopAnimation();
                    this.dissolveAlpha = 1;
                    this.collapseProgress = 0;
                    this.drawWheel(options);
                }
            }
        });
    }

    ngAfterViewInit() {
        const canvas = this.canvasRef.nativeElement;
        this.ctx = canvas.getContext('2d')!;

        // Handle retina displays for crisp rendering
        this.dpr = window.devicePixelRatio || 1;

        // Set actual canvas size (scaled for retina)
        canvas.width = this.canvasSize * this.dpr;
        canvas.height = this.canvasSize * this.dpr;

        // Scale canvas back down with CSS
        canvas.style.width = this.canvasSize + 'px';
        canvas.style.height = this.canvasSize + 'px';

        // Scale the drawing context
        this.ctx.scale(this.dpr, this.dpr);

        this.drawWheel(this.wheelService.options());
    }

    private startDissolveAnimation() {
        let startTime: number | null = null;
        const duration = 600; // ms

        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const elapsed = timestamp - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Ease out cubic
            const ease = 1 - Math.pow(1 - progress, 3);
            this.dissolveAlpha = 1 - ease;

            this.drawWheel(this.wheelService.options());

            if (progress < 1) {
                this.animationFrameId = requestAnimationFrame(animate);
            } else {
                // Dissolve done, start collapse if more than 1 option remains
                if (this.wheelService.options().length > 1) {
                    this.startCollapseAnimation();
                } else {
                    this.wheelService.completeRemoval();
                }
            }
        };

        this.animationFrameId = requestAnimationFrame(animate);
    }

    private startCollapseAnimation() {
        let startTime: number | null = null;
        const duration = 800; // ms

        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const elapsed = timestamp - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Ease in-out cubic for smooth gap closing
            const ease = progress < 0.5
                ? 4 * progress * progress * progress
                : 1 - Math.pow(-2 * progress + 2, 3) / 2;

            this.collapseProgress = ease;
            this.drawWheel(this.wheelService.options());

            if (progress < 1) {
                this.animationFrameId = requestAnimationFrame(animate);
            } else {
                this.wheelService.completeRemoval();
                this.collapseProgress = 0;
            }
        };

        this.animationFrameId = requestAnimationFrame(animate);
    }

    private stopAnimation() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    private drawWheel(options: string[]) {
        const ctx = this.ctx;
        const centerX = this.canvasSize / 2;
        const centerY = this.canvasSize / 2;
        const radius = this.canvasSize / 2 - 8;
        const winnerIndex = this.wheelService.winnerIndex();

        // Clear canvas
        ctx.clearRect(0, 0, this.canvasSize, this.canvasSize);

        if (options.length === 0) {
            // Draw empty wheel placeholder
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
            ctx.fillStyle = '#F5F5F5';
            ctx.fill();
            ctx.strokeStyle = '#E0E0E0';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.fillStyle = '#999999';
            ctx.font = '500 16px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Add options to spin', centerX, centerY);
            return;
        }

        // Draw outer shadow/glow
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
        ctx.shadowBlur = 20;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 4;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
        ctx.restore();

        // Calculate angles
        const n = options.length;
        const baseAngle = (2 * Math.PI) / n;
        const targetAngle = n > 1 ? (2 * Math.PI) / (n - 1) : 0;

        let currentRotation = -Math.PI / 2; // Start from top

        options.forEach((option, index) => {
            const isWinner = index === winnerIndex;

            // Calculate slice angle based on collapse progress
            let currentSliceAngle: number;

            if (this.collapseProgress > 0 && winnerIndex !== -1) {
                if (isWinner) {
                    // Winner shrinks to 0
                    currentSliceAngle = baseAngle * (1 - this.collapseProgress);
                } else {
                    // Others grow to fill
                    currentSliceAngle = baseAngle + (targetAngle - baseAngle) * this.collapseProgress;
                }
            } else {
                currentSliceAngle = baseAngle;
            }

            // Only draw if angle is significant
            if (currentSliceAngle > 0.01) {
                const startAngle = currentRotation;
                const endAngle = startAngle + currentSliceAngle;

                // Apply dissolve alpha ONLY if this is the winner AND we are removing it
                const alpha = (isWinner && this.wheelService.isRemoving()) ? this.dissolveAlpha : 1;

                ctx.save();
                ctx.globalAlpha = alpha;

                // Draw segment
                ctx.beginPath();
                ctx.moveTo(centerX, centerY);
                ctx.arc(centerX, centerY, radius, startAngle, endAngle);
                ctx.closePath();

                ctx.fillStyle = this.colors[index % this.colors.length];
                ctx.fill();

                // Draw segment border
                ctx.strokeStyle = '#FFFFFF';
                ctx.lineWidth = 2;
                ctx.stroke();

                // Draw text handling
                ctx.save();
                ctx.translate(centerX, centerY);
                ctx.rotate(startAngle + currentSliceAngle / 2);

                if (isWinner && this.dissolveAlpha < 0.5) {
                    // Don't draw text if mostly dissolved
                } else {
                    // Text styling
                    ctx.fillStyle = '#1A1A1A';
                    ctx.font = '600 13px Inter, sans-serif';
                    ctx.textAlign = 'right';
                    ctx.textBaseline = 'middle';

                    // Truncate based on size
                    const maxChars = options.length > 8 ? 10 : 14;
                    const displayText = option.length > maxChars
                        ? option.substring(0, maxChars) + '...'
                        : option;

                    const textRadius = radius - 25;
                    ctx.fillText(displayText, textRadius, 0);
                }
                ctx.restore();
                ctx.restore(); // Restore globalAlpha
            }

            // Advance rotation
            currentRotation += currentSliceAngle;
        });

        // Draw center circle with gradient
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 30);
        gradient.addColorStop(0, '#FFFFFF');
        gradient.addColorStop(1, '#F0F0F0');

        ctx.beginPath();
        ctx.arc(centerX, centerY, 28, 0, 2 * Math.PI);
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.strokeStyle = '#E5E5E5';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw inner dot
        ctx.beginPath();
        ctx.arc(centerX, centerY, 8, 0, 2 * Math.PI);
        ctx.fillStyle = '#333333';
        ctx.fill();
    }

    spin() {
        this.wheelService.spin();
    }
}
