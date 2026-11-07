import {normalizeItems, selectDisplaySnapshots, selectItemFromSnapshotGroup, normalizeWeather, getNewestItem} from '../../domain/market-river.mjs';
    const publicBaseUrl = 'https://market-river-generator-089089716476-dev.s3.us-east-1.amazonaws.com';
    const slotLabels = {
        open: 'Open',
        midday: 'Midday',
        close: 'Close'
    };
    const defaultWeather = 'sunny';
    const maxMarketRiverSnapshots = 9;
    const carouselWheelThreshold = 10;
    const carouselWheelUnlockMs = 260;
    const carouselTouchThreshold = 36;
    const carouselCenterSettleDelays = [0, 120, 240, 380];
    const carouselDesktopMediaQuery = '(min-width: 641px)';

    async function loadMarketRiver() {
        const homeRail = document.querySelector('[data-market-river-home]');
        const galleryRail = document.querySelector('[data-market-river-gallery]');
        const status = document.querySelector('[data-market-river-status]');

        if (!homeRail && !galleryRail) {
            return;
        }

        setMarketRiverStatus(status, homeRail ? 'loading latest market river image...' : 'loading market river...');
        renderLoading(homeRail || galleryRail);

        try {
            const manifestUrl = `${publicBaseUrl}/manifests/${homeRail ? 'latest' : 'recent'}.json`;
            let response;
            let historyUnavailable = false;
            try {
                response = await fetch(manifestUrl, { cache: 'no-store' });
                if (!response.ok) {
                    throw new Error(`Manifest request failed with status ${response.status}`);
                }
            } catch (error) {
                if (!galleryRail) throw error;
                historyUnavailable = true;
                response = await fetch(`${publicBaseUrl}/manifests/latest.json`, { cache: 'no-store' });
            }

            if (!response.ok) {
                throw new Error(`Manifest request failed with status ${response.status}`);
            }

            const manifest = await response.json();
            const items = normalizeItems(Array.isArray(manifest) ? manifest : manifest.items);
            renderForWeather(defaultWeather);
            const localWeather = await determineLocalWeather();
            if (localWeather !== defaultWeather) {
                renderForWeather(localWeather);
            }

            function renderForWeather(weather) {
                const displayItems = selectDisplaySnapshots(items, weather, maxMarketRiverSnapshots);
                const currentItem = displayItems[displayItems.length - 1] || null;

                if (homeRail) {
                    renderHomeRail(homeRail, displayItems, currentItem, manifest.updated_at);
                }

                if (galleryRail) {
                    renderGalleryRail(galleryRail, displayItems, manifest.updated_at);
                }

                bindImageFallbacks(homeRail || galleryRail);
                setMarketRiverStatus(status, historyUnavailable
                    ? 'history is unavailable right now. showing the latest snapshots.'
                    : formatGalleryStatus(displayItems, manifest.updated_at));
            }
        } catch (error) {
            renderFetchError(homeRail || galleryRail);
            setMarketRiverStatus(status, 'market river is unavailable right now. please check back soon.');
            console.error('Unable to load Market River manifest:', error);
        }
    }

    async function determineLocalWeather() {
        const position = await getBrowserPosition();

        if (!position) {
            return defaultWeather;
        }

        try {
            const params = new URLSearchParams({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                current: 'weather_code',
                timezone: 'auto'
            });
            const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`, {
                signal: AbortSignal.timeout(5000)
            });

            if (!response.ok) {
                return defaultWeather;
            }

            const weather = await response.json();
            return normalizeWeather(weather.current && weather.current.weather_code);
        } catch (error) {
            console.error('Unable to determine local weather:', error);
            return defaultWeather;
        }
    }

    function getBrowserPosition() {
        if (!navigator.geolocation) {
            return Promise.resolve(null);
        }

        return new Promise((resolve) => {
            const timeout = setTimeout(() => resolve(null), 7000);

            navigator.geolocation.getCurrentPosition((position) => {
                clearTimeout(timeout);
                resolve(position);
            }, () => {
                clearTimeout(timeout);
                resolve(null);
            }, {
                enableHighAccuracy: false,
                maximumAge: 30 * 60 * 1000,
                timeout: 6000
            });
        });
    }

    function renderHomeRail(rail, items, currentItem, fallbackProducedAtDateTime) {
        if (!items.length) {
            rail.innerHTML = renderEmptyState('No market river images yet.');
            return;
        }

        rail.innerHTML = items
            .map((item) => renderMarketCard(item, {
                linkImage: 'market-river/',
                isCurrent: item === currentItem,
                fallbackProducedAtDateTime: fallbackProducedAtDateTime
            }))
            .join('');

        bindMarketRiverCarousel(rail.parentElement, rail);
    }

    function renderGalleryRail(rail, items, fallbackProducedAtDateTime) {
        if (!items.length) {
            rail.innerHTML = renderEmptyState('No market river images yet.');
            return;
        }

        const days = new Map();
        items.forEach((item) => {
            const dayItems = days.get(item.date) || [];
            dayItems.push(item);
            days.set(item.date, dayItems);
        });
        const currentItem = items[items.length - 1];
        rail.innerHTML = Array.from(days, ([date, dayItems]) => `
            <section class="market-river-gallery__day${date === currentItem.date ? ' market-river-gallery__day--current' : ''}">
                <h2 class="market-river-gallery__date"><button type="button">${escapeHtml(formatDate(date))}</button></h2>
                <div class="market-river-gallery__day-rail">
                    ${dayItems.map((item) => renderMarketCard(item, {
                        showMetadataLink: true,
                        isCurrent: item === currentItem,
                        showSnapshotDate: true,
                        fallbackProducedAtDateTime
                    })).join('')}
                </div>
            </section>
        `).join('');

        const allCards = Array.from(rail.querySelectorAll('.market-river__card'));
        const rows = Array.from(rail.querySelectorAll('.market-river-gallery__day'));
        rows.forEach((row) => {
            const dayRail = row.querySelector('.market-river-gallery__day-rail');
            dayRail.querySelectorAll('.market-river__card').forEach((card) => {
                card.tabIndex = 0;
                card.setAttribute('aria-label', `View ${row.querySelector('h2').textContent} ${card.querySelector('.market-river__eyebrow span').textContent} snapshot`);
            });
            row.querySelector('button').addEventListener('click', () => {
                const dayCards = dayRail.querySelectorAll('.market-river__card');
                dayCards[dayCards.length - 1].click();
            });
            bindMarketRiverCarousel(dayRail, dayRail, (card) => {
                setFocusedMarketRiverCard(allCards, card);
                rows.forEach((day) => day.classList.toggle('market-river-gallery__day--current', day === row));
            });
        });
    }

    function bindMarketRiverCarousel(scroller, rail, onFocus) {
        if (!scroller || !rail) {
            return;
        }

        const cards = Array.from(rail.querySelectorAll('.market-river__card'));

        if (!cards.length) {
            return;
        }

        let activeIndex = cards.findIndex((card) => card.classList.contains('market-river__card--current'));
        if (activeIndex === -1) {
            activeIndex = cards.length - 1;
        }
        let frameRequest = null;
        let wheelGestureLocked = false;
        let wheelUnlockTimer = null;
        let centerSettleTimers = [];
        let suppressScrollFocus = true;
        let touchStartX = 0;
        let touchStartY = 0;
        let touchDeltaX = 0;
        let touchDeltaY = 0;
        let touchIsHorizontal = false;
        const latestCard = cards[activeIndex];

        if (!onFocus) setFocusedMarketRiverCard(cards, latestCard);
        settleMarketRiverCarouselCenter(scroller, cards, activeIndex, false);

        window.addEventListener('resize', () => {
            settleMarketRiverCarouselCenter(scroller, cards, activeIndex, false);
        });

        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                settleMarketRiverCarouselCenter(scroller, cards, activeIndex, false);
            }
        });

        scroller.addEventListener('scroll', () => {
            // Collapsing another day can change its scroll offset; it must not reclaim focus.
            if (suppressScrollFocus || (onFocus && !cards.some((card) => card.classList.contains('market-river__card--current')))) {
                return;
            }

            if (frameRequest) {
                return;
            }

            frameRequest = requestAnimationFrame(() => {
                frameRequest = null;
                activeIndex = cards.indexOf(getCenteredMarketRiverCard(scroller, cards));
                suppressScrollFocus = true;
                if (onFocus) onFocus(cards[activeIndex]);
                else setFocusedMarketRiverCard(cards, cards[activeIndex]);
                settleMarketRiverCarouselCenter(scroller, cards, activeIndex, false);
            });
        }, { passive: true });

        scroller.addEventListener('click', (event) => {
            const card = event.target.closest('.market-river__card');
            const cardIndex = cards.indexOf(card);

            if (cardIndex === -1 || (cardIndex === activeIndex && card.classList.contains('market-river__card--current'))) {
                return;
            }

            event.preventDefault();
            moveMarketRiverCarouselToIndex(scroller, cards, cardIndex, true);
        });

        if (onFocus) scroller.addEventListener('keydown', (event) => {
            if (event.target.closest('a')) return;
            const index = cards.indexOf(event.target.closest('.market-river__card'));
            if (index !== -1 && (event.key === 'Enter' || event.key === ' ')) {
                event.preventDefault();
                moveMarketRiverCarouselToIndex(scroller, cards, index, true);
            }
        });

        scroller.addEventListener('wheel', (event) => {
            const horizontalDelta = Math.abs(event.deltaX) >= Math.abs(event.deltaY) || event.shiftKey
                ? event.deltaX || event.deltaY
                : 0;

            if (Math.abs(horizontalDelta) < carouselWheelThreshold) {
                return;
            }

            event.preventDefault();

            if (isDesktopCarousel()) {
                return;
            }

            window.clearTimeout(wheelUnlockTimer);

            if (wheelGestureLocked) {
                wheelUnlockTimer = window.setTimeout(() => {
                    wheelGestureLocked = false;
                }, carouselWheelUnlockMs);
                return;
            }

            wheelGestureLocked = true;
            moveMarketRiverCarouselToIndex(scroller, cards, activeIndex + Math.sign(horizontalDelta), true);

            wheelUnlockTimer = window.setTimeout(() => {
                wheelGestureLocked = false;
            }, carouselWheelUnlockMs);
        }, { passive: false });

        scroller.addEventListener('touchstart', (event) => {
            const touch = event.touches[0];

            if (!touch) {
                return;
            }

            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
            touchDeltaX = 0;
            touchDeltaY = 0;
            touchIsHorizontal = false;
        }, { passive: true });

        scroller.addEventListener('touchmove', (event) => {
            const touch = event.touches[0];

            if (!touch) {
                return;
            }

            touchDeltaX = touch.clientX - touchStartX;
            touchDeltaY = touch.clientY - touchStartY;

            if (!touchIsHorizontal) {
                touchIsHorizontal = Math.abs(touchDeltaX) > carouselWheelThreshold
                    && Math.abs(touchDeltaX) > Math.abs(touchDeltaY);
            }

            if (touchIsHorizontal) {
                event.preventDefault();
            }
        }, { passive: false });

        scroller.addEventListener('touchend', () => {
            if (!touchIsHorizontal || Math.abs(touchDeltaX) < carouselTouchThreshold) {
                return;
            }

            moveMarketRiverCarouselToIndex(scroller, cards, activeIndex + (touchDeltaX < 0 ? 1 : -1), true);
        }, { passive: false });

        function moveMarketRiverCarouselToIndex(targetScroller, targetCards, index, smooth) {
            const nextIndex = Math.max(0, Math.min(targetCards.length - 1, index));

            activeIndex = nextIndex;
            suppressScrollFocus = true;
            if (onFocus) onFocus(targetCards[nextIndex]);
            else setFocusedMarketRiverCard(targetCards, targetCards[nextIndex]);
            settleMarketRiverCarouselCenter(targetScroller, targetCards, nextIndex, smooth);
        }

        function settleMarketRiverCarouselCenter(targetScroller, targetCards, index, smooth) {
            centerSettleTimers.forEach((timer) => window.clearTimeout(timer));
            centerSettleTimers = carouselCenterSettleDelays.map((delay, delayIndex) => window.setTimeout(() => {
                requestAnimationFrame(() => {
                    const targetCard = targetCards[index];

                    if (!targetCard) {
                        return;
                    }

                    centerMarketRiverCard(targetScroller, targetCard, smooth && delayIndex === 0);

                    if (delayIndex === carouselCenterSettleDelays.length - 1) {
                        activeIndex = index;
                        suppressScrollFocus = false;
                        if (!onFocus) setFocusedMarketRiverCard(targetCards, targetCard);
                    }
                });
            }, delay));
        }
    }

    function getCenteredMarketRiverCard(scroller, cards) {
        const scrollerRect = scroller.getBoundingClientRect();
        const scrollerCenter = scrollerRect.left + scrollerRect.width / 2;

        return cards.reduce((closestCard, card) => {
            const cardRect = card.getBoundingClientRect();
            const cardCenter = cardRect.left + cardRect.width / 2;
            const closestRect = closestCard.getBoundingClientRect();
            const closestCenter = closestRect.left + closestRect.width / 2;

            return Math.abs(cardCenter - scrollerCenter) < Math.abs(closestCenter - scrollerCenter)
                ? card
                : closestCard;
        }, cards[0]);
    }

    function centerMarketRiverCard(scroller, card, smooth) {
        const scrollerRect = scroller.getBoundingClientRect();
        const cardRect = card.getBoundingClientRect();
        const cardCenterOffset = cardRect.left + cardRect.width / 2 - (scrollerRect.left + scrollerRect.width / 2);

        scroller.scrollTo({
            left: scroller.scrollLeft + cardCenterOffset,
            behavior: smooth ? 'smooth' : 'auto'
        });
    }

    function isDesktopCarousel() {
        return window.matchMedia && window.matchMedia(carouselDesktopMediaQuery).matches;
    }

    function setFocusedMarketRiverCard(cards, focusedCard) {
        cards.forEach((card) => {
            const isFocused = card === focusedCard;

            card.classList.toggle('market-river__card--current', isFocused);
            card.setAttribute('aria-current', isFocused ? 'true' : 'false');
        });
    }

    function renderMarketCard(item, options) {
        const settings = options || {};
        const label = getSlotLabel(item.slot);
        const dateTime = (settings.showSnapshotDate && item.date) || item.created_at || settings.fallbackProducedAtDateTime || item.date || '';
        const date = settings.showSnapshotDate && item.date ? formatDate(item.date) : formatProducedAt(dateTime) || formatDate(item.date);
        const caption = item.caption ? `<p class="market-river__caption">${escapeHtml(item.caption)}</p>` : '';
        const image = renderImage(item, label, date, settings.linkImage);
        const metadataLink = settings.showMetadataLink ? renderMetadataLink(item.metadata_url) : '';
        const currentClass = settings.isCurrent ? ' market-river__card--current' : '';

        return `
            <article class="market-river__card${currentClass}" data-metadata-url="${escapeAttribute(item.metadata_url || '')}" data-weather="${escapeAttribute(normalizeWeather(item.weather))}" data-run-id="${escapeAttribute(item.run_id || '')}">
                ${image}
                <div class="market-river__card-body">
                    <div class="market-river__eyebrow">
                        <span>${escapeHtml(label)}</span>
                        <time datetime="${escapeAttribute(dateTime)}">${escapeHtml(date)}</time>
                    </div>
                    ${caption}
                    <dl class="market-river__moods">
                        <div>
                            <dt>market</dt>
                            <dd>${escapeHtml(formatMood(item.market_mood))}</dd>
                        </div>
                        <div>
                            <dt>volatility</dt>
                            <dd>${escapeHtml(formatMood(item.volatility_mood))}</dd>
                        </div>
                    </dl>
                    ${metadataLink}
                </div>
            </article>
        `;
    }

    function renderPeekImage(item) {
        const label = getSlotLabel(item.slot);
        const date = formatProducedAt(item.created_at) || formatDate(item.date);

        return `
            <article class="market-river__peek" data-metadata-url="${escapeAttribute(item.metadata_url || '')}" data-weather="${escapeAttribute(normalizeWeather(item.weather))}" data-run-id="${escapeAttribute(item.run_id || '')}" aria-label="${escapeAttribute(`${label} market river image for ${date}`)}">
                ${renderImage(item, label, date)}
            </article>
        `;
    }

    function renderMetadataLink(metadataUrl) {
        if (!metadataUrl) {
            return '';
        }

        return `
            <p class="market-river__metadata">
                <a href="${escapeAttribute(metadataUrl)}" target="_blank" rel="noopener">metadata</a>
            </p>
        `;
    }

    function renderImage(item, label, date, linkHref) {
        const fallbackAlt = `${label} market river image for ${date}`;
        const alt = item.caption ? `${item.caption} (${fallbackAlt})` : fallbackAlt;
        const imageMarkup = `
            <img src="${escapeAttribute(item.image_url || '')}" alt="${escapeAttribute(alt)}" loading="lazy">
            <div class="market-river__image-error" hidden>image unavailable</div>
        `;

        if (!linkHref) {
            return `<div class="market-river__image-wrap">${imageMarkup}</div>`;
        }

        return `
            <a class="market-river__image-link" href="${escapeAttribute(linkHref)}" data-metadata-url="${escapeAttribute(item.metadata_url || '')}" aria-label="Open the Market River archive">
                <div class="market-river__image-wrap">${imageMarkup}</div>
            </a>
        `;
    }

    function renderLoading(target) {
        if (!target) {
            return;
        }

        target.innerHTML = `
            <article class="market-river__card market-river__card--current market-river__card--loading">
                <div class="market-river__placeholder">loading</div>
                <div class="market-river__card-body" aria-hidden="true"></div>
            </article>
        `;
    }

    function renderEmptyState(message) {
        return `
            <article class="market-river__card market-river__card--current market-river__card--empty">
                <div class="market-river__placeholder">market river</div>
                <div class="market-river__card-body">
                    <h3>${escapeHtml(message)}</h3>
                </div>
            </article>
        `;
    }

    function renderFetchError(target) {
        if (!target) {
            return;
        }

        target.innerHTML = renderEmptyState('Market river is unavailable right now.');
    }

    function bindImageFallbacks(target) {
        if (!target) {
            return;
        }

        target.querySelectorAll('.market-river__image-wrap img').forEach((image) => {
            image.addEventListener('error', function() {
                const wrapper = image.closest('.market-river__image-wrap');
                const fallback = wrapper && wrapper.querySelector('.market-river__image-error');

                image.hidden = true;

                if (fallback) {
                    fallback.hidden = false;
                }
            }, { once: true });

            if (!image.getAttribute('src')) {
                image.dispatchEvent(new Event('error'));
            }
        });
    }

    function setMarketRiverStatus(element, message) {
        if (element) {
            element.textContent = message;
        }
    }

    function formatGalleryStatus(items, fallbackProducedAtDateTime) {
        const latestItem = getNewestItem(items);
        const producedAt = latestItem ? formatProducedAt(latestItem.created_at || fallbackProducedAtDateTime) : '';
        return producedAt ? `latest produced ${producedAt}` : formatManifestStatus(fallbackProducedAtDateTime, items.length);
    }

    function formatManifestStatus(updatedAt, itemCount) {
        const countLabel = itemCount === 1 ? '1 image' : `${itemCount} images`;
        const updatedDate = new Date(updatedAt);

        if (Number.isNaN(updatedDate.getTime())) {
            return `${countLabel} available`;
        }

        return `${countLabel} available - last updated ${updatedDate.toLocaleString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        })}`;
    }

    function formatProducedAt(value) {
        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return '';
        }

        return `${date.toLocaleString('en-US', {
            timeZone: 'America/Los_Angeles',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        })} Pacific`;
    }

    function formatDate(value) {
        const date = parseManifestDate(value);

        if (Number.isNaN(date.getTime())) {
            return value || 'undated';
        }

        return date.toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }

    function parseManifestDate(value) {
        const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '');

        if (match) {
            return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
        }

        return new Date(value);
    }

    function formatMood(value) {
        return value ? value.replace(/_/g, ' ') : 'unknown';
    }

    function getSlotLabel(slot) {
        return slotLabels[slot] || formatMood(slot || 'image');
    }

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function escapeAttribute(value) {
        return escapeHtml(value).replace(/`/g, '&#96;');
    }

export {loadMarketRiver, renderMarketCard};
