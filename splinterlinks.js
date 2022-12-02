function exists(item) {
  return !!item;
}

function filterGroup(group, regExpSearch) {
  if (!group) return [];
  return group.map(({name, icon, links = [], group}) => {
    const filteredLinks = links.filter(link => link.search.match(regExpSearch));
    const filteredGroup = filterGroup(group, regExpSearch);
    if (filteredLinks.length > 0 || filteredGroup.length > 0) {
      return {
        name,
        icon,
        links: filteredLinks,
        group: filteredGroup,
      };
    } else {
      return null;
    }
  }).filter(exists);
}

function buildLinks(links = []) {
  if (links.length === 0) return '';
  return `<div class="item-links">
    ${links.map(link => `
      <a class="item-links__link" href="${link.url}">
        ${link.icon ? `<img src="icons/${link.icon}" class="item-links__icon" />` : ''}
        ${link.name}
      </a>
    `).join('')}
  </div>`;
}

const randCharMatcher = /[^a-z]+/g
function randId() {
   return Math.random().toString(36).replace(randCharMatcher, '').substr(2, 10);
}

function buildGroup(group = [], nested) {
  if (group.length === 0) return '';
  return `<div class="${nested ? 'sub-group': 'group'}">
    ${group.filter(exists).map(groupItem => {
      const childGroups = buildGroup(groupItem.group, true);
      const childLinks = buildLinks(groupItem.links)

      const groupId = randId();
      const sub = nested ? 'sub-' : ''
      const collapsible = !nested || (groupItem.group || [] ).filter(exists).length ? ' iscollapsible' : ''
      return `<div class="${sub}group-item">
        <input class="item__check${collapsible}" type="checkbox" id="${groupId}" />
        <label class="${sub}group-item__title" for="${groupId}">
          ${groupItem.icon ? `<img src="icons/${groupItem.icon}" class="${sub}group-item__icon" />` : ''}
          ${groupItem.name}
        </label>
        ${childLinks}
        ${childGroups}
      </div>`;
    }).join('')}
  </div>`;
}

function onKeyUp(e) {
  const searchTerms = e.target.value;
  const results = filterGroup(data.links, `.*${searchTerms.toLowerCase().split('').join('.*')}.*`);

  if (e.which === 13) {
    const hits = extractHits(results);
    if (hits.length === 1) {
      openTab(hits[0].url, true);
      return;
    }
  }

  window.container.innerHTML = buildGroup(results);
  const checkedState = searchTerms === '' ? '' : 'checked';
  document.querySelectorAll('.item__check').forEach(itemCheck => {
    itemCheck.checked = checkedState;
  });
}

function extractHits(results) {
  return results.reduce((acc, group) => acc.concat(group.links).concat(extractHits(group.group)), []);
}

function enhanceDataWithSearch(group, context = []) {
  if (!group) return;
  group.forEach(groupItem => {
    const searchTerms = context.concat(groupItem.name);
    enhanceDataWithSearch(groupItem.group, searchTerms);
    if (groupItem.links) {
      groupItem.links = groupItem.links.map(({name, icon, url}) => ({
        name,
        icon,
        url,
        search: searchTerms.concat(name).join(' ').toLowerCase(),
      }));
    }
  });
}

window.browser = (() => {
  return window.msBrowser ||
  window.browser ||
  window.chrome;
})();

function whichClick (evt) {
 if (evt.button) {
  if (evt.button === 0) return 'LEFT';
  if (evt.button === 1) return 'MIDDLE';
  if (evt.button === 2) return 'RIGHT';
 } else if (evt.which) {
  if (evt.which === 1) return 'LEFT';
  if (evt.which === 2) return 'MIDDLE';
  if (evt.which === 3) return 'RIGHT';
 }
}

function handleMouseEvent (e) {
  const mouseButton = whichClick(e);
  const isPrimaryClick = mouseButton === 'LEFT';
  const isMiddleClick = mouseButton === 'MIDDLE';
  if(e.target.href && (isPrimaryClick || isMiddleClick)) {
    e.preventDefault();
    const isMetaOrCtrl = e.ctrlKey || e.metaKey;
    const active = !(isMetaOrCtrl && isPrimaryClick) && !isMiddleClick;
    openTab(e.target.href, active);
  }
}

function openTab(url, active) {
  window.browser.tabs.create({ url: url, active: active });
}

window.addEventListener('click', handleMouseEvent);
window.addEventListener('contextmenu', handleMouseEvent);
window.addEventListener('auxclick', handleMouseEvent);

(function () {
  const title = document.querySelector('.splinterlinks__title')
  title.innerHTML = data.title;
  const searchBox = document.querySelector('.splinterlinks__search')
  searchBox.placeholder = data.placeholder;
  searchBox.addEventListener('keyup', onKeyUp);
  searchBox.focus();
  enhanceDataWithSearch(data.links);
  const container = document.querySelector('.splinterlinks__content')
  container.innerHTML = buildGroup(data.links);
  window.container = container;
}());
