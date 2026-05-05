import { useState, useRef, useEffect } from "react";

const FULL_MOON_GOLD_BONUS = 10;
const MAX_ROUNDS = 4;

const C = {
  bg:"#0d0d0d",bgDark:"#080808",bgCard:"#141414",bgCardAlt:"#111111",
  border:"#2a2a2a",gold:"#b8860b",goldBright:"#d4a017",goldDim:"#5a4a00",
  red:"#6b1a1a",redBright:"#a02020",
  text:"#aaa9a0",textDim:"#555550",textBright:"#d0cfc0",
};

const RETREAT_MESSAGES = [
  "You ran. Pathetic.","Another coward flees. The monsters are laughing.",
  "You retreated. 'Only cowards retreat.' — sound familiar?",
  "You turned and ran. The dungeon didn't even bother chasing.",
  "Fled again. Nothing was threatened by your departure.",
  "A tactical withdrawal. That's what cowards call it.",
  "Safe. Warm. Forgettable.",
];

const DEATH_MESSAGES = [
  {title:"You Died",body:"The dungeon showed no mercy. Better luck next time."},
  {title:"Too Greedy",body:"One more room, you said. The monsters disagreed."},
  {title:"Outmatched",body:"You fought hard and fell harder."},
  {title:"Greed Kills",body:"You had enough gold to leave. You wanted more."},
  {title:"Overconfident",body:"Your stats said you could win. Your HP said otherwise."},
  {title:"One Step Too Far",body:"The treasure was right there. Shame about the monster."},
  {title:"Not Good Enough",body:"Push further next time. Or die again. Your choice."},
];

const AI_WIN_MESSAGES = [
  {title:"The Rival Wins. Again.",body:"Did you really think this time would be different?"},
  {title:"Not Even Close",body:"The Rival outgeared, outfought, and outwitted you. All four rounds."},
  {title:"You Were Outclassed",body:"The Rival didn't win. You lost. There's a difference and you are it."},
  {title:"Completely Dominated",body:"The Rival barely noticed you were there. Try harder."},
  {title:"Was That Your Best?",body:"If so, you should seriously reconsider your life choices."},
  {title:"Go Home",body:"The Rival has already moved on. You should too."},
  {title:"You Never Had a Chance",body:"The Rival knew from round one. You just didn't know it yet."},
];

const BATTLE_NARRATIVES = [
  (_,m,o)=>o==="win"?`Your strike lands clean. The ${m} drops.`:`The ${m} tears through your guard.`,
  (_,m,o)=>o==="win"?`The ${m} falls. Blood on stone.`:`The ${m} was stronger. Today it wins.`,
  (_,m,o)=>o==="win"?`Clean kill. The ${m} won't trouble anyone again.`:`You underestimated the ${m}. Painful.`,
  (_,m,o)=>o==="win"?`Down. The ${m} is done.`:`The ${m} was too much today.`,
];

const ROUND_NARRATIVES = [
  r=>`Round ${r}. The dark gets heavier. Push forward.`,
  r=>`Round ${r}. Something worse is waiting below.`,
  r=>`Round ${r}. The monsters know you're coming.`,
  r=>`Round ${r}. Last chance to build something worth fighting with.`,
];

const WEAPON_CHAIN = [
  {id:"w1",name:"Dagger",icon:"🔪",desc:"+1 Weapon",stat:"weapon",val:1,cost:5,tier:1},
  {id:"w2",name:"Short Sword",icon:"🗡️",desc:"+2 Weapon",stat:"weapon",val:2,cost:10,tier:2},
  {id:"w3",name:"Longsword",icon:"⚔️",desc:"+4 Weapon",stat:"weapon",val:4,cost:18,tier:3},
  {id:"w4",name:"Grand Sword",icon:"🌟",desc:"+7 Weapon",stat:"weapon",val:7,cost:30,tier:4},
  {id:"w5",name:"Excalibur",icon:"👑",desc:"+12 Weapon — LEGENDARY",stat:"weapon",val:12,cost:55,tier:5,legendary:true},
];
const ARMOUR_CHAIN = [
  {id:"a1",name:"Buckler",icon:"🪖",desc:"+1 Armour",stat:"armour",val:1,cost:5,tier:1},
  {id:"a2",name:"Chainmail",icon:"⛓️",desc:"+2 Armour",stat:"armour",val:2,cost:10,tier:2},
  {id:"a3",name:"Plate Armour",icon:"🛡️",desc:"+4 Armour",stat:"armour",val:4,cost:18,tier:3},
  {id:"a4",name:"Dragon Scale",icon:"🐉",desc:"+7 Armour",stat:"armour",val:7,cost:30,tier:4},
  {id:"a5",name:"Aegis",icon:"🔱",desc:"+12 Armour — LEGENDARY",stat:"armour",val:12,cost:55,tier:5,legendary:true},
];
const BATTLE_CARDS = {
  1:[{id:"b1",name:"War Cry",icon:"⚔️",desc:"+1 Weapon this run",stat:"weapon",val:1,cost:2},{id:"b2",name:"Brace",icon:"🛡️",desc:"+1 Armour this run",stat:"armour",val:1,cost:2},{id:"b3",name:"Sprint",icon:"💨",desc:"+1 Speed this run",stat:"speed",val:1,cost:2},{id:"b4",name:"Adrenaline",icon:"💉",desc:"+3 HP this run",stat:"hp",val:3,cost:2}],
  2:[{id:"b5",name:"Battle Rage",icon:"🪓",desc:"+2 Weapon this run",stat:"weapon",val:2,cost:4},{id:"b6",name:"Iron Skin",icon:"🧱",desc:"+2 Armour this run",stat:"armour",val:2,cost:4},{id:"b7",name:"Haste",icon:"💨",desc:"+2 Speed this run",stat:"speed",val:2,cost:4},{id:"b8",name:"Vitality",icon:"❤️",desc:"+6 HP this run",stat:"hp",val:6,cost:5}],
  3:[{id:"b9",name:"Berserker",icon:"😤",desc:"+3 Weapon this run",stat:"weapon",val:3,cost:8},{id:"b10",name:"Stone Form",icon:"🪨",desc:"+3 Armour this run",stat:"armour",val:3,cost:8},{id:"b11",name:"Blur",icon:"💨",desc:"+3 Speed this run",stat:"speed",val:3,cost:8},{id:"b12",name:"Giant Blood",icon:"🩸",desc:"+10 HP this run",stat:"hp",val:10,cost:9}],
  4:[{id:"b13",name:"God of War",icon:"⚜️",desc:"+5 Weapon this run",stat:"weapon",val:5,cost:13},{id:"b14",name:"Invincible",icon:"🗡️",desc:"+5 Armour this run",stat:"armour",val:5,cost:13},{id:"b15",name:"Ghost Step",icon:"👣",desc:"+5 Speed this run",stat:"speed",val:5,cost:13}],
};
const EQUIPMENT_CARDS = {
  1:[{id:"e3",name:"Boots",icon:"👢",desc:"+1 Speed",stat:"speed",val:1,cost:5,cardType:"equipment",level:1},{id:"e4",name:"Lucky Charm",icon:"🍀",desc:"+1 Luck",stat:"luck",val:1,cost:5,cardType:"equipment",level:1}],
  2:[{id:"e7",name:"Swift Boots",icon:"👞",desc:"+2 Speed",stat:"speed",val:2,cost:6,cardType:"equipment",level:2},{id:"e8",name:"Fortune Ring",icon:"💍",desc:"+2 Luck",stat:"luck",val:2,cost:6,cardType:"equipment",level:2}],
  3:[{id:"e11",name:"Wing Boots",icon:"🪶",desc:"+3 Speed",stat:"speed",val:3,cost:11,cardType:"equipment",level:3},{id:"e12",name:"Luck Amulet",icon:"📿",desc:"+3 Luck",stat:"luck",val:3,cost:11,cardType:"equipment",level:3}],
  4:[{id:"e15",name:"Hermes Boots",icon:"⚡",desc:"+5 Speed",stat:"speed",val:5,cost:20,cardType:"equipment",level:4},{id:"e16",name:"Destiny Stone",icon:"🔮",desc:"+5 Luck",stat:"luck",val:5,cost:20,cardType:"equipment",level:4}],
};
const GOLD_CARDS = {
  1:[{id:"g1",name:"Copper",icon:"🪙",desc:"Worth 1 Gold",val:1},{id:"g2",name:"Silver",icon:"🥈",desc:"Worth 3 Gold",val:3}],
  2:[{id:"g3",name:"Gold",icon:"🟡",desc:"Worth 5 Gold",val:5},{id:"g4",name:"Gem",icon:"💎",desc:"Worth 8 Gold",val:8}],
  3:[{id:"g5",name:"Ruby",icon:"🔴",desc:"Worth 12 Gold",val:12},{id:"g6",name:"Sapphire",icon:"🔵",desc:"Worth 15 Gold",val:15}],
  4:[{id:"g7",name:"Diamond",icon:"💠",desc:"Worth 25 Gold",val:25},{id:"g8",name:"Crown",icon:"👑",desc:"Worth 40 Gold",val:40}],
};
const MONSTERS = [
  {name:"Goblin",icon:"👺",hp:6,maxHp:6,armour:1,weapon:3,speed:3,flavour:"Small. Fast. More annoying than dangerous."},
  {name:"Orc",icon:"👹",hp:10,maxHp:10,armour:3,weapon:4,speed:2,flavour:"Thick skull. Hits like a wall."},
  {name:"Wraith",icon:"👻",hp:7,maxHp:7,armour:0,weapon:6,speed:5,flavour:"No armour. Pure damage. Kill it fast."},
  {name:"Troll",icon:"🧌",hp:14,maxHp:14,armour:4,weapon:5,speed:1,flavour:"Slow. Massive. One hit could end you."},
  {name:"Skeleton",icon:"💀",hp:5,maxHp:5,armour:2,weapon:3,speed:4,flavour:"Already dead. Still wants to kill you."},
  {name:"Dragon",icon:"🐉",hp:20,maxHp:20,armour:5,weapon:7,speed:3,flavour:"Ancient. Terrible. The dungeon fears it."},
  {name:"Vampire",icon:"🧛",hp:9,maxHp:9,armour:1,weapon:5,speed:5,flavour:"Fast and precise. It has done this before."},
  {name:"Werewolf",icon:"🐺",hp:12,maxHp:12,armour:2,weapon:6,speed:4,flavour:"Rage given form. It does not stop."},
  {name:"Demon",icon:"😈",hp:15,maxHp:15,armour:3,weapon:6,speed:3,flavour:"From the pit. It enjoys this."},
  {name:"Banshee",icon:"👁️",hp:6,maxHp:6,armour:0,weapon:7,speed:6,flavour:"Screams first. Kills second. Move fast."},
  {name:"Golem",icon:"🗿",hp:18,maxHp:18,armour:6,weapon:4,speed:1,flavour:"Cannot be reasoned with."},
  {name:"Witch",icon:"🧙",hp:8,maxHp:8,armour:1,weapon:5,speed:4,flavour:"Old. Patient. Has seen a thousand fighters die."},
  {name:"Minotaur",icon:"🐂",hp:16,maxHp:16,armour:3,weapon:7,speed:2,flavour:"Built for this maze. Born angry."},
  {name:"Hydra",icon:"🐍",hp:22,maxHp:22,armour:4,weapon:6,speed:2,flavour:"High HP. High damage. Do not linger."},
  {name:"Phoenix",icon:"🔥",hp:11,maxHp:11,armour:2,weapon:6,speed:6,flavour:"Died once. Didn't care. Came back meaner."},
  {name:"Lich",icon:"☠️",hp:13,maxHp:13,armour:2,weapon:7,speed:3,flavour:"Chose undeath. Regrets nothing."},
];
const WEAK_MONSTERS = MONSTERS.filter(m=>m.weapon<=4&&m.hp<=10);
const STAT_UPGRADES = [
  {stat:"speed",label:"Speed",icon:"💨",costs:[5,10,18,28,40]},
  {stat:"luck",label:"Luck",icon:"🍀",costs:[4,8,14,22,33]},
  {stat:"hp",label:"Max HP",icon:"❤️",costs:[4,8,14,22,33]},
];
const BASE = {hp:20,maxHp:20,weapon:2,armour:1,speed:2,luck:1};
const STARTING_CARDS = [
  {id:"s1",name:"Strong Arm",icon:"💪",desc:"+3 Weapon",stat:"weapon",val:3},
  {id:"s2",name:"Sword Arm",icon:"⚔️",desc:"+2 Weapon",stat:"weapon",val:2},
  {id:"s3",name:"Iron Hide",icon:"🛡️",desc:"+3 Armour",stat:"armour",val:3},
  {id:"s4",name:"Thick Skin",icon:"🧱",desc:"+2 Armour",stat:"armour",val:2},
  {id:"s5",name:"Fleet Foot",icon:"💨",desc:"+3 Speed",stat:"speed",val:3},
  {id:"s6",name:"Quick Step",icon:"👟",desc:"+2 Speed",stat:"speed",val:2},
  {id:"s7",name:"Born Lucky",icon:"🍀",desc:"+3 Luck",stat:"luck",val:3},
  {id:"s8",name:"Lucky",icon:"🎲",desc:"+2 Luck",stat:"luck",val:2},
  {id:"s9",name:"Hardy",icon:"❤️",desc:"+6 Max HP",stat:"hp",val:6},
  {id:"s10",name:"Tough",icon:"🩸",desc:"+4 Max HP",stat:"hp",val:4},
];

