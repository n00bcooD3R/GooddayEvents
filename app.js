
// ── Particles ──
(function createParticles() {
  const container = document.getElementById('particles');
  const colors = ['rgba(74,222,128,0.4)','rgba(201,168,76,0.3)','rgba(255,255,255,0.15)'];
  for (let i = 0; i < 28; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = Math.random() * 5 + 2;
    p.style.cssText = 'width:'+size+'px;height:'+size+'px;left:'+(Math.random()*100)+'%;background:'+colors[Math.floor(Math.random()*colors.length)]+';animation-duration:'+(Math.random()*12+8)+'s;animation-delay:'+(Math.random()*10)+'s;';
    container.appendChild(p);
  }
})();

// ── Sticky bar visibility ──
const actionBar = document.getElementById('actionBar');
const hero = document.querySelector('.hero');
const heroObs = new IntersectionObserver(function(entries) {
  actionBar.classList.toggle('visible', !entries[0].isIntersecting);
}, { threshold: 0.1 });
heroObs.observe(hero);

// ── updateCount ──
function updateCount() {
  const checked = document.querySelectorAll('.item-check:checked');
  document.getElementById('selectedCount').textContent = checked.length;
  const sub = document.getElementById('ctaSub');
  if (checked.length === 0) {
    sub.textContent = 'Select your preferred items above and download your custom menu';
  } else {
    sub.textContent = checked.length + ' item' + (checked.length > 1 ? 's' : '') + ' selected — ready to download!';
  }
  // Update per-category badges
  document.querySelectorAll('.menu-card').forEach(function(card) {
    const checks = card.querySelectorAll('.item-check');
    const checkedCount = card.querySelectorAll('.item-check:checked').length;
    const badge = card.querySelector('.cat-count-badge');
    if (badge) badge.textContent = checkedCount + '/' + checks.length;
    const btn = card.querySelector('.cat-select-all');
    if (btn) {
      if (checkedCount === checks.length && checks.length > 0) {
        btn.textContent = 'Deselect All';
        btn.classList.add('all-selected');
      } else {
        btn.textContent = 'Select All';
        btn.classList.remove('all-selected');
      }
    }
  });
}

// ── toggleCategory ──
function toggleCategory(catId, btn) {
  const section = document.getElementById(catId);
  const checks = section.querySelectorAll('.item-check');
  const isAllSelected = Array.from(checks).every(function(c) { return c.checked; });
  checks.forEach(function(c) { c.checked = !isAllSelected; });
  updateCount();
}

// ── selectAllGlobal ──
function selectAllGlobal() {
  document.querySelectorAll('.item-check').forEach(function(c) { c.checked = true; });
  updateCount();
  showToast('All items selected!');
}

// ── clearAll ──
function clearAll() {
  document.querySelectorAll('.item-check').forEach(function(c) { c.checked = false; });
  updateCount();
}

// ── showToast ──
function showToast(msg, duration) {
  duration = duration || 3000;
  var t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(function() { t.classList.remove('show'); }, duration);
}

