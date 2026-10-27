// Explicit source rectangles: generated illustrations do not obey equal cells.
export const PROP_RECTS={jar:[20,25,490,490],rope:[560,10,420,560],shield:[1030,20,490,500],jarBroken:[10,535,515,465],ropeBroken:[550,580,450,410],shieldBroken:[1015,530,515,475]};
export const RELIC_RECTS=[
[20,12,165,161],[200,22,177,144],[388,20,180,146],[592,20,170,146],[784,0,174,178],[982,20,146,145],[1155,8,185,172],[1360,20,160,146],
[32,180,128,159],[196,180,172,160],[387,188,178,150],[596,180,155,158],[778,184,165,155],[968,178,170,163],[1170,187,163,151],[1355,178,160,164],
[28,344,139,166],[222,346,153,166],[418,340,148,181],[607,340,147,181],[786,352,152,162],[971,342,173,179],[1170,346,135,174],[1353,340,167,181],
[17,528,155,156],[192,528,190,165],[399,528,178,159],[592,530,164,160],[770,526,190,166],[968,532,184,156],[1170,523,147,169],[1353,520,172,178],
[10,698,186,155],[208,703,164,137],[410,694,151,150],[588,700,170,140],[777,695,168,151],[976,700,164,143],[1169,694,144,155],[1357,700,157,141],
[12,853,166,156],[193,850,180,157],[384,850,184,166],[588,850,170,168],[764,845,198,171],[969,845,184,165],[1180,835,123,178],[1343,845,185,167]
];
const RELIC_MASKS={
19:'607,348 650,348 650,340 754,340 754,521 607,521',
23:'1353,355 1425,355 1425,340 1520,340 1520,521 1353,521',
38:'1169,694 1313,694 1313,832 1220,832 1220,849 1169,849',
46:'1180,850 1220,850 1220,835 1303,835 1303,1013 1180,1013'
};
let iconSerial=0;
export function atlasIcon(element,file,rect,label='',size=[1536,1024]){
 const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg'),image=document.createElementNS(ns,'image');
 svg.setAttribute('viewBox',rect.join(' '));svg.setAttribute('preserveAspectRatio','xMidYMid meet');svg.setAttribute('role','img');svg.setAttribute('aria-label',label);svg.style.cssText='display:block;width:100%;height:100%;overflow:hidden';
 const clip=document.createElementNS(ns,'clipPath'),box=document.createElementNS(ns,'rect'),id='atlas-crop-'+(++iconSerial);clip.setAttribute('id',id);['x','y','width','height'].forEach((k,i)=>box.setAttribute(k,rect[i]));const mask=RELIC_MASKS[RELIC_RECTS.indexOf(rect)];if(mask){const polygon=document.createElementNS(ns,'polygon');polygon.setAttribute('points',mask);clip.append(polygon);}else clip.append(box);svg.append(clip);image.setAttribute('clip-path',`url(#${id})`);image.setAttribute('href',file);image.setAttribute('width',String(size[0]));image.setAttribute('height',String(size[1]));svg.append(image);element.replaceChildren(svg);element.style.background='none';
}