function rnd(a){return a[Math.floor(Math.random()*a.length)];}
function lv1(pool,n){return[...pool[1]].sort(()=>Math.random()-.5).slice(0,n).map(c=>({...c}));}
function sumCards(cards,stat){return cards.filter(c=>c.stat===stat).reduce((a,c)=>a+c.val,0);}
function calcEff(base,equip,battle,wT=0,aT=0){
  const wB=WEAPON_CHAIN.filter(c=>c.tier<=wT).reduce((a,c)=>a+c.val,0);
  const aB=ARMOUR_CHAIN.filter(c=>c.tier<=aT).reduce((a,c)=>a+c.val,0);
  return{weapon:base.weapon+wB+sumCards(equip,"weapon")+sumCards(battle,"weapon"),armour:base.armour+aB+sumCards(equip,"armour")+sumCards(battle,"armour"),speed:base.speed+sumCards(equip,"speed")+sumCards(battle,"speed"),luck:base.luck+sumCards(equip,"luck"),maxHp:base.maxHp+sumCards(equip,"hp")+sumCards(battle,"hp")};
}
function scaleMonster(base,depth){return{...base,weapon:base.weapon+Math.floor(depth/2),hp:base.hp+depth*2,maxHp:base.hp+depth*2,armourTokens:base.armour};}
function luckChestLevel(luck,depth){return Math.min(4,(depth<=2?1:depth<=4?2:depth<=6?3:4)+(luck>=8?2:luck>=5?1:0));}
function luckBonusGold(luck){return Math.random()<luck/10?luck:0;}
function luckDodge(luck){return Math.random()<luck*0.03;}
function chestOpts(depth,luck=1){const lv=luckChestLevel(luck,depth);const pick=(pool,ct)=>({...rnd(pool[lv]||pool[1]),cardType:ct,level:lv});return[pick(BATTLE_CARDS,"battle"),pick(EQUIPMENT_CARDS,"equipment"),pick(GOLD_CARDS,"gold")];}
function shopAvail(pool,owned,ct){return Object.values(pool).flat().filter(c=>!owned.find(o=>o.id===c.id)).slice(0,6).map(c=>({...c,cardType:ct}));}
function initPlayer(){return{base:{...BASE},statLevels:{speed:0,luck:0,hp:0},equipCards:lv1(EQUIPMENT_CARDS,5).map(c=>({...c,cardType:"equipment",level:1})),battleCards:lv1(BATTLE_CARDS,5).map(c=>({...c,cardType:"battle",level:1})),goldCards:lv1(GOLD_CARDS,5).map(c=>({...c,cardType:"gold",level:1})),gold:0,hp:BASE.hp,depth:1,dungeonRounds:0,weaponTier:0,armourTier:0};}

