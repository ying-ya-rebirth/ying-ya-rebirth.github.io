(function(){
  function getSectionEl(){return document.getElementById('gallery-section')}
  function byId(id){return document.getElementById(id)}
  function setDisplay(el,show){if(!el)return;el.style.display=show?'':'none'}
  function buildRawUrl(owner,repo,branch,path){
    if(!owner||!repo){return null}
    var base='https://raw.githubusercontent.com/'+owner+'/'+repo+'/'+(branch||'main')+'/'
    return base+path.replace(/^\/+/, '')
  }
  function randomTilt(){var deg=[-2,-1.2,-0.8,0,0.8,1.2,2];return deg[Math.floor(Math.random()*deg.length)]+'deg'}
  function createTag(label){var s=document.createElement('span');s.className='polaroid-tag';s.textContent=label;return s}
  function sortByDateAsc(items){return items.slice().sort(function(a,b){return new Date(a.date)-new Date(b.date)})}

  function render(items, cfg){
    var container=byId('gallery');
    var emptyEl=byId('gallery-empty');
    var errorEl=byId('gallery-error');
    if(!container)return;
    container.innerHTML=''
    if(!items||!items.length){setDisplay(emptyEl,true);setDisplay(errorEl,false);return}
    setDisplay(emptyEl,false);setDisplay(errorEl,false)
    var tpl=document.getElementById('gallery-card-template')
    sortByDateAsc(items).forEach(function(it){
      var node=tpl.content.firstElementChild.cloneNode(true)
      node.style.setProperty('--tilt', randomTilt())
      var link=node.querySelector('.polaroid-link')
      var img=node.querySelector('.polaroid-img')
      var title=node.querySelector('.polaroid-title')
      var dateEl=node.querySelector('.polaroid-date')
      var tagsEl=node.querySelector('.polaroid-tags')
      var url=it.url || (cfg.rawBase ? (cfg.rawBase + (it.path||it.file||'')) : '')
      link.href=url
      img.src=url
      img.alt=it.title||''
      title.textContent=it.title||''
      dateEl.textContent=it.date? new Date(it.date).toISOString().slice(0,10): ''
      ;(it.tags||[]).forEach(function(t){tagsEl.appendChild(createTag(t))})
      link.addEventListener('click', function(ev){ev.preventDefault();openModal(url,it)})
      container.appendChild(node)
    })
  }

  function openModal(url, meta){
    var modal=byId('gallery-modal');
    if(!modal)return;
    var img=modal.querySelector('.gallery-modal-img')
    var title=modal.querySelector('.gallery-modal-title')
    var tags=modal.querySelector('.gallery-modal-tags')
    img.src=url
    img.alt=meta.title||''
    title.textContent=meta.title||''
    tags.innerHTML=''
    ;(meta.tags||[]).forEach(function(t){tags.appendChild(createTag(t))})
    setDisplay(modal,true)
  }
  function closeModal(){setDisplay(byId('gallery-modal'),false)}

  function attachModalHandlers(){
    var modal=byId('gallery-modal');
    if(!modal)return;
    var closeBtn=modal.querySelector('.gallery-modal-close')
    var backdrop=modal.querySelector('.gallery-modal-backdrop')
    ;[closeBtn,backdrop].forEach(function(el){if(el){el.addEventListener('click',closeModal)}})
    document.addEventListener('keydown',function(e){if(e.key==='Escape')closeModal()})
  }

  function fetchIndex(cfg){
    var indexPath=(cfg.path? cfg.path.replace(/\/$/,'') + '/': '') + (cfg.index||'index.json')
    var url=buildRawUrl(cfg.owner,cfg.repo,cfg.branch,indexPath)
    return fetch(url,{cache:'no-store'}).then(function(r){
      if(!r.ok)throw new Error('HTTP '+r.status)
      return r.json()
    })
  }

  function init(){
    var root=getSectionEl();
    if(!root)return;
    attachModalHandlers()
    var cfg={
      owner: root.getAttribute('data-owner')||'',
      repo: root.getAttribute('data-repo')||'',
      branch: root.getAttribute('data-branch')||'main',
      path: root.getAttribute('data-path')||'gallery',
      index: root.getAttribute('data-index')||'index.json'
    }
    cfg.rawBase = buildRawUrl(cfg.owner,cfg.repo,cfg.branch,(cfg.path? cfg.path.replace(/\/$/,'') + '/': ''))

    var emptyEl=byId('gallery-empty');
    var errorEl=byId('gallery-error');

    if(!cfg.owner||!cfg.repo){
      if(emptyEl){emptyEl.textContent='未配置图库仓库';setDisplay(emptyEl,true)}
      return
    }

    fetchIndex(cfg).then(function(data){
      if(Array.isArray(data)){
        render(data,cfg)
      } else if (Array.isArray(data.items)){
        render(data.items,cfg)
      } else {
        throw new Error('Invalid index format')
      }
    }).catch(function(){
      if(errorEl)setDisplay(errorEl,true)
    })
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',init)
  }else{init()}
})();

