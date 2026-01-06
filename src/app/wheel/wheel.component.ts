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
            if (this.ctx) {
                this.drawWheel(options);
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

    private drawWheel(options: string[]) {
        const ctx = this.ctx;
        const centerX = this.canvasSize / 2;
        const centerY = this.canvasSize / 2;
        const radius = this.canvasSize / 2 - 8;

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

        const segmentAngle = (2 * Math.PI) / options.length;

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

        options.forEach((option, index) => {
            const startAngle = index * segmentAngle - Math.PI / 2;
            const endAngle = startAngle + segmentAngle;

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

            // Draw text
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(startAngle + segmentAngle / 2);

            // Text styling - dark text for better readability on colorful backgrounds
            ctx.fillStyle = '#1A1A1A';
            ctx.font = '600 13px Inter, sans-serif';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';

            // Truncate long text based on segment size
            const maxChars = options.length > 8 ? 10 : 14;
            const displayText = option.length > maxChars
                ? option.substring(0, maxChars) + '...'
                : option;

            // Position text with some padding from edge
            const textRadius = radius - 25;
            ctx.fillText(displayText, textRadius, 0);
            ctx.restore();
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
