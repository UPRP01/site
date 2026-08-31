document.addEventListener('DOMContentLoaded', function() {
    initializeSmoothScrolling();
    initializeCardAnimations();
    initializeImageModal();
    initializeModalMenu();
    if (navigator.maxTouchPoints > 0) {
        initializeMobileHover();
    }

});

//PARALLAX
function initializeSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}


//FLOATING ANI
function initializeCardAnimations() {
    const cards = document.querySelectorAll('.griditem');
    const observer = createIntersectionObserver();
    
    cards.forEach(card => {
        setupCardAnimation(card, observer);
    });
}

function createIntersectionObserver() {
    return new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCardAppearance(entry.target);
            }
        });
    }, {
        threshold: 0.1
    });
}

function setupCardAnimation(card, observer) {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
    
    observer.observe(card);
}

function animateCardAppearance(card) {
    card.style.opacity = '1';
    card.style.transform = 'translateY(0)';
}

//MODAL IMAGE VIEWER (zoom + pan)
let modalZoom = 1;
let modalPanX = 0;
let modalPanY = 0;
let modalDragging = false;
let modalDragStartX = 0;
let modalDragStartY = 0;

function getModalWrapper() {
    return document.getElementById('modal-image-wrapper');
}

function applyModalTransform() {
    const modalImg = document.getElementById('modal-img');
    if (!modalImg) return;
    modalImg.style.transform = `translate(${modalPanX}px, ${modalPanY}px) scale(${modalZoom})`;
}

function clampModalPan() {
    const wrapper = getModalWrapper();
    const modalImg = document.getElementById('modal-img');
    if (!wrapper || !modalImg) return;
    const maxX = Math.max(0, (modalImg.clientWidth * modalZoom - wrapper.clientWidth) / 2);
    const maxY = Math.max(0, (modalImg.clientHeight * modalZoom - wrapper.clientHeight) / 2);
    modalPanX = Math.min(maxX, Math.max(-maxX, modalPanX));
    modalPanY = Math.min(maxY, Math.max(-maxY, modalPanY));
}

function setModalZoom(factor, clientX, clientY) {
    const wrapper = getModalWrapper();
    if (!wrapper) return;
    const rect = wrapper.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const px = (clientX ?? centerX) - centerX;
    const py = (clientY ?? centerY) - centerY;
    const newZoom = Math.min(8, Math.max(1, modalZoom * factor));
    if (newZoom === modalZoom) return;
    const f = newZoom / modalZoom;
    modalPanX = modalPanX * f + px * (1 - f);
    modalPanY = modalPanY * f + py * (1 - f);
    modalZoom = newZoom;
    clampModalPan();
    applyModalTransform();
    updateModalZoomButtons();
}

function resetModalZoom() {
    modalZoom = 1;
    modalPanX = 0;
    modalPanY = 0;
    applyModalTransform();
    updateModalZoomButtons();
    const wrapper = getModalWrapper();
    if (wrapper) wrapper.style.cursor = 'grab';
}

function updateModalZoomButtons() {
    const zoomIn = document.getElementById('modal-zoom-in');
    const zoomOut = document.getElementById('modal-zoom-out');
    const reset = document.getElementById('modal-zoom-reset');
    if (zoomIn) zoomIn.disabled = modalZoom >= 8;
    if (zoomOut) zoomOut.disabled = modalZoom <= 1;
    if (reset) reset.disabled = modalZoom <= 1;
}

function openImageModal(imgId) {
    const overlay = document.getElementById('dim-overlay-2');
    const modal = document.getElementById('modal');
    const modalImg = document.getElementById('modal-img');
    const img = document.getElementById(imgId);
    if (!modal || !img) return;

    modalImg.src = img.src;
    modalImg.alt = img.alt || '';
    resetModalZoom();
    modal.style.display = 'block';
    overlay.style.visibility = 'visible';
    overlay.style.opacity = '1';
    setBackButtonHidden(true);
}

function closeImageModal() {
    const overlay = document.getElementById('dim-overlay-2');
    const modal = document.getElementById('modal');
    if (modal) modal.style.display = 'none';
    if (overlay) {
        overlay.style.visibility = 'hidden';
        overlay.style.opacity = '0';
    }
    setBackButtonHidden(false);
}

function setBackButtonHidden(hidden) {
    document.querySelectorAll('.back-button').forEach(btn => {
        btn.style.visibility = hidden ? 'hidden' : '';
    });
}