// ============================================================
// ── generatePDF ──
// ============================================================
function generatePDF() {
  // 1. Collect selected items grouped by category
  var selected = {};
  var catOrder = [];
  document.querySelectorAll('.item-check:checked').forEach(function(c) {
    var cat = c.getAttribute('data-cat');
    if (!selected[cat]) { selected[cat] = []; catOrder.push(cat); }
    selected[cat].push(c.value);
  });

  var totalItems = 0;
  catOrder.forEach(function(cat) { totalItems += selected[cat].length; });

  if (totalItems === 0) {
    showToast('Please select at least one item first!', 3500);
    return;
  }

  // 2. Check jsPDF loaded
  if (!window.jspdf || !window.jspdf.jsPDF) {
    showToast('PDF library still loading — please try again!', 3500);
    return;
  }

  var jsPDF = window.jspdf.jsPDF;
  var doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  var W = 210, H = 297;
  var mL = 15, mR = 15;
  var cW = W - mL - mR; // content width = 180

  // ── Helper: draw dark background on current page ──
  function drawBg() {
    doc.setFillColor(10, 20, 12);
    doc.rect(0, 0, W, H, 'F');
  }

  // ── Helper: draw page footer ──
  function drawFooter() {
    doc.setFillColor(26, 61, 26);
    doc.rect(0, H - 12, W, 12, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(140, 200, 140);
    doc.text('Good Day Events  |  Making Every Occasion Extraordinary', W / 2, H - 4, { align: 'center' });
  }

  // ── Helper: new page ──
  var pageNum = 1;
  function newPage() {
    drawFooter();
    doc.addPage();
    pageNum++;
    drawBg();
    // Mini header on continuation pages
    doc.setFillColor(26, 61, 26);
    doc.rect(0, 0, W, 14, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(240, 212, 128);
    doc.text('Good Day Events — Catering Menu (continued)', W / 2, 9, { align: 'center' });
    return 20; // new y
  }

  // ── PAGE 1: Draw background + header ──
  drawBg();

  // Header band
  doc.setFillColor(26, 61, 26);
  doc.rect(0, 0, W, 45, 'F');
  // Gold accent line
  doc.setFillColor(201, 168, 76);
  doc.rect(0, 44, W, 1.5, 'F');

  // Company name
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(240, 212, 128);
  doc.text('Good Day Events', W / 2, 17, { align: 'center' });

  // Tagline
  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(180, 230, 180);
  doc.text('Making Every Occasion Extraordinary', W / 2, 26, { align: 'center' });

  // Section title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('CATERING MENU', W / 2, 38, { align: 'center' });

  // Date + count line
  var dateStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(140, 190, 140);
  doc.text('Generated: ' + dateStr + '   |   ' + totalItems + ' item' + (totalItems > 1 ? 's' : '') + ' selected', W / 2, 56, { align: 'center' });

  // Divider
  doc.setDrawColor(74, 222, 128);
  doc.setLineWidth(0.3);
  doc.line(mL, 60, W - mR, 60);

  var y = 66;
  var pageBottom = H - 18;

  // ── Draw each category ──
  for (var ci = 0; ci < catOrder.length; ci++) {
    var cat = catOrder[ci];
    var items = selected[cat];
    var numRows = Math.ceil(items.length / 2);
    var blockHeight = 12 + numRows * 7 + 6; // header + rows + gap

    // Check if whole block fits; if not, start new page
    if (y + blockHeight > pageBottom) {
      y = newPage();
    }

    // ── Category header bar ──
    doc.setFillColor(20, 45, 22);
    doc.roundedRect(mL, y, cW, 11, 2, 2, 'F');

    // Left green accent strip
    doc.setFillColor(74, 222, 128);
    doc.roundedRect(mL, y, 3, 11, 1, 1, 'F');

    // Category name
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(200, 255, 200);
    doc.text(cat.toUpperCase(), mL + 7, y + 7.5);

    // Item count on right
    var cntTxt = items.length + ' item' + (items.length > 1 ? 's' : '');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 180, 100);
    doc.text(cntTxt, mL + cW - 4, y + 7.5, { align: 'right' });

    y += 13;

    // ── Items in 2-column layout ──
    var col1X = mL + 4;
    var col2X = mL + cW / 2 + 2;
    var half = Math.ceil(items.length / 2);

    for (var i = 0; i < half; i++) {
      if (y + 7 > pageBottom) {
        y = newPage();
      }

      // Column 1
      doc.setFillColor(74, 222, 128);
      doc.ellipse(col1X + 0.9, y + 1.8, 0.9, 0.9, 'F');
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(235, 250, 235);
      doc.text(items[i], col1X + 4, y + 3);

      // Column 2 (if exists)
      var item2 = items[i + half];
      if (item2) {
        doc.setFillColor(74, 222, 128);
        doc.ellipse(col2X + 0.9, y + 1.8, 0.9, 0.9, 'F');
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(235, 250, 235);
        doc.text(item2, col2X + 4, y + 3);
      }

      y += 7;
    }

    y += 5; // gap between categories
  }

  // ── Always Included section ──
  var includesHeight = 48;
  if (y + includesHeight > pageBottom) {
    y = newPage();
  }

  // Gold border box
  doc.setFillColor(18, 28, 14);
  doc.roundedRect(mL, y, cW, includesHeight, 3, 3, 'F');
  doc.setDrawColor(201, 168, 76);
  doc.setLineWidth(0.5);
  doc.roundedRect(mL, y, cW, includesHeight, 3, 3, 'S');

  // Gold top accent
  doc.setFillColor(201, 168, 76);
  doc.roundedRect(mL, y, cW, 3, 1, 1, 'F');

  // Title
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(240, 200, 80);
  doc.text('ALWAYS INCLUDED', W / 2, y + 12, { align: 'center' });

  // Divider under title
  doc.setDrawColor(201, 168, 76);
  doc.setLineWidth(0.2);
  doc.line(mL + 10, y + 15, mL + cW - 10, y + 15);

  var includes = [
    { icon: 'Waste Management' },
    { icon: 'Counter Setting' },
    { icon: 'Service Staff' },
    { icon: 'Disposable Items' },
    { icon: 'Bottle Water' }
  ];

  // Layout: 3 items row 1, 2 items row 2 (centered)
  var incY1 = y + 22;
  var incY2 = y + 36;
  var col3W = cW / 3;

  for (var k = 0; k < 3; k++) {
    var cx = mL + col3W * k + col3W / 2;
    doc.setFillColor(201, 168, 76);
    doc.ellipse(cx - 16, incY1 + 1.2, 0.8, 0.8, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(230, 215, 175);
    doc.text(includes[k].icon, cx - 12, incY1 + 2.5);
  }
  // Row 2: 2 items centered
  var col2W = cW / 2;
  for (var k2 = 0; k2 < 2; k2++) {
    var cx2 = mL + col2W * k2 + col2W / 2;
    doc.setFillColor(201, 168, 76);
    doc.ellipse(cx2 - 16, incY2 + 1.2, 0.8, 0.8, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(230, 215, 175);
    doc.text(includes[k2 + 3].icon, cx2 - 12, incY2 + 2.5);
  }

  // ── Draw footer on last page ──
  drawFooter();

  // ── Save ──
  doc.save('GoodDay_Events_Catering_Menu.pdf');
  showToast('PDF downloaded with ' + totalItems + ' items!', 3000);
}
