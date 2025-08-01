document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.querySelector('.hamburger');
    const mobileMenu = document.getElementById('mobile-menu');
    const menuLinks = mobileMenu.querySelectorAll('a');
    const themeToggle = document.querySelector('.theme-toggle');
    const body = document.body;
    const header = document.querySelector('header');
    const sunIcon = document.querySelector('.theme-icon.sun');
    const moonIcon = document.querySelector('.theme-icon.moon');

    // Toggle Menu con keyboard
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

    // Theme Default: dark su mobile, light su desktop, con localStorage override
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
        updateModelBackground();
    });

    // Header Scroll
    window.addEventListener('scroll', () => {
        header.classList.toggle('scrolled', window.scrollY > 50);
    });

    // Carousel Infinite con debounce
    const carouselContainers = document.querySelectorAll('.carousel-container');
    const debounce = (func, delay) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), delay);
        };
    };

    carouselContainers.forEach(container => {
        const carouselWrapper = container.querySelector('.carousel-wrapper');
        const leftArrow = container.querySelector('.carousel-arrow.left');
        const rightArrow = container.querySelector('.carousel-arrow.right');

        let isScrolling = false;

        leftArrow.addEventListener('click', () => {
            if (isScrolling) return;
            isScrolling = true;
            carouselWrapper.scrollBy({ left: -300, behavior: 'smooth' });
            setTimeout(() => {
                if (carouselWrapper.scrollLeft <= 0) {
                    carouselWrapper.scrollTo({ left: carouselWrapper.scrollWidth - carouselWrapper.clientWidth, behavior: 'smooth' });
                }
                isScrolling = false;
            }, 300);
        });

        rightArrow.addEventListener('click', () => {
            if (isScrolling) return;
            isScrolling = true;
            carouselWrapper.scrollBy({ left: 300, behavior: 'smooth' });
            setTimeout(() => {
                if (carouselWrapper.scrollLeft + carouselWrapper.clientWidth >= carouselWrapper.scrollWidth - 1) {
                    carouselWrapper.scrollTo({ left: 0, behavior: 'smooth' });
                }
                isScrolling = false;
            }, 300);
        });
    });

    // Sketchfab API Load con error handling
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
                    bianco: 'https://res.cloudinary.com/dqhbriryo/image/upload/v1752068874/bianco_sdebye.png?quality=auto&format=auto',
                    grigio: 'https://res.cloudinary.com/dqhbriryo/image/upload/v1752068859/grigio_iutpvj.png?quality=auto&format=auto',
                    bronzo: 'https://res.cloudinary.com/dqhbriryo/image/upload/v1752068893/bronzo_g23m36.png?quality=auto&format=auto',
                    nero: 'https://res.cloudinary.com/dqhbriryo/image/upload/v1752068910/nero_whga1l.png?quality=auto&format=auto'
                },
                background: {
                    'sfondo-nero-bronzo': 'https://res.cloudinary.com/dqhbriryo/image/upload/v1751981260/sfondo_iphone_viola_e_nero_qhggk6.webp?quality=auto&format=auto',
                    'sfondo-arancio-nero': 'https://res.cloudinary.com/dqhbriryo/image/upload/v1751981229/sfondo_iphone_nero_e_rosso_yzpl6h.webp?quality=auto&format=auto',
                    'sfondo-nero-blu': 'https://res.cloudinary.com/dqhbriryo/image/upload/v1751981196/sfondo_iphone_nero_e_bronzo_cmmt3h.webp?quality=auto&format=auto',
                    'sfondo-nero-viola': 'https://res.cloudinary.com/dqhbriryo/image/upload/v1751981244/sfondo_iphone_nero_e_blue_h6rgcb.webp?quality=auto&format=auto'
                }
            };

            const error = (err) => console.error('Errore API Sketchfab:', err);

            const success = (api) => {
                window.sketchfabAPI = api;
                api.start();
                api.addEventListener('viewerready', function() {
                    updateModelBackground();
                    api.getMaterialList((err, materials) => {
                        if (err) return console.error('Errore materiali:', err);
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

                    // Node Map per Airpods
                    api.getNodeMap((err, nodes) => {
                        if (err) return console.error('Errore nodi:', err);
                        const airpodsNode = Object.values(nodes).find(node => node.name === 'Airpods');
                        if (airpodsNode) {
                            const airpodsID = airpodsNode.instanceID;
                            api.hide(airpodsID); // Default hide
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
        .catch(err => console.error('Errore Sketchfab API:', err));

    // Update Model Background
    function updateModelBackground() {
        if (window.sketchfabAPI) {
            const isDarkMode = body.classList.contains('dark-mode');
            const color = isDarkMode ? { r: 0, g: 0, b: 0, a: 1 } : { r: 250/255, g: 250/255, b: 250/255, a: 1 };
            window.sketchfabAPI.setBackground(color);
        }
    }

    // Configuratore 2D
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

    // ApexCharts con stat aggiornate 2025
    const barChartOptions = {
        chart: {
            type: 'bar',
            height: 350,
            animations: {
                enabled: true,
                easing: 'easeinout',
                speed: 2000,
                animateGradually: { enabled: true, delay: 150 },
                dynamicAnimation: { enabled: true, speed: 350 }
            },
            toolbar: { show: false }
        },
        plotOptions: {
            bar: { horizontal: true, barHeight: '75%', distributed: true }
        },
        dataLabels: { enabled: false },
        series: [{ data: [82, 94, 66, 40] }], // Aggiornato: engagement 82%, conversion 94%, satisfaction 66%, returns -40%
        xaxis: {
            categories: ['Engagement Utenti', 'Tasso di Conversione', 'Soddisfazione Clienti', 'Riduzione Resi'],
            labels: { formatter: val => val + '%', style: { colors: '#6e6e73', fontSize: '14px' } },
            axisBorder: { show: false },
            axisTicks: { show: false }
        },
        yaxis: {
            labels: {
                formatter: value => {
                    if (value === 'Engagement Utenti') return ['Engagement', 'Utenti'];
                    if (value === 'Tasso di Conversione') return ['Tasso di', 'Conversione'];
                    if (value === 'Soddisfazione Clienti') return ['Soddisfazione', 'Clienti'];
                    return value;
                },
                style: { colors: '#6e6e73', fontSize: '14px' }
            },
            axisBorder: { show: false },
            axisTicks: { show: false }
        },
        colors: ['#45b6fe', '#6a9bfe', '#8f80fe', '#d95bc5'],
        grid: { show: false },
        tooltip: { enabled: false }
    };

    // Observer per chart
    const whyChooseSection = document.getElementById('why-choose');
    let statsChart = null;
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                if (statsChart) statsChart.destroy();
                statsChart = new ApexCharts(document.querySelector("#stats-chart"), barChartOptions);
                statsChart.render();
            } else {
                entry.target.classList.remove('visible');
            }
        });
    }, { threshold: 0.1 });

    observer.observe(whyChooseSection);

    // Resize per theme
    window.addEventListener('resize', debounce(() => {
        if (!localStorage.getItem('theme')) {
            const newIsMobile = window.matchMedia("(max-width: 768px)").matches;
            const newDefault = newIsMobile ? 'dark' : 'light';
            if (newDefault !== savedTheme) {
                location.reload();
            }
        }
    }, 300));
});