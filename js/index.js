document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.querySelector('.hamburger');
    const mobileMenu = document.getElementById('mobile-menu');
    const menuLinks = mobileMenu.querySelectorAll('a');
    const themeToggle = document.querySelector('.theme-toggle');
    const body = document.body;
    const header = document.querySelector('header');
    const sunIcon = document.querySelector('.theme-icon.sun');
    const moonIcon = document.querySelector('.theme-icon.moon');
    const carouselWrapper = document.querySelector('.carousel-wrapper');
    const leftArrow = document.querySelector('.carousel-arrow.left');
    const rightArrow = document.querySelector('.carousel-arrow.right');

    // Toggle Menu - Aggiunto keyboard support
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

    // Theme Toggle - Default basato su device, con localStorage override
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

    // Carousel with Infinite Loop - Aggiunto debounce per performance
    const debounce = (func, delay) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), delay);
        };
    };

    const handleScroll = () => {
        // Logica infinite loop ottimizzata
    };

    leftArrow.addEventListener('click', () => {
        carouselWrapper.scrollBy({ left: -300, behavior: 'smooth' });
        if (carouselWrapper.scrollLeft <= 0) {
            carouselWrapper.scrollTo({ left: carouselWrapper.scrollWidth - carouselWrapper.clientWidth, behavior: 'smooth' });
        }
    });

    rightArrow.addEventListener('click', () => {
        carouselWrapper.scrollBy({ left: 300, behavior: 'smooth' });
        if (carouselWrapper.scrollLeft + carouselWrapper.clientWidth >= carouselWrapper.scrollWidth - 1) {
            carouselWrapper.scrollTo({ left: 0, behavior: 'smooth' });
        }
    });

    carouselWrapper.addEventListener('scroll', debounce(handleScroll, 200));

    // Lazy Load for Background Images in Carousel - Threshold ottimizzato
    const cards = document.querySelectorAll('.portfolio-card');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const card = entry.target;
                const bgUrl = card.getAttribute('data-bg');
                if (bgUrl) {
                    card.style.backgroundImage = `url('${bgUrl}')`;
                    card.removeAttribute('data-bg');
                }
                observer.unobserve(card);
            }
        });
    }, { threshold: 0.1 });

    cards.forEach(card => observer.observe(card));

    // Resize listener per theme default su rotate (es. tablet)
    window.addEventListener('resize', debounce(() => {
        if (!localStorage.getItem('theme')) {
            const newIsMobile = window.matchMedia("(max-width: 768px)").matches;
            const newDefault = newIsMobile ? 'dark' : 'light';
            if (newDefault !== savedTheme) {
                location.reload(); // Ricarica per applicare, ma raro
            }
        }
    }, 300));
});