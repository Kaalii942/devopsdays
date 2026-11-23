/**
 * DevOpsDays Islamabad 2026 – I'm Attending Poster Generator
 * Pure Vanilla JavaScript Implementation
 */

(function () {
  'use strict';

  // ==========================================================================
  // Poster Geometry & Canvas Constants (1842 x 2304 native resolution)
  // ==========================================================================
  const CANVAS_WIDTH = 1842;
  const CANVAS_HEIGHT = 2304;

  // Exact coordinates of the central picture box measured from "final one.jfif"
  const PHOTO_BOX = {
    x: 612,
    y: 976,
    width: 648,
    height: 616,
    radius: 34,
    centerX: 936, // (612 + 648/2)
    centerY: 1284 // (976 + 616/2)
  };

  // Text bounds below the photo box (above footer at Y: 1940)
  const TEXT_BOUNDS = {
    centerX: 936,
    maxWidth: 1500,
    name: {
      centerY: 1715,
      maxHeight: 120,
      defaultSize: 76,
      minSize: 40,
      maxSize: 110
    },
    designation: {
      topY: 1785,
      maxHeight: 130,
      defaultSize: 42,
      minSize: 24,
      maxSize: 64,
      lineHeightMultiplier: 1.28
    }
  };

  const TEMPLATE_PATHS = ['final one.jfif', 'final one .jfif'];

  // ==========================================================================
  // Application State
  // ==========================================================================
  const state = {
    templateImage: null,
    templateLoaded: false,
    
    // User uploaded photo
    photoImage: null,
    photoFileName: '',
    photoZoom: 100, // 50% to 300%
    photoPanX: 0,   // Canvas pixels
    photoPanY: 0,
    photoRotation: 0, // 0, 90, 180, 270

    // Text details
    name: 'SYED MUHAMMAD ALI',
    nameSize: 76,
    isUppercase: true,
    fontFamily: 'Montserrat',

    designation: 'Principal DevOps Architect | AWS Hero\nCloud Platform Engineering',
    desigSize: 42,

    // Visual effects
    glowIntensity: 1.0, // 0.2 to 1.8

    // Dragging state
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0,
    panStartX: 0,
    panStartY: 0
  };

  // ==========================================================================
  // DOM Elements
  // ==========================================================================
  const dom = {
    canvas: document.getElementById('posterCanvas'),
    canvasWrapper: document.getElementById('canvasWrapper'),
    canvasViewport: document.getElementById('canvasViewport'),
    dragHintOverlay: document.getElementById('dragHintOverlay'),
    
    // Image Upload & controls
    imageInput: document.getElementById('imageInput'),
    uploadDropzone: document.getElementById('uploadDropzone'),
    photoStatusBar: document.getElementById('photoStatusBar'),
    photoFileName: document.getElementById('photoFileName'),
    btnChangePhoto: document.getElementById('btnChangePhoto'),
    btnRemovePhoto: document.getElementById('btnRemovePhoto'),
    btnUseDemoPhoto: document.getElementById('btnUseDemoPhoto'),
    imageAdjustments: document.getElementById('imageAdjustments'),

    // Zoom & Pan
    zoomRange: document.getElementById('zoomRange'),
    zoomValue: document.getElementById('zoomValue'),
    btnZoomIn: document.getElementById('btnZoomIn'),
    btnZoomOut: document.getElementById('btnZoomOut'),
    btnCenterPan: document.getElementById('btnCenterPan'),
    btnPanCenter: document.getElementById('btnPanCenter'),
    btnFitPreview: document.getElementById('btnFitPreview'),
    btnPanUp: document.getElementById('btnPanUp'),
    btnPanDown: document.getElementById('btnPanDown'),
    btnPanLeft: document.getElementById('btnPanLeft'),
    btnPanRight: document.getElementById('btnPanRight'),
    panXRange: document.getElementById('panXRange'),
    panYRange: document.getElementById('panYRange'),
    btnRotate: document.getElementById('btnRotate'),

    // Text inputs & sizing
    nameInput: document.getElementById('nameInput'),
    nameSizeRange: document.getElementById('nameSizeRange'),
    nameSizeValue: document.getElementById('nameSizeValue'),
    btnNameSizeDown: document.getElementById('btnNameSizeDown'),
    btnNameSizeUp: document.getElementById('btnNameSizeUp'),

    desigInput: document.getElementById('desigInput'),
    desigSizeRange: document.getElementById('desigSizeRange'),
    desigSizeValue: document.getElementById('desigSizeValue'),
    btnDesigSizeDown: document.getElementById('btnDesigSizeDown'),
    btnDesigSizeUp: document.getElementById('btnDesigSizeUp'),

    // Effects & Typography
    fontSelect: document.getElementById('fontSelect'),
    glowIntensityRange: document.getElementById('glowIntensityRange'),
    glowIntensityValue: document.getElementById('glowIntensityValue'),
    chkUppercase: document.getElementById('chkUppercase'),

    // Primary Buttons
    btnDownload: document.getElementById('btnDownload'),
    btnDownloadSide: document.getElementById('btnDownloadSide'),
    btnLinkedInShare: document.getElementById('btnLinkedInShare'),
    btnLinkedInSide: document.getElementById('btnLinkedInSide'),
    btnResetAll: document.getElementById('btnResetAll'),

    // LinkedIn Modal
    linkedInModal: document.getElementById('linkedInModal'),
    btnCloseModal: document.getElementById('btnCloseModal'),
    btnDoneModal: document.getElementById('btnDoneModal'),
    btnModalDownload: document.getElementById('btnModalDownload'),
    btnCopyCaption: document.getElementById('btnCopyCaption'),
    copyTextState: document.getElementById('copyTextState'),
    captionText: document.getElementById('captionText'),

    // Toast Container
    toastContainer: document.getElementById('toastContainer')
  };

  const ctx = dom.canvas.getContext('2d', { alpha: false });

  // ==========================================================================
  // Initialization & Template Loading
  // ==========================================================================
  function init() {
    // Set initial values in input fields
    dom.nameInput.value = state.name;
    dom.desigInput.value = state.designation;
    dom.zoomRange.value = state.photoZoom;
    dom.zoomValue.textContent = state.photoZoom + '%';
    dom.nameSizeRange.value = state.nameSize;
    dom.nameSizeValue.textContent = state.nameSize + 'px';
    dom.desigSizeRange.value = state.desigSize;
    dom.desigSizeValue.textContent = state.desigSize + 'px';
    dom.glowIntensityRange.value = Math.round(state.glowIntensity * 100);
    dom.glowIntensityValue.textContent = dom.glowIntensityRange.value + '%';
    dom.chkUppercase.checked = state.isUppercase;

    setupEventListeners();
    loadTemplate();
  }

  /**
   * Load the conference poster template (final one.jfif)
   */
  function loadTemplate() {
    let pathIndex = 0;

    function tryLoadNext() {
      if (pathIndex >= TEMPLATE_PATHS.length) {
        showToast('Template image could not be loaded. Please ensure final one.jfif exists in the project root.', 'error');
        return;
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = function () {
        state.templateImage = img;
        state.templateLoaded = true;
        renderCanvas();
      };
      img.onerror = function () {
        pathIndex++;
        tryLoadNext();
      };
      img.src = TEMPLATE_PATHS[pathIndex];
    }

    tryLoadNext();
  }

  // ==========================================================================
  // Event Listeners
  // ==========================================================================
  function setupEventListeners() {
    // --- Upload Dropzone & File Input ---
    dom.uploadDropzone.addEventListener('click', () => dom.imageInput.click());
    dom.btnChangePhoto.addEventListener('click', () => dom.imageInput.click());
    dom.btnRemovePhoto.addEventListener('click', removePhoto);
    dom.imageInput.addEventListener('change', handleFileSelect);

    // Drag and Drop onto dropzone
    ['dragenter', 'dragover'].forEach(eventName => {
      dom.uploadDropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dom.uploadDropzone.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dom.uploadDropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dom.uploadDropzone.classList.remove('dragover');
      });
    });

    dom.uploadDropzone.addEventListener('drop', (e) => {
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        processUploadedFile(e.dataTransfer.files[0]);
      }
    });

    // Also support drag and drop directly onto the canvas viewport
    dom.canvasViewport.addEventListener('dragover', (e) => e.preventDefault());
    dom.canvasViewport.addEventListener('drop', (e) => {
      e.preventDefault();
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        processUploadedFile(e.dataTransfer.files[0]);
      }
    });

    // Paste image from clipboard anywhere on the page
    window.addEventListener('paste', (e) => {
      const items = (e.clipboardData || e.originalEvent.clipboardData).items;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          processUploadedFile(file);
          showToast('Image pasted from clipboard!', 'success');
          break;
        }
      }
    });

    // Demo Photo Button
    dom.btnUseDemoPhoto.addEventListener('click', loadDemoAvatar);

    // --- Zoom Controls ---
    dom.zoomRange.addEventListener('input', (e) => {
      state.photoZoom = parseInt(e.target.value, 10);
      dom.zoomValue.textContent = state.photoZoom + '%';
      renderCanvas();
    });

    dom.btnZoomIn.addEventListener('click', () => {
      state.photoZoom = Math.min(300, state.photoZoom + 10);
      dom.zoomRange.value = state.photoZoom;
      dom.zoomValue.textContent = state.photoZoom + '%';
      renderCanvas();
    });

    dom.btnZoomOut.addEventListener('click', () => {
      state.photoZoom = Math.max(50, state.photoZoom - 10);
      dom.zoomRange.value = state.photoZoom;
      dom.zoomValue.textContent = state.photoZoom + '%';
      renderCanvas();
    });

    // --- Pan Controls ---
    dom.panXRange.addEventListener('input', (e) => {
      state.photoPanX = parseInt(e.target.value, 10);
      renderCanvas();
    });

    dom.panYRange.addEventListener('input', (e) => {
      state.photoPanY = parseInt(e.target.value, 10);
      renderCanvas();
    });

    const resetPan = () => {
      state.photoPanX = 0;
      state.photoPanY = 0;
      dom.panXRange.value = 0;
      dom.panYRange.value = 0;
      renderCanvas();
    };

    dom.btnCenterPan.addEventListener('click', resetPan);
    dom.btnPanCenter.addEventListener('click', resetPan);
    dom.btnFitPreview.addEventListener('click', () => {
      state.photoZoom = 100;
      dom.zoomRange.value = 100;
      dom.zoomValue.textContent = '100%';
      resetPan();
      showToast('Photo position and zoom centered', 'info');
    });

    // D-Pad Nudge Buttons
    dom.btnPanUp.addEventListener('click', () => nudgePan(0, -20));
    dom.btnPanDown.addEventListener('click', () => nudgePan(0, 20));
    dom.btnPanLeft.addEventListener('click', () => nudgePan(-20, 0));
    dom.btnPanRight.addEventListener('click', () => nudgePan(20, 0));

    // Rotate Button
    dom.btnRotate.addEventListener('click', () => {
      state.photoRotation = (state.photoRotation + 90) % 360;
      renderCanvas();
    });

    // --- Interactive Mouse & Touch Drag on Canvas ---
    setupCanvasInteractivity();

    // --- Name & Designation Inputs ---
    dom.nameInput.addEventListener('input', (e) => {
      state.name = e.target.value;
      renderCanvas();
    });

    dom.desigInput.addEventListener('input', (e) => {
      state.designation = e.target.value;
      renderCanvas();
    });

    // --- Font Size Steppers & Sliders ---
    dom.nameSizeRange.addEventListener('input', (e) => {
      state.nameSize = parseInt(e.target.value, 10);
      dom.nameSizeValue.textContent = state.nameSize + 'px';
      renderCanvas();
    });

    dom.btnNameSizeDown.addEventListener('click', () => {
      state.nameSize = Math.max(TEXT_BOUNDS.name.minSize, state.nameSize - 2);
      dom.nameSizeRange.value = state.nameSize;
      dom.nameSizeValue.textContent = state.nameSize + 'px';
      renderCanvas();
    });

    dom.btnNameSizeUp.addEventListener('click', () => {
      state.nameSize = Math.min(TEXT_BOUNDS.name.maxSize, state.nameSize + 2);
      dom.nameSizeRange.value = state.nameSize;
      dom.nameSizeValue.textContent = state.nameSize + 'px';
      renderCanvas();
    });

    dom.desigSizeRange.addEventListener('input', (e) => {
      state.desigSize = parseInt(e.target.value, 10);
      dom.desigSizeValue.textContent = state.desigSize + 'px';
      renderCanvas();
    });

    dom.btnDesigSizeDown.addEventListener('click', () => {
      state.desigSize = Math.max(TEXT_BOUNDS.designation.minSize, state.desigSize - 2);
      dom.desigSizeRange.value = state.desigSize;
      dom.desigSizeValue.textContent = state.desigSize + 'px';
      renderCanvas();
    });

    dom.btnDesigSizeUp.addEventListener('click', () => {
      state.desigSize = Math.min(TEXT_BOUNDS.designation.maxSize, state.desigSize + 2);
      dom.desigSizeRange.value = state.desigSize;
      dom.desigSizeValue.textContent = state.desigSize + 'px';
      renderCanvas();
    });

    // --- Typography & Effects ---
    dom.fontSelect.addEventListener('change', (e) => {
      state.fontFamily = e.target.value;
      renderCanvas();
    });

    dom.glowIntensityRange.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      state.glowIntensity = val / 100;
      dom.glowIntensityValue.textContent = val + '%';
      renderCanvas();
    });

    dom.chkUppercase.addEventListener('change', (e) => {
      state.isUppercase = e.target.checked;
      renderCanvas();
    });

    // --- Primary Action Buttons ---
    dom.btnDownload.addEventListener('click', downloadPoster);
    dom.btnDownloadSide.addEventListener('click', downloadPoster);
    dom.btnLinkedInShare.addEventListener('click', handleLinkedInShare);
    dom.btnLinkedInSide.addEventListener('click', handleLinkedInShare);
    dom.btnResetAll.addEventListener('click', resetAll);

    // --- LinkedIn Modal Events ---
    dom.btnCloseModal.addEventListener('click', closeModal);
    dom.btnDoneModal.addEventListener('click', closeModal);
    dom.btnModalDownload.addEventListener('click', downloadPoster);
    dom.btnCopyCaption.addEventListener('click', copyShareCaption);
    dom.linkedInModal.addEventListener('click', (e) => {
      if (e.target === dom.linkedInModal) closeModal();
    });
  }

  function nudgePan(dx, dy) {
    state.photoPanX = Math.max(-400, Math.min(400, state.photoPanX + dx));
    state.photoPanY = Math.max(-400, Math.min(400, state.photoPanY + dy));
    dom.panXRange.value = state.photoPanX;
    dom.panYRange.value = state.photoPanY;
    renderCanvas();
  }

  // ==========================================================================
  // Interactive Canvas Drag & Scroll Zoom
  // ==========================================================================
  function setupCanvasInteractivity() {
    const wrapper = dom.canvasWrapper;

    const startDrag = (clientX, clientY) => {
      if (!state.photoImage) return;
      state.isDragging = true;
      state.dragStartX = clientX;
      state.dragStartY = clientY;
      state.panStartX = state.photoPanX;
      state.panStartY = state.photoPanY;
      wrapper.classList.add('is-dragging');
    };

    const doDrag = (clientX, clientY) => {
      if (!state.isDragging || !state.photoImage) return;
      const rect = dom.canvas.getBoundingClientRect();
      const scaleFactor = CANVAS_WIDTH / rect.width;

      const deltaX = (clientX - state.dragStartX) * scaleFactor;
      const deltaY = (clientY - state.dragStartY) * scaleFactor;

      state.photoPanX = Math.max(-400, Math.min(400, Math.round(state.panStartX + deltaX)));
      state.photoPanY = Math.max(-400, Math.min(400, Math.round(state.panStartY + deltaY)));

      dom.panXRange.value = state.photoPanX;
      dom.panYRange.value = state.photoPanY;

      renderCanvas();
    };

    const endDrag = () => {
      if (state.isDragging) {
        state.isDragging = false;
        wrapper.classList.remove('is-dragging');
      }
    };

    // Mouse Events
    wrapper.addEventListener('mousedown', (e) => {
      if (e.button === 0) { // Left click
        startDrag(e.clientX, e.clientY);
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (state.isDragging) {
        doDrag(e.clientX, e.clientY);
      }
    });

    window.addEventListener('mouseup', endDrag);

    // Touch Events for Mobile / Tablet
    wrapper.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        startDrag(touch.clientX, touch.clientY);
      }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (state.isDragging && e.touches.length === 1) {
        const touch = e.touches[0];
        doDrag(touch.clientX, touch.clientY);
      }
    }, { passive: true });

    window.addEventListener('touchend', endDrag);
    window.addEventListener('touchcancel', endDrag);

    // Mouse Wheel Zoom over canvas
    wrapper.addEventListener('wheel', (e) => {
      if (!state.photoImage) return;
      e.preventDefault();
      const zoomDelta = e.deltaY < 0 ? 5 : -5;
      state.photoZoom = Math.max(50, Math.min(300, state.photoZoom + zoomDelta));
      dom.zoomRange.value = state.photoZoom;
      dom.zoomValue.textContent = state.photoZoom + '%';
      renderCanvas();
    }, { passive: false });
  }

  // ==========================================================================
  // Image Upload Handling & Demo Avatar
  // ==========================================================================
  function handleFileSelect(e) {
    if (e.target.files && e.target.files[0]) {
      processUploadedFile(e.target.files[0]);
    }
  }

  function processUploadedFile(file) {
    if (!file) return;

    // Validate mime type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jfif', 'image/jpg', 'image/gif'];
    const isImage = file.type ? validTypes.includes(file.type.toLowerCase()) : /\.(jpe?g|png|webp|jfif|gif)$/i.test(file.name);

    if (!isImage) {
      showToast('Please upload a valid image file (JPG, PNG, WEBP, or JFIF).', 'error');
      return;
    }

    // Validate size (max 15MB)
    if (file.size > 15 * 1024 * 1024) {
      showToast('File size exceeds 15MB. Please choose a smaller photo.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
      const img = new Image();
      img.onload = function () {
        state.photoImage = img;
        state.photoFileName = file.name;
        state.photoZoom = 100;
        state.photoPanX = 0;
        state.photoPanY = 0;
        state.photoRotation = 0;

        dom.zoomRange.value = 100;
        dom.zoomValue.textContent = '100%';
        dom.panXRange.value = 0;
        dom.panYRange.value = 0;

        updatePhotoUIState(true);
        renderCanvas();
        showToast('Profile photo uploaded successfully!', 'success');
      };
      img.onerror = function () {
        showToast('Failed to load image. The file may be corrupted.', 'error');
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  function removePhoto() {
    state.photoImage = null;
    state.photoFileName = '';
    state.photoZoom = 100;
    state.photoPanX = 0;
    state.photoPanY = 0;
    state.photoRotation = 0;
    dom.imageInput.value = '';

    updatePhotoUIState(false);
    renderCanvas();
    showToast('Photo removed', 'info');
  }

  function updatePhotoUIState(hasPhoto) {
    if (hasPhoto) {
      dom.uploadDropzone.style.display = 'none';
      dom.photoStatusBar.style.display = 'flex';
      dom.photoFileName.textContent = state.photoFileName || 'profile-picture.jpg';
      dom.canvasWrapper.classList.add('has-photo');
    } else {
      dom.uploadDropzone.style.display = 'block';
      dom.photoStatusBar.style.display = 'none';
      dom.canvasWrapper.classList.remove('has-photo');
    }
  }

  /**
   * Generates a sleek, professional sample avatar for rapid testing
   */
  function loadDemoAvatar() {
    const avatarCanvas = document.createElement('canvas');
    avatarCanvas.width = 600;
    avatarCanvas.height = 600;
    const actx = avatarCanvas.getContext('2d');

    // Modern cyber tech gradient background
    const bgGrad = actx.createLinearGradient(0, 0, 600, 600);
    bgGrad.addColorStop(0, '#1e103f');
    bgGrad.addColorStop(0.5, '#3b1260');
    bgGrad.addColorStop(1, '#0e0724');
    actx.fillStyle = bgGrad;
    actx.fillRect(0, 0, 600, 600);

    // Decorative geometric ring
    actx.strokeStyle = 'rgba(217, 70, 239, 0.4)';
    actx.lineWidth = 4;
    actx.beginPath();
    actx.arc(300, 300, 250, 0, Math.PI * 2);
    actx.stroke();

    // Head / Face silhouette
    actx.fillStyle = '#fce7f3';
    actx.beginPath();
    actx.arc(300, 240, 95, 0, Math.PI * 2);
    actx.fill();

    // Modern tech glasses
    actx.fillStyle = '#0f172a';
    actx.beginPath();
    actx.roundRect(220, 220, 70, 35, 6);
    actx.roundRect(310, 220, 70, 35, 6);
    actx.fill();
    actx.strokeStyle = '#d946ef';
    actx.lineWidth = 3;
    actx.stroke();
    actx.beginPath();
    actx.moveTo(290, 235);
    actx.lineTo(310, 235);
    actx.stroke();

    // Shoulders silhouette
    actx.fillStyle = '#ec4899';
    actx.beginPath();
    actx.ellipse(300, 480, 180, 140, 0, 0, Math.PI * 2);
    actx.fill();

    // Hoodie collar
    actx.fillStyle = '#1e1b4b';
    actx.beginPath();
    actx.moveTo(220, 340);
    actx.lineTo(300, 440);
    actx.lineTo(380, 340);
    actx.closePath();
    actx.fill();

    const img = new Image();
    img.onload = function () {
      state.photoImage = img;
      state.photoFileName = 'DevOps-Demo-Attendee.png';
      state.photoZoom = 100;
      state.photoPanX = 0;
      state.photoPanY = 0;
      state.photoRotation = 0;
      updatePhotoUIState(true);
      renderCanvas();
      showToast('Sample attendee avatar loaded!', 'success');
    };
    img.src = avatarCanvas.toDataURL();
  }

  // ==========================================================================
  // Canvas Rendering Core
  // ==========================================================================
  function renderCanvas() {
    // 1. Clear Canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 2. Draw Fixed Conference Template Background
    if (state.templateLoaded && state.templateImage) {
      ctx.drawImage(state.templateImage, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    } else {
      // Dark fallback background while loading
      ctx.fillStyle = '#080318';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = '#a855f7';
      ctx.font = '700 32px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Loading DevOpsDays Poster Template...', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      return;
    }

    // 3. Draw Profile Picture inside the central square area
    if (state.photoImage) {
      renderProfilePhoto();
    }

    // 4. Render Attendee Name below photo area
    renderAttendeeName();

    // 5. Render Attendee Designation below name
    renderAttendeeDesignation();
  }

  /**
   * Render uploaded profile photo strictly clipped inside the central square box,
   * preserving frame, border, rounded corners, proportions, and alignment.
   */
  function renderProfilePhoto() {
    const box = PHOTO_BOX;
    const img = state.photoImage;

    ctx.save();

    // Create the rounded rectangle clipping path matching the template frame
    createRoundedRectPath(ctx, box.x, box.y, box.width, box.height, box.radius);
    ctx.clip();

    // Dark backdrop behind photo inside the box
    ctx.fillStyle = '#0f0728';
    ctx.fill();

    // Calculate cover scale so photo fills the box without distortion
    const coverScale = Math.max(box.width / img.width, box.height / img.height);
    const totalScale = coverScale * (state.photoZoom / 100);

    const drawW = img.width * totalScale;
    const drawH = img.height * totalScale;

    // Apply rotation and pan offsets relative to box center
    ctx.translate(box.centerX + state.photoPanX, box.centerY + state.photoPanY);

    if (state.photoRotation !== 0) {
      ctx.rotate((state.photoRotation * Math.PI) / 180);
    }

    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);

    ctx.restore();

    // Draw seamless matching neon border on top of the photo edge
    ctx.save();
    createRoundedRectPath(ctx, box.x, box.y, box.width, box.height, box.radius);

    // Outer glow
    ctx.lineWidth = 8;
    ctx.strokeStyle = 'rgba(217, 70, 239, 0.7)';
    ctx.shadowColor = 'rgba(217, 70, 239, 0.9)';
    ctx.shadowBlur = 18;
    ctx.stroke();

    // Inner bright neon rim
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = 'rgba(255, 220, 255, 0.96)';
    ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
    ctx.shadowBlur = 6;
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Render attendee name with stylish italic bold neon glow typography
   */
  function renderAttendeeName() {
    let rawName = (state.name || '').trim();
    if (!rawName) return;

    if (state.isUppercase) {
      rawName = rawName.toUpperCase();
    }

    const bounds = TEXT_BOUNDS;
    let targetFontSize = state.nameSize;
    const fontName = state.fontFamily || 'Montserrat';

    // Auto-fit check: ensure text fits within TEXT_BOUNDS.maxWidth (1500px)
    ctx.font = `900 italic ${targetFontSize}px "${fontName}", "Montserrat", sans-serif`;
    let measuredWidth = ctx.measureText(rawName).width;

    if (measuredWidth > bounds.maxWidth) {
      const scale = bounds.maxWidth / measuredWidth;
      targetFontSize = Math.max(TEXT_BOUNDS.name.minSize, Math.floor(targetFontSize * scale));
      ctx.font = `900 italic ${targetFontSize}px "${fontName}", "Montserrat", sans-serif`;
    }

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const textX = bounds.centerX;
    const textY = bounds.name.centerY;

    // Create vertical neon gradient matching "I AM ATTENDING"
    const grad = ctx.createLinearGradient(0, textY - targetFontSize * 0.5, 0, textY + targetFontSize * 0.5);
    grad.addColorStop(0.0, '#FFFFFF');
    grad.addColorStop(0.3, '#FFE4F8');
    grad.addColorStop(0.7, '#F472B6');
    grad.addColorStop(1.0, '#C084FC');

    const intensity = state.glowIntensity;

    // Pass 1: Deep wide magenta/purple glow
    ctx.shadowColor = `rgba(217, 70, 239, ${0.85 * intensity})`;
    ctx.shadowBlur = 32 * intensity;
    ctx.fillStyle = grad;
    ctx.fillText(rawName, textX, textY);

    // Pass 2: Medium vibrant violet glow
    ctx.shadowColor = `rgba(168, 85, 247, ${0.75 * intensity})`;
    ctx.shadowBlur = 14 * intensity;
    ctx.fillText(rawName, textX, textY);

    // Pass 3: Crisp core white highlight
    ctx.shadowColor = '#FFFFFF';
    ctx.shadowBlur = 4 * intensity;
    ctx.fillText(rawName, textX, textY);

    ctx.restore();
  }

  /**
   * Render attendee designation supporting up to two lines with auto-wrap and auto-scaling
   */
  function renderAttendeeDesignation() {
    const rawDesig = (state.designation || '').trim();
    if (!rawDesig) return;

    const bounds = TEXT_BOUNDS;
    let targetFontSize = state.desigSize;

    // Parse lines: user explicit newlines or automatic word-wrapping to 2 lines
    let lines = rawDesig.split('\n').map(l => l.trim()).filter(Boolean);

    // If single line, check if it exceeds maxWidth and split into 2 lines
    ctx.font = `700 ${targetFontSize}px "Inter", "Montserrat", sans-serif`;
    if (lines.length === 1) {
      const singleWidth = ctx.measureText(lines[0]).width;
      if (singleWidth > bounds.maxWidth) {
        lines = wrapTextIntoLines(lines[0], bounds.maxWidth, targetFontSize);
      }
    }

    // Limit to max 2 lines
    if (lines.length > 2) {
      lines = [lines[0], lines.slice(1).join(' • ')];
    }

    // Auto-fit check: ensure each line fits within maxWidth
    let maxLineWidth = 0;
    lines.forEach(line => {
      const w = ctx.measureText(line).width;
      if (w > maxLineWidth) maxLineWidth = w;
    });

    if (maxLineWidth > bounds.maxWidth) {
      const scale = bounds.maxWidth / maxLineWidth;
      targetFontSize = Math.max(TEXT_BOUNDS.designation.minSize, Math.floor(targetFontSize * scale));
    }

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = `700 ${targetFontSize}px "Inter", "Montserrat", sans-serif`;

    const lineHeight = targetFontSize * bounds.designation.lineHeightMultiplier;
    const totalBlockHeight = lines.length * lineHeight;
    // Center the block vertically within designation area
    const startY = bounds.designation.topY + (bounds.designation.maxHeight - totalBlockHeight) / 2;

    lines.forEach((line, index) => {
      const lineY = startY + index * lineHeight;

      // Clean modern white/slate with soft lavender glow
      ctx.shadowColor = 'rgba(192, 132, 252, 0.45)';
      ctx.shadowBlur = 8;
      ctx.fillStyle = index === 0 ? '#F8FAFC' : '#E2E8F0';
      ctx.fillText(line, bounds.centerX, lineY);
    });

    ctx.restore();
  }

  /**
   * Helper to wrap long single string into 2 balanced lines
   */
  function wrapTextIntoLines(text, maxWidth, fontSize) {
    ctx.font = `700 ${fontSize}px "Inter", "Montserrat", sans-serif`;
    const words = text.split(' ');
    if (words.length <= 1) return [text];

    let line1 = '';
    let line2 = '';
    const midpoint = Math.floor(words.length / 2);

    line1 = words.slice(0, midpoint).join(' ');
    line2 = words.slice(midpoint).join(' ');

    return [line1, line2];
  }

  /**
   * Helper to draw a rounded rectangle path on canvas
   */
  function createRoundedRectPath(context, x, y, width, height, radius) {
    context.beginPath();
    context.moveTo(x + radius, y);
    context.lineTo(x + width - radius, y);
    context.quadraticCurveTo(x + width, y, x + width, y + radius);
    context.lineTo(x + width, y + height - radius);
    context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    context.lineTo(x + radius, y + height);
    context.quadraticCurveTo(x, y + height, x, y + height - radius);
    context.lineTo(x, y + radius);
    context.quadraticCurveTo(x, y, x + radius, y);
    context.closePath();
  }

  // ==========================================================================
  // High-Resolution PNG Export
  // ==========================================================================
  function downloadPoster() {
    try {
      // Ensure canvas is up to date
      renderCanvas();

      const sanitizedName = (state.name || 'Attendee')
        .trim()
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .replace(/_+/g, '_');

      const fileName = `DevOpsDays-Islamabad-2026-${sanitizedName}.png`;

      // Use toBlob for high visual fidelity and robust memory handling
      if (dom.canvas.toBlob) {
        dom.canvas.toBlob(function (blob) {
          if (!blob) {
            triggerDataUrlDownload(fileName);
            return;
          }
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(() => URL.revokeObjectURL(url), 2000);
          showToast('High-resolution poster downloaded!', 'success');
        }, 'image/png', 1.0);
      } else {
        triggerDataUrlDownload(fileName);
      }
    } catch (err) {
      console.error('Download error:', err);
      showToast('Error generating poster download. Please try again.', 'error');
    }
  }

  function triggerDataUrlDownload(fileName) {
    const dataUrl = dom.canvas.toDataURL('image/png', 1.0);
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Poster downloaded!', 'success');
  }

  // ==========================================================================
  // LinkedIn Sharing
  // ==========================================================================
  async function handleLinkedInShare() {
    renderCanvas();

    const shareTitle = "I'm Attending DevOpsDays Islamabad 2026!";
    const shareText = `Excited to announce that I will be attending DevOpsDays Islamabad 2026! 🚀 Looking forward to inspiring keynotes, technical workshops, and connecting with the DevOps, Cloud, and SRE community.\n\n#DevOpsDaysIslamabad #DevOpsDays #DevOps #CloudNative #Islamabad #SRE`;

    // Attempt Native Web Share API with File
    if (navigator.canShare && navigator.share && dom.canvas.toBlob) {
      try {
        const blob = await new Promise(resolve => dom.canvas.toBlob(resolve, 'image/png', 1.0));
        if (blob) {
          const sanitizedName = (state.name || 'Attendee').replace(/[^a-zA-Z0-9_-]/g, '_');
          const file = new File([blob], `DevOpsDays-Islamabad-2026-${sanitizedName}.png`, { type: 'image/png' });

          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: shareTitle,
              text: shareText,
              files: [file]
            });
            showToast('Shared successfully!', 'success');
            return;
          }
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.warn('Native share failed or dismissed, opening fallback dialog:', err);
        } else {
          return; // User canceled share sheet
        }
      }
    }

    // Fallback: Open polished LinkedIn Sharing modal
    openLinkedInModal(shareText);
  }

  function openLinkedInModal(caption) {
    dom.captionText.value = caption;
    dom.copyTextState.textContent = 'Copy Caption';
    dom.linkedInModal.classList.add('is-open');
    dom.linkedInModal.setAttribute('aria-hidden', 'false');
  }

  function closeModal() {
    dom.linkedInModal.classList.remove('is-open');
    dom.linkedInModal.setAttribute('aria-hidden', 'true');
  }

  function copyShareCaption() {
    dom.captionText.select();
    dom.captionText.setSelectionRange(0, 99999);
    try {
      navigator.clipboard.writeText(dom.captionText.value).then(() => {
        dom.copyTextState.textContent = 'Copied! ✓';
        showToast('Caption copied to clipboard!', 'success');
        setTimeout(() => {
          dom.copyTextState.textContent = 'Copy Caption';
        }, 2500);
      });
    } catch (err) {
      document.execCommand('copy');
      dom.copyTextState.textContent = 'Copied! ✓';
      showToast('Caption copied to clipboard!', 'success');
    }
  }

  // ==========================================================================
  // Reset Everything
  // ==========================================================================
  function resetAll() {
    if (!confirm('Are you sure you want to reset all customizations to defaults?')) {
      return;
    }

    removePhoto();

    state.name = 'SYED MUHAMMAD ALI';
    state.nameSize = TEXT_BOUNDS.name.defaultSize;
    state.designation = 'Principal DevOps Architect | AWS Hero\nCloud Platform Engineering';
    state.desigSize = TEXT_BOUNDS.designation.defaultSize;
    state.photoZoom = 100;
    state.photoPanX = 0;
    state.photoPanY = 0;
    state.photoRotation = 0;
    state.glowIntensity = 1.0;
    state.isUppercase = true;
    state.fontFamily = 'Montserrat';

    dom.nameInput.value = state.name;
    dom.desigInput.value = state.designation;
    dom.nameSizeRange.value = state.nameSize;
    dom.nameSizeValue.textContent = state.nameSize + 'px';
    dom.desigSizeRange.value = state.desigSize;
    dom.desigSizeValue.textContent = state.desigSize + 'px';
    dom.zoomRange.value = 100;
    dom.zoomValue.textContent = '100%';
    dom.panXRange.value = 0;
    dom.panYRange.value = 0;
    dom.glowIntensityRange.value = 100;
    dom.glowIntensityValue.textContent = '100%';
    dom.fontSelect.value = 'Montserrat';
    dom.chkUppercase.checked = true;

    renderCanvas();
    showToast('Reset all customizations to defaults', 'info');
  }

  // ==========================================================================
  // Toast Notification System
  // ==========================================================================
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = 'toast';

    let iconSvg = '';
    if (type === 'success') {
      iconSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>';
    } else if (type === 'error') {
      iconSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';
    } else {
      iconSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="#d946ef" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
    }

    toast.innerHTML = `<span class="toast-icon">${iconSvg}</span><span>${escapeHtml(message)}</span>`;
    dom.toastContainer.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 3500);
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // Start application on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
