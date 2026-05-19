// ========================================================
// CONFIGURAÇÃO INICIAL DO CANVAS (Área de Desenho do Jogo)
// ========================================================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Dimensões fixas do canvas — NÃO altere dinamicamente
canvas.width  = 1000;
canvas.height = 1000;

// ========================================================
// 1. ASSETS
// ========================================================
const assets = {
    player:      new Image(),
    chica:       new Image(),
    bonnie:      new Image(),
    freddy:      new Image(),
    endo:        new Image(),
    pizza:       new Image(),
    taser:       new Image(),
    moeda:       new Image(),
    batteryItem: new Image(),
    lanternaHUD: new Image(),
    moedaHUD:    new Image(),

    // Salas — nomes corrigidos para bater com os arquivos reais em c/
    sala1: new Image(),  // salaInicialSafe.jpg
    sala2: new Image(),  // areaAntesChica.jpg
    sala3: new Image(),  // batalhaChica.jpg
    sala4: new Image(),  // areaAntesBonnie.jpg   (corredor/loja)
    sala5: new Image(),  // batalhaBonnie.jpg
    sala6: new Image(),  // areaAntesFreddy.jpg
    sala7: new Image(),  // batalhaFreddy.jpg
    sala8: new Image()   // quartoReferencia / sala final Freddy
};

function iniciarCarregamentoImagens() {
    // Sprites (mantidos na subpasta sprites/)
    assets.player.src       = 'sprites/player_baixo_0.png';
    assets.chica.src        = 'sprites/chica.png';
    assets.bonnie.src       = 'sprites/bonnie.png';
    assets.freddy.src       = 'sprites/freddy.png';
    assets.endo.src         = 'sprites/endo.png';
    assets.pizza.src        = 'sprites/pizza_tiro.png';
    assets.taser.src        = 'sprites/taser.png';
    assets.moeda.src        = 'sprites/moeda.png';
    assets.batteryItem.src  = 'sprites/bateria.png';
    assets.lanternaHUD.src  = 'sprites/hud_lanterna.png';
    assets.moedaHUD.src     = 'sprites/hud_moeda.png';

    // -------------------------------------------------------
    // CAMINHOS DAS SALAS — corrigidos para os nomes reais dos
    // arquivos visíveis no explorador (pasta c/ ao lado do JS)
    // -------------------------------------------------------
    assets.sala1.src = 'c/salaInicialSafe.jpg';        // Sala 1 — safe room inicial
    assets.sala2.src = 'c/areaAntesChica.jpg';         // Sala 2 — corredor antes da Chica  ← CORRIGIDO
    assets.sala3.src = 'c/batalhaChica.jpg';           // Sala 3 — arena da Chica
    assets.sala4.src = 'c/corredor.jpg';               // Sala 4 — corredor/loja             ← CORRIGIDO
    assets.sala5.src = 'c/areaAntesBonnie.jpg';        // Sala 5 — área antes do Bonnie      ← CORRIGIDO
    assets.sala6.src = 'c/batalhaBonnie.jpg';          // Sala 6 — arena do Bonnie           ← CORRIGIDO
    assets.sala7.src = 'c/areaAntesFreddy.jpg';        // Sala 7 — área antes do Freddy      ← CORRIGIDO
    assets.sala8.src = 'c/batalhaFreddy.jpg';          // Sala 8 — arena final do Freddy     ← CORRIGIDO
}

iniciarCarregamentoImagens();

// ========================================================
// 2. CONFIG
// ========================================================
const CONFIG = {
    vidaMaximaChica:         25,
    vidaMaximaFreddy:        90,
    vidaMaximaBonnie:        30,
    velocidadeFreddyNormal:  7.5,
    velocidadeFreddyLento:   2.0,
    velocidadeFreddyVagar:   1.5,
    tempoDesacelerado:       90,
    tempoTontoFreddy:        120,
    bateriaConsumo:          0.15,
    raioLuzNormal:           200,
    anguloLanternaNormal:    0.8,
    maxSalas:                8,
    raioPercepcaoFreddy:     450
};

// ========================================================
// 3. ESTADOS
// ========================================================
const player = {
    x: 475, y: 800, w: 50, h: 50,
    speedNormal: 5, speed: 5,
    moedas: 0, battery: 100,
    hasTaser: false,
    hasPerkLanterna: false, hasPerkVelocidade: false, hasPerkEscudo: false,
    timerPerkLanterna: 0, timerPerkVelocidade: 0, timerPerkEscudo: 0,
    temPerkChica: false, temPerkBonnie: false
};

const progresso = { salaAtual: 1, vitoria: false, lojaAtiva: false };
const teclas = {};
const mouse   = { x: 0, y: 0 };

let jogando = true;
let inimigos = [], moedasNoChao = [], bateriasNoChao = [], pizzas = [];
let ondasChoque = [], pulsosCone = [];
let lanternaAtiva = false;
let itemPerkChicaNoChao  = null;
let itemPerkBonnieNoChao = null;
let pizzasEspeciaisNoChao = [];

const estadoSalas = { chicaDerrotada: false, bonnieDerrotado: false, freddyDerrotado: false };

const PRECOS_LOJA = { velocidade: 13, lanterna: 20, escudo: 25 };
const itensLoja   = [
    { x: 180, y: 400, w: 100, h: 65, tipo: "lanterna",   preco: PRECOS_LOJA.lanterna,   texto: "Super Lanterna (20s)" },
    { x: 450, y: 400, w: 100, h: 65, tipo: "velocidade", preco: PRECOS_LOJA.velocidade, texto: "Velocidade (5s)"       },
    { x: 720, y: 400, w: 100, h: 65, tipo: "escudo",     preco: PRECOS_LOJA.escudo,     texto: "Escudo Protetor (4s)" }
];

