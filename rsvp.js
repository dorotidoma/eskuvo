(function () {
  // A Google Apps Script "Web app" URL-je (…/exec). Beállítás: rsvp/BEALLITAS.md
  var RSVP_URL = '';

  var form = document.getElementById('rsvp-form');
  if (!form) return;
  var peopleBox = document.getElementById('rsvp-people');
  var plusBox = document.getElementById('rsvp-plus');
  var plusToggle = document.getElementById('rsvp-plus-toggle');
  var plusFields = document.getElementById('rsvp-plus-fields');
  var extra = document.getElementById('rsvp-extra');
  var hello = document.getElementById('rsvp-hello');
  var statusEl = document.getElementById('rsvp-status');
  var done = document.getElementById('rsvp-done');
  var submitBtn = form.querySelector('button[type="submit"]');

  var params = new URLSearchParams(location.search);
  var code = (params.get('m') || '').trim();
  var invited = []; // nevek a meghívóról (QR kód alapján)

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
  }
  function firstName(n) { var p = String(n).trim().split(/\s+/); return p.length > 1 ? p[p.length - 1] : p[0]; }

  function personBlock(i, name) {
    var fixed = !!name;
    return '<fieldset class="person" data-i="' + i + '">' +
      (fixed
        ? '<legend class="person-name">' + esc(name) + '</legend><input type="hidden" name="name-' + i + '" value="' + esc(name) + '">'
        : '<legend class="sr-only">Résztvevő</legend><label class="field"><span>Neved</span><input name="name-' + i + '" autocomplete="name" required></label>') +
      '<div class="choice" role="radiogroup">' +
        '<label><input type="radio" name="att-' + i + '" value="yes" required><span>Ott leszek</span></label>' +
        '<label><input type="radio" name="att-' + i + '" value="no"><span>Sajnos nem tudok jönni</span></label>' +
      '</div>' +
      '<label class="field diet" hidden><span>Ételallergia, -érzékenység</span>' +
        '<input name="diet-' + i + '" placeholder="pl. laktóz, glutén – ha nincs, hagyd üresen"></label>' +
      '</fieldset>';
  }

  function render(names) {
    invited = names || [];
    var list = invited.length ? invited : [''];
    peopleBox.innerHTML = list.map(function (n, i) { return personBlock(i, n); }).join('');
    plusBox.hidden = list.length !== 1; // +1 csak egyedül meghívottaknak
    if (invited.length) {
      hello.textContent = 'Kedves ' + invited.map(firstName).join(' és ') + '!';
      hello.hidden = false;
    }
    var many = list.length > 1;
    document.getElementById('lodging-q').textContent = many ? 'Kértek szállást a helyszínen?' : 'Kérsz szállást a helyszínen?';
    document.getElementById('dog-q').textContent = many ? 'Hoztok kutyát?' : 'Hozol kutyát?';
    update();
  }

  function attending() {
    return Array.prototype.map.call(peopleBox.querySelectorAll('.person'), function (p) {
      var r = p.querySelector('input[type="radio"]:checked');
      return r ? r.value === 'yes' : null;
    });
  }

  function update() {
    var att = attending();
    peopleBox.querySelectorAll('.person').forEach(function (p, i) {
      p.querySelector('.diet').hidden = att[i] !== true;
    });
    var anyone = att.some(function (a) { return a === true; });
    if (!plusBox.hidden) plusToggle.disabled = att[0] !== true;
    plusFields.hidden = !(plusToggle.checked && att[0] === true);
    extra.hidden = !anyone;
    form.querySelectorAll('#rsvp-extra input[type="radio"]').forEach(function (r) { r.required = anyone; });
    plusFields.querySelector('input[name="plus-name"]').required = !plusFields.hidden;
  }

  function prefill(prev) {
    if (!prev || !prev.people) return;
    var main = prev.people.filter(function (p) { return !p.plusOne; });
    var plus = prev.people.filter(function (p) { return p.plusOne; })[0];
    main.forEach(function (p, i) {
      var block = peopleBox.querySelector('.person[data-i="' + i + '"]');
      if (!block) return;
      var r = block.querySelector('input[value="' + (p.attending ? 'yes' : 'no') + '"]');
      if (r) r.checked = true;
      block.querySelector('input[name="diet-' + i + '"]').value = p.diet || '';
      var nameInput = block.querySelector('input[name="name-' + i + '"]:not([type="hidden"])');
      if (nameInput) nameInput.value = p.name;
    });
    if (plus && !plusBox.hidden) {
      plusToggle.checked = true;
      form.elements['plus-name'].value = plus.name || '';
      form.elements['plus-diet'].value = plus.diet || '';
    }
    ['lodging', 'dog'].forEach(function (k) {
      if (prev[k] === true || prev[k] === false) {
        var r = form.querySelector('input[name="' + k + '"][value="' + (prev[k] ? 'yes' : 'no') + '"]');
        if (r) r.checked = true;
      }
    });
    form.elements.message.value = prev.message || '';
    hello.textContent += ' Már visszajeleztetek – ha valami változott, itt módosíthatjátok.';
    update();
  }

  form.addEventListener('change', update);

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    statusEl.textContent = '';
    if (!form.reportValidity()) return;
    if (!RSVP_URL) { statusEl.textContent = 'Az űrlap még nincs bekötve. Kérjük, próbáld később.'; return; }

    var att = attending();
    var people = Array.prototype.map.call(peopleBox.querySelectorAll('.person'), function (p, i) {
      return {
        name: form.elements['name-' + i].value.trim(),
        attending: att[i] === true,
        diet: att[i] === true ? form.elements['diet-' + i].value.trim() : ''
      };
    });
    if (!plusFields.hidden && form.elements['plus-name'].value.trim()) {
      people.push({ name: form.elements['plus-name'].value.trim(), attending: true, diet: form.elements['plus-diet'].value.trim(), plusOne: true });
    }
    var radio = function (n) { var r = form.querySelector('input[name="' + n + '"]:checked'); return r ? r.value === 'yes' : null; };
    var payload = {
      code: code,
      people: people,
      lodging: radio('lodging'),
      dog: radio('dog'),
      message: form.elements.message.value.trim(),
      website: form.elements.website.value
    };

    submitBtn.disabled = true;
    submitBtn.textContent = 'Küldés…';
    fetch(RSVP_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (!res.ok) throw new Error(res.error || 'error');
        var anyone = people.some(function (p) { return p.attending; });
        document.getElementById('rsvp-done-text').textContent = anyone
          ? 'Köszönjük a visszajelzést, nagyon várunk ' + (people.length > 1 ? 'Titeket' : 'Téged') + '!'
          : 'Köszönjük, hogy jelezted. Sajnáljuk, hogy nem tudsz ott lenni – gondolni fogunk rád!';
        form.hidden = true;
        done.hidden = false;
        done.scrollIntoView({ behavior: 'smooth', block: 'center' });
      })
      .catch(function () {
        statusEl.textContent = 'Valami hiba történt a küldésnél. Kérjük, próbáld újra, vagy írj Sipos Rékának.';
      })
      .then(function () { submitBtn.disabled = false; submitBtn.textContent = 'Visszajelzés küldése'; });
  });

  document.getElementById('rsvp-edit').addEventListener('click', function () {
    done.hidden = true;
    form.hidden = false;
  });

  render([]);
  if (code && RSVP_URL) {
    form.classList.add('is-loading');
    fetch(RSVP_URL + '?m=' + encodeURIComponent(code))
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (res.ok && res.names && res.names.length) {
          render(res.names);
          prefill(res.previous);
        }
      })
      .catch(function () {})
      .then(function () { form.classList.remove('is-loading'); });
  }
})();
