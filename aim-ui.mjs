export function aimCue(power,z,{holding=false,open=true,inFlight=false,tap=false}={}){
 if(inFlight)return {state:'flight',label:'箭已离弦',detail:'等待落点'};
 if(!holding)return {state:'idle',label:'按住拉弓',detail:'青区可中 · 金芯神射'};
 if(!open)return {state:'blocked',label:'等旗帘打开',detail:'可以收弓，等待下一次空隙'};
 if(power<z.min)return {state:'drawing',label:'再拉一点',detail:'指针还未进入命中区'};
 if(power>z.max)return {state:'over',label:'过了，收弓',detail:'这次收弓不算失手'};
 if(power>=z.perfectMin&&power<=z.perfectMax)return {state:'perfect',label:tap?'神射 · 再点':'神射 · 松手',detail:'金芯内，预计神射'};
 return {state:'good',label:tap?'再点出箭':'松手',detail:'继续观察金芯，别拉过头'};
}
