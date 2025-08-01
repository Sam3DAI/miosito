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

    // Toggle Menu - Keyboard support
    function toggleMenu() {
        hamburger.classList.toggle('active');
        mobileMenu.classList.toggle('open');
        hamburger.setAttribute('aria-expanded', hamburger.classList.contains('active'));
    }

    hamburger.addEventListener('click', toggleMenu);
    hamburger.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            toggleMenu();
        }
    });
    menuLinks.forEach(link => link.addEventListener('click', toggleMenu));

    // Theme Toggle - Default device-based
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    let savedTheme = localStorage.getItem('theme');

    if (!savedTheme) {
        savedTheme = isMobile ? 'dark' : 'light';
        localStorage.setItem('theme', savedTheme);
    }

    if (savedTheme === 'dark') {
        body.classList.add('dark-mode');
        sunIcon.style.display = 'none';
        moonIcon.style.display = 'block';
    } else {
        body.classList.remove('dark-mode');
        sunIcon.style.display = 'block';
        moonIcon.style.display = 'none';
    }

    themeToggle.addEventListener('click', () => {
        body.classList.toggle('dark-mode');
        const newTheme = body.classList.contains('dark-mode') ? 'dark' : 'light';
        localStorage.setItem('theme', newTheme);
        if (newTheme === 'dark') {
            sunIcon.style.display = 'none';
            moonIcon.style.display = 'block';
        } else {
            sunIcon.style.display = 'block';
            moonIcon.style.display = 'none';
        }
    });

    // Header Scroll Effect
    window.addEventListener('scroll', () => {
        header.classList.toggle('scrolled', window.scrollY > 50);
    });

    // Gestione Form con AJAX, validation avanzata
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        let valid = true;

        // Pulisci errori precedenti
        const errorSpans = contactForm.querySelectorAll('.error-message');
        errorSpans.forEach(span => span.textContent = '');

        // Validazione campi
        const name = document.getElementById('name');
        if (!name.value.trim()) {
            document.getElementById('name-error').textContent = 'Il nome è obbligatorio.';
            name.classList.add('error');
            valid = false;
        } else {
            name.classList.remove('error');
        }

        const email = document.getElementById('email');
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email.value.trim() || !emailRegex.test(email.value)) {
            document.getElementById('email-error').textContent = 'Inserisci una email valida.';
            email.classList.add('error');
            valid = false;
        } else {
            email.classList.remove('error');
        }

        const phone = document.getElementById('phone');
        const phoneRegex = /^[+]?[\d\s-]{9,15}$/;
        if (phone.value.trim() && !phoneRegex.test(phone.value)) {
            document.getElementById('phone-error').textContent = 'Inserisci un numero di telefono valido.';
            phone.classList.add('error');
            valid = false;
        } else {
            phone.classList.remove('error');
        }

        const servicesChecked = contactForm.querySelectorAll('input[name="services[]"]:checked').length;
        if (servicesChecked === 0) {
            document.getElementById('services-error').textContent = 'Seleziona almeno un servizio.';
            valid = false;
        }

        const message = document.getElementById('message');
        if (!message.value.trim()) {
            document.getElementById('message-error').textContent = 'Il messaggio è obbligatorio.';
            message.classList.add('error');
            valid = false;
        } else {
            message.classList.remove('error');
        }

        const privacy = document.getElementById('privacy');
        if (!privacy.checked) {
            document.getElementById('privacy-error').textContent = 'Accetta la Privacy Policy.';
            privacy.classList.add('error');
            valid = false;
        } else {
            privacy.classList.remove('error');
        }

        if (!valid) return;

        // Invia via AJAX
        const formData = new FormData(contactForm);
        try {
            const response = await fetch(contactForm.action, {
                method: 'POST',
                body: formData
            });
            if (response.ok) {
                modal.classList.add('show');
                modal.setAttribute('aria-hidden', 'false');
                closeModalBtn.focus();
                contactForm.reset();
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

    // Carousel Testimonials - Infinite loop
    leftArrow.addEventListener('click', () => {
        testimonialsCarousel.scrollBy({ left: -320, behavior: 'smooth' });
        if (testimonialsCarousel.scrollLeft <= 0) {
            testimonialsCarousel.scrollTo({ left: testimonialsCarousel.scrollWidth - testimonialsCarousel.clientWidth, behavior: 'smooth' });
        }
    });

    rightArrow.addEventListener('click', () => {
        testimonialsCarousel.scrollBy({ left: 320, behavior: 'smooth' });
        if (testimonialsCarousel.scrollLeft + testimonialsCarousel.clientWidth >= testimonialsCarousel.scrollWidth - 1) {
            testimonialsCarousel.scrollTo({ left: 0, behavior: 'smooth' });
        }
    });

    // Debounce per resize/theme
    const debounce = (func, delay) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), delay);
        };
    };

    window.addEventListener('resize', debounce(() => {
        if (!localStorage.getItem('theme')) {
            location.reload();
        }
    }, 300));
});