function aiDoHome(p,round){
  let np={...p,goldCards:[],gold:p.gold+p.goldCards.reduce((a,c)=>a+(c.val||0),0)};
  const bonus=round===1?8:round===2?12:round===3?16:20;
  np={...np,gold:np.gold+bonus};
  const pri=(s,r)=>r===1?{weapon:12,armour:10,hp:6,speed:4,luck:3}[s]||0:r===2?{weapon:12,armour:10,speed:8,hp:5,luck:4}[s]||0:r===3?{weapon:14,speed:12,armour:8,luck:5,hp:3}[s]||0:{weapon:16,speed:14,armour:6,luck:4,hp:2}[s]||0;
  for(const type of["weapon","armour"]){const chain=type==="weapon"?WEAPON_CHAIN:ARMOUR_CHAIN;let tier=type==="weapon"?np.weaponTier:np.armourTier;let next=chain.find(c=>c.tier===tier+1);while(next&&np.gold>=next.cost){np={...np,gold:np.gold-next.cost,[type==="weapon"?"weaponTier":"armourTier"]:next.tier};tier=next.tier;next=chain.find(c=>c.tier===tier+1);}}
  const bOpts=shopAvail(BATTLE_CARDS,np.battleCards,"battle").filter(c=>np.gold>=c.cost).map(c=>({...c,score:(round>=3&&c.stat==="speed"?c.val*4:c.stat==="weapon"?c.val*3:c.val*2)/(c.cost||1)})).sort((a,b)=>b.score-a.score);
  for(const card of bOpts)if(np.gold>=card.cost)np={...np,gold:np.gold-card.cost,battleCards:[...np.battleCards,{...card}]};
  let ch=true;while(ch){ch=false;const opts=STAT_UPGRADES.map(su=>{const lv=np.statLevels[su.stat]||0;return{su,lv,cost:lv<su.costs.length?su.costs[lv]:Infinity,score:pri(su.stat,round)/(lv+1)};}).filter(o=>o.cost!==Infinity&&np.gold>=o.cost).sort((a,b)=>b.score-a.score);if(opts.length){const best=opts[0];const nb={...np.base};if(best.su.stat==="hp")nb.maxHp+=3;else nb[best.su.stat]+=1;np={...np,gold:np.gold-best.cost,base:nb,statLevels:{...np.statLevels,[best.su.stat]:best.lv+1}};ch=true;}}
  const eqOpts=shopAvail(EQUIPMENT_CARDS,np.equipCards,"equipment").filter(c=>np.gold>=c.cost).map(c=>({...c,score:pri(c.stat,round)*c.val/(c.cost||1)})).sort((a,b)=>b.score-a.score);
  if(eqOpts.length)np={...np,gold:np.gold-eqOpts[0].cost,equipCards:[...np.equipCards,{...eqOpts[0]}]};
  const e=calcEff(np.base,np.equipCards,np.battleCards,np.weaponTier,np.armourTier);
  return{...np,hp:e.maxHp};
}
function simulateDungeon(p){
  const eff=calcEff(p.base,p.equipCards,p.battleCards,p.weaponTier,p.armourTier);let hp=eff.maxHp,depth=1,msgs=[];
  while(hp>0&&depth<=5){const base=rnd(MONSTERS);const m=scaleMonster(base,depth+p.dungeonRounds*3);let mHp=m.hp,mAT=m.armourTokens,r=1;msgs.push(`Rival — Room ${depth}: ${m.icon} ${m.name}`);
    while(hp>0&&mHp>0&&r<=20){if(eff.speed>=m.speed){const d=eff.weapon,a=Math.min(mAT,d);mAT=Math.max(0,mAT-a);mHp=Math.max(0,mHp-(d-a));}if(mHp>0){const d=m.weapon,a=Math.min(eff.armour,d);hp=Math.max(0,hp-(d-a));}mAT=Math.min(m.armour,mAT+1);r++;}
    if(mHp<=0){msgs.push(`✓ ${m.name} down.`);const c=chestOpts(depth,eff.luck);const pick=c.find(x=>x.cardType==="equipment")||c[0];if(pick.cardType==="equipment")p={...p,equipCards:[...p.equipCards,pick]};else if(pick.cardType==="gold")p={...p,goldCards:[...p.goldCards,pick]};depth++;}
    else{msgs.push(`Rival fell — lost half gold.`);p={...p,gold:Math.floor(p.gold/2),goldCards:[]};break;}
  }
  return{player:{...p,hp:Math.max(0,hp),battleCards:[],dungeonRounds:p.dungeonRounds+1},msgs};
}

function HPBar({current,max,color}){return(<div style={{background:"#1a1a1a",borderRadius:2,height:8,width:"100%",overflow:"hidden",margin:"4px 0"}}><div style={{width:`${Math.max(0,(current/max)*100)}%`,height:"100%",background:color,transition:"width 0.4s"}}/></div>);}
const cardBg={battle:"#180f0f",equipment:"#0f1318",gold:"#181400"};
const cardBorder={battle:"#4a2020",equipment:"#1a2a3a",gold:"#4a3a00"};
function CardUI({card,onClick,small,showCost,canAfford}){
  const ct=card.cardType||"battle";
  return(<div onClick={canAfford!==false?onClick:undefined} style={{background:cardBg[ct],border:`1px solid ${canAfford===false?"#222":cardBorder[ct]}`,borderRadius:4,padding:small?"8px 6px":"12px 10px",textAlign:"center",flex:"1 1 80px",minWidth:small?70:85,maxWidth:115,opacity:canAfford===false?0.3:1,cursor:onClick&&canAfford!==false?"pointer":"default"}}>
    <div style={{fontSize:small?18:22}}>{card.icon}</div>
    <div style={{fontWeight:"bold",fontSize:small?11:13,color:C.textBright,margin:"4px 0 3px",lineHeight:1.2}}>{card.name}</div>
    <div style={{fontSize:small?10:11,color:C.textDim,lineHeight:1.3}}>{card.desc}</div>
    {showCost&&<div style={{fontSize:12,color:canAfford?C.goldBright:C.textDim,marginTop:4,fontWeight:"bold"}}>⬡ {card.cost}</div>}
  </div>);
}
function Btn({label,onClick,color,textColor,disabled,full,large}){
  return(<button onClick={onClick} disabled={disabled} style={{background:disabled?"#181818":color||C.bgCard,color:disabled?C.textDim:textColor||C.text,border:`1px solid ${disabled?"#222":C.border}`,borderRadius:3,padding:large?"16px 20px":"10px 16px",cursor:disabled?"not-allowed":"pointer",fontWeight:"bold",fontSize:large?17:14,width:full?"100%":"auto"}}>{label}</button>);
}
function Divider({label}){return(<div style={{display:"flex",alignItems:"center",gap:8,margin:"12px 0 8px"}}><div style={{flex:1,height:1,background:C.border}}/><div style={{color:C.textDim,fontSize:11,textTransform:"uppercase",letterSpacing:2}}>{label}</div><div style={{flex:1,height:1,background:C.border}}/></div>);}
function Tooltip({text,children}){
  const [show,setShow]=useState(false);
  return(<span style={{position:"relative",display:"inline-block",cursor:"help"}} onMouseEnter={()=>setShow(true)} onMouseLeave={()=>setShow(false)} onClick={e=>{e.stopPropagation();setShow(s=>!s);}}>
    {children}
    {show&&<div style={{position:"absolute",bottom:"130%",left:"50%",transform:"translateX(-50%)",background:"#0a0a0a",border:`1px solid ${C.border}`,borderRadius:4,padding:"10px 12px",fontSize:13,color:C.text,width:200,zIndex:100,lineHeight:1.6,pointerEvents:"none"}}>{text}</div>}
  </span>);
}
function Modal({children,borderColor}){return(<div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.96)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}><div style={{background:C.bgDark,border:`1px solid ${borderColor||C.border}`,borderRadius:4,padding:28,maxWidth:400,width:"100%"}}>{children}</div></div>);}
function CombatGuide({onClose}){
  return(<Modal borderColor={C.gold}>
    <div style={{color:C.goldBright,fontWeight:"bold",fontSize:18,marginBottom:14,textAlign:"center"}}>HOW COMBAT WORKS</div>
    <div style={{fontSize:14,lineHeight:2,color:C.text}}>
      <div><b style={{color:C.textBright}}>Speed</b> — higher acts first. Strictly higher = free Run.</div>
      <div><b style={{color:C.textBright}}>Weapon</b> — damage dealt each round.</div>
      <div><b style={{color:C.textBright}}>Armour</b> — absorbs damage before HP. Restores 1/round.</div>
      <div><b style={{color:C.textBright}}>HP</b> — hit 0 = death. Lose battle cards + half your gold.</div>
      <div><b style={{color:C.textBright}}>Luck</b> — dodge chance, bonus gold, better chest rewards.</div>
      <div><b style={{color:C.textBright}}>Bribe</b> — spend a gold card to skip the fight.</div>
      <div style={{color:C.goldDim,fontSize:12,marginTop:10,paddingTop:10,borderTop:`1px solid ${C.border}`}}>4 dungeon rounds → Full Moon Tournament. Most gold wins.</div>
    </div>
    <button onClick={onClose} style={{marginTop:16,width:"100%",background:"#1a1a1a",color:C.goldBright,border:`1px solid ${C.gold}`,borderRadius:3,padding:"14px",fontWeight:"bold",fontSize:15,cursor:"pointer"}}>Got it</button>
  </Modal>);
}
function DeathPopup({msg,onClose}){
  return(<Modal borderColor={C.redBright}>
    <div style={{textAlign:"center"}}>
      <div style={{fontSize:52,marginBottom:10}}>💀</div>
      <div style={{fontSize:20,fontWeight:"bold",color:C.redBright,marginBottom:12}}>{msg.title}</div>
      <div style={{fontSize:14,color:C.text,lineHeight:1.8,marginBottom:16}}>{msg.body}</div>
      <div style={{fontSize:13,color:C.goldDim,background:"#130808",border:`1px solid ${C.red}`,borderRadius:3,padding:"10px",marginBottom:18}}>Battle cards lost. Half your gold taken.</div>
      <button onClick={onClose} style={{width:"100%",background:"#1a0808",color:C.redBright,border:`1px solid ${C.red}`,borderRadius:3,padding:"14px",fontWeight:"bold",fontSize:15,cursor:"pointer"}}>Get back up</button>
    </div>
  </Modal>);
}
function AiWinPopup({msg,onClose}){
  return(<Modal borderColor="#5a0000">
    <div style={{textAlign:"center"}}>
      <div style={{fontSize:52,marginBottom:10}}>🏴</div>
      <div style={{fontSize:18,fontWeight:"bold",color:"#a02020",marginBottom:12,textTransform:"uppercase"}}>{msg.title}</div>
      <div style={{fontSize:14,color:C.textDim,lineHeight:1.8,marginBottom:20}}>{msg.body}</div>
      <button onClick={onClose} style={{width:"100%",background:"#0d0808",color:C.textDim,border:"1px solid #3a0000",borderRadius:3,padding:"14px",fontWeight:"bold",fontSize:14,cursor:"pointer"}}>Try again</button>
    </div>
  </Modal>);
}
function FightArena({monsterIcon,monsterName,combatAnim}){
  const a=combatAnim;
  return(<>
    <style>{`
      @keyframes lunge-r{0%{transform:translateX(0) scale(1)}40%{transform:translateX(52px) scale(1.12)}100%{transform:translateX(0) scale(1)}}
      @keyframes lunge-l{0%{transform:translateX(0) scale(1)}40%{transform:translateX(-52px) scale(1.12)}100%{transform:translateX(0) scale(1)}}
      @keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-11px)}40%{transform:translateX(10px)}60%{transform:translateX(-8px)}80%{transform:translateX(5px)}}
      @keyframes dodge{0%,100%{transform:translateY(0)}35%{transform:translateY(-24px)}}
      @keyframes flash-hit{0%,100%{filter:none}45%{filter:drop-shadow(0 0 16px #ff2020) brightness(1.7)}}
    `}</style>
    <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",padding:"24px 28px 16px",background:"#050505",borderRadius:4,marginBottom:12,border:`1px solid ${C.border}`,minHeight:160,position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",bottom:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${C.goldDim},transparent,#3a0000)`}}/>
      <div style={{textAlign:"center"}}>
        <div key={`p-${a.tick}`} style={{fontSize:88,display:"inline-block",lineHeight:1,
          animation:a.who==="player"&&a.type==="attack"?"lunge-r 0.45s ease-in-out":
                   a.who==="player"&&a.type==="hit"?"shake 0.4s ease,flash-hit 0.4s ease":
                   a.who==="player"&&a.type==="dodge"?"dodge 0.35s ease":"none"}}>🧙</div>
        <div style={{fontSize:13,color:C.goldBright,fontWeight:"bold",letterSpacing:2,marginTop:6}}>YOU</div>
      </div>
      <div style={{color:C.textDim,fontSize:18,opacity:0.4,paddingBottom:28}}>VS</div>
      <div style={{textAlign:"center"}}>
        <div key={`m-${a.tick}`} style={{fontSize:88,display:"inline-block",lineHeight:1,
          animation:a.who==="monster"&&a.type==="attack"?"lunge-l 0.45s ease-in-out":
                   a.who==="monster"&&a.type==="hit"?"shake 0.4s ease,flash-hit 0.4s ease":"none"}}>
          {monsterIcon}
        </div>
        <div style={{fontSize:13,color:"#8a3030",fontWeight:"bold",letterSpacing:2,marginTop:6}}>{(monsterName||"").toUpperCase()}</div>
      </div>
    </div>
  </>);}

