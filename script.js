const button = document.getElementById("startBtn");
const shareBtn = document.getElementById("shareBtn");
const music = document.getElementById("music");

function saveAudioState() {
    if (!music) return;
    localStorage.setItem("scrapbookMusicPlaying", !music.paused);
    localStorage.setItem("scrapbookMusicTime", music.currentTime.toString());
}

function restoreAudioState() {
    if (!music) return;
    const wasPlaying = localStorage.getItem("scrapbookMusicPlaying") === "true";
    const savedTime = parseFloat(localStorage.getItem("scrapbookMusicTime") || "0");

    const applySavedTime = () => {
        if (!isNaN(savedTime) && savedTime > 0) {
            const maxTime = music.duration || savedTime;
            music.currentTime = Math.min(savedTime, maxTime);
        }
    };

    if (music.readyState >= 1) {
        applySavedTime();
    } else {
        music.addEventListener("loadedmetadata", applySavedTime, { once: true });
    }

    if (wasPlaying) {
        const tryPlay = () => {
            const playPromise = music.play();
            if (playPromise && typeof playPromise.then === "function") {
                playPromise.catch(() => {
                    // Auto-play may be blocked until a user interaction occurs.
                });
            }
        };

        if (music.readyState >= 2) {
            tryPlay();
        } else {
            music.addEventListener("canplay", tryPlay, { once: true });
        }
    }
}

if (music) {
    music.addEventListener("timeupdate", saveAudioState);
    music.addEventListener("play", saveAudioState);
    music.addEventListener("pause", saveAudioState);
    window.addEventListener("beforeunload", saveAudioState);
    restoreAudioState();
    initMusicControl();
}

function initMusicControl() {
    const control = document.createElement("button");
    control.className = "music-control";
    control.type = "button";
    control.textContent = music && !music.paused ? "Pause Music" : "Play Music";
    control.addEventListener("click", () => {
        if (!music) return;
        if (music.paused) {
            music.play().catch(() => {
                control.textContent = "Play Music";
            });
        } else {
            music.pause();
        }
    });
    document.body.appendChild(control);

    const updateControl = () => {
        if (!music) return;
        control.textContent = music.paused ? "Play Music" : "Pause Music";
    };

    music.addEventListener("play", updateControl);
    music.addEventListener("pause", updateControl);
}

const navigateToStory = (target) => {
    if (window.navigateWithTransition) {
        window.navigateWithTransition(target);
    } else {
        window.location.href = target;
    }
};

if (button) {
    button.onclick = function() {
        if (music) {
            music.load();
            music.volume = 0.65;
            const playPromise = music.play();
            if (playPromise && typeof playPromise.then === "function") {
                playPromise.catch(() => {
                    // If browser blocks autoplay, still continue to the story page.
                }).finally(() => {
                    navigateToStory("story.html");
                });
            } else {
                navigateToStory("story.html");
            }
        } else {
            navigateToStory("story.html");
        }
    };
}

if (shareBtn) {
    shareBtn.addEventListener('click', async () => {
        const url = window.location.href;
        try {
            await navigator.clipboard.writeText(url);
            shareBtn.textContent = 'Link copied! ✅';
            setTimeout(() => {
                shareBtn.textContent = '📱 Copy link for phone';
            }, 2200);
        } catch (error) {
            window.prompt('Copy this link to your phone:', url);
        }
    });
}

const imageModal = document.getElementById("imageModal");
const modalImg = document.getElementById("modalImg");
const modalCaption = document.getElementById("modalCaption");
const modalClose = document.getElementById("modalClose");

function openImageModal(src, caption) {
    if (!imageModal || !modalImg) return;
    modalImg.src = src;
    modalImg.alt = caption || "Memory image";
    if (modalCaption) {
        modalCaption.textContent = caption || "";
    }
    imageModal.classList.add("open");
    imageModal.setAttribute("aria-hidden", "false");
}

function closeImageModal() {
    if (!imageModal) return;
    imageModal.classList.remove("open");
    imageModal.setAttribute("aria-hidden", "true");
}

const galleryImages = document.querySelectorAll(".scrapbook-card img");
if (galleryImages.length > 0) {
    galleryImages.forEach((img) => {
        img.style.cursor = "pointer";
        img.addEventListener("click", () => {
            openImageModal(img.src, img.dataset.caption || img.alt || "");
        });
    });
}

if (modalClose) {
    modalClose.addEventListener("click", closeImageModal);
}

if (imageModal) {
    imageModal.addEventListener("click", (event) => {
        if (event.target === imageModal) {
            closeImageModal();
        }
    });
}

