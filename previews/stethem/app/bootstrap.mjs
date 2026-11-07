import {startFavicon} from '../ui/favicon.mjs';
import {loadMarketRiver} from '../features/market-river/index.mjs';
const start = () => { startFavicon(); loadMarketRiver(); };
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true});
else start();