function initializeImageModal() {
    const modal = document.getElementById('modal');
    const wrapper = document.getElementById('modal-image-wrapper');
    const overlay = document.getElementById('dim-overlay-2');
    if (!modal || !wrapper) return;

    const zoomIn = document.getElementById('modal-zoom-in');
    const zoomOut = document.getElementById('modal-zoom-out');
    const reset = document.getElementById('modal-zoom-reset');
    const closeBtn = document.getElementById('modal-close');

    if (zoomIn) zoomIn.addEventListener('click', () => setModalZoom(1.5));
    if (zoomOut) zoomOut.addEventListener('click', () => setModalZoom(1 / 1.5));
    if (reset) reset.addEventListener('click', resetModalZoom);
    if (closeBtn) closeBtn.addEventListener('click', closeImageModal);
    if (overlay) overlay.addEventListener('click', closeImageModal);

    // Mouse wheel zoom (keeps cursor position fixed)
    wrapper.addEventListener('wheel', (e) => {
        e.preventDefault();
        setModalZoom(e.deltaY < 0 ? 1.15 : 1 / 1.15, e.clientX, e.clientY);
    }, { passive: false });

    // Double click toggles zoom
    wrapper.addEventListener('dblclick', (e) => {
        setModalZoom(modalZoom > 1 ? 1 / 2 : 2, e.clientX, e.clientY);
    });

    // Drag to pan when zoomed in
    wrapper.addEventListener('mousedown', (e) => {
        if (modalZoom <= 1) return;
        e.preventDefault();
        modalDragging = true;
        modalDragStartX = e.clientX - modalPanX;
        modalDragStartY = e.clientY - modalPanY;
        wrapper.style.cursor = 'grabbing';
        wrapper.classList.add('dragging');
    });

    document.addEventListener('mousemove', (e) => {
        if (!modalDragging) return;
        modalPanX = e.clientX - modalDragStartX;
        modalPanY = e.clientY - modalDragStartY;
        clampModalPan();
        applyModalTransform();
    });

    document.addEventListener('mouseup', () => {
        if (!modalDragging) return;
        modalDragging = false;
        wrapper.style.cursor = 'grab';
        wrapper.classList.remove('dragging');
    });

    // Touch support: single finger pan when zoomed in
    wrapper.addEventListener('touchstart', (e) => {
        if (modalZoom <= 1 || e.touches.length !== 1) return;
        const t = e.touches[0];
        modalDragging = true;
        modalDragStartX = t.clientX - modalPanX;
        modalDragStartY = t.clientY - modalPanY;
    }, { passive: true });

    wrapper.addEventListener('touchmove', (e) => {
        if (!modalDragging || e.touches.length !== 1) return;
        const t = e.touches[0];
        modalPanX = t.clientX - modalDragStartX;
        modalPanY = t.clientY - modalDragStartY;
        clampModalPan();
        applyModalTransform();
    }, { passive: true });

    wrapper.addEventListener('touchend', () => {
        modalDragging = false;
    });

    // Keyboard: Esc to close, +/- to zoom, 0 to reset (only while modal is open)
    document.addEventListener('keydown', (e) => {
        if (modal.style.display !== 'block') return;
        if (e.key === 'Escape') closeImageModal();
        else if (e.key === '+' || e.key === '=') setModalZoom(1.5);
        else if (e.key === '-' || e.key === '_') setModalZoom(1 / 1.5);
        else if (e.key === '0') resetModalZoom();
    });
}

//MODAL MENU (works.html)
function initializeModalMenu() {
    const modal = document.getElementById('modal');
    const menuWrapper = document.getElementById('modal-menu-wrapper');
    const overlay = document.getElementById('dim-overlay-2');
    const modalImg = document.getElementById('modal-img');
    const titleEl = document.getElementById('modal-title');
    const metadataEl = document.getElementById('modal-metadata');
    const linksEl = document.getElementById('modal-links');
    const closeBtn = document.getElementById('modal-close');
    if (!modal || !menuWrapper) return;

    function openModalMenu(card) {
        const cover = card.querySelector('img');
        if (!card.dataset.title && !card.dataset.links) return;

        modalImg.src = (cover && (cover.currentSrc || cover.src)) || '';
        modalImg.alt = (cover && cover.alt) || '';

        titleEl.textContent = (card.dataset.title || '').trim();

        metadataEl.textContent = (card.dataset.meta || '').trim();

        linksEl.innerHTML = '';
        const linksRaw = card.dataset.links || '';
        const parts = linksRaw.split('||').map(s => s.trim()).filter(Boolean);
        parts.forEach((part, i) => {
            const sep = part.indexOf('::');
            if (sep === -1) return;
            const label = part.slice(0, sep).trim();
            const href = part.slice(sep + 2).trim();
            const link = document.createElement('a');
            link.href = href;
            link.textContent = label;
            link.target = '_blank';
            link.rel = 'noopener';
            linksEl.appendChild(link);
            if (i < parts.length - 1) {
                linksEl.appendChild(document.createTextNode(' | '));
            }
        });

        modal.style.display = 'block';
        if (overlay) {
            overlay.style.visibility = 'visible';
            overlay.style.opacity = '1';
        }
        setBackButtonHidden(true);
    }

    function closeModalMenu() {
        modal.style.display = 'none';
        if (overlay) {
            overlay.style.visibility = 'hidden';
            overlay.style.opacity = '0';
        }
        setBackButtonHidden(false);
    }

    document.querySelectorAll('.imagecard').forEach(card => {
        card.style.cursor = 'pointer';
        card.addEventListener('click', () => openModalMenu(card));
    });

    if (closeBtn) closeBtn.addEventListener('click', closeModalMenu);
    if (overlay) overlay.addEventListener('click', closeModalMenu);
    document.addEventListener('keydown', (e) => {
        if (modal.style.display !== 'block') return;
        if (e.key === 'Escape') closeModalMenu();
    });
}





