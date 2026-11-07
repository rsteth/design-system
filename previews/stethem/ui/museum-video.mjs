(() => {
    const video = document.querySelector('.museum-animation__video');
    const button = document.querySelector('.museum-animation__toggle');
    if (!video || !button || !video.canPlayType('video/mp4')) return;

    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let loaded = false;
    video.muted = true;
    button.hidden = false;

    function update() {
        const playing = !video.paused && !video.ended;
        button.textContent = playing ? 'pause' : 'play';
        button.setAttribute('aria-label', `${playing ? 'Pause' : 'Play'} museum animation`);
    }
    function load() {
        if (loaded) return;
        video.src = video.dataset.src;
        loaded = true;
    }
    function play() {
        load();
        video.play().catch(() => {
            // Low Power Mode or autoplay policy can leave the still poster in place.
            update();
        });
    }
    video.addEventListener('playing', () => {
        video.hidden = false;
        update();
    });
    video.addEventListener('pause', update);
    video.addEventListener('error', () => {
        video.hidden = true;
        button.hidden = true;
    });
    button.addEventListener('click', () => {
        if (video.paused) play();
        else video.pause();
    });
    motion.addEventListener('change', () => {
        if (motion.matches) {
            video.pause();
            video.hidden = true;
            video.removeAttribute('src');
            video.load();
            loaded = false;
            update();
        }
    });
    // No src or load call for reduced motion: even the video download is avoided.
    if (!motion.matches && !navigator.connection?.saveData) play();
})();
