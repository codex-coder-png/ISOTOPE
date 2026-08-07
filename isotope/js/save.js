'use strict';window.SAVE={};
(function(){
const KEY='isotope_save_v3';
function def(){return{coins:0,sel:'e1',unlocked:['e1','e6','e8'],mols:[],meta:{},
 mastery:{},stats:{runs:0,kills:0,bestWave:0,earned:0,mxp:0},
 set:{sfx:80,mus:50,music:1,shake:1,dmg:1},brief:false}}
let S;try{S={...def(),...JSON.parse(localStorage.getItem(KEY)||'{}')};
 S.stats={...def().stats,...(S.stats||{})};S.set={...def().set,...(S.set||{})};
 S.meta=S.meta||{};S.mastery=S.mastery||{};}catch(e){S=def()}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}
function refreshCoins(){document.querySelectorAll('.coinv').forEach(b=>b.textContent=S.coins)}
function addCoins(v){S.coins+=v;S.stats.earned+=Math.max(0,v);refreshCoins()}
function spend(v){if(S.coins<v)return false;S.coins-=v;refreshCoins();save();return true}
function mxp(id){return S.mastery[id]||{xp:0,nodes:{}}}
function addMxp(id,v){const m=mxp(id);m.xp+=v;S.mastery[id]=m;S.stats.mxp+=v}
function nodeRank(id,key){return mxp(id).nodes[key]||0}
function buyNode(elemId,nodeIdx){const t=DATA.MNODES[nodeIdx],m=mxp(elemId),r=m.nodes[t.key]||0;
 if(r>=t.max)return false;const c=DATA.mxCost(nodeIdx,r);
 if(m.xp<c)return false;m.xp-=c;m.nodes[t.key]=r+1;S.mastery[elemId]=m;save();return true}
function metaLv(id){return S.meta[id]||0}
function metaCost(m,lv){return Math.round(m.base*Math.pow(lv+1,1.7)/10)*10}
Object.assign(SAVE,{get raw(){return S},save,refreshCoins,addCoins,spend,
 mxp,addMxp,nodeRank,buyNode,metaLv,metaCost});
Object.defineProperty(SAVE,'coins',{get:()=>S.coins});
Object.defineProperty(SAVE,'unlocked',{get:()=>S.unlocked});
Object.defineProperty(SAVE,'mols',{get:()=>S.mols});
Object.defineProperty(SAVE,'set',{get:()=>S.set});
Object.defineProperty(SAVE,'stats',{get:()=>S.stats});
Object.defineProperty(SAVE,'meta',{get:()=>S.meta});
Object.defineProperty(SAVE,'sel',{get:()=>S.sel,set:v=>{S.sel=v}});
})();