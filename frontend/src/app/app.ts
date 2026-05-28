import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.html',
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
})
export class App {

  brandLogo: string = 'images/logoLetter.png';
  brandLogo2: string = 'images/logoCup.png'; 

}
