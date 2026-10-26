import {loadProfiles} from './camp-profile.mjs';
try{const book=loadProfiles(localStorage),p=book.slots[book.active];if(p.progress?.shots>0||p.progress?.mission>0)document.getElementById('enter-game').textContent='继续历练 →';}catch{}
