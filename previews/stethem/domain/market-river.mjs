const slotOrder = ['open', 'midday', 'close'];
const defaultWeather = 'sunny';
    function normalizeItems(items) {
        if (!Array.isArray(items)) {
            return [];
        }

        return items.filter((item) => item && item.image_url);
    }

    function compareItemsOldestFirst(a, b) {
        const aCreatedAt = Date.parse(a.created_at || '');
        const bCreatedAt = Date.parse(b.created_at || '');
        const dateDiff = Number.isFinite(aCreatedAt) && Number.isFinite(bCreatedAt)
            ? aCreatedAt - bCreatedAt
            : Date.parse(a.date || '') - Date.parse(b.date || '');

        if (Number.isFinite(dateDiff) && dateDiff !== 0) {
            return dateDiff;
        }

        return getSlotRank(a.slot) - getSlotRank(b.slot);
    }

    function getSlotRank(slot) {
        const rank = slotOrder.indexOf(slot);
        return rank === -1 ? slotOrder.length : rank;
    }

    function selectDisplaySnapshots(items, localWeather, maxItems) {
        const groups = new Map();

        items.forEach((item) => {
            const key = getSnapshotKey(item);
            const group = groups.get(key) || [];

            group.push(item);
            groups.set(key, group);
        });

        return Array.from(groups.values())
            .sort(compareSnapshotGroupsOldestFirst)
            .map((group) => selectItemFromSnapshotGroup(group, localWeather))
            .filter(Boolean)
            .slice(-maxItems);
    }

    function compareSnapshotGroupsOldestFirst(a, b) {
        return compareItemsOldestFirst(getNewestItem(a), getNewestItem(b));
    }

    function getSnapshotKey(item) {
        return `${item.date || ''}|${item.slot || ''}`;
    }

    function selectItemFromSnapshotGroup(items, localWeather) {
        const weatherOrder = [...new Set([localWeather || defaultWeather, 'sunny', 'cloudy', 'rainy'])];

        for (const weather of weatherOrder) {
            const selected = getNewestItem(items.filter((item) => String(item.weather || '').toLowerCase() === weather));

            if (selected) {
                return selected;
            }
        }

        return items[0] || null;
    }

    function getNewestItem(items) {
        return items.slice().sort(compareItemsOldestFirst).pop() || null;
    }

    function normalizeWeather(value) {
        if (value === null || value === undefined || value === '') {
            return defaultWeather;
        }

        if (typeof value === 'number' || /^\d+$/.test(String(value))) {
            return normalizeWeatherCode(Number(value));
        }

        const weather = String(value).toLowerCase().replace(/[_-]/g, ' ');

        if (/(rain|drizzle|thunder|storm|shower|sleet|snow|wet)/.test(weather)) {
            return 'rainy';
        }

        if (/(cloud|overcast|partly|fog|mist|haze)/.test(weather)) {
            return 'cloudy';
        }

        if (/(clear|sun|fair)/.test(weather)) {
            return 'sunny';
        }

        return defaultWeather;
    }

    function normalizeWeatherCode(code) {
        if ([0, 1].includes(code)) {
            return 'sunny';
        }

        if ([2, 3, 45, 48].includes(code)) {
            return 'cloudy';
        }

        if (code >= 51 && code <= 99) {
            return 'rainy';
        }

        return defaultWeather;
    }


export {normalizeItems, selectDisplaySnapshots, selectItemFromSnapshotGroup, normalizeWeather, getNewestItem};
