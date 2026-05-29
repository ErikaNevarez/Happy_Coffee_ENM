import { Component } from '@angular/core';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [],
  template: `
    <div class="home-container">
        <img
            [src]="homeImages.src"
            [alt]="homeImages.alt"
            class="home-image"
        >
    </div>  
  `,
})
export class HomePageComponent{

  homeImages={
    src: 'https://images.unsplash.com/photo-1562815240-be666d2600ce?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8Y2FmZXRlcmlhfGVufDB8fDB8fHww', 
    alt:'Cafecito Feliz'}; 
  
  }


