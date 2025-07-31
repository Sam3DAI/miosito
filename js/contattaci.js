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

    const modal = document.getElementById('thank-you-modal');

    const closeModalBtn = document.getElementById('close-modal');

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

    // Gestione Form con AJAX e Modal

    contactForm.addEventListener('submit', async (e) => {

        e.preventDefault(); // Previeni submit tradizionale

        let valid = true;

        // Validazione campi required

        const requiredFields = contactForm.querySelectorAll('[required]');

        requiredFields.forEach(field => {

            if (!field.value.trim() && field.type !== 'checkbox') {

                field.classList.add('error');

                valid = false;

            } else if (field.id === 'privacy' && !field.checked) {

                field.classList.add('error');

                valid = false;

            } else {

                field.classList.remove('error');

            }

        });

        // Validazione servizi (almeno uno checked)

        const servicesChecked = contactForm.querySelectorAll('input[name="services[]"]:checked').length;

        if (servicesChecked === 0) {

            alert('Seleziona almeno un servizio di interesse.');

            valid = false;

        }

        if (!valid) {

            return;

        }

        // Invia via AJAX

        const formData = new FormData(contactForm);

        try {

            const response = await fetch(contactForm.action, {

                method: 'POST',

                body: formData

            });

            if (response.ok) {

                // Mostra modal

                modal.classList.add('show');

                modal.setAttribute('aria-hidden', 'false');

                closeModalBtn.focus(); // Accessibilità: focus su bottone chiudi

                contactForm.reset(); // Reset form

            } else {

                alert('Errore durante l\'invio. Riprova più tardi.');

            }

        } catch (error) {

            alert('Errore di connessione. Controlla la tua rete e riprova.');

        }

    });

    // Chiudi Modal

    closeModalBtn.addEventListener('click', () => {

        modal.classList.remove('show');

        modal.setAttribute('aria-hidden', 'true');

    });

    // Chiudi con click overlay o ESC

    modal.addEventListener('click', (e) => {

        if (e.target === modal) {

            modal.classList.remove('show');

            modal.setAttribute('aria-hidden', 'true');

        }

    });

    document.addEventListener('keydown', (e) => {

        if (e.key === 'Escape' && modal.classList.contains('show')) {

            modal.classList.remove('show');

            modal.setAttribute('aria-hidden', 'true');

        }

    });

    // Carousel Testimonials

    leftArrow.addEventListener('click', () => {

        testimonialsCarousel.scrollBy({ left: -320, behavior: 'smooth' });

    });

    rightArrow.addEventListener('click', () => {

        testimonialsCarousel.scrollBy({ left: 320, behavior: 'smooth' });

    });

});