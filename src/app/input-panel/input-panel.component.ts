import { Component, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WheelService } from '../services/wheel.service';

@Component({
    selector: 'app-input-panel',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './input-panel.component.html',
    styleUrl: './input-panel.component.css'
})
export class InputPanelComponent {
    wheelService = inject(WheelService);
    inputText = 'Option 1, Option 2, Option 3';

    constructor() {
        effect(() => {
            const options = this.wheelService.options();
            const currentParsed = this.wheelService.parseInput(this.inputText);

            // Sync input text if options change externally (e.g. winner removed)
            if (JSON.stringify(options) !== JSON.stringify(currentParsed)) {
                this.inputText = options.join('\n');
            }
        });

        // Initialize with default options
        this.updateOptions();
    }

    updateOptions() {
        const parsed = this.wheelService.parseInput(this.inputText);
        this.wheelService.setOptions(parsed);
    }

    onInputChange() {
        this.updateOptions();
    }

    clearInput() {
        this.inputText = '';
        this.wheelService.setOptions([]);
    }

    addSampleOptions() {
        this.inputText = 'Pizza\nBurger\nSushi\nTacos\nPasta';
        this.updateOptions();
    }
}
