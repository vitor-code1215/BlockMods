const $ = (selector, root = document) => root.querySelector(selector);
const STORE = {
  mods: "blockmods_user_mods_v1",
  ratings: "blockmods_user_ratings_v2",
  favorites: "blockmods_favorites_v1",
  view: "blockmods_view_v1"
};
const starterMods = [
  {id:"waystones",name:"Waystones",category:"Utilidade",version:"1.20.1",description:"Adicione waystones ao seu mundo e viaje rapidamente entre locais já descobertos. Ideal para explorar mapas enormes sem perder tempo.",image:"",download:"https://www.curseforge.com/minecraft/mc-mods/waystones",rating:4.8,ratings:126,featured:true,symbol:"⌁",loader:"Forge / Fabric"},
  {id:"biomes-o-plenty",name:"Biomes O' Plenty",category:"Aventura",version:"1.20.1",description:"Descubra uma grande variedade de biomas, plantas e paisagens para deixar a exploração muito mais interessante.",image:"",download:"https://www.curseforge.com/minecraft/mc-mods/biomes-o-plenty",rating:4.9,ratings:214,featured:true,symbol:"❋",loader:"Forge"},
  {id:"jei",name:"Just Enough Items",category:"Utilidade",version:"1.20.1",description:"Consulte receitas e usos de itens diretamente no inventário. Uma ferramenta prática para quem joga com vários mods.",image:"",download:"https://www.curseforge.com/minecraft/mc-mods/jei",rating:4.9,ratings:302,featured:true,symbol:"▦",loader:"Forge / NeoForge"},
  {id:"create",name:"Create",category:"Tecnologia",version:"1.20.1",description:"Construa máquinas, mecanismos e sistemas automatizados usando engrenagens, eixos e muita criatividade.",image:"",download:"https://www.curseforge.com/minecraft/mc-mods/create",rating:5.0,ratings:189,featured:true,symbol:"⚙",loader:"Forge / NeoForge"},
  {id:"decorative-blocks",name:"Decorative Blocks",category:"Construção",version:"1.20.1",description:"Amplie suas opções de construção com blocos decorativos que ajudam a dar personalidade às suas estruturas.",image:"",download:"https://www.curseforge.com/minecraft/mc-mods/decorative-blocks",rating:4.6,ratings:87,featured:false,symbol:"▧",loader:"Forge"},
  {id:"sodium",name:"Sodium",category:"Desempenho",version:"1.20.1",description:"Melhore o desempenho e a fluidez do Minecraft com uma otimização de renderização focada em performance.",image:"",download:"https://modrinth.com/mod/sodium",rating:4.9,ratings:255,featured:true,symbol:"⚡",loader:"Fabric / NeoForge"}
];
const read = (key, fallback) => {
  try { const value = JSON.parse(localStorage.getItem(key)); return value ?? fallback; }
  catch { return fallback; }
};
const write = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; }
  catch { toast("O armazenamento do navegador está cheio ou indisponível."); return false; }
};
let userMods = read(STORE.mods, []);
let ratings = read(STORE.ratings, {});
let favorites = read(STORE.favorites, []);
let viewMode = read(STORE.view, "grid");
let mods = [];
let currentDetail = null;
let toastTimer;