const chica  = { x: 450, y: 200, w: 100, h: 100, vida: CONFIG.vidaMaximaChica,  vivo: true, ultimoTiro: 0, direcaoX: undefined, direcaoY: undefined };
const bonnie = { x: 450, y: 200, w: 100, h: 100, vivo: true, atordoado: false, timerAtordoado: 0, cliques: 0, ultimoAtaque: 0 };

const obstaculosBonnie = [
    { x: 250, y: 350, w: 100, h: 100 }, { x: 650, y: 350, w: 100, h: 100 },
    { x: 250, y: 600, w: 100, h: 100 }, { x: 650, y: 600, w: 100, h: 100 }
];

const freddy = {
    x: 450, y: 100, w: 100, h: 100, vivo: true,
    vida: CONFIG.vidaMaximaFreddy,
    timerLento: 0, timerTonto: 0, perseguindo: false,
    direcaoVagarX: 1, direcaoVagarY: 1, timerMudarDirecao: 0,
    paradoModoFlash: false, timerEstadoParado: 0
};

const obstaculosFreddy = [];

// ========================================================
// PERKS
// ========================================================
function checarEAtivarPerks(numeroSala) {
    const salaTemInimigos = [2, 5, 7].includes(numeroSala) || (numeroSala === 4 && !progresso.lojaAtiva);
    const salaTemBoss =
        ([3].includes(numeroSala) && !estadoSalas.chicaDerrotada) ||
        ([6].includes(numeroSala) && !estadoSalas.bonnieDerrotado) ||
        ([8].includes(numeroSala) && !estadoSalas.freddyDerrotado);

    if (salaTemInimigos || salaTemBoss) {
        if (player.hasPerkLanterna   && player.timerPerkLanterna   <= 0) { player.timerPerkLanterna   = 1200; player.hasPerkLanterna   = false; }
        if (player.hasPerkVelocidade && player.timerPerkVelocidade <= 0) { player.timerPerkVelocidade = 300;  player.hasPerkVelocidade = false; }
        if (player.hasPerkEscudo     && player.timerPerkEscudo     <= 0) { player.timerPerkEscudo     = 240;  player.hasPerkEscudo     = false; }
    }
}

// ========================================================
// 4. CARREGAR SALA
// ========================================================
function carregarSala(numero, vindoDeOnde = "baixo") {
    inimigos = []; moedasNoChao = []; bateriasNoChao = [];
    pizzas   = []; ondasChoque  = []; pulsosCone    = [];
    pizzasEspeciaisNoChao = [];

    freddy.perseguindo       = false;
    freddy.timerTonto        = 0;
    freddy.paradoModoFlash   = false;
    freddy.timerEstadoParado = 0;

    if (estadoSalas.chicaDerrotada)  chica.vivo  = false;
    if (estadoSalas.bonnieDerrotado) bonnie.vivo = false;
    if (estadoSalas.freddyDerrotado) freddy.vivo = false;

    // Dimensões fixas — canvas não muda de tamanho
    const largSala = canvas.width;
    const altSala  = canvas.height;

    if (vindoDeOnde === "baixo")    { player.x = largSala * 0.475; player.y = altSala * 0.820; }
    else if (vindoDeOnde === "cima")    { player.x = largSala * 0.475; player.y = altSala * 0.086; }
    else if (vindoDeOnde === "esquerda"){ player.x = largSala * 0.850; player.y = altSala * 0.461; }
    else if (vindoDeOnde === "direita") { player.x = largSala * 0.100; player.y = altSala * 0.461; }

    if (numero === 3 && chica.vivo)  { player.battery = 100; itemPerkChicaNoChao  = null; }
    if (numero === 6 && bonnie.vivo) { bonnie.ultimoAtaque = Date.now() + 1500; bonnie.atordoado = false; bonnie.timerAtordoado = 0; itemPerkBonnieNoChao = null; }
    if (numero === 8 && player.battery < 45) { player.battery = 75; }

    const salaComInimigosAtivos = [2, 4, 5, 7].includes(numero) && !progresso.lojaAtiva;

    if (salaComInimigosAtivos && inimigos.length === 0) {
        let qtd = (numero === 4) ? 6 : 3;
        for (let i = 0; i < qtd; i++) {
            let tipo = Math.floor(Math.random() * 5) + 1;
            let ok = false, tx, ty, tentativas = 50;
            while (!ok && tentativas-- > 0) {
                tx = Math.random() * (largSala * 0.8) + largSala * 0.1;
                ty = Math.random() * (altSala  * 0.54) + altSala  * 0.1;
                if (Math.hypot(tx - player.x, ty - player.y) < 200) continue;
                if (inimigos.some(o => Math.hypot(tx - o.x, ty - o.y) < 75)) continue;
                ok = true;
            }
            inimigos.push({ x: tx, y: ty, w: 60, h: 60, vivo: true, jaDropou: false, tipo });
        }
    }

    if (player.temPerkChica && (salaComInimigosAtivos || [3, 6, 8].includes(numero))) {
        let qtd = Math.floor(Math.random() * 2) + 1;
        for (let p = 0; p < qtd; p++) {
            pizzasEspeciaisNoChao.push({
                x: Math.random() * (largSala * 0.75) + largSala * 0.1,
                y: Math.random() * (altSala  * 0.65) + altSala  * 0.16,
                w: 35, h: 35,
                tipo: Math.random() < 0.5 ? "velocidade" : "escudo"
            });
        }
    }

    checarEAtivarPerks(numero);
}

