document.addEventListener('DOMContentLoaded', () => {
  const navbar = document.getElementById('navbar');
  const adminEntry = document.getElementById('adminEntry');

  if (adminEntry) {
    adminEntry.addEventListener('click', () => {
      const enteredCode = window.prompt('Code d’accès au panel administrateur :');
      if (enteredCode === null) return;
      if (!enteredCode.trim()) {
        window.alert('Saisis le code d’accès.');
        return;
      }

      sessionStorage.setItem('locksetAdminCode', enteredCode);
      window.location.href = 'admin.html';
    });
  }

  // Effet de compression de la navbar au scroll
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });
});

document.addEventListener('DOMContentLoaded', () => {
  const slides = document.querySelectorAll('.hero-slide');
  const dots = document.querySelectorAll('.dot');
  let currentSlide = 0;
  const slideInterval = 3000; // 3 secondes

  function goToSlide(index) {
    // Retirer la classe active de la slide et du dot actuels
    slides[currentSlide].classList.remove('active');
    dots[currentSlide].classList.remove('active');

    // Mettre à jour l'index
    currentSlide = index;

    // Ajouter la classe active au nouveau slide et dot
    slides[currentSlide].classList.add('active');
    dots[currentSlide].classList.add('active');
  }

  function nextSlide() {
    const newIndex = (currentSlide + 1) % slides.length;
    goToSlide(newIndex);
  }

  // Lancer le défilement automatique toutes les 3 secondes
  let autoSlide = setInterval(nextSlide, slideInterval);

  // Permettre au clic sur les dots de changer manuellement de slide
  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      clearInterval(autoSlide); // Réinitialiser le timer
      goToSlide(index);
      autoSlide = setInterval(nextSlide, slideInterval);
    });
  });
});

document.addEventListener('DOMContentLoaded', () => {
  const experienceSection = document.getElementById('experience');
  const stripTop = document.getElementById('stripTop');
  const stripBottom = document.getElementById('stripBottom');
  const centerObject = document.getElementById('centerObject');

  window.addEventListener('scroll', () => {
    const sectionRect = experienceSection.getBoundingClientRect();
    const sectionHeight = experienceSection.offsetHeight - window.innerHeight;
    
    // Calcul de la progression du scroll entre 0 et 1
    let progress = -sectionRect.top / sectionHeight;
    progress = Math.max(0, Math.min(1, progress));

    // 1. Déplacement de la bande du haut (gauche vers droite)
    stripTop.style.transform = `translateX(${progress * 350}px)`;

    // 2. Déplacement de la bande du bas (droite vers gauche)
    stripBottom.style.transform = `translateX(${-progress * 350}px)`;

    // 3. Apparition de l'objet central au milieu du défilement
    if (progress > 0.35 && progress < 0.7) {
      centerObject.classList.add('visible');
    } else {
      centerObject.classList.remove('visible');
    }

  });
});

document.addEventListener('DOMContentLoaded', () => {
  const gallerySection = document.getElementById('lookbook');
  if (!gallerySection) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let shuffleTimer;
  let dealTimer;

  const observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
      gallerySection.classList.add('is-active');

      if (reduceMotion) {
        gallerySection.classList.add('is-dealt');
        return;
      }

      shuffleTimer = window.setTimeout(() => {
        gallerySection.classList.add('is-shuffling');

        dealTimer = window.setTimeout(() => {
          gallerySection.classList.remove('is-shuffling');
          gallerySection.classList.add('is-dealt');
        }, 2000);
      }, 1000);
      return;
    }

    window.clearTimeout(shuffleTimer);
    window.clearTimeout(dealTimer);
    gallerySection.classList.remove('is-active', 'is-shuffling', 'is-dealt');
  }, { threshold: 0.2 });

  observer.observe(gallerySection);
});

document.addEventListener('DOMContentLoaded', () => {
  const year = document.getElementById('currentYear');
  const contactForm = document.getElementById('contactForm');
  const studioEmail = 'Locksetvous@email.com';

  if (year) year.textContent = new Date().getFullYear();
  if (!contactForm) return;

  contactForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const formData = new FormData(contactForm);
    const subject = `Demande de contact de ${formData.get('name')}`;
    const body = [
      `Nom : ${formData.get('name')}`,
      `E-mail : ${formData.get('email')}`,
      '',
      formData.get('message')
    ].join('\n');

    window.location.href = `mailto:${studioEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });
});