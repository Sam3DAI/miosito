document.addEventListener('DOMContentLoaded', () => {

// Elementi del menu

const hamburger = document.querySelector('.hamburger');

const mobileMenu = document.getElementById('mobile-menu');

const menuLinks = mobileMenu.querySelectorAll('a');

const themeToggle = document.querySelector('.theme-toggle');

const body = document.body;

const header = document.querySelector('header');

const sunIcon = document.querySelector('.theme-icon.sun');

const moonIcon = document.querySelector('.theme-icon.moon');

// Funzionalità carosello multipli

const carouselContainers = document.querySelectorAll('.carousel-container');

carouselContainers.forEach(container => {

const carouselWrapper = container.querySelector('.carousel-wrapper');

const leftArrow = container.querySelector('.carousel-arrow.left');

const rightArrow = container.querySelector('.carousel-arrow.right');

leftArrow.addEventListener('click', () => {

carouselWrapper.scrollBy({

left: -300,

behavior: 'smooth'

});

});

rightArrow.addEventListener('click', () => {

carouselWrapper.scrollBy({

left: 300,

behavior: 'smooth'

});

});

});

// Funzione per toggle del menu

function toggleMenu() {

hamburger.classList.toggle('active');

mobileMenu.classList.toggle('open');

}

// Event listener per il menu

hamburger.addEventListener('click', toggleMenu);

menuLinks.forEach(link => link.addEventListener('click', toggleMenu));

// Carica il tema salvato

if (localStorage.getItem('theme') === 'dark') {

body.classList.add('dark-mode');

sunIcon.style.display = 'block';

moonIcon.style.display = 'none';

} else {

body.classList.remove('dark-mode');

sunIcon.style.display = 'none';

moonIcon.style.display = 'block';

}

// Toggle del tema

themeToggle.addEventListener('click', () => {

body.classList.toggle('dark-mode');

if (body.classList.contains('dark-mode')) {

localStorage.setItem('theme', 'dark');

sunIcon.style.display = 'block';

moonIcon.style.display = 'none';

updateModelBackground();

} else {

localStorage.setItem('theme', 'light');

sunIcon.style.display = 'none';

moonIcon.style.display = 'block';

updateModelBackground();

}

});

// Effetto scroll dell'header

window.addEventListener('scroll', () => {

if (window.scrollY > 50) {

header.classList.add('scrolled');

} else {

header.classList.remove('scrolled');

}

});

// Funzionalità Configuratore

const loadSketchfabAPI = () => {

return new Promise((resolve, reject) => {

const script = document.createElement('script');

script.src = 'https://static.sketchfab.com/api/sketchfab-viewer-1.12.1.js';

script.onload = resolve;

script.onerror = reject;

document.head.appendChild(script);

});

};

loadSketchfabAPI()

.then(() => {

const iframe = document.getElementById('api-frame');

const version = '1.12.1';

const uid = 'd8d8df55647a45c0beecc1b22e6b6c79';

const client = new Sketchfab(version, iframe);

const textures = {

color: {

bianco: 'https://res.cloudinary.com/dqhbriryo/image/upload/v1752068874/bianco_sdebye.png',

grigio: 'https://res.cloudinary.com/dqhbriryo/image/upload/v1752068859/grigio_iutpvj.png',

bronzo: 'https://res.cloudinary.com/dqhbriryo/image/upload/v1752068893/bronzo_g23m36.png',

nero: 'https://res.cloudinary.com/dqhbriryo/image/upload/v1752068910/nero_whga1l.png'

},

background: {

'sfondo-nero-bronzo': 'https://res.cloudinary.com/dqhbriryo/image/upload/v1751981260/sfondo_iphone_viola_e_nero_qhggk6.webp',

'sfondo-arancio-nero': 'https://res.cloudinary.com/dqhbriryo/image/upload/v1751981229/sfondo_iphone_nero_e_rosso_yzpl6h.webp',

'sfondo-nero-blu': 'https://res.cloudinary.com/dqhbriryo/image/upload/v1751981196/sfondo_iphone_nero_e_bronzo_cmmt3h.webp',

'sfondo-nero-viola': 'https://res.cloudinary.com/dqhbriryo/image/upload/v1751981244/sfondo_iphone_nero_e_blue_h6rgcb.webp'

}

};

const error = (err) => console.error('Errore API Sketchfab:', err);

const success = (api) => {

window.sketchfabAPI = api;

api.start();

api.addEventListener('viewerready', function() {

updateModelBackground();

api.getMaterialList((err, materials) => {

if (err) return console.error('Errore nel caricamento dei materiali:', err);

const relevantMaterials = {

scocca: ["scocca retro", "pulsanti", "box camere", "bordi laterali", "dettagli laterali e carica"],

schermo: "schermo"

};

const updateMaterialTexture = (materialName, textureUrl) => {

const material = materials.find(mat => mat.name === materialName);

if (material) {

api.addTexture(textureUrl, (err, textureUid) => {

if (!err) {

material.channels.AlbedoPBR.texture.uid = textureUid;

api.setMaterial(material);

}

});

}

};

const moveToAnnotation = (annotationIndex) => {

api.gotoAnnotation(annotationIndex);

};

document.querySelectorAll('.color-options input').forEach(input => {

input.addEventListener('click', () => {

const textureUrl = textures.color[input.id];

relevantMaterials.scocca.forEach(materialName => {

updateMaterialTexture(materialName, textureUrl);

});

moveToAnnotation(0);

});

});

document.querySelectorAll('.background-options input').forEach(input => {

input.addEventListener('click', () => {

const textureUrl = textures.background[input.id];

updateMaterialTexture(relevantMaterials.schermo, textureUrl);

moveToAnnotation(1);

});

});

});

// Ottieni Node Map per ID di "Airpods"

api.getNodeMap((err, nodes) => {

if (err) return console.error('Errore nel caricamento dei nodi:', err);

const airpodsNode = Object.values(nodes).find(node => node.name === 'Airpods');

if (airpodsNode) {

const airpodsID = airpodsNode.instanceID; // O matrixID se necessario

// Nascondi per default

api.hide(airpodsID);

// Toggle Event Listener

const toggle = document.getElementById('toggle-airpods');

toggle.addEventListener('change', () => {

if (toggle.checked) {

api.show(airpodsID);

} else {

api.hide(airpodsID);

}

});

} else {

console.warn('Nodo "Airpods" non trovato.');

}

});

});

};

client.init(uid, {

success,

error,

ui_infos: 0,

ui_controls: 0,

ui_stop: 0,

ui_watermark: 0,

ui_fullscreen: 0,

ui_annotations: 0,

ui_hint: 0,

transparent: 1,

});

})

.catch(err => console.error('Errore nel caricamento della Sketchfab API:', err));

// Aggiorna lo sfondo del modello

function updateModelBackground() {

if (window.sketchfabAPI) {

const isDarkMode = body.classList.contains('dark-mode');

const color = isDarkMode ? { r: 0, g: 0, b: 0, a: 1 } : { r: 250/255, g: 250/255, b: 250/255, a: 1 }; // HEX #000000 e #fafafa convertiti in RGB normalizzato

window.sketchfabAPI.setBackground(color);

}

}

// Funzionalità Configuratore 2D

document.querySelectorAll('.color-options-2d input').forEach(input => {

input.addEventListener('change', () => {

const productImage = document.getElementById('product-image-2d');

const selectedSwatch = input.nextElementSibling;

const newSrc = selectedSwatch.dataset.image;

const newAlt = `Prodotto Configurabile 2D - ${input.value.charAt(0).toUpperCase() + input.value.slice(1)}`;

productImage.style.opacity = 0;

setTimeout(() => {

productImage.src = newSrc;

productImage.alt = newAlt;

productImage.style.opacity = 1;

}, 300);

});

});

// Configurazione ApexCharts per l'Istogramma a Barre Orizzontali

const barChartOptions = {

chart: {

type: 'bar',

height: 350,

animations: {

enabled: true,

easing: 'easeinout',

speed: 2000, // Rallentato a 2 secondi

animateGradually: {

enabled: true,

delay: 150

},

dynamicAnimation: {

enabled: true,

speed: 350

}

},

toolbar: {

show: false

}

},

plotOptions: {

bar: {

horizontal: true,

barHeight: '75%', // Aumentata la distanza tra le barre

distributed: true,

}

},

dataLabels: {

enabled: false

},

series: [{

data: [66, 40, 66, 30]

}],

xaxis: {

categories: ['Engagement Utenti', 'Tasso di Conversione', 'Soddisfazione Clienti', 'Riduzione Resi'],

labels: {

formatter: function(val) { return val + '%'; },

style: {

colors: '#6e6e73',

fontSize: '14px'

}

},

axisBorder: {

show: false

},

axisTicks: {

show: false

}

},

yaxis: {

labels: {

formatter: function (value) {

if (value === 'Engagement Utenti') {

return ['Engagement', 'Utenti'];

} else if (value === 'Tasso di Conversione') {

return ['Tasso di', 'Conversione'];

} else if (value === 'Soddisfazione Clienti') {

return ['Soddisfazione', 'Clienti'];

}

return value;

},

style: {

colors: '#6e6e73',

fontSize: '14px'

}

},

axisBorder: {

show: false

},

axisTicks: {

show: false

}

},

colors: ['#45b6fe', '#6a9bfe', '#8f80fe', '#d95bc5'],

grid: {

show: false

},

tooltip: {

enabled: false

}

};

// Animazione Fade-In e rendering grafico quando visibile

const whyChooseSection = document.getElementById('why-choose');

let statsChart = null;

const observer = new IntersectionObserver((entries) => {

entries.forEach(entry => {

if (entry.isIntersecting) {

entry.target.classList.add('visible');

if (statsChart) {

statsChart.destroy();

}

statsChart = new ApexCharts(document.querySelector("#stats-chart"), barChartOptions);

statsChart.render();

} else {

entry.target.classList.remove('visible');

}

});

}, { threshold: 0.1 });

observer.observe(whyChooseSection);

});