// ========================================================
// 5. GEOMETRIA / COLISÃO
// ========================================================
function noConeDeLuz(alvo) {
    if (player.battery <= 0) return false;
    let cx = player.x + player.w / 2, cy = player.y + player.h / 2;
    let ax = alvo.x  + alvo.w  / 2,  ay = alvo.y  + alvo.h  / 2;
    let raio = CONFIG.raioLuzNormal, ang = CONFIG.anguloLanternaNormal;
    if (player.temPerkBonnie)         { raio *= 1.2; ang *= 1.2; }
    if (player.timerPerkLanterna > 0) { raio  = CONFIG.raioLuzNormal * 1.6; ang = CONFIG.anguloLanternaNormal * 1.5; }
    if (Math.hypot(ax - cx, ay - cy) > raio) return false;
    let am = Math.atan2(mouse.y - cy, mouse.x - cx);
    let aa = Math.atan2(ay - cy, ax - cx);
    let d  = aa - am;
    while (d < -Math.PI) d += Math.PI * 2;
    while (d >  Math.PI) d -= Math.PI * 2;
    return Math.abs(d) < ang / 2;
}

function visaoBloqueadaPorObstaculo(p, entidade, lista) {
    let px = p.x + p.w/2, py = p.y + p.h/2;
    let ex = entidade.x + entidade.w/2, ey = entidade.y + entidade.h/2;
    for (let obs of lista) { if (linhaInterceptaRetangulo(px, py, ex, ey, obs)) return true; }
    return false;
}

function rInter(x1,y1,x2,y2,r) {
    let mnX=Math.min(x1,x2),mxX=Math.max(x1,x2),mnY=Math.min(y1,y2),mxY=Math.max(y1,y2);
    if (mxX<r.x||mnX>r.x+r.w||mxY<r.y||mnY>r.y+r.h) return false;
    if (lInter(x1,y1,x2,y2,r.x,r.y,r.x+r.w,r.y))         return true;
    if (lInter(x1,y1,x2,y2,r.x,r.y+r.h,r.x+r.w,r.y+r.h)) return true;
    if (lInter(x1,y1,x2,y2,r.x,r.y,r.x,r.y+r.h))         return true;
    if (lInter(x1,y1,x2,y2,r.x+r.w,r.y,r.x+r.w,r.y+r.h)) return true;
    return false;
}

function lInter(a1x,a1y,a2x,a2y,b1x,b1y,b2x,b2y) {
    let det=(a2x-a1x)*(b2y-b1y)-(b2x-b1x)*(a2y-a1y);
    if(det===0) return false;
    let u=((b1x-a1x)*(b2y-b1y)-(b2x-b1x)*(b1y-a1y))/det;
    let v=((b1x-a1x)*(a2y-a1y)-(a2x-a1x)*(b1y-a1y))/det;
    return u>=0&&u<=1&&v>=0&&v<=1;
}

function pCone(px,py,cx,cy,ang,alc,ab) {
    let dx=px-cx,dy=py-cy,dist=Math.hypot(dx,dy);
    if(dist>alc) return false;
    let ap=Math.atan2(dy,dx),d=ap-ang;
    while(d<-Math.PI) d+=Math.PI*2; while(d>Math.PI) d-=Math.PI*2;
    return Math.abs(d)<ab/2;
}

function distancia(o1,o2) { return Math.hypot((o1.x+o1.w/2)-(o2.x+o2.w/2),(o1.y+o1.h/2)-(o2.y+o2.h/2)); }
function colisao(r1,r2)   { return r1.x<r2.x+r2.w&&r1.x+r1.w>r2.x&&r1.y<r2.y+r2.h&&r1.y+r1.h>r2.y; }
function linhaInterceptaRetangulo(x1,y1,x2,y2,r) { return rInter(x1,y1,x2,y2,r); }

// ========================================================
// 6. LÓGICA
// ========================================================
function processarDanoOuro() { if (player.timerPerkEscudo > 0) return; morrer(); }

function morrer() {
    player.temPerkChica = false; player.temPerkBonnie = false;
    jogando = false; location.reload();
}