function ActionTile({icon,title,subtitle,borderColor,onClick,disabled}){
  return(<div onClick={!disabled?onClick:undefined} style={{background:C.bgCard,border:`1px solid ${disabled?"#1e1e1e":borderColor||C.border}`,borderRadius:4,padding:"18px 12px",textAlign:"center",cursor:disabled?"default":"pointer",opacity:disabled?0.3:1}}>
    <div style={{fontSize:30,marginBottom:6}}>{icon}</div>
    <div style={{fontWeight:"bold",color:disabled?C.textDim:C.textBright,fontSize:15}}>{title}</div>
    <div style={{fontSize:12,color:C.textDim,marginTop:4,lineHeight:1.4}}>{subtitle}</div>
  </div>);
}

function HitFlash({trigger,isPlayer,children}){
  const ref=useRef(null);
  useEffect(()=>{
    if(!trigger)return;
    const el=ref.current;if(!el)return;
    el.style.animation="none";
    void el.offsetHeight;
    el.style.animation=isPlayer?"playerHit 0.45s ease":"monsterHit 0.45s ease";
  },[trigger]);
  return<div ref={ref}>{children}</div>;
}

export default function App(){
  const [human,setHuman]=useState(initPlayer);
  const [ai,setAi]=useState(initPlayer);
  const [round,setRound]=useState(1);
  const [phase,setPhase]=useState("draft");
  const [draftHand]=useState(()=>[...STARTING_CARDS].sort(()=>Math.random()-.5).slice(0,6));
  const [shopTab,setShopTab]=useState("forge");
  const [monster,setMonster]=useState(null);
  const [monsterHp,setMonsterHp]=useState(0);
  const [monsterAT,setMonsterAT]=useState(0);
  const [chest,setChest]=useState([]);
  const [log,setLog]=useState(["Choose your starting trait. One choice. No take-backs."]);
  const [fightLog,setFightLog]=useState([]);
  const [winner,setWinner]=useState(null);
  const [showGuide,setShowGuide]=useState(false);
  const [seenGuide,setSeenGuide]=useState(false);
  const [deathMsg,setDeathMsg]=useState(null);
  const [aiWinMsg,setAiWinMsg]=useState(null);
  const [playerHitKey,setPlayerHitKey]=useState(0);
  const [monsterHitKey,setMonsterHitKey]=useState(0);
  const [combatAnim,setCombatAnim]=useState({who:null,type:null,tick:0});
  const logRef=useRef(null);
  useEffect(()=>{if(logRef.current)logRef.current.scrollTop=logRef.current.scrollHeight;},[log]);

  const addLog=msg=>setLog(l=>[...l,msg]);
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const eff=calcEff(human.base,human.equipCards,human.battleCards,human.weaponTier,human.armourTier);
  const aiEff=calcEff(ai.base,ai.equipCards,ai.battleCards,ai.weaponTier,ai.armourTier);
  const hEffBase=calcEff(human.base,human.equipCards,[],human.weaponTier,human.armourTier);

  function confirmDraft(card){
    const nb={...BASE};
    if(card.stat==="hp"){nb.maxHp+=card.val;nb.hp=nb.maxHp;}
    else nb[card.stat]=(nb[card.stat]||0)+card.val;
    setHuman(p=>({...p,base:nb,hp:nb.hp}));
    setPhase("home");
    addLog(`You chose: ${card.name}. Now go earn the rest.`);
  }

  function sellGold(){const t=human.goldCards.reduce((a,c)=>a+(c.val||0),0);if(!t)return;setHuman(p=>({...p,gold:p.gold+t,goldCards:[]}));addLog(`Sold gold cards: +${t} gold.`);}
  function buyStatUpgrade(statKey){
    const su=STAT_UPGRADES.find(s=>s.stat===statKey);const lv=human.statLevels[statKey]||0;
    if(lv>=su.costs.length||human.gold<su.costs[lv])return;const cost=su.costs[lv];
    setHuman(p=>{const nb={...p.base};if(statKey==="hp")nb.maxHp+=3;else nb[statKey]+=1;return{...p,gold:p.gold-cost,base:nb,statLevels:{...p.statLevels,[statKey]:lv+1}};});
    addLog(`${su.label} upgraded.`);
  }
  function upgradeChain(type){
    const chain=type==="weapon"?WEAPON_CHAIN:ARMOUR_CHAIN;
    const tier=type==="weapon"?human.weaponTier:human.armourTier;
    const next=chain.find(c=>c.tier===tier+1);
    if(!next||human.gold<next.cost)return;
    setHuman(p=>({...p,gold:p.gold-next.cost,[type==="weapon"?"weaponTier":"armourTier"]:tier+1}));
    addLog(`${next.icon} ${next.name} forged.${next.legendary?" LEGENDARY.":""}`);
  }
  function buyCard(card){if(human.gold<card.cost)return;setHuman(p=>({...p,gold:p.gold-card.cost,battleCards:card.cardType==="battle"?[...p.battleCards,{...card}]:p.battleCards,equipCards:card.cardType==="equipment"?[...p.equipCards,{...card}]:p.equipCards}));addLog(`${card.name} acquired.`);}
  function enterDungeon(){setHuman(p=>({...p,hp:eff.maxHp,depth:1}));setPhase("prep");addLog(rnd(ROUND_NARRATIVES)(round));}
  function exitDungeon(){setHuman(p=>({...p,battleCards:[],depth:1,dungeonRounds:p.dungeonRounds+1}));setMonster(null);addLog(rnd(RETREAT_MESSAGES));runAiTurn();}
  function bribe(){const gc=[...human.goldCards].filter(c=>c.val).sort((a,b)=>b.val-a.val);if(!gc.length)return;setHuman(p=>({...p,goldCards:p.goldCards.filter(c=>c.id!==gc[0].id),depth:p.depth+1}));addLog(`Bribed with ${gc[0].name}. Slipped past.`);setMonster(null);setPhase("prep");}
  function runAway(){addLog(rnd(RETREAT_MESSAGES));setHuman(p=>({...p,depth:p.depth+1}));setMonster(null);setPhase("prep");}

  async function enterRoom(){
    const earlyRoom=round===1&&human.depth<=2;
    const pool=earlyRoom?WEAK_MONSTERS:MONSTERS;
    const base=rnd(pool);
    const scalingDepth=earlyRoom?human.depth:human.depth+(round-1)*3;
    const m=scaleMonster(base,scalingDepth);
    setMonster(m);setMonsterHp(m.hp);setMonsterAT(m.armourTokens);
    addLog(`— Room ${human.depth} —`);
    addLog(`${m.icon} ${m.name}. ${m.flavour}`);
    addLog(eff.speed>=m.speed?`You move first.`:`${m.name} moves first.`);
    setPhase("fighting");
    let pHp=human.hp,mHp=m.hp,mAT=m.armourTokens,r=1;
    const pAtk=async()=>{
      setCombatAnim(prev=>({who:"player",type:"attack",tick:prev.tick+1}));
      await sleep(280);
      const dmg=eff.weapon,abs=Math.min(mAT,dmg);mAT=Math.max(0,mAT-abs);const dealt=dmg-abs;mHp=Math.max(0,mHp-dealt);
      const pts=[];if(abs>0)pts.push(`${abs} blocked`);if(dealt>0)pts.push(`${dealt} damage`);
      addLog(`You: ${pts.join(", ")}. ${m.name}: ${mHp} HP.`);setMonsterHp(mHp);setMonsterAT(mAT);
      setCombatAnim(prev=>({who:"monster",type:"hit",tick:prev.tick+1}));
      if(dealt>0)setMonsterHitKey(k=>k+1);
      await sleep(320);
      setCombatAnim(prev=>({...prev,who:null,type:null}));
    };
    const mAtk=async()=>{
      if(mHp<=0)return;
      setCombatAnim(prev=>({who:"monster",type:"attack",tick:prev.tick+1}));
      await sleep(280);
      if(luckDodge(eff.luck)){
        setCombatAnim(prev=>({who:"player",type:"dodge",tick:prev.tick+1}));
        addLog(`Dodged.`);
        await sleep(320);
        setCombatAnim(prev=>({...prev,who:null,type:null}));
        return;
      }
      const dmg=m.weapon,abs=Math.min(eff.armour,dmg),dealt=dmg-abs;pHp=Math.max(0,pHp-dealt);
      const pts=[];if(abs>0)pts.push(`${abs} blocked`);if(dealt>0)pts.push(`${dealt} damage`);
      addLog(`${m.name}: ${pts.join(", ")}. Your HP: ${pHp}.`);setHuman(p=>({...p,hp:pHp}));
      setCombatAnim(prev=>({who:"player",type:"hit",tick:prev.tick+1}));
      if(dealt>0)setPlayerHitKey(k=>k+1);
      await sleep(320);
      setCombatAnim(prev=>({...prev,who:null,type:null}));
    };
    while(pHp>0&&mHp>0&&r<=20){if(r>1)addLog(`— Round ${r} —`);if(eff.speed>=m.speed){await pAtk();if(mHp>0)await mAtk();}else{await mAtk();if(pHp>0)await pAtk();}mAT=Math.min(m.armour,mAT+1);setMonsterAT(mAT);r++;}
    setCombatAnim({who:null,type:null,tick:0});
    setHuman(p=>({...p,hp:pHp}));
    if(pHp<=0){
      const lost=Math.floor(human.gold/2);const kept=human.gold-lost;
      addLog(rnd(BATTLE_NARRATIVES)(null,m.name,"loss"));
      addLog(`You died. Lost ${lost} gold. ${kept} remains.`);
      setHuman(p=>({...p,battleCards:[],goldCards:[],gold:kept,depth:1,dungeonRounds:p.dungeonRounds+1}));
      setMonster(null);setDeathMsg(rnd(DEATH_MESSAGES));
    } else {
      addLog(rnd(BATTLE_NARRATIVES)(null,m.name,"win"));
      const bonus=luckBonusGold(eff.luck);if(bonus>0){addLog(`Lucky — +${bonus} gold.`);setHuman(p=>({...p,gold:p.gold+bonus}));}
      setChest(chestOpts(human.depth,eff.luck));setPhase("chest");
    }
  }

  function takeChest(card){
    setHuman(p=>({...p,depth:p.depth+1,battleCards:card.cardType==="battle"?[...p.battleCards,card]:p.battleCards,equipCards:card.cardType==="equipment"?[...p.equipCards,card]:p.equipCards,goldCards:card.cardType==="gold"?[...p.goldCards,{...card,cardType:"gold"}]:p.goldCards}));
    addLog(`${card.icon} ${card.name} taken.`);setChest([]);setPhase("prep");
  }

  function runAiTurn(){
    setPhase("aiTurn");
    setTimeout(()=>{
      const afterHome=aiDoHome(ai,round);
      const{player:afterDungeon,msgs}=simulateDungeon(afterHome);
      const aiG=afterDungeon.goldCards.reduce((a,c)=>a+(c.val||0),0);
      const finalAi={...afterDungeon,gold:afterDungeon.gold+aiG,goldCards:[]};
      setAi(finalAi);msgs.forEach(m=>addLog(m));
      const nr=round+1;
      if(nr>MAX_ROUNDS){addLog(`Round 4 done. Spend your gold. The Full Moon is here.`);setRound(nr);setPhase("preTournament");}
      else{setRound(nr);addLog(`— Round ${nr} of ${MAX_ROUNDS} —`);setPhase("home");}
    },1000);
  }

  async function startFullMoon(){
    const hge=human.goldCards.reduce((a,c)=>a+(c.val||0),0);const hGold=human.gold+hge;
    setHuman(p=>({...p,gold:hGold,goldCards:[]}));setPhase("fullMoon");
    const hEff=calcEff(human.base,human.equipCards,[],human.weaponTier,human.armourTier);
    const aEff=calcEff(ai.base,ai.equipCards,[],ai.weaponTier,ai.armourTier);
    const logs=[];let hHp=hEff.maxHp,aHp=aEff.maxHp,r=1,hAT=hEff.armour,aAT=aEff.armour;
    logs.push(`FULL MOON TOURNAMENT`);
    logs.push(`You — ⚔️${hEff.weapon} 🛡️${hEff.armour} 💨${hEff.speed} ❤️${hHp}`);
    logs.push(`Rival — ⚔️${aEff.weapon} 🛡️${aEff.armour} 💨${aEff.speed} ❤️${aHp}`);
    logs.push(`Gold — You: ${hGold} / Rival: ${ai.gold}`);
    const hFirst=hEff.speed>=aEff.speed;
    while(hHp>0&&aHp>0&&r<=30){
      logs.push(`— Round ${r} —`);
      const hAtk=()=>{const d=hEff.weapon,a=Math.min(aAT,d);aAT=Math.max(0,aAT-a);aHp=Math.max(0,aHp-(d-a));logs.push(`You: ${d} dmg. Rival HP: ${aHp}.`);};
      const aAtk=()=>{const d=aEff.weapon,a=Math.min(hAT,d);hAT=Math.max(0,hAT-a);hHp=Math.max(0,hHp-(d-a));logs.push(`Rival: ${d} dmg. Your HP: ${hHp}.`);};
      if(hFirst){hAtk();if(aHp>0)aAtk();}else{aAtk();if(hHp>0)hAtk();}
      hAT=Math.min(hEff.armour,hAT+1);aAT=Math.min(aEff.armour,aAT+1);r++;
    }
    const humanWon=hHp>0;
    const fhg=hGold+(humanWon?FULL_MOON_GOLD_BONUS:0);
    const fag=ai.gold+(humanWon?0:FULL_MOON_GOLD_BONUS);
    logs.push(humanWon?`You win. +${FULL_MOON_GOLD_BONUS} gold.`:`Rival wins. +${FULL_MOON_GOLD_BONUS} gold to Rival.`);
    logs.push(`— Final Gold —`);logs.push(`You: ${fhg}`);logs.push(`Rival: ${fag}`);
    const w=fhg>fag?"human":fag>fhg?"ai":"tie";
    logs.push(w==="human"?"YOU WIN.":w==="ai"?"RIVAL WINS.":"TIE.");
    setFightLog(logs);setHuman(p=>({...p,gold:fhg,hp:hHp}));setAi(p=>({...p,gold:fag,hp:aHp}));setWinner(w);
    if(w==="ai")setAiWinMsg(rnd(AI_WIN_MESSAGES));
    setPhase("result");
  }

  function restart(){
    setHuman(initPlayer());setAi(initPlayer());setRound(1);setMonster(null);
    setPhase("draft");setFightLog([]);setWinner(null);setSeenGuide(false);setDeathMsg(null);setAiWinMsg(null);
    setCombatAnim({who:null,type:null,tick:0});setPlayerHitKey(0);setMonsterHitKey(0);
    setLog(["Choose your starting trait."]);
  }

  const shopB=shopAvail(BATTLE_CARDS,human.battleCards,"battle");

  function ForgeTab({weaponTier,armourTier,onUpgrade}){
    return(<div>
      <div style={{fontSize:13,color:C.textDim,marginBottom:12}}>Build weapon and armour tier by tier. Each requires the previous.</div>
      {[{chain:WEAPON_CHAIN,tier:weaponTier,type:"weapon",label:"WEAPON"},{chain:ARMOUR_CHAIN,tier:armourTier,type:"armour",label:"ARMOUR"}].map(({chain,tier,type,label})=>(
        <div key={type} style={{marginBottom:16}}>
          <div style={{fontSize:11,color:C.textDim,letterSpacing:2,marginBottom:8}}>{label}</div>
          <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
            {chain.map(item=>{const owned=tier>=item.tier;const isNext=item.tier===tier+1;const canBuy=isNext&&human.gold>=item.cost;
              return(<div key={item.id} style={{flex:"1 1 80px",maxWidth:100,background:owned?"#1a1400":C.bgCard,border:`1px solid ${owned?C.gold:item.legendary?"#5a3a00":C.border}`,borderRadius:4,padding:"10px 6px",textAlign:"center",opacity:!owned&&!isNext?0.25:1}}>
                <div style={{fontSize:20}}>{item.icon}</div>
                <div style={{fontSize:11,fontWeight:"bold",color:owned?C.goldBright:item.legendary?"#c8a84b":C.textBright,margin:"4px 0 3px"}}>{item.name}</div>
                <div style={{fontSize:10,color:C.textDim,marginBottom:4}}>{item.desc}</div>
                {owned?<div style={{fontSize:10,color:C.gold}}>✓ Owned</div>:isNext?<Btn label={`⬡${item.cost}`} onClick={()=>onUpgrade(type)} color={canBuy?"#1a2a1a":""} disabled={!canBuy}/>:<div style={{fontSize:10,color:C.textDim}}>Locked</div>}
              </div>);
            })}
          </div>
        </div>
      ))}
    </div>);
  }

  return(
    <div style={{fontFamily:"'Segoe UI',system-ui,sans-serif",background:C.bg,minHeight:"100vh",color:C.text,padding:16,maxWidth:500,margin:"0 auto",fontSize:15}}>
      <style>{`
        @keyframes playerHit {
          0%,15%{box-shadow:inset 0 0 0 2px #a02020,0 0 18px #6b1a1a;background:#2a0808;}
          100%{box-shadow:none;background:#141414;}
        }
        @keyframes monsterHit {
          0%,15%{box-shadow:inset 0 0 0 2px #8a2020,0 0 14px #3a0808;background:#1e0808;}
          100%{box-shadow:none;background:#111111;}
        }
      `}</style>
      {showGuide&&<CombatGuide onClose={()=>setShowGuide(false)}/>}
      {deathMsg&&<DeathPopup msg={deathMsg} onClose={()=>{setDeathMsg(null);runAiTurn();}}/>}
      {aiWinMsg&&<AiWinPopup msg={aiWinMsg} onClose={()=>{setAiWinMsg(null);restart();}}/>}

      {/* Header */}
      <div style={{textAlign:"center",marginBottom:14,paddingBottom:12,borderBottom:`1px solid ${C.border}`}}>
        <div style={{color:C.goldBright,fontWeight:"bold",fontSize:22,letterSpacing:4}}>DUNGEON CRAWLER</div>
        <div style={{color:C.textDim,fontSize:11,marginTop:4,letterSpacing:3,fontStyle:"italic"}}>"Only cowards retreat."</div>
        {phase!=="draft"&&(
          <div style={{marginTop:10}}>
            <div style={{color:C.textDim,fontSize:12,letterSpacing:2,marginBottom:8}}>{round<=MAX_ROUNDS?`ROUND ${round} / ${MAX_ROUNDS}`:"FULL MOON TOURNAMENT"}</div>
            <div style={{display:"flex",justifyContent:"center",gap:12}}>
              {Array.from({length:MAX_ROUNDS}).map((_,i)=>(
                <div key={i} style={{width:12,height:12,borderRadius:"50%",background:i<round-1?C.goldBright:i===round-1?C.textBright:C.bgCard,border:`1px solid ${i<round-1?C.gold:i===round-1?"#666":C.border}`}}/>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Scoreboard */}
      {phase!=="draft"&&(
        <div style={{display:"flex",gap:8,marginBottom:14}}>
          <div style={{flex:1,background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:4,padding:12}}>
            <div style={{color:C.goldBright,fontWeight:"bold",fontSize:13,marginBottom:4}}>YOU</div>
            <HPBar current={human.hp} max={eff.maxHp} color={C.goldBright}/>
            <div style={{fontSize:12,color:C.textDim,marginBottom:6}}>{human.hp} / {eff.maxHp} HP</div>
            <div style={{display:"flex",gap:10,fontSize:13,flexWrap:"wrap"}}>
              <Tooltip text="Damage per round">⚔️<b style={{color:C.textBright}}> {eff.weapon}</b></Tooltip>
              <Tooltip text="Absorbs hits. Regens 1/round">🛡️<b style={{color:C.textBright}}> {eff.armour}</b></Tooltip>
              <Tooltip text="Higher = goes first. Strictly higher = can run">💨<b style={{color:C.textBright}}> {eff.speed}</b></Tooltip>
              <Tooltip text="Dodge + bonus gold + better chests">🍀<b style={{color:C.textBright}}> {eff.luck}</b></Tooltip>
            </div>
            <div style={{fontSize:14,color:C.goldBright,marginTop:6,fontWeight:"bold"}}>⬡ {human.gold}</div>
          </div>
          <div style={{flex:1,background:C.bgCardAlt,border:`1px solid ${C.border}`,borderRadius:4,padding:12}}>
            <div style={{color:"#7a3030",fontWeight:"bold",fontSize:13,marginBottom:4}}>THE RIVAL</div>
            <HPBar current={ai.hp} max={aiEff.maxHp} color="#6a2020"/>
            <div style={{fontSize:12,color:C.textDim,marginBottom:6}}>{ai.hp} / {aiEff.maxHp} HP</div>
            <div style={{display:"flex",gap:10,fontSize:13,flexWrap:"wrap"}}>
              <span>⚔️<b style={{color:C.textBright}}> {aiEff.weapon}</b></span>
              <span>🛡️<b style={{color:C.textBright}}> {aiEff.armour}</b></span>
              <span>💨<b style={{color:C.textBright}}> {aiEff.speed}</b></span>
            </div>
            <div style={{fontSize:14,color:C.goldBright,marginTop:6,fontWeight:"bold"}}>⬡ {ai.gold}</div>
          </div>
        </div>
      )}

      {/* DRAFT */}
      {phase==="draft"&&(
        <div style={{marginBottom:14}}>
          <div style={{background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:4,padding:16,marginBottom:14,textAlign:"center"}}>
            <div style={{fontSize:16,color:C.textBright,fontWeight:"bold",marginBottom:6}}>Choose one starting trait.</div>
            <div style={{fontSize:13,color:C.textDim}}>One choice. No take-backs. The rest you earn.</div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
            {draftHand.map(card=>(
              <div key={card.id} onClick={()=>confirmDraft(card)} style={{background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:4,padding:"16px 10px",textAlign:"center",cursor:"pointer"}}>
                <div style={{fontSize:28,marginBottom:6}}>{card.icon}</div>
                <div style={{fontWeight:"bold",color:C.textBright,fontSize:13,marginBottom:4}}>{card.name}</div>
                <div style={{fontSize:12,color:C.textDim}}>{card.desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI TURN */}
      {phase==="aiTurn"&&(
        <div style={{background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:4,padding:18,marginBottom:14,textAlign:"center"}}>
          <div style={{fontSize:15,color:C.textDim}}>The Rival is running its dungeon...</div>
        </div>
      )}

      {/* HOME */}
      {phase==="home"&&(
        <div style={{marginBottom:14}}>
          {round===1&&<div style={{background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:4,padding:"10px 14px",fontSize:13,color:C.textDim,marginBottom:12,textAlign:"center"}}>Round 1 — go straight to the dungeon. Shop opens next round.</div>}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
            <ActionTile icon="🕯️" title="Enter Dungeon" subtitle={`Round ${round} — harder each time`} borderColor={C.goldDim} onClick={()=>{if(!seenGuide){setShowGuide(true);setSeenGuide(true);setTimeout(enterDungeon,200);}else enterDungeon();}}/>
            <ActionTile icon="🏪" title="Shop" subtitle={`⬡ ${human.gold} to spend`} borderColor="#1a2a3a" onClick={()=>setPhase("shop")} disabled={round===1}/>
            <ActionTile icon="🪙" title="Sell Gold Cards" subtitle={human.goldCards.length?`+${human.goldCards.reduce((a,c)=>a+(c.val||0),0)} available`:"Nothing to sell"} borderColor={C.goldDim} onClick={sellGold} disabled={round===1||!human.goldCards.length}/>
            <ActionTile icon="⏭" title="End Turn" subtitle="Let the Rival move" borderColor={C.border} onClick={()=>{addLog(`Turn ended.`);runAiTurn();}} disabled={round===1}/>
          </div>
          <div style={{textAlign:"right",marginBottom:10}}><span onClick={()=>setShowGuide(true)} style={{fontSize:12,color:C.textDim,cursor:"pointer"}}>How does combat work?</span></div>
          <Divider label="Equipment — permanent"/>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{human.equipCards.length?human.equipCards.map(c=>(<CardUI key={c.id} card={{...c,cardType:"equipment"}} small/>)):<div style={{fontSize:13,color:C.textDim}}>None yet</div>}</div>
          <Divider label="Battle boosts — this run only"/>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{human.battleCards.length?human.battleCards.map(c=>(<CardUI key={c.id} card={{...c,cardType:"battle"}} small/>)):<div style={{fontSize:13,color:C.textDim}}>None — find in chests or buy in shop</div>}</div>
        </div>
      )}

      {/* SHOP */}
      {phase==="shop"&&(
        <div style={{marginBottom:14}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
            <div style={{color:C.textBright,fontWeight:"bold",fontSize:16}}>SHOP</div>
            <div style={{color:C.goldBright,fontSize:15,fontWeight:"bold"}}>⬡ {human.gold}</div>
          </div>
          <div style={{display:"flex",gap:6,marginBottom:12}}>
            {["forge","battle","skills","other"].map(t=>(<button key={t} onClick={()=>setShopTab(t)} style={{flex:1,background:shopTab===t?"#1a1a1a":C.bgCard,color:shopTab===t?C.goldBright:C.textDim,border:`1px solid ${shopTab===t?C.gold:C.border}`,borderRadius:3,padding:"10px 6px",fontWeight:"bold",fontSize:12,cursor:"pointer"}}>{t==="forge"?"⚒ Forge":t==="battle"?"Battle":t==="skills"?"Skills":"Other"}</button>))}
          </div>
          {shopTab==="forge"&&<ForgeTab weaponTier={human.weaponTier} armourTier={human.armourTier} onUpgrade={upgradeChain}/>}
          {shopTab==="battle"&&<div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{shopB.map(c=>(<CardUI key={c.id} card={c} showCost canAfford={human.gold>=c.cost} onClick={()=>buyCard(c)}/>))}</div>}
          {shopTab==="skills"&&STAT_UPGRADES.map(su=>{const lv=human.statLevels[su.stat]||0;const maxed=lv>=su.costs.length;const cost=maxed?null:su.costs[lv];const can=!maxed&&human.gold>=cost;return(<div key={su.stat} style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:C.bgCard,borderRadius:4,padding:"12px 14px",marginBottom:6,border:`1px solid ${C.border}`}}><div style={{fontSize:14}}>{su.icon} <b style={{color:C.textBright}}>{su.label}</b><span style={{color:C.textDim,fontSize:12}}> — rank {lv}</span></div>{maxed?<span style={{color:C.goldDim,fontSize:12}}>MAX</span>:<Btn label={`+1  ⬡${cost}`} onClick={()=>buyStatUpgrade(su.stat)} color={can?"#1a2a1a":""} disabled={!can}/>}</div>);})}
          {shopTab==="other"&&<div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{shopAvail(EQUIPMENT_CARDS,human.equipCards,"equipment").map(c=>(<CardUI key={c.id} card={c} showCost canAfford={human.gold>=c.cost} onClick={()=>buyCard(c)}/>))}</div>}
          <div style={{marginTop:14}}><Btn label="← Back" onClick={()=>setPhase("home")}/></div>
        </div>
      )}

      {/* PREP */}
      {phase==="prep"&&(
        <div style={{marginBottom:14}}>
          <div style={{background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:4,padding:14,marginBottom:12}}>
            <div style={{color:C.textBright,fontWeight:"bold",fontSize:14,marginBottom:6}}>Room {human.depth}</div>
            <div style={{display:"flex",gap:12,fontSize:14}}><span>⚔️ {eff.weapon}</span><span>🛡️ {eff.armour}</span><span>💨 {eff.speed}</span><span>❤️ {human.hp}/{eff.maxHp}</span></div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
            <ActionTile icon="⚔️" title={`Enter Room ${human.depth}`} subtitle="Fight whatever's inside" borderColor={C.goldDim} onClick={enterRoom}/>
            <ActionTile icon="🚪" title="Leave Dungeon" subtitle="Coward." borderColor={C.border} onClick={exitDungeon}/>
          </div>
          <Divider label="Active this fight"/>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{[...human.equipCards,...human.battleCards].map((c,i)=>(<CardUI key={c.id+i} card={c} small/>))}</div>
        </div>
      )}

      {/* FIGHTING */}
      {phase==="fighting"&&monster&&(
        <div style={{marginBottom:14}}>
          <FightArena monsterIcon={monster.icon} monsterName={monster.name} combatAnim={combatAnim}/>
          <div style={{display:"flex",gap:8,marginBottom:12}}>
            <HitFlash trigger={playerHitKey} isPlayer={true}>
              <div style={{flex:1,background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:4,padding:12}}>
                <div style={{fontWeight:"bold",color:C.goldBright,fontSize:13,marginBottom:2}}>YOU</div>
                <HPBar current={human.hp} max={eff.maxHp} color={C.goldBright}/>
                <div style={{fontSize:12,color:C.textDim}}>{human.hp} / {eff.maxHp}</div>
              </div>
            </HitFlash>
            <div style={{display:"flex",alignItems:"center",color:C.textDim,fontSize:14,padding:"0 4px"}}>vs</div>
            <HitFlash trigger={monsterHitKey} isPlayer={false}>
              <div style={{flex:1,background:C.bgCardAlt,border:`1px solid ${C.border}`,borderRadius:4,padding:12}}>
                <div style={{fontWeight:"bold",color:"#7a3030",fontSize:13,marginBottom:2}}>{monster.icon} {monster.name}</div>
                <HPBar current={monsterHp} max={monster.maxHp} color="#6a2020"/>
                <div style={{fontSize:12,color:C.textDim}}>{monsterHp} / {monster.maxHp} · 🛡️{monsterAT}</div>
              </div>
            </HitFlash>
          </div>
          <div style={{textAlign:"center",fontSize:13,color:eff.speed>=monster.speed?C.goldBright:C.textDim,marginBottom:10}}>{eff.speed>=monster.speed?"You go first.":"Enemy goes first."}</div>
          <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap"}}>
            {human.goldCards.filter(c=>c.val).length>0&&<Btn label="⬡ Bribe & Flee" onClick={bribe}/>}
            {eff.speed>monster.speed&&<Btn label="Run (coward)" onClick={runAway}/>}
          </div>
        </div>
      )}

      {/* CHEST */}
      {phase==="chest"&&(
        <div style={{background:C.bgCard,border:`1px solid ${C.goldDim}`,borderRadius:4,padding:18,marginBottom:14}}>
          <div style={{color:C.goldBright,fontWeight:"bold",marginBottom:8,textAlign:"center",fontSize:16}}>CHEST — Pick one:</div>
          <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap",marginBottom:14}}>{chest.map(c=>(<div key={c.id} onClick={()=>takeChest(c)} style={{cursor:"pointer",flex:"1 1 90px",maxWidth:130}}><CardUI card={c}/></div>))}</div>
          <Btn label="Leave dungeon (coward)" onClick={exitDungeon} full/>
        </div>
      )}

      {/* PRE-TOURNAMENT */}
      {phase==="preTournament"&&(
        <div style={{marginBottom:14}}>
          <div style={{background:"#080808",border:`2px solid ${C.gold}`,borderRadius:4,padding:20,marginBottom:14,textAlign:"center"}}>
            <div style={{fontSize:44,marginBottom:8}}>🌕</div>
            <div style={{fontSize:20,color:C.goldBright,fontWeight:"bold",letterSpacing:3,marginBottom:6}}>FULL MOON</div>
            <div style={{fontSize:13,color:C.textDim,marginBottom:16}}>4 rounds done. Spend your gold. Battle boosts don't carry in.</div>
            <div style={{display:"flex",gap:12,justifyContent:"center",fontSize:15,marginBottom:18}}>
              <span>You: <b style={{color:C.goldBright}}>⬡{human.gold}</b></span>
              <span style={{color:C.textDim}}>·</span>
              <span>Rival: <b style={{color:"#7a3030"}}>⬡{ai.gold}</b></span>
            </div>
            <div style={{display:"flex",gap:8,justifyContent:"center",marginBottom:16,flexWrap:"wrap"}}>
              <Btn label="⚒ Shop" onClick={()=>setPhase("preTournamentShop")} color="#1a1a1a" textColor={C.textBright}/>
              {human.goldCards.length>0&&<Btn label={`🪙 Sell (+${human.goldCards.reduce((a,c)=>a+(c.val||0),0)})`} onClick={sellGold} color="#1a1a1a" textColor={C.textBright}/>}
            </div>
            <button onClick={()=>setPhase("fullMoonPrep")} style={{width:"100%",background:C.goldBright,color:"#080808",border:"none",borderRadius:4,padding:"18px",fontWeight:"bold",fontSize:18,cursor:"pointer",letterSpacing:2}}>ENTER TOURNAMENT</button>
          </div>
        </div>
      )}

      {/* PRE-TOURNAMENT SHOP */}
      {phase==="preTournamentShop"&&(
        <div style={{marginBottom:14}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
            <div style={{color:C.textBright,fontWeight:"bold",fontSize:16}}>FINAL SHOP</div>
            <div style={{color:C.goldBright,fontSize:15,fontWeight:"bold"}}>⬡ {human.gold}</div>
          </div>
          <div style={{display:"flex",gap:6,marginBottom:12}}>
            {["forge","skills","other"].map(t=>(<button key={t} onClick={()=>setShopTab(t)} style={{flex:1,background:shopTab===t?"#1a1a1a":C.bgCard,color:shopTab===t?C.goldBright:C.textDim,border:`1px solid ${shopTab===t?C.gold:C.border}`,borderRadius:3,padding:"10px",fontWeight:"bold",fontSize:12,cursor:"pointer"}}>{t==="forge"?"⚒ Forge":t==="skills"?"Skills":"Other"}</button>))}
          </div>
          {shopTab==="forge"&&<ForgeTab weaponTier={human.weaponTier} armourTier={human.armourTier} onUpgrade={upgradeChain}/>}
          {shopTab==="skills"&&STAT_UPGRADES.map(su=>{const lv=human.statLevels[su.stat]||0;const maxed=lv>=su.costs.length;const cost=maxed?null:su.costs[lv];const can=!maxed&&human.gold>=cost;return(<div key={su.stat} style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:C.bgCard,borderRadius:4,padding:"12px 14px",marginBottom:6,border:`1px solid ${C.border}`}}><div style={{fontSize:14}}>{su.icon} <b style={{color:C.textBright}}>{su.label}</b><span style={{color:C.textDim,fontSize:12}}> — rank {lv}</span></div>{maxed?<span style={{color:C.goldDim,fontSize:12}}>MAX</span>:<Btn label={`+1  ⬡${cost}`} onClick={()=>buyStatUpgrade(su.stat)} color={can?"#1a2a1a":""} disabled={!can}/>}</div>);})}
          {shopTab==="other"&&<div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{shopAvail(EQUIPMENT_CARDS,human.equipCards,"equipment").map(c=>(<CardUI key={c.id} card={c} showCost canAfford={human.gold>=c.cost} onClick={()=>buyCard(c)}/>))}</div>}
          <div style={{marginTop:14}}><Btn label="← Back" onClick={()=>setPhase("preTournament")}/></div>
        </div>
      )}

      {/* FULL MOON PREP */}
      {phase==="fullMoonPrep"&&(
        <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"#050505",zIndex:150,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24}}>
          <div style={{fontSize:64,marginBottom:10}}>🌕</div>
          <div style={{fontSize:24,fontWeight:"bold",color:C.goldBright,letterSpacing:4,marginBottom:4}}>FULL MOON</div>
          <div style={{fontSize:14,color:C.textDim,letterSpacing:3,marginBottom:36}}>TOURNAMENT</div>
          <div style={{display:"flex",gap:16,width:"100%",maxWidth:420,marginBottom:32}}>
            <div style={{flex:1,background:C.bgCard,border:`2px solid ${C.gold}`,borderRadius:6,padding:20,textAlign:"center"}}>
              <div style={{fontSize:36,marginBottom:8}}>🧙</div>
              <div style={{color:C.goldBright,fontWeight:"bold",fontSize:15,marginBottom:12}}>YOU</div>
              <div style={{display:"flex",flexDirection:"column",gap:6,fontSize:16,color:C.textBright,textAlign:"left"}}>
                <div>⚔️ <b>{hEffBase.weapon}</b> Weapon</div>
                <div>🛡️ <b>{hEffBase.armour}</b> Armour</div>
                <div>💨 <b>{hEffBase.speed}</b> Speed</div>
                <div>❤️ <b>{hEffBase.maxHp}</b> HP</div>
              </div>
              <div style={{marginTop:14,fontSize:18,color:C.goldBright,fontWeight:"bold"}}>⬡ {human.gold}</div>
            </div>
            <div style={{display:"flex",alignItems:"center",color:C.textDim,fontSize:20}}>vs</div>
            <div style={{flex:1,background:C.bgCardAlt,border:"2px solid #5a1a1a",borderRadius:6,padding:20,textAlign:"center"}}>
              <div style={{fontSize:36,marginBottom:8}}>🏴</div>
              <div style={{color:"#8a3030",fontWeight:"bold",fontSize:15,marginBottom:12}}>THE RIVAL</div>
              <div style={{display:"flex",flexDirection:"column",gap:6,fontSize:16,color:C.textBright,textAlign:"left"}}>
                <div>⚔️ <b>{aiEff.weapon}</b> Weapon</div>
                <div>🛡️ <b>{aiEff.armour}</b> Armour</div>
                <div>💨 <b>{aiEff.speed}</b> Speed</div>
                <div>❤️ <b>{aiEff.maxHp}</b> HP</div>
              </div>
              <div style={{marginTop:14,fontSize:18,color:C.goldBright,fontWeight:"bold"}}>⬡ {ai.gold}</div>
            </div>
          </div>
          <div style={{fontSize:13,color:C.textDim,marginBottom:6}}>Winner gets +{FULL_MOON_GOLD_BONUS} gold. Most gold wins.</div>
          <div style={{fontSize:13,color:C.textDim,marginBottom:28}}>{hEffBase.speed>=aiEff.speed?"You strike first.":"The Rival strikes first."}</div>
          <button onClick={startFullMoon} style={{background:C.goldBright,color:"#050505",border:"none",borderRadius:4,padding:"18px 40px",fontWeight:"bold",fontSize:20,cursor:"pointer",letterSpacing:2,width:"100%",maxWidth:420}}>FIGHT</button>
        </div>
      )}

      {/* FULL MOON RESOLVING */}
      {phase==="fullMoon"&&(
        <div style={{background:"#080808",border:`1px solid ${C.gold}`,borderRadius:4,padding:24,marginBottom:14,textAlign:"center"}}>
          <div style={{fontSize:36,marginBottom:8}}>🌕</div>
          <div style={{fontSize:15,color:C.goldBright,fontWeight:"bold"}}>Fighting...</div>
        </div>
      )}

      {/* RESULT */}
      {phase==="result"&&(
        <div style={{background:C.bgCard,border:`2px solid ${winner==="human"?C.goldBright:winner==="ai"?C.redBright:C.border}`,borderRadius:4,padding:22,marginBottom:14,textAlign:"center"}}>
          <div style={{fontSize:40,marginBottom:8}}>{winner==="human"?"👑":winner==="ai"?"🏴":"⚖️"}</div>
          <div style={{fontSize:22,fontWeight:"bold",color:winner==="human"?C.goldBright:winner==="ai"?C.redBright:C.textDim,marginBottom:14,letterSpacing:1}}>{winner==="human"?"YOU WIN":winner==="ai"?"RIVAL WINS":"TIE"}</div>
          <div style={{background:C.bgDark,borderRadius:3,border:`1px solid ${C.border}`,padding:12,marginBottom:16,textAlign:"left",fontSize:13,maxHeight:200,overflowY:"auto",lineHeight:1.9}}>
            {fightLog.map((l,i)=>(<div key={i} style={{color:l.includes("YOU WIN")||l.includes("Final")||l==="FULL MOON TOURNAMENT"||l.startsWith("Gold")?C.goldBright:l.includes("RIVAL WINS")||l.includes("Rival wins")?C.redBright:C.textDim,marginBottom:1}}>{l}</div>))}
          </div>
          <Btn label="Play again" onClick={restart} full large/>
        </div>
      )}

      {/* Log */}
      {phase!=="result"&&(
        <div>
          <Divider label="Log"/>
          <div ref={logRef} style={{background:C.bgDark,border:`1px solid ${C.border}`,borderRadius:4,padding:12,height:150,overflowY:"auto",fontSize:13,lineHeight:1.9}}>
            {log.map((l,i)=>(<div key={i} style={{color:l.startsWith("—")||l.startsWith("Round")||l.includes("Full Moon")||l.includes("ROUND")?C.goldBright:l.includes("died")||l.includes("coward")||l.includes("ran")||l.includes("Fled")||l.includes("Pathetic")||l.includes("Safe")||l.includes("tactical")||l.includes("retreat")?C.textDim:C.text,marginBottom:1}}>{l}</div>))}
          </div>
        </div>
      )}
    </div>
  );
}
