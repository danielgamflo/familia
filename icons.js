// Íconos propios de Familia: solo contorno, trazo redondeado, color heredado (negro por defecto).
(function () {
  const P = {
    // interfaz
    calendar: '<rect x="3.5" y="5" width="17" height="15" rx="4"/><path d="M8 3v4M16 3v4M3.5 10h17"/>',
    timer: '<circle cx="12" cy="13.5" r="7.5"/><path d="M12 9.5v4l2.5 2M9.5 3h5"/>',
    star: '<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8L3.5 9.7l5.9-.9z"/>',
    sliders: '<path d="M4 7h9M18 7h2M4 17h3M12 17h8"/><circle cx="15.5" cy="7" r="2.3"/><circle cx="9.5" cy="17" r="2.3"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    play: '<path d="M8.5 6.2v11.6a.8.8 0 0 0 1.2.7l9-5.8a.8.8 0 0 0 0-1.4l-9-5.8a.8.8 0 0 0-1.2.7z"/>',
    stop: '<rect x="6.5" y="6.5" width="11" height="11" rx="2.5"/>',
    pause: '<path d="M9 6.5v11M15 6.5v11"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    question: '<path d="M9.2 9.2a3 3 0 1 1 4.7 2.4c-1 .7-1.9 1.2-1.9 2.6"/><path d="M12 17.6v.1"/>',
    ban: '<circle cx="12" cy="12" r="8"/><path d="M6.5 17.5l11-11"/>',
    refresh: '<path d="M19 8.5A7.5 7.5 0 0 0 5.800 7M5 4v3.500h3.500M5 15.500A7.500 7.500 0 0 0 18.200 17M19 20v-3.500h-3.500"/>',
    'chev-left': '<path d="M14.5 6l-6 6 6 6"/>',
    'chev-right': '<path d="M9.5 6l6 6-6 6"/>',
    'arrow-up': '<path d="M12 19V6M6.500 11.500L12 6l5.500 5.500"/>',
    'arrow-down': '<path d="M12 5v13M6.500 12.500L12 18l5.500-5.500"/>',
    equal: '<path d="M6 9.500h12M6 14.500h12"/>',
    eye: '<path d="M2.500 12S6 5.500 12 5.500 21.500 12 21.500 12 18 18.500 12 18.500 2.500 12 2.500 12z"/><circle cx="12" cy="12" r="2.800"/>',
    key: '<circle cx="8" cy="15" r="3.500"/><path d="M10.500 12.500L19 4M16 7l2.500 2.500M13.500 9.500L16 12"/>',
    // logros y clima
    flame: '<path d="M12 2.800c.9 3.300 5.200 5.500 5.200 10A5.200 5.200 0 0 1 12 18a5.200 5.200 0 0 1-5.200-5.200c0-2.300 1.200-3.800 2.400-5.100.2 1.400.9 2.200 1.800 2.500C10.900 8.400 11 5.600 12 2.800zM9.500 21h5"/>',
    crown: '<path d="M4 17l-1-9 5 4 4-6 4 6 5-4-1 9zM4.500 20.500h15"/>',
    trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8.500 20h7M10 17h4"/>',
    gift: '<rect x="4" y="9" width="16" height="11" rx="2.500"/><path d="M12 9v11M3.500 9h17M12 9C9 8.800 7.500 7.500 7.500 6s2.500-2 4.500 3zM12 9c3-.2 4.500-1.500 4.500-3S14 4 12 9z"/>',
    sparkles: '<path d="M11 4l1.700 4.800L17.500 10.500l-4.800 1.700L11 17l-1.700-4.800L4.500 10.500l4.800-1.700zM18.500 15l.8 2.200 2.200.8-2.200.8-.8 2.200-.8-2.200-2.200-.8 2.200-.8z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.600 5.600L7 7M17 17l1.400 1.400M18.400 5.600L17 7M7 17l-1.400 1.400"/>',
    rain: '<path d="M7 15a4.500 4.500 0 1 1 1-8.900A5.500 5.500 0 0 1 18.500 8.300 3.400 3.400 0 0 1 17.500 15zM9 18l-1 2.500M13 18l-1 2.500M17 18l-1 2.500"/>',
    'cloud-sun': '<circle cx="8" cy="8" r="2.800"/><path d="M8 2.500v1M2.500 8h1M4 4l.7.7M12 4l-.7.7"/><path d="M8 19a4 4 0 0 1 .4-8 5 5 0 0 1 9.400 1.600A3.200 3.200 0 0 1 17 19z"/>',
    wave: '<path d="M3 9c2.500-3 4.500-3 6 0s3.500 3 6 0 3.500-3 6 0M3 15c2.500-3 4.500-3 6 0s3.500 3 6 0 3.500-3 6 0"/>',
    scale: '<path d="M12 4v16M7 20h10M5 8h14M5 8l-2.500 6a2.500 2.500 0 0 0 5 0zM19 8l-2.500 6a2.500 2.500 0 0 0 5 0z"/>',
    trend: '<path d="M3.500 17l6-6 4 4 7-8M15 7h5.500v5.500"/>',
    thumb: '<path d="M7 11v9H4v-9zM7 11l4-7a2 2 0 0 1 2 2v3h5.200a2 2 0 0 1 2 2.300l-1 6a2 2 0 0 1-2 1.700H7"/>',
    note: '<path d="M5 20h4L19.500 9.500a2.100 2.100 0 0 0-3-3L6 17zM14.500 8.500l3 3"/>',
    target: '<circle cx="12" cy="12" r="8.500"/><circle cx="12" cy="12" r="4.500"/><path d="M12 12v.1"/>',
    // naturaleza
    sprout: '<path d="M12 21v-9M12 12c0-4 3-6.500 7-6.500 0 4-3 6.500-7 6.500zM12 14.500c0-3-2.200-5-5.500-5 0 3 2.200 5 5.500 5z"/>',
    leaf: '<path d="M5 19c0-8 5-14 15-14 0 9-5 14-13 14zM5 19l7-7"/>',
    plant: '<path d="M12 12V8M12 12c-3 0-5-2-5-5 3 0 5 2 5 5zM12 12c3 0 5-2 5-5-3 0-5 2-5 5zM7.500 14h9l-1 6h-7z"/>',
    tree: '<path d="M12 21v-6M12 15c-4 0-6-2.500-6-5.500 0-2 1.200-3.300 3-3.800C9 3.700 10.500 2.500 12 2.500s3 1.200 3 3.200c1.800.5 3 1.800 3 3.800 0 3-2 5.500-6 5.500z"/>',
    pine: '<path d="M12 3l-5 6h3l-4 5h4l-3 4h10l-3-4h4l-4-5h3zM12 18v3"/>',
    flower: '<circle cx="12" cy="12" r="2.200"/><path d="M12 9.800C10 7.800 10 4.800 12 3.500c2 1.300 2 4.300 0 6.300zM14.200 12c2-2 5-2 6.300 0-1.300 2-4.300 2-6.300 0zM12 14.200c2 2 2 5 0 6.300-2-1.300-2-4.300 0-6.300zM9.800 12c-2 2-5 2-6.300 0 1.300-2 4.300-2 6.300 0z"/>',
    moon: '<path d="M19.500 14.500A8 8 0 0 1 9.500 4.500a8 8 0 1 0 10 10z"/>',
    // vida: categorías y áreas
    pray: '<path d="M12 3.500C8.500 7 6 9.800 6 13.500c0 2.800 1.300 4.700 3 6.200V21.500h6v-1.800c1.700-1.500 3-3.400 3-6.200C18 9.800 15.500 7 12 3.500zM12 7.500v14M9 11.800l3 1.700M15 11.800l-3 1.700"/>',
    cross: '<path d="M12 3v18M7 8.500h10"/>',
    book: '<path d="M4 5.500C6.500 4.500 9.500 4.500 12 6c2.500-1.500 5.500-1.500 8-.5v13c-2.500-1-5.500-1-8 .5-2.500-1.500-5.500-1.500-8-.5zM12 6v13"/>',
    church: '<path d="M12 2.500v4M10.500 4h3M7 21V12l5-4 5 4v9zM3.500 21h17M10 21v-5h4v5"/>',
    heart: '<path d="M12 20s-7-4.500-7-10a4 4 0 0 1 7-2.500A4 4 0 0 1 19 10c0 5.500-7 10-7 10z"/>',
    users: '<circle cx="9" cy="8.500" r="3"/><path d="M3.500 19c0-3 2.500-5 5.500-5s5.500 2 5.500 5M16 5.800a3 3 0 0 1 0 5.400M17.500 14.300c2 .6 3 2.200 3 4.700"/>',
    glasses: '<path d="M6 4h5l-.5 5a2 2 0 0 1-4 0zM8.500 11v7M6.500 20h4M13 4h5l-.5 5a2 2 0 0 1-4 0zM15.500 11v7M13.500 20h4"/>',
    cake: '<path d="M4 20h16v-6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2zM4 16c2 1.500 3.500 1.500 5 0s3-1.500 5 0 3.500 1.500 5 0M12 12V8M12 8c-1-1-1-2.500 0-3.500 1 1 1 2.500 0 3.500z"/>',
    dumbbell: '<path d="M6.500 7.500v9M17.500 7.500v9M3.500 10v4M20.500 10v4M6.500 12h11"/>',
    run: '<circle cx="14.500" cy="5" r="1.800"/><path d="M12 9l-3 3 3 2.500v5M12 9l4 2 3 .5M9 12l-4 1M12 14.500l3 2 1 3.500"/>',
    utensils: '<path d="M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10M17 21V3c-2.500 1.500-3.500 4.500-3.500 7.500H17"/>',
    coffee: '<path d="M5 9h11v5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5zM16 10.500h1.500a2.500 2.500 0 0 1 0 5H16M8 3.500c0 1.500 1.500 1.500 1.500 3M12 3.500c0 1.500 1.500 1.500 1.500 3"/>',
    broom: '<path d="M19 4l-8 8"/><path d="M9 10l5 5-4 5.500H5l-1-3z"/>',
    home: '<path d="M4 11l8-6.500 8 6.500M6 9.500V20h12V9.500M10 20v-5.500h4V20"/>',
    cart: '<path d="M3 4h2.500l2 11h10l2-8H7"/><circle cx="9" cy="19.500" r="1.400"/><circle cx="17" cy="19.500" r="1.400"/>',
    briefcase: '<rect x="3.500" y="7.500" width="17" height="12" rx="3"/><path d="M9 7.500V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.500M3.500 13h17"/>',
    laptop: '<rect x="5" y="5.500" width="14" height="10" rx="2.500"/><path d="M2.500 19h19"/>',
    phone: '<path d="M6.500 3.500h3l1.500 4-2 1.500a10 10 0 0 0 5 5l1.500-2 4 1.500v3a2 2 0 0 1-2 2A15 15 0 0 1 4.500 5.500a2 2 0 0 1 2-2z"/>',
    clapper: '<path d="M3.500 9.500l16-3.500.7 3.500zM8 6.800l2 3M13 5.800l2 3"/><rect x="3.500" y="10" width="17" height="10" rx="2.500"/>',
    mic: '<rect x="9" y="3.500" width="6" height="11" rx="3"/><path d="M5.500 11.500a6.500 6.500 0 0 0 13 0M12 18v3"/>',
    music: '<path d="M9 18V6l10-2v12"/><circle cx="6.500" cy="18" r="2.500"/><circle cx="16.500" cy="16" r="2.500"/>',
    camera: '<rect x="3.500" y="7" width="17" height="12" rx="3"/><circle cx="12" cy="13" r="3.200"/><path d="M8.500 7l1.200-2.500h4.600L15.500 7"/>',
    bulb: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.500 10.900c.8.600 1.500 1.500 1.500 2.600h4c0-1.100.7-2 1.500-2.600A6 6 0 0 0 12 3z"/>',
    plane: '<path d="M3 12l18-8-6 16-3.500-6.500zM11.500 13.500L21 4"/>',
    car: '<path d="M4.500 15.500V12l2-5h11l2 5v3.500zM4.500 12h15"/><circle cx="8" cy="15.500" r="1.200"/><circle cx="16" cy="15.500" r="1.200"/>'
  };
  const E = {
    '🙏': 'pray', '✝': 'cross', '⛪': 'church', '🕊': 'cross', '📖': 'book', '📚': 'book', '🥂': 'glasses', '🍷': 'glasses', '🍻': 'glasses',
    '👥': 'users', '👨‍👩‍👧': 'users', '🤝': 'users', '❤': 'heart', '💪': 'dumbbell', '🏋': 'dumbbell', '🏃': 'run', '🍽': 'utensils', '🍳': 'utensils', '🥗': 'utensils',
    '🧹': 'broom', '🧺': 'broom', '🛒': 'cart', '💼': 'briefcase', '💻': 'laptop', '🧑‍💻': 'laptop', '📞': 'phone', '📱': 'phone', '🎬': 'clapper', '🎥': 'clapper',
    '🎤': 'mic', '🎵': 'music', '🎶': 'music', '🌱': 'sprout', '🌾': 'sprout', '🌿': 'leaf', '🪴': 'plant', '🌳': 'tree', '🌲': 'pine', '🌸': 'flower',
    '🏠': 'home', '✨': 'sparkles', '🌟': 'sparkles', '🎉': 'sparkles', '⭐': 'star', '🔥': 'flame', '👑': 'crown', '🏆': 'trophy', '🎁': 'gift',
    '🌤': 'cloud-sun', '☀': 'sun', '🌧': 'rain', '🌊': 'wave', '⚖': 'scale', '📈': 'trend', '📝': 'note', '✏': 'note', '🗓': 'calendar', '📅': 'calendar',
    '⏱': 'timer', '⏸': 'pause', '👍': 'thumb', '👏': 'thumb', '👀': 'eye', '🔑': 'key', '☕': 'coffee', '🚗': 'car', '✈': 'plane', '📷': 'camera',
    '💡': 'bulb', '🌙': 'moon', '🎂': 'cake', '💯': 'target'
  };
  const key = x => {
    if (P[x]) return x;
    const c = String(x || '').replace(/️/g, '');
    return P[c] ? c : (E[c] || 'sparkles');
  };
  window.iconKey = key;
  window.ico = (x, cls) => `<svg class="ic${cls ? ' ' + cls : ''}" viewBox="0 0 24 24" aria-hidden="true">${P[key(x)]}</svg>`;
  window.ICON_LIST = ['pray', 'cross', 'book', 'church', 'heart', 'users', 'glasses', 'cake', 'dumbbell', 'run', 'utensils', 'coffee', 'broom', 'home', 'cart', 'briefcase', 'laptop', 'phone', 'clapper', 'camera', 'mic', 'music', 'bulb', 'target', 'sprout', 'leaf', 'tree', 'flower', 'sun', 'moon', 'plane', 'car', 'star', 'sparkles', 'flame', 'trophy', 'gift', 'timer', 'calendar', 'note'];
  // Quita emojis de los textos (avisos, mensajes) para que la app solo use íconos propios.
  window.noEmoji = t => String(t).replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B50}️‍✓]/gu, '').replace(/\s{2,}/g, ' ').trim();
})();