function atualizar() {
    if (!jogando || progresso.vitoria) return;
    const sala = progresso.salaAtual;

    if (player.timerPerkLanterna   > 0) player.timerPerkLanterna--;
    if (player.timerPerkEscudo     > 0) player.timerPerkEscudo--;
    if (player.timerPerkVelocidade > 0) { player.timerPerkVelocidade--; player.speed = player.speedNormal * 1.6; }
    else                                 { player.speed = player.speedNormal; }

    let proxX = player.x, proxY = player.y;
    if (teclas['w'] || teclas['arrowup'])    proxY -= player.speed;
    if (teclas['s'] || teclas['arrowdown'])  proxY += player.speed;
    if (teclas['a'] || teclas['arrowleft'])  proxX -= player.speed;
    if (teclas['d'] || teclas['arrowright']) proxX += player.speed;

    let temMortaisVivos = inimigos.some(e => e.vivo && e.tipo !== 4 && e.tipo !== 5);

    // Portal Norte
    if (proxY < 5 && proxX > 440 && proxX < 540) {
        let bloq = (sala===2&&temMortaisVivos)||(sala===3&&chica.vivo)||(sala===4&&temMortaisVivos)||(sala===6&&bonnie.vivo)||(sala===8&&freddy.vivo);
        if (!bloq) {
            if (sala < CONFIG.maxSalas) { progresso.salaAtual++; carregarSala(progresso.salaAtual,"baixo"); return; }
            else { progresso.vitoria = true; return; }
        } else { proxY = 5; }
    }

    // Portal Sul
    if (proxY > 865 && proxX > 440 && proxX < 540 && sala > 1) {
        let bloq = (sala===3&&chica.vivo)||(sala===6&&bonnie.vivo)||(sala===8&&freddy.vivo);
        if (!bloq) { progresso.salaAtual--; carregarSala(progresso.salaAtual,"cima"); return; }
        else { proxY = 865; }
    }

    if (proxX < 0) proxX = 0; if (proxX > 1000 - player.w) proxX = 1000 - player.w;
    if (proxY < 0) proxY = 0; if (proxY > 920 - player.h) proxY = 920 - player.h;

    if (sala === 6) {
        let cX=false,cY=false;
        obstaculosBonnie.forEach(o=>{if(colisao({x:proxX,y:player.y,w:player.w,h:player.h},o))cX=true;});if(!cX)player.x=proxX;
        obstaculosBonnie.forEach(o=>{if(colisao({x:player.x,y:proxY,w:player.w,h:player.h},o))cY=true;});if(!cY)player.y=proxY;
    } else if (progresso.lojaAtiva) {
        let cX=false,cY=false;
        itensLoja.forEach(o=>{if(colisao({x:proxX,y:player.y,w:player.w,h:player.h},o))cX=true;});if(!cX)player.x=proxX;
        itensLoja.forEach(o=>{if(colisao({x:player.x,y:proxY,w:player.w,h:player.h},o))cY=true;});if(!cY)player.y=proxY;
    } else { player.x=proxX; player.y=proxY; }

    if (sala === 4) {
        if (!progresso.lojaAtiva && player.x < 15 && player.y > 350 && player.y < 550) { progresso.lojaAtiva = true;  carregarSala(4,"esquerda"); }
        else if (progresso.lojaAtiva && player.x > 980-player.w && player.y > 350 && player.y < 550) { progresso.lojaAtiva = false; carregarSala(4,"direita"); }
    }

    if (progresso.lojaAtiva) return;

    let mirandoNaChica = (sala===3 && chica.vivo && lanternaAtiva && noConeDeLuz(chica));

    if (lanternaAtiva && player.battery > 0) {
        let consumo = (sala===3 && chica.vivo) ? CONFIG.bateriaConsumo/2 : CONFIG.bateriaConsumo;
        if (!mirandoNaChica) { player.battery -= consumo; if (player.battery<=0){player.battery=0;lanternaAtiva=false;} }
    } else { lanternaAtiva = false; }

    // IAs dos endos
    for (let e of inimigos) {
        if (!e.vivo) continue;
        let dist=distancia(player,e),mX=0,mY=0;
        if (e.tipo===1){if(e.x<player.x)mX=2.5;else mX=-2.5;if(e.y<player.y)mY=2.5;else mY=-2.5;}
        else if(e.tipo===2){if(dist<350){if(e.x<player.x)mX=2;else mX=-2;if(e.y<player.y)mY=2;else mY=-2;}}
        else if(e.tipo===3){
            if(lanternaAtiva&&noConeDeLuz(e)){if(!e.jaDropou){e.vivo=false;e.jaDropou=true;moedasNoChao.push({x:e.x+10,y:e.y+10,w:25,h:25});}continue;}
            else{if(e.x<player.x)mX=1.5;else mX=-1.5;if(e.y<player.y)mY=1.5;else mY=-1.5;}
        }
        else if(e.tipo===4){if(lanternaAtiva&&noConeDeLuz(e)){if(e.x<player.x)mX=-3;else mX=3;if(e.y<player.y)mY=3;else mY=3;}else{if(e.x<player.x)mX=2;else mX=-2;if(e.y<player.y)mY=2;else mY=-2;}}
        else if(e.tipo===5){if(lanternaAtiva&&noConeDeLuz(e)){mX=0;mY=0;}else{if(e.x<player.x)mX=2.8;else mX=-2.8;if(e.y<player.y)mY=2.8;else mY=-2.8;}}
        let tx=e.x+mX,ty=e.y+mY;
        if(tx>0&&tx<1000-e.w)e.x=tx; if(ty>0&&ty<920-e.h)e.y=ty;
        if(e.vivo&&dist<40){processarDanoOuro();return;}
    }

    if (lanternaAtiva && [2,4,5,7,8].includes(sala)) {
        for (let i=0;i<inimigos.length;i++) {
            let e=inimigos[i];
            if(e.vivo&&e.tipo!==3&&e.tipo!==4&&e.tipo!==5&&noConeDeLuz(e)&&!e.jaDropou){
                e.jaDropou=true;e.vivo=false;
                if(sala===8){moedasNoChao.push({x:e.x+5,y:e.y+5,w:25,h:25});bateriasNoChao.push({x:e.x+25,y:e.y+25,w:30,h:30});}
                else{let q=Math.floor(Math.random()*3)+1;for(let m=0;m<q;m++)moedasNoChao.push({x:e.x+Math.random()*30,y:e.y+Math.random()*30,w:25,h:25});if(Math.random()<0.40||player.battery<50)bateriasNoChao.push({x:e.x+15,y:e.y+15,w:30,h:30});}
            }
        }
    }

    // CHICA
    if (sala===3) {
        if(chica.vivo){
            if(chica.direcaoX===undefined){chica.direcaoX=Math.random()*2-1;chica.direcaoY=Math.random()*2-1;}
            if(Math.random()<0.02){chica.direcaoX=Math.random()*2-1;chica.direcaoY=Math.random()*2-1;}
            chica.x+=chica.direcaoX*3;chica.y+=chica.direcaoY*3;
            if(chica.x<=0||chica.x+chica.w>=1000)chica.direcaoX*=-1;
            if(chica.y<=0||chica.y+chica.h>=920) chica.direcaoY*=-1;
            let intervalo=Math.max(40,120+(chica.vida*2));
            if(Date.now()-chica.ultimoTiro>intervalo){pizzas.push({x:chica.x+chica.w/2,y:chica.y+chica.h/2,vx:Math.random()*10-5,vy:Math.random()*10-5});chica.ultimoTiro=Date.now();}
            for(let i=pizzas.length-1;i>=0;i--){let p=pizzas[i];p.x+=p.vx;p.y+=p.vy;if(colisao(player,{x:p.x,y:p.y,w:40,h:40})){processarDanoOuro();return;}if(p.y>1000||p.y<0||p.x<0||p.x>1000)pizzas.splice(i,1);}
        } else {
            if(itemPerkChicaNoChao&&colisao(player,itemPerkChicaNoChao)){player.temPerkChica=true;itemPerkChicaNoChao=null;}
        }
    }

    for(let i=pizzasEspeciaisNoChao.length-1;i>=0;i--){
        let pe=pizzasEspeciaisNoChao[i];
        if(colisao(player,pe)){
            if(pe.tipo==="velocidade")player.timerPerkVelocidade=300;
            else if(pe.tipo==="escudo")player.timerPerkEscudo=240;
            pizzasEspeciaisNoChao.splice(i,1);
        }
    }

    // BONNIE
    if(sala===6){
        if(bonnie.vivo){
            if(!player.hasTaser&&colisao(player,{x:150,y:150,w:40,h:40}))player.hasTaser=true;
            if(colisao(player,bonnie)){processarDanoOuro();return;}
            let restantes=CONFIG.vidaMaximaBonnie-bonnie.cliques,faseFinal=(restantes<=5);
            if(bonnie.atordoado){bonnie.timerAtordoado--;if(bonnie.timerAtordoado<=0)bonnie.atordoado=false;}
            if(!bonnie.atordoado&&!faseFinal){
                let bVel=3.2,dX=player.x-bonnie.x,dY=player.y-bonnie.y,dp=Math.hypot(dX,dY)||1;
                let pbX=bonnie.x+(dX/dp)*bVel,pbY=bonnie.y+(dY/dp)*bVel,cX=false,cY=false;
                obstaculosBonnie.forEach(o=>{if(colisao({x:pbX,y:bonnie.y,w:bonnie.w,h:bonnie.h},o))cX=true;if(colisao({x:bonnie.x,y:pbY,w:bonnie.w,h:bonnie.h},o))cY=true;});
                if(!cX)bonnie.x=pbX;if(!cY)bonnie.y=pbY;
            }
            if(!bonnie.atordoado){
                let bcX=bonnie.x+bonnie.w/2,bcY=bonnie.y+bonnie.h/2;
                if(!faseFinal){
                    let esp=Math.max(1200,3500-bonnie.cliques*150);
                    if(Date.now()-bonnie.ultimoAtaque>esp){
                        let pcX=player.x+player.w/2,pcY=player.y+player.h/2;
                        pulsosCone.push({x:bcX,y:bcY,angulo:Math.atan2(pcY-bcY,pcX-bcX),alcanceInterno:0,alcanceMaximo:340,abertura:0.9,velocidade:5.2});
                        bonnie.atordoado=true;bonnie.timerAtordoado=240;bonnie.ultimoAtaque=Date.now();
                    }
                } else {
                    if(Date.now()-bonnie.ultimoAtaque>4500){
                        ondasChoque.push({x:bcX,y:bcY,r:0});
                        bonnie.atordoado=true;bonnie.timerAtordoado=240;bonnie.ultimoAtaque=Date.now();
                    }
                }
            }
            if(teclas['q']&&player.hasTaser&&distancia(player,bonnie)<150){
                bonnie.cliques++;teclas['q']=false;bonnie.atordoado=false;bonnie.timerAtordoado=0;
                if(bonnie.cliques>=CONFIG.vidaMaximaBonnie){bonnie.vivo=false;estadoSalas.bonnieDerrotado=true;itemPerkBonnieNoChao={x:bonnie.x+15,y:bonnie.y+15,w:70,h:45};}
            }
            for(let i=pulsosCone.length-1;i>=0;i--){
                let p=pulsosCone[i];p.x+=Math.cos(p.angulo)*p.velocidade;p.y+=Math.sin(p.angulo)*p.velocidade;
                if(pCone(player.x+25,player.y+25,p.x,p.y,p.angulo,p.alcanceMaximo,p.abertura)){if(!visaoBloqueadaPorObstaculo(player,bonnie,obstaculosBonnie)){processarDanoOuro();return;}}
                if(p.x<-300||p.x>1300)pulsosCone.splice(i,1);
            }
            for(let i=ondasChoque.length-1;i>=0;i--){
                let o=ondasChoque[i];o.r+=8.5;
                if(Math.hypot((player.x+25)-o.x,(player.y+25)-o.y)-25<=o.r){if(!visaoBloqueadaPorObstaculo(player,bonnie,obstaculosBonnie)){processarDanoOuro();return;}}
                if(o.r>750)ondasChoque.splice(i,1);
            }
        } else {
            if(itemPerkBonnieNoChao&&colisao(player,itemPerkBonnieNoChao)){player.temPerkBonnie=true;itemPerkBonnieNoChao=null;}
        }
    }

    // FREDDY
    if(sala===8&&freddy.vivo){
        if(Math.random()<0.015&&inimigos.filter(e=>e.vivo).length<6){
            let sx,sy,ok=false,cnt=20;
            while(!ok&&cnt-->0){sx=freddy.x+(Math.random()*200-100);sy=freddy.y+(Math.random()*200-100);if(Math.hypot(sx-player.x,sy-player.y)>200&&!inimigos.some(o=>o.vivo&&Math.hypot(sx-o.x,sy-o.y)<65))ok=true;}
            if(!ok){sx=100;sy=450;}
            inimigos.push({x:sx,y:sy,w:55,h:55,vivo:true,jaDropou:false,tipo:Math.floor(Math.random()*2)+1});
        }
        if(lanternaAtiva&&noConeDeLuz(freddy)){freddy.vida-=0.15;if(freddy.vida<=0){freddy.vivo=false;estadoSalas.freddyDerrotado=true;}}
        let vel=CONFIG.velocidadeFreddyNormal;if(lanternaAtiva&&noConeDeLuz(freddy))vel=CONFIG.velocidadeFreddyLento;
        let vX=0,vY=0;
        if(freddy.x<player.x)vX=vel;else if(freddy.x>player.x)vX=-vel;
        if(freddy.y<player.y)vY=vel;else if(freddy.y>player.y)vY=-vel;
        let pfX=freddy.x+vX,pfY=freddy.y+vY;
        if(pfX>=0&&pfX<=1000-freddy.w)freddy.x=pfX;
        if(pfY>=0&&pfY<=920-freddy.h)freddy.y=pfY;
        if(freddy.vivo&&colisao(player,freddy)){processarDanoOuro();return;}
    }

    // Coleta de itens
    for(let i=moedasNoChao.length-1;i>=0;i--){if(colisao(player,moedasNoChao[i])){player.moedas++;moedasNoChao.splice(i,1);}}
    for(let i=bateriasNoChao.length-1;i>=0;i--){if(colisao(player,bateriasNoChao[i])){player.battery=Math.min(100,player.battery+35);bateriasNoChao.splice(i,1);}}
}


