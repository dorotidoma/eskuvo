(function () {
  // A Google Apps Script "Web app" URL-je (…/exec). Beállítás: rsvp/BEALLITAS.md
  var RSVP_URL = 'https://script.google.com/macros/s/AKfycbzfI44XAIWMwaXtQxhGxc7x_2yxyCdFzWRMsdY3sRSO1qYF6rc5fyRwY5daEmSxkJqz/exec';

  var form = document.getElementById('rsvp-form');
  if (!form) return;
  var diet = document.getElementById('rsvp-diet');
  var extra = document.getElementById('rsvp-extra');
  var statusEl = document.getElementById('rsvp-status');
  var done = document.getElementById('rsvp-done');
  var submitBtn = form.querySelector('button[type="submit"]');

  function radio(n) {
    var r = form.querySelector('input[name="' + n + '"]:checked');
    return r ? r.value === 'yes' : null;
  }

  function update() {
    var yes = radio('attending') === true;
    diet.hidden = !yes;
    extra.hidden = !yes;
    extra.querySelectorAll('input[type="radio"]').forEach(function (r) { r.required = yes; });
  }

  // Saját, az oldal stílusához illő hibaüzenetek (a böngésző buborékjai helyett)
  function clearError(box) {
    box.classList.remove('has-error');
    var m = box.querySelector(':scope > .err');
    if (m) m.remove();
  }
  function setError(box, msg) {
    clearError(box);
    box.classList.add('has-error');
    var p = document.createElement('p');
    p.className = 'err';
    p.textContent = msg;
    box.appendChild(p);
  }
  function validate() {
    var first = null;
    function check(ok, box, msg) {
      if (ok) { clearError(box); return; }
      setError(box, msg);
      if (!first) first = box;
    }
    var nameBox = form.elements.name.closest('.field');
    check(form.elements.name.value.trim() !== '', nameBox, 'Kérjük, add meg a neved.');
    var att = radio('attending');
    check(att !== null, form.querySelector('input[name="attending"]').closest('.choice'), 'Kérjük, jelöld, hogy ott leszel-e.');
    if (att === true) {
      check(radio('lodging') !== null, form.querySelector('input[name="lodging"]').closest('.choice'), 'Kérjük, válassz.');
      check(radio('dog') !== null, form.querySelector('input[name="dog"]').closest('.choice'), 'Kérjük, válassz.');
    }
    if (first) {
      first.scrollIntoView({ behavior: 'smooth', block: 'center' });
      var input = first.querySelector('input:not([type="radio"])');
      if (input) input.focus({ preventScroll: true });
    }
    return !first;
  }
  form.addEventListener('input', function (e) {
    var box = e.target.closest('.field, .choice');
    if (box && box.classList.contains('has-error')) clearError(box);
  });

  form.addEventListener('change', update);

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    statusEl.textContent = '';
    if (!validate()) return;

    var attending = radio('attending') === true;
    var payload = {
      name: form.elements.name.value.trim(),
      attending: attending,
      diet: attending ? form.elements.diet.value.trim() : '',
      lodging: attending ? radio('lodging') : null,
      dog: attending ? radio('dog') : null,
      message: form.elements.message.value.trim(),
      website: form.elements.website.value
    };

    submitBtn.disabled = true;
    submitBtn.textContent = 'Küldés…';
    fetch(RSVP_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (!res.ok) throw new Error(res.error || 'error');
        document.getElementById('rsvp-done-text').textContent = attending
          ? 'Köszönjük a visszajelzést, nagyon várunk!'
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

  // "Még valaki kitölti" / módosítás: üres vagy megtartott formmal vissza
  document.getElementById('rsvp-again').addEventListener('click', function () {
    form.reset();
    form.querySelectorAll('.has-error').forEach(clearError);
    update();
    done.hidden = true;
    form.hidden = false;
    form.elements.name.focus();
  });

  update();
})();
