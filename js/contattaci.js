document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.querySelector('.hamburger');
    const mobileMenu = document.getElementById('mobile-menu');
    const menuLinks = mobileMenu.querySelectorAll('a');
    const themeToggle = document.querySelector('.theme-toggle');
    const body = document.body;
    const header = document.querySelector('header');
    const sunIcon = document.querySelector('.theme-icon.sun');
    const moonIcon = document.querySelector('.theme-icon.moon');
    const contactForm = document.getElementById('contact-form');
    const testimonialsCarousel = document.querySelector('.testimonials-carousel');
    const leftArrow = document.querySelector('.testimonials-section .carousel-arrow.left');
    const rightArrow = document.querySelector('.testimonials-section .carousel-arrow.right');

    // Toggle Menu (dalla home)
    function toggleMenu() {
        hamburger.classList.toggle('active');
        mobileMenu.classList.toggle('open');
    }

    hamburger.addEventListener('click', toggleMenu);
    menuLinks.forEach(link => link.addEventListener('click', toggleMenu));

    // Theme Toggle (dalla home)
    if (localStorage.getItem('theme') === 'dark') {
        body.classList.add('dark-mode');
        sunIcon.style.display = 'block';
        moonIcon.style.display = 'none';
    } else {
        body.classList.remove('dark-mode');
        sunIcon.style.display = 'none';
        moonIcon.style.display = 'block';
    }

    themeToggle.addEventListener('click', () => {
        body.classList.toggle('dark-mode');
        if (body.classList.contains('dark-mode')) {
            localStorage.setItem('theme', 'dark');
            sunIcon.style.display = 'block';
            moonIcon.style.display = 'none';
        } else {
            localStorage.setItem('theme', 'light');
            sunIcon.style.display = 'none';
            moonIcon.style.display = 'block';
        }
    });

    // Header Scroll Effect (dalla home)
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // Validazione Form Enhanced
    contactForm.addEventListener('submit', (e) => {
      let valid = true;
    const requiredFields = contactForm.querySelectorAll('[required]');
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            field.classList.add('error');
            valid = false;
        } else {
            field.classList.remove('error');
        }
    });
        const servicesChecked = contactForm.querySelectorAll('input[name="services[]"]:checked').length;
        if (servicesChecked === 0) {
            e.preventDefault();
            alert('Seleziona almeno un servizio di interesse.');
            return;
        }
        // Simulazione success con messaggio
        e.preventDefault(); // Per demo; rimuovi per real submit
        alert('Richiesta inviata con successo! Il nostro team ti contatterà presto.');
        contactForm.reset(); // Reset form post-submit
    });

    // Carousel Testimonials
    leftArrow.addEventListener('click', () => {
        testimonialsCarousel.scrollBy({ left: -320, behavior: 'smooth' });
    });

    rightArrow.addEventListener('click', () => {
        testimonialsCarousel.scrollBy({ left: 320, behavior: 'smooth' });
    });
});