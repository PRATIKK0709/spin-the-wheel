import { Component, inject } from '@angular/core';
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
