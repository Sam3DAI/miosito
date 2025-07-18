document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.querySelector('.hamburger');
    const mobileMenu = document.getElementById('mobile-menu');
    const menuLinks = mobileMenu.querySelectorAll('a');
    const themeToggle = document.querySelector('.theme-toggle');
    const body = document.body;
    const header = document.querySelector('header');
    const sunIcon = document.querySelector('.theme-icon.sun');
    const moonIcon = document.querySelector('.theme-icon.moon');
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
            if (carouselWrapper.scrollLeft === 0) {
                carouselWrapper.scrollTo({ left: carouselWrapper.scrollWidth, behavior: 'smooth' });
            }
        });

        rightArrow.addEventListener('click', () => {
            carouselWrapper.scrollBy({
                left: 300,
                behavior: 'smooth'
            });
            if (carouselWrapper.scrollLeft + carouselWrapper.clientWidth >= carouselWrapper.scrollWidth) {
                carouselWrapper.scrollTo({ left: 0, behavior: 'smooth' });
            }
        });
    });

    function toggleMenu() {
        hamburger.classList.toggle('active');
        mobileMenu.classList.toggle('open');
    }

    hamburger.addEventListener('click', toggleMenu);
    menuLinks.forEach(link => link.addEventListener('click', toggleMenu));

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

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    const barChartOptions = {
        chart: {
            type: 'bar',
            height: 350,
            animations: {
                enabled: true,
                easing: 'easeinout',
                speed: 2000,
                animateGradually: {
                    enabled: true,
                    delay: 300
                },
                dynamicAnimation: {
                    enabled: true,
                    speed: 700
                }
            },
            toolbar: {
                show: false
            }
        },
        plotOptions: {
            bar: {
                horizontal: true,
                barHeight: '70%',
                distributed: true,
            }
        },
        dataLabels: {
            enabled: false
        },
        series: [{
            data: [85, 90, 80, 75]
        }],
        xaxis: {
            categories: ['Efficienza Operativa', 'Precisione dei Dati', 'Risparmio di Tempo', 'Soddisfazione Clienti'],
            labels: {
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
        grid: {
            show: false
        },
        colors: ['#45b6fe', '#6a9bfe', '#8f80fe', '#d95bc5'],
        tooltip: {
            y: {
                formatter: function(val) {
                    return val + "%";
                }
            }
        }
    };

    const whyChooseSection = document.getElementById('why-choose');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                const statsChart = new ApexCharts(document.querySelector("#stats-chart"), barChartOptions);
                statsChart.render();
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    observer.observe(whyChooseSection);
});