// ========================================================
// 8. DESENHAR CENÁRIO  ← FUNÇÃO CORRIGIDA
// ========================================================
function desenharCenarioAtual() {
    // Tenta buscar a imagem da sala atual (sala1 … sala8)
    let imgSala = assets[`sala${progresso.salaAtual}`];

    if (imgSala && imgSala.complete && imgSala.naturalWidth > 0) {
        // Desenha a imagem esticada para ocupar todo o canvas (1000 × 920 — área de jogo)
        ctx.drawImage(imgSala, 0, 0, canvas.width, canvas.height - 80);
    } else {
        // Fallback: fundo escuro enquanto a imagem carrega
        ctx.fillStyle = "#161616";
        ctx.fillRect(0, 0, canvas.width, canvas.height - 80);
    }
}

// ========================================================
// 9. RENDER LOOP
// ========================================================
function render() {
    if (!jogando) return;
    atualizar();

    // Limpa tudo
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Qualidade pixel-art
    ctx.imageSmoothingEnabled       = false;
    ctx.mozImageSmoothingEnabled    = false;
    ctx.webkitImageSmoothingEnabled = false;
    ctx.msImageSmoothingEnabled     = false;

    // 1) Cenário de fundo — sempre primeiro
    desenharCenarioAtual();

    const sala = progresso.salaAtual;

    // -------- LOJA --------
    if (progresso.lojaAtiva) {
        ctx.fillStyle="purple"; ctx.fillRect(975,350,25,200);
        ctx.fillStyle="white";  ctx.font="bold 16px Arial"; ctx.fillText("VOLTAR",910,450);
        itensLoja.forEach(item=>{
            let tem=(item.tipo==="lanterna"&&player.hasPerkLanterna)||(item.tipo==="velocidade"&&player.hasPerkVelocidade)||(item.tipo==="escudo"&&player.hasPerkEscudo);
            ctx.fillStyle=tem?"#1a3d24":"#2e1c3d"; ctx.fillRect(item.x,item.y,item.w,item.h);
            ctx.strokeStyle=tem?"#24ff5a":"#a124ff"; ctx.lineWidth=3; ctx.strokeRect(item.x,item.y,item.w,item.h);
            ctx.fillStyle="white"; ctx.font="bold 12px Arial"; ctx.fillText(item.texto,item.x-15,item.y-25);
            ctx.fillStyle="gold";  ctx.fillText(item.preco+" Moedas",item.x+15,item.y-8);
            ctx.fillStyle=tem?"lime":"#9f9f9f"; ctx.font="10px Arial"; ctx.fillText(tem?"[Guardado]":"[Clique]",item.x+(tem?20:30),item.y+38);
        });
        ctx.fillStyle="#a124ff"; ctx.font="bold 32px Arial"; ctx.fillText("LOJA DE PERKS - SALA 4",320,150);
    }
    // -------- JOGO --------
    else {
        let temMortaisVivos=inimigos.some(e=>e.vivo&&e.tipo!==4&&e.tipo!==5);
        let portaTrancada=(sala===2&&temMortaisVivos)||(sala===3&&chica.vivo)||(sala===4&&temMortaisVivos)||(sala===6&&bonnie.vivo)||(sala===8&&freddy.vivo);

        // Portais
        ctx.fillStyle=portaTrancada?"red":"lime"; ctx.fillRect(470,0,60,20);
        if(sala===4){ctx.fillStyle="purple";ctx.fillRect(0,350,25,200);ctx.fillStyle="white";ctx.font="bold 14px Arial";ctx.fillText("LOJA",30,455);}
        let portaVoltarTrancada=(sala===3&&chica.vivo)||(sala===6&&bonnie.vivo)||(sala===8&&freddy.vivo);
        if(sala>1){ctx.fillStyle=portaVoltarTrancada?"red":"lime";ctx.fillRect(470,900,60,20);}

        // Itens no chão
        moedasNoChao.forEach(m=>desenharSprite(assets.moeda,m.x,m.y,m.w,m.h,"gold","$"));
        bateriasNoChao.forEach(b=>desenharSprite(assets.batteryItem,b.x,b.y,b.w,b.h,"#00ff66","B"));
        pizzasEspeciaisNoChao.forEach(pe=>desenharSprite(assets.pizza,pe.x,pe.y,pe.w,pe.h,pe.tipo==="velocidade"?"gold":"blue",pe.tipo==="velocidade"?"P-VEL":"P-ESC"));

        // Endos
        inimigos.forEach(e=>{
            if(!e.vivo)return;
            let tag="ENDO 1",cor="red";
            if(e.tipo===2){tag="ENDO 2";cor="darkred";}
            else if(e.tipo===3){tag="ENDO 3";cor="yellow";}
            else if(e.tipo===4){tag="ENDO 4";cor="magenta";}
            else if(e.tipo===5){tag="ENDO 5";cor="cyan";}
            desenharSprite(assets.endo,e.x,e.y,e.w,e.h,cor,tag);
        });

        // CHICA
        if(sala===3){
            if(chica.vivo){
                desenharSprite(assets.chica,chica.x,chica.y,chica.w,chica.h,"yellow","CHICA");
                pizzas.forEach(p=>desenharSprite(assets.pizza,p.x,p.y,40,40,"orange","PZ"));
                ctx.fillStyle="#222"; ctx.fillRect(300,40,400,15);
                ctx.fillStyle="yellow"; ctx.fillRect(300,40,(Math.max(0,chica.vida)/CONFIG.vidaMaximaChica)*400,15);
                ctx.fillStyle="white"; ctx.font="bold 12px Arial"; ctx.fillText(`CHICA FLASHES: ${chica.vida} / 25`,430,52);
            } else if(itemPerkChicaNoChao){
                ctx.fillStyle="#ff00aa"; ctx.fillRect(itemPerkChicaNoChao.x,itemPerkChicaNoChao.y,itemPerkChicaNoChao.w,itemPerkChicaNoChao.h);
                ctx.strokeStyle="white"; ctx.lineWidth=2; ctx.strokeRect(itemPerkChicaNoChao.x,itemPerkChicaNoChao.y,itemPerkChicaNoChao.w,itemPerkChicaNoChao.h);
                ctx.fillStyle="white"; ctx.font="bold 10px Arial"; ctx.fillText("PERK CHICA",itemPerkChicaNoChao.x+2,itemPerkChicaNoChao.y+22);
            }
        }

        // BONNIE
        if(sala===6){
            obstaculosBonnie.forEach(o=>{ctx.fillStyle="#1c2e3d";ctx.fillRect(o.x,o.y,o.w,o.h);ctx.strokeStyle="#00ffff";ctx.strokeRect(o.x,o.y,o.w,o.h);});
            if(bonnie.vivo){
                if(!player.hasTaser)desenharSprite(assets.taser,150,150,40,40,"cyan","TSR");
                let restantes=CONFIG.vidaMaximaBonnie-bonnie.cliques;
                let txt="BONNIE",cor="blue";
                if(restantes<=5){txt=bonnie.atordoado?"FASE FINAL: EXAUSTO (USE TASER!)":"FASE FINAL: GOLPE AMPLO EM ÁREA!";cor=bonnie.atordoado?"#442255":"#aa00ff";}
                else if(bonnie.atordoado){txt="BONNIE ATORDOADO (USE TASER!)";cor="gray";}
                desenharSprite(assets.bonnie,bonnie.x,bonnie.y,100,100,cor,txt);
                pulsosCone.forEach(p=>{ctx.save();ctx.fillStyle="rgba(255,0,0,0.2)";ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.arc(p.x,p.y,p.alcanceMaximo,p.angulo-p.abertura/2,p.angulo+p.abertura/2);ctx.closePath();ctx.fill();ctx.restore();});
                ondasChoque.forEach(o=>{ctx.strokeStyle="rgba(230,0,255,0.85)";ctx.lineWidth=7;ctx.beginPath();ctx.arc(o.x,o.y,o.r,0,Math.PI*2);ctx.stroke();});
                ctx.fillStyle="#222"; ctx.fillRect(300,40,400,15);
                ctx.fillStyle="purple"; ctx.fillRect(300,40,(Math.max(0,restantes)/CONFIG.vidaMaximaBonnie)*400,15);
                ctx.fillStyle="white"; ctx.font="bold 12px Arial"; ctx.fillText(`BONNIE CHOQUES RESTANTES: ${restantes} / ${CONFIG.vidaMaximaBonnie}`,395,52);
            } else if(itemPerkBonnieNoChao){
                ctx.fillStyle="#00aaff"; ctx.fillRect(itemPerkBonnieNoChao.x,itemPerkBonnieNoChao.y,itemPerkBonnieNoChao.w,itemPerkBonnieNoChao.h);
                ctx.strokeStyle="white"; ctx.lineWidth=2; ctx.strokeRect(itemPerkBonnieNoChao.x,itemPerkBonnieNoChao.y,itemPerkBonnieNoChao.w,itemPerkBonnieNoChao.h);
                ctx.fillStyle="white"; ctx.font="bold 10px Arial"; ctx.fillText("PERK BONNIE",itemPerkBonnieNoChao.x+2,itemPerkBonnieNoChao.y+22);
            }
        }

        // FREDDY
        if(sala===8&&freddy.vivo){
            let tf="FREDDY ("+Math.ceil(freddy.vida)+" HP)";if(lanternaAtiva&&noConeDeLuz(freddy))tf="FREDDY (FRACO!)";
            desenharSprite(assets.freddy,freddy.x,freddy.y,100,100,(lanternaAtiva&&noConeDeLuz(freddy))?"#8b5a2b":"#5d3a1a",tf);
            ctx.fillStyle="#222"; ctx.fillRect(300,40,400,15);
            ctx.fillStyle="#5d3a1a"; ctx.fillRect(300,40,(Math.max(0,freddy.vida)/CONFIG.vidaMaximaFreddy)*400,15);
            ctx.fillStyle="white"; ctx.font="bold 12px Arial"; ctx.fillText(`FREDDY HP: ${Math.ceil(freddy.vida)} / ${CONFIG.vidaMaximaFreddy}`,430,52);
        }
    }

    // Aura de perks no player
    if(player.timerPerkEscudo>0){ctx.strokeStyle="cyan";ctx.lineWidth=5;ctx.strokeRect(player.x-4,player.y-4,player.w+8,player.h+8);}
    else if(player.timerPerkVelocidade>0){ctx.strokeStyle="gold";ctx.lineWidth=3;ctx.strokeRect(player.x-2,player.y-2,player.w+4,player.h+4);}
    desenharSprite(assets.player,player.x,player.y,50,50,"lime","PLAYER");

    // HUD
    ctx.fillStyle="rgba(0,0,0,0.85)"; ctx.fillRect(0,920,1000,80);
    desenharSprite(assets.moedaHUD,30,940,40,40,"gold","$");
    ctx.fillStyle="white"; ctx.font="bold 24px Arial"; ctx.fillText(player.moedas,85,970);
    desenharSprite(assets.lanternaHUD,200,940,40,40,"white","L");
    ctx.fillStyle="#444"; ctx.fillRect(250,950,150,20);
    ctx.fillStyle=player.battery>20?"lime":"red"; ctx.fillRect(250,950,player.battery*1.5,20);
    ctx.fillStyle="cyan"; ctx.font="12px Arial";
    if(player.timerPerkLanterna>0)ctx.fillText("Lanterna+: "+Math.ceil(player.timerPerkLanterna/60)+"s",420,950);
    else if(player.hasPerkLanterna)ctx.fillText("Lanterna+ [Mochila]",420,950);
    if(player.timerPerkEscudo>0)ctx.fillText("Escudo: "+Math.ceil(player.timerPerkEscudo/60)+"s",420,975);
    else if(player.hasPerkEscudo)ctx.fillText("Escudo [Mochila]",420,975);
    if(player.timerPerkVelocidade>0)ctx.fillText("Velocidade+: "+Math.ceil(player.timerPerkVelocidade/60)+"s",550,950);
    else if(player.hasPerkVelocidade)ctx.fillText("Velocidade+ [Mochila]",550,950);
    if(player.temPerkChica){ctx.fillStyle="#ff00aa";ctx.font="bold 11px Arial";ctx.fillText("✨ PIZZAS CHICA ATIVAS",685,948);}
    if(player.temPerkBonnie){ctx.fillStyle="#00aaff";ctx.font="bold 11px Arial";ctx.fillText("🔦 LANTERNA BONNIE (+20%)",685,970);}
    ctx.fillStyle="white"; ctx.font="bold 24px Arial"; ctx.fillText(progresso.lojaAtiva?"LOJA":"SALA: "+progresso.salaAtual+" / 8",800,970);
    if(progresso.vitoria){ctx.fillStyle="lime";ctx.font="bold 50px Arial";ctx.fillText("VOCÊ ESCAPOU!",320,500);}

    requestAnimationFrame(render);
}