function esc(value="") {
  return String(value).replace(/[&<>"']/g, char => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  })[char]);
}
function safeUrl(value, image=false) {
  try {
    const url = new URL(value);
    if (!["http:","https:"].includes(url.protocol)) return "";
    return url.href;
  } catch { return ""; }
}
function slugify(value) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"")
    .replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
}
function toast(message) {
  const node = $("#toast");
  node.textContent = message;
  node.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => node.classList.remove("show"), 2600);
}
function allMods() {
  userMods = read(STORE.mods, []);
  mods = [...starterMods, ...userMods];
  return mods;
}
function categories() { return ["Todas", ...new Set(mods.map(mod => mod.category).filter(Boolean))]; }
function updateFilters() {
  const categorySelect = $("#categoryFilter");
  const versionSelect = $("#versionFilter");
  const previousCategory = categorySelect.value || "Todas";
  const previousVersion = versionSelect.value || "Todas";
  categorySelect.innerHTML = categories().map(category =>
    `<option value="${esc(category)}">${esc(category === "Todas" ? "Todas as categorias" : category)}</option>`
  ).join("");
  categorySelect.value = categories().includes(previousCategory) ? previousCategory : "Todas";
  const versions = ["Todas", ...new Set(mods.map(mod => mod.version).filter(Boolean))];
  versionSelect.innerHTML = versions.map(version =>
    `<option value="${esc(version)}">${esc(version === "Todas" ? "Todas as versões" : `Minecraft ${version}`)}</option>`
  ).join("");
  versionSelect.value = versions.includes(previousVersion) ? previousVersion : "Todas";
  $("#categoryChips").innerHTML = categories().map(category =>
    `<button class="chip ${categorySelect.value===category?"active":""}" data-category="${esc(category)}">${esc(category)}</button>`
  ).join("");
}
function average(mod) {
  const localVotes = Array.isArray(ratings[mod.id]) ? ratings[mod.id] : [];
  const baseCount = Number(mod.ratings) || 0;
  const baseRating = Number(mod.rating) || 0;
  const total = baseCount + localVotes.length;
  return total ? ((baseRating * baseCount + localVotes.reduce((sum, vote) => sum + vote, 0)) / total).toFixed(1) : "—";
}
function imageMarkup(mod, detail=false) {
  const url = safeUrl(mod.image || "");
  if (url) return `<img src="${esc(url)}" alt="Imagem de ${esc(mod.name)}" loading="lazy" referrerpolicy="no-referrer" onerror="this.closest('.mod-cover,.detail-cover')?.classList.add('image-failed');this.remove()">`;
  return `<div class="cover-grid"></div><span class="cover-symbol">${esc(mod.symbol || "✦")}</span>`;
}
function render() {
  allMods();
  updateFilters();
  const query = $("#searchInput").value.trim().toLocaleLowerCase("pt-BR");
  const category = $("#categoryFilter").value || "Todas";
  const version = $("#versionFilter").value || "Todas";
  const sort = $("#sortFilter").value;
  const onlyFavorites = $("#favoritesToggle").getAttribute("aria-pressed") === "true";
  let results = mods.filter(mod => {
    const searchable = `${mod.name} ${mod.description} ${mod.category} ${mod.version} ${mod.loader||""}`.toLocaleLowerCase("pt-BR");
    return (category === "Todas" || mod.category === category) &&
      (version === "Todas" || mod.version === version) &&
      (!onlyFavorites || favorites.includes(mod.id)) && searchable.includes(query);
  });
  if (sort === "rating") results.sort((a,b) => Number(average(b)) - Number(average(a)));
  if (sort === "name") results.sort((a,b) => a.name.localeCompare(b.name, "pt-BR"));
  if (sort === "newest") results.sort((a,b) => Number(userMods.some(m=>m.id===b.id))-Number(userMods.some(m=>m.id===a.id)));
  if (sort === "featured") results.sort((a,b) => Number(b.featured)-Number(a.featured));

  $("#modGrid").classList.toggle("list-layout", viewMode === "list");
  $("#gridView").classList.toggle("selected", viewMode === "grid");
  $("#listView").classList.toggle("selected", viewMode === "list");
  $("#modGrid").innerHTML = results.map(mod => {
    const score = average(mod);
    const saved = favorites.includes(mod.id);
    return `<article class="mod-card" tabindex="0" data-id="${esc(mod.id)}" aria-label="Abrir detalhes de ${esc(mod.name)}">
      <div class="mod-cover">${imageMarkup(mod)}<span class="category-label">${esc(mod.category)}</span>
        <button class="card-favorite ${saved?"is-favorite":""}" data-favorite="${esc(mod.id)}" aria-label="${saved?"Remover dos":"Adicionar aos"} favoritos" title="Favoritar" type="button">${saved?"♥":"♡"}</button>
      </div>
      <div class="card-body"><div class="card-top"><h3>${esc(mod.name)}</h3><span class="rating">${score==="—"?"☆":"★"} ${score}</span></div>
        <p>${esc(mod.description)}</p><div class="card-meta"><span>MC ${esc(mod.version)} · ${esc(mod.loader||"Loader não informado")}</span><span>Detalhes ↗</span></div>
      </div></article>`;
  }).join("");
  $("#modCount").textContent = String(mods.length).padStart(2,"0");
  $("#favoriteCount").textContent = String(favorites.length).padStart(2,"0");
  $("#visibleCount").textContent = String(results.length).padStart(2,"0");
  $("#emptyState").classList.toggle("hidden", results.length !== 0);
  $("#catalogStatus").textContent = `Mostrando ${results.length} de ${mods.length} mods`;
}
function openDetail(id, updateHash=true) {
  const mod = mods.find(item => item.id === id);
  if (!mod) return;
  currentDetail = id;
  if (updateHash && location.hash !== `#mod/${encodeURIComponent(id)}`) history.pushState({mod:id},"",`#mod/${encodeURIComponent(id)}`);
  const localVotes = Array.isArray(ratings[id]) ? ratings[id] : [];
  const saved = favorites.includes(id);
  const score = average(mod);
  const owned = userMods.some(item => item.id === id);
  $("#detailContent").innerHTML = `
    <div class="detail-cover">${imageMarkup(mod,true)}</div>
    <div class="eyebrow">${esc(mod.category)} · MOD PARA MINECRAFT</div>
    <h2 id="detailTitle">${esc(mod.name)}</h2>
    <div class="detail-rating"><span class="rating">★ ${score}</span><span>${Number(mod.ratings||0)+localVotes.length} avaliações registradas no catálogo/localmente</span></div>
    <p class="detail-description">${esc(mod.description)}</p>
    <div class="detail-info"><span>Versão: ${esc(mod.version)}</span><span>Loader: ${esc(mod.loader||"Não informado")}</span><span>Categoria: ${esc(mod.category)}</span></div>
    <div class="detail-actions"><a class="btn btn-primary" href="${esc(safeUrl(mod.download))}" target="_blank" rel="noopener noreferrer">Abrir página oficial ↗</a>
      <button class="btn btn-outline" id="copyLink">Copiar link</button><button class="btn btn-outline" id="shareMod">Compartilhar mod</button>
      <button class="btn btn-outline" id="favoriteDetail">${saved?"♥ Favoritado":"♡ Favoritar"}</button>
      ${owned?'<button class="btn btn-outline danger-button" id="deleteMod">Excluir meu mod</button>':""}
    </div>
    <div class="rating-control"><p><strong>Qual sua avaliação?</strong> Você pode alterar sua nota a qualquer momento neste navegador.</p>
      <div class="stars" aria-label="Avaliar de 1 a 5 estrelas">${[1,2,3,4,5].map(n=>`<button data-star="${n}" class="${localVotes[0]===n?"selected":""}" aria-label="${n} estrelas" title="${n} estrelas">★</button>`).join("")}</div>
    </div>
    <p class="tiny-note">Confira a versão do Minecraft, o carregador (Forge/Fabric/NeoForge), dependências e instruções na página do autor antes de instalar.</p>`;
  $("#detailModal").classList.remove("hidden");
  $("#copyLink").addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(mod.download); toast("Link oficial copiado!"); }
    catch { toast("Não foi possível copiar. Abra a página do mod para copiar o endereço."); }
  });
  $("#shareMod").addEventListener("click", async () => {
    const shareUrl = `${location.href.split("#")[0]}#mod/${encodeURIComponent(mod.id)}`;
    try {
      if (navigator.share) await navigator.share({title:`${mod.name} — BlockMods`,text:mod.description,url:shareUrl});
      else { await navigator.clipboard.writeText(shareUrl); toast("Link do mod copiado!"); }
    } catch (error) { if (error.name !== "AbortError") toast("Não foi possível compartilhar agora."); }
  });
  $("#favoriteDetail").addEventListener("click", () => toggleFavorite(id));
  $("#deleteMod")?.addEventListener("click", () => {
    if (!confirm(`Excluir "${mod.name}" dos seus mods locais?`)) return;
    userMods = userMods.filter(item => item.id !== id);
    write(STORE.mods,userMods);
    favorites = favorites.filter(item => item !== id);
    write(STORE.favorites,favorites);
    ratings[id] = undefined; write(STORE.ratings,ratings);
    closeDetail(true); render(); toast("Mod removido deste navegador.");
  });
  $("#detailContent").querySelectorAll("[data-star]").forEach(button => button.addEventListener("click", () => {
    ratings[id] = [Number(button.dataset.star)];
    write(STORE.ratings,ratings);
    openDetail(id,false); render(); toast("Sua avaliação foi salva neste navegador.");
  }));
}
function closeDetail(clearHash=false) {
  $("#detailModal").classList.add("hidden");
  currentDetail = null;
  if (clearHash && location.hash.startsWith("#mod/")) history.pushState({},"",`${location.pathname}${location.search}#explorar`);
}
function toggleFavorite(id) {
  favorites = favorites.includes(id) ? favorites.filter(item=>item!==id) : [...favorites,id];
  write(STORE.favorites,favorites);
  render();
  if (currentDetail) openDetail(currentDetail,false);
}
function clearFilters() {
  $("#searchInput").value = "";
  $("#categoryFilter").value = "Todas";
  $("#versionFilter").value = "Todas";
  $("#sortFilter").value = "featured";
  $("#favoritesToggle").setAttribute("aria-pressed","false");
  $("#favoritesToggle").classList.remove("active-filter");
  render();
}
function addMod(form) {
  const data = new FormData(form);
  const name = String(data.get("name")||"").trim();
  const download = safeUrl(String(data.get("download")||""));
  const image = data.get("image") ? safeUrl(String(data.get("image"))) : "";
  const id = slugify(name);
  if (!name || !id) return toast("Informe um nome válido.");
  if (!download) return toast("Informe uma URL http(s) válida para a página do mod.");
  if (data.get("image") && !image) return toast("A imagem precisa usar uma URL http(s) válida.");
  if (allMods().some(mod => mod.id === id)) return toast("Já existe um mod com esse nome.");
  const entry = {
    id,name,category:String(data.get("category")),version:String(data.get("version")).trim(),
    description:String(data.get("description")).trim(),image,download,rating:0,ratings:0,
    featured:false,symbol:"✦",loader:"Não informado",createdAt:new Date().toISOString()
  };
  userMods = [...userMods,entry];
  if (!write(STORE.mods,userMods)) return;
  form.reset(); closeModal("admin"); clearFilters(); toast("Mod adicionado neste navegador!");
}
function closeModal(which) { $(`#${which}Modal`).classList.add("hidden"); }
function exportMods() {
  const payload = {format:"BlockMods backup",version:1,exportedAt:new Date().toISOString(),mods:userMods};
  const blob = new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href=url; anchor.download="blockmods-backup.json"; anchor.click();
  URL.revokeObjectURL(url); toast("Backup dos seus mods exportado!");
}
async function importMods(file) {
  if (!file) return;
  try {
    const parsed = JSON.parse(await file.text());
    const imported = Array.isArray(parsed) ? parsed : parsed.mods;
    if (!Array.isArray(imported)) throw new Error("Formato inválido");
    const clean = [];
    for (const raw of imported) {
      if (!raw || typeof raw.name!=="string" || typeof raw.description!=="string") continue;
      const id = slugify(raw.name);
      const download = safeUrl(raw.download||"");
      if (!id || !download || [...starterMods,...clean].some(m=>m.id===id)) continue;
      clean.push({
        id,name:raw.name.slice(0,60),category:String(raw.category||"Utilidade").slice(0,30),
        version:String(raw.version||"Não informada").slice(0,20),
        description:raw.description.slice(0,500),image:safeUrl(raw.image||""),
        download,rating:0,ratings:0,featured:false,symbol:"✦",
        loader:String(raw.loader||"Não informado").slice(0,40),createdAt:raw.createdAt||new Date().toISOString()
      });
    }
    if (!clean.length) throw new Error("Nenhum mod válido encontrado");
    const existing = new Set(userMods.map(m=>m.id));
    const merged = [...userMods,...clean.filter(m=>!existing.has(m.id))];
    if (!write(STORE.mods,merged)) return;
    userMods=merged; render(); toast(`${merged.length-existing.size} mod(s) importado(s)!`);
  } catch { toast("Não foi possível importar: confira se é um backup JSON do BlockMods."); }
  $("#importMods").value="";
}
function handleRoute() {
  const match = location.hash.match(/^#mod\/(.+)$/);
  if (match) {
    let id = "";
    try { id = decodeURIComponent(match[1]); } catch {}
    if (id) openDetail(id,false);
  } else if (currentDetail) closeDetail(false);
}
function setView(mode) {
  viewMode=mode; write(STORE.view,mode); render();
}
$("#year").textContent = new Date().getFullYear();
$("#searchInput").addEventListener("input",render);
$("#categoryFilter").addEventListener("change",render);
$("#versionFilter").addEventListener("change",render);
$("#sortFilter").addEventListener("change",render);
$("#categoryChips").addEventListener("click",event=>{
  const chip=event.target.closest("[data-category]"); if(!chip)return;
  $("#categoryFilter").value=chip.dataset.category; render();
});
$("#modGrid").addEventListener("click",event=>{
  const favorite=event.target.closest("[data-favorite]");
  if(favorite){event.stopPropagation();toggleFavorite(favorite.dataset.favorite);return;}
  const card=event.target.closest("[data-id]"); if(card)openDetail(card.dataset.id);
});
$("#modGrid").addEventListener("keydown",event=>{
  if((event.key==="Enter"||event.key===" ")&&event.target.matches("[data-id]")){event.preventDefault();openDetail(event.target.dataset.id);}
});
$("#favoritesToggle").addEventListener("click",()=>{
  const active=$("#favoritesToggle").getAttribute("aria-pressed")!=="true";
  $("#favoritesToggle").setAttribute("aria-pressed",String(active));
  $("#favoritesToggle").classList.toggle("active-filter",active); render();
});
$("#clearFilters").addEventListener("click",clearFilters);
$("#resetCatalog").addEventListener("click",clearFilters);
$("#gridView").addEventListener("click",()=>setView("grid"));
$("#listView").addEventListener("click",()=>setView("list"));
$("#openAdmin").addEventListener("click",()=>$("#adminModal").classList.remove("hidden"));
$("#contactSuggest").addEventListener("click",()=>$("#adminModal").classList.remove("hidden"));
$("#modForm").addEventListener("submit",event=>{event.preventDefault();addMod(event.currentTarget);});
$("#exportMods").addEventListener("click",exportMods);
$("#importMods").addEventListener("change",event=>importMods(event.target.files[0]));
document.querySelectorAll("[data-close]").forEach(element=>element.addEventListener("click",()=>element.dataset.close==="detail"?closeDetail(true):closeModal(element.dataset.close)));
$("#menuToggle").addEventListener("click",()=>$(".nav").classList.toggle("open"));
document.querySelectorAll(".nav a").forEach(link=>link.addEventListener("click",()=>$(".nav").classList.remove("open")));
document.addEventListener("keydown",event=>{
  if(event.key==="Escape"){closeDetail(true);closeModal("admin");}
  if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==="k"){event.preventDefault();$("#searchInput").focus();}
});
window.addEventListener("hashchange",handleRoute);
window.addEventListener("popstate",handleRoute);
allMods(); render(); handleRoute();