// ========================================================
// 10. SPRITE HELPER
// ========================================================
function desenharSprite(img,x,y,w,h,cor,txt) {
    if(img&&img.complete&&img.src!==""&&img.naturalWidth>0){ctx.drawImage(img,x,y,w,h);}
    else{ctx.fillStyle=cor;ctx.fillRect(x,y,w,h);ctx.fillStyle="black";ctx.font="bold 10px Arial";ctx.fillText(txt,x+4,y+h/2);}
}

// ========================================================
// 11. INPUTS
// ========================================================
window.addEventListener('keydown', e=>{ teclas[e.key.toLowerCase()]=true; });
window.addEventListener('keyup',   e=>{ teclas[e.key.toLowerCase()]=false; });
canvas.addEventListener('mousemove', e=>{ const r=canvas.getBoundingClientRect(); mouse.x=e.clientX-r.left; mouse.y=e.clientY-r.top; });

window.addEventListener('mousedown', e=>{
    if(e.button===0){
        lanternaAtiva=!lanternaAtiva;
        if(lanternaAtiva&&progresso.salaAtual===3&&chica.vivo&&noConeDeLuz(chica)){
            chica.vida-=1;
            if(chica.vida<=0){
                chica.vivo=false;estadoSalas.chicaDerrotada=true;
                itemPerkChicaNoChao={x:chica.x+15,y:chica.y+15,w:70,h:45};
                for(let m=0;m<5;m++)moedasNoChao.push({x:chica.x+Math.random()*60,y:chica.y+Math.random()*60,w:25,h:25});
            }
        }
    }
    if(progresso.lojaAtiva){
        itensLoja.forEach(item=>{
            if(mouse.x>item.x&&mouse.x<item.x+item.w&&mouse.y>item.y&&mouse.y<item.y+item.h){
                let tem=(item.tipo==="lanterna"&&player.hasPerkLanterna)||(item.tipo==="velocidade"&&player.hasPerkVelocidade)||(item.tipo==="escudo"&&player.hasPerkEscudo);
                if(!tem&&player.moedas>=item.preco){
                    player.moedas-=item.preco;
                    if(item.tipo==="lanterna")player.hasPerkLanterna=true;
                    if(item.tipo==="velocidade")player.hasPerkVelocidade=true;
                    if(item.tipo==="escudo")player.hasPerkEscudo=true;
                }
            }
        });
    }
});

// ========================================================
// INICIAR
// ========================================================
render();
