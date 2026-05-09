/* ════════════════════════════════════════════════════════════
   modals.js — Modal Management & Form Rendering
   ════════════════════════════════════════════════════════════ */

const ModalManager = {
  currentType: null,
  currentData: null,

  open(title, bodyHtml, onSubmit, wide = false) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = bodyHtml;
    document.getElementById('modalOverlay').classList.remove('hidden');
    document.getElementById('modal').classList.toggle('wide', wide);
    ModalManager._onSubmit = onSubmit;
  },

  openDetailOnly(title, bodyHtml) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = bodyHtml;
    document.getElementById('modalFooter').innerHTML = `<button class="btn-secondary" onclick="closeModal()">關閉</button>`;
    document.getElementById('modalOverlay').classList.remove('hidden');
    document.getElementById('modal').classList.add('wide');
    ModalManager._onSubmit = null;
  },

  // ── CLIENT FORMS ────────────────────────────────────────────
  openClientForm(client = null) {
    ModalManager.currentType = 'client';
    ModalManager.currentData = client;
    const isEdit = !!client;

    const catOptions = CONFIG.CLIENT_CATEGORIES.map(c =>
      `<option value="${c}" ${client?.category===c?'selected':''}>${c}</option>`).join('');
    const levelOptions = CONFIG.CLIENT_LEVELS.map(l =>
      `<option value="${l}" ${client?.level===l?'selected':''}>${l}</option>`).join('');
    const statusOptions = Object.values(CONFIG.CLIENT_STATUS).map(s =>
      `<option value="${s}" ${client?.status===s?'selected':''}>${s}</option>`).join('');
    const regionOptions = CONFIG.REGIONS.map(r =>
      `<option value="${r}" ${client?.region===r?'selected':''}>${r}</option>`).join('');

    const body = `
      <div class="form-grid">
        <div class="form-section-title">基本資料</div>
        <div class="form-field">
          <label>公司名稱 <span class="required">*</span></label>
          <input type="text" id="f_name" value="${Utils.escapeHtml(client?.name||'')}" placeholder="例：數位發展部" />
        </div>
        <div class="form-field">
          <label>公司英文名稱</label>
          <input type="text" id="f_nameEn" value="${Utils.escapeHtml(client?.nameEn||'')}" placeholder="English Name" />
        </div>
        <div class="form-field">
          <label>統一編號</label>
          <input type="text" id="f_taxId" value="${Utils.escapeHtml(client?.taxId||'')}" placeholder="8碼統編" maxlength="8" style="font-family:var(--font-mono)" />
        </div>
        <div class="form-field">
          <label>公司類型</label>
          <select id="f_category">${catOptions}</select>
        </div>
        <div class="form-field">
          <label>客戶等級</label>
          <select id="f_level">${levelOptions}</select>
        </div>
        <div class="form-field">
          <label>合作狀態</label>
          <select id="f_status">${statusOptions}</select>
        </div>
        <div class="form-field">
          <label>地區</label>
          <select id="f_region">${regionOptions}</select>
        </div>
        <div class="form-field">
          <label>公司網站</label>
          <input type="text" id="f_website" value="${Utils.escapeHtml(client?.website||'')}" placeholder="https://" />
        </div>

        <div class="form-section-title">聯絡資訊</div>
        <div class="form-field">
          <label>公司電話</label>
          <input type="text" id="f_phone" value="${Utils.escapeHtml(client?.phone||'')}" placeholder="02-XXXX-XXXX" />
        </div>
        <div class="form-field">
          <label>公司 Email</label>
          <input type="email" id="f_email" value="${Utils.escapeHtml(client?.email||'')}" placeholder="contact@example.gov.tw" />
        </div>
        <div class="form-field span-2">
          <label>公司地址</label>
          <input type="text" id="f_address" value="${Utils.escapeHtml(client?.address||'')}" placeholder="縣市區路號" />
        </div>

        <div class="form-section-title">標籤與備註</div>
        <div class="form-field span-2">
          <label>標籤（逗號分隔）</label>
          <input type="text" id="f_tags" value="${(client?.tags||[]).join(', ')}" placeholder="高潛力, 長期合作, 年度標案" />
        </div>
        <div class="form-field span-2">
          <label>備註</label>
          <textarea id="f_notes" placeholder="內部備註，不會顯示給客戶">${Utils.escapeHtml(client?.notes||'')}</textarea>
        </div>
      </div>
    `;

    ModalManager.open(
      isEdit ? `編輯客戶：${client.name}` : '新增客戶',
      body,
      ModalManager.submitClientForm
    );
  },

  async submitClientForm() {
    const data = {
      name:     document.getElementById('f_name').value.trim(),
      nameEn:   document.getElementById('f_nameEn').value.trim(),
      taxId:    document.getElementById('f_taxId').value.trim(),
      category: document.getElementById('f_category').value,
      level:    document.getElementById('f_level').value,
      status:   document.getElementById('f_status').value,
      region:   document.getElementById('f_region').value,
      website:  document.getElementById('f_website').value.trim(),
      phone:    document.getElementById('f_phone').value.trim(),
      email:    document.getElementById('f_email').value.trim(),
      address:  document.getElementById('f_address').value.trim(),
      tags:     document.getElementById('f_tags').value.split(',').map(t => t.trim()).filter(Boolean),
      notes:    document.getElementById('f_notes').value.trim(),
    };

    if (!data.name) { Utils.toast('請輸入公司名稱', 'warning'); return; }

    const btn = document.getElementById('modalSubmit');
    btn.textContent = '儲存中…'; btn.disabled = true;

    let res;
    if (ModalManager.currentData?.id) {
      res = await API.updateClient(ModalManager.currentData.id, data);
    } else {
      res = await API.createClient(data);
    }

    btn.textContent = '儲存'; btn.disabled = false;

    if (res.success) {
      Utils.toast(ModalManager.currentData ? '已更新客戶資料' : '已新增客戶', 'success');
      closeModal();
      ClientsPage.load();
    } else {
      Utils.toast('儲存失敗：' + (res.message || '請稍後再試'), 'error');
    }
  },

  // ── CLIENT DETAIL ───────────────────────────────────────────
  openClientDetail(client) {
    const infoHtml = `
      <div class="detail-header">
        <div class="detail-identity">
          ${Utils.companyAvatar(client.name, 56)}
          <div>
            <div class="detail-name">${Utils.escapeHtml(client.name)}</div>
            <div class="detail-sub">${Utils.escapeHtml(client.nameEn||'')} · ${client.category}</div>
            <div class="detail-tags">
              ${Utils.levelBadge(client.level)}
              ${Utils.statusChip(client.status)}
              ${Utils.tags(client.tags, true)}
            </div>
          </div>
        </div>
        <div class="detail-actions">
          <button class="btn-secondary" onclick="closeModal();ClientsPage.openEdit('${client.id}')">編輯資料</button>
          <button class="btn-primary" onclick="ModalManager.openActivityForm('${client.id}','${Utils.escapeHtml(client.name)}')">新增追蹤</button>
        </div>
      </div>
      <div class="info-grid">
        <div class="info-item"><div class="info-label">統一編號</div><div class="info-value mono">${client.taxId||'—'}</div></div>
        <div class="info-item"><div class="info-label">地區</div><div class="info-value">${client.region||'—'}</div></div>
        <div class="info-item"><div class="info-label">電話</div><div class="info-value"><a href="tel:${client.phone}">${client.phone||'—'}</a></div></div>
        <div class="info-item"><div class="info-label">Email</div><div class="info-value"><a href="mailto:${client.email}">${client.email||'—'}</a></div></div>
        <div class="info-item"><div class="info-label">網站</div><div class="info-value"><a href="${client.website||'#'}" target="_blank" rel="noopener">${client.website||'—'}</a></div></div>
        <div class="info-item"><div class="info-label">建立日期</div><div class="info-value mono">${Utils.formatDate(client.createdAt)}</div></div>
        <div class="info-item"><div class="info-label">聯絡人數</div><div class="info-value">${client.contacts} 人</div></div>
        <div class="info-item"><div class="info-label">合作專案</div><div class="info-value">${client.projects} 件</div></div>
      </div>
    `;
    ModalManager.openDetailOnly(`客戶詳情：${client.name}`, infoHtml);
  },

  // ── VENDOR FORMS ────────────────────────────────────────────
  openVendorForm(vendor = null) {
    ModalManager.currentType = 'vendor';
    ModalManager.currentData = vendor;
    const isEdit = !!vendor;

    const catOptions = CONFIG.VENDOR_CATEGORIES.map(c =>
      `<option value="${c}" ${vendor?.category===c?'selected':''}>${c}</option>`).join('');
    const statusOptions = Object.values(CONFIG.VENDOR_STATUS).map(s =>
      `<option value="${s}" ${vendor?.status===s?'selected':''}>${s}</option>`).join('');
    const regionOptions = CONFIG.REGIONS.map(r =>
      `<option value="${r}" ${vendor?.region===r?'selected':''}>${r}</option>`).join('');

    const body = `
      <div class="form-grid">
        <div class="form-section-title">基本資料</div>
        <div class="form-field">
          <label>供應商名稱 <span class="required">*</span></label>
          <input type="text" id="f_name" value="${Utils.escapeHtml(vendor?.name||'')}" />
        </div>
        <div class="form-field">
          <label>統一編號</label>
          <input type="text" id="f_taxId" value="${Utils.escapeHtml(vendor?.taxId||'')}" maxlength="8" style="font-family:var(--font-mono)" />
        </div>
        <div class="form-field">
          <label>供應商類型 <span class="required">*</span></label>
          <select id="f_category">${catOptions}</select>
        </div>
        <div class="form-field">
          <label>配合狀態</label>
          <select id="f_status">${statusOptions}</select>
        </div>
        <div class="form-field">
          <label>配合地區</label>
          <select id="f_region">${regionOptions}</select>
        </div>

        <div class="form-section-title">聯絡資訊</div>
        <div class="form-field">
          <label>聯絡人姓名</label>
          <input type="text" id="f_contact" value="${Utils.escapeHtml(vendor?.contact||'')}" />
        </div>
        <div class="form-field">
          <label>聯絡人電話</label>
          <input type="text" id="f_phone" value="${Utils.escapeHtml(vendor?.phone||'')}" />
        </div>
        <div class="form-field span-2">
          <label>公司地址</label>
          <input type="text" id="f_address" value="${Utils.escapeHtml(vendor?.address||'')}" />
        </div>

        <div class="form-section-title">付款資訊</div>
        <div class="form-field">
          <label>付款方式</label>
          <select id="f_payment">
            ${['月結30天','月結60天','即期付款','預付款'].map(p =>
              `<option value="${p}" ${vendor?.payment===p?'selected':''}>${p}</option>`).join('')}
          </select>
        </div>
        <div class="form-field">
          <label>銀行帳戶（後4碼）</label>
          <input type="text" id="f_bankLast4" value="${Utils.escapeHtml(vendor?.bankLast4||'')}" maxlength="4" style="font-family:var(--font-mono)" placeholder="****" />
        </div>

        <div class="form-section-title">標籤與備註</div>
        <div class="form-field span-2">
          <label>標籤（逗號分隔）</label>
          <input type="text" id="f_tags" value="${(vendor?.tags||[]).join(', ')}" placeholder="推薦, 高品質, 快速交件" />
        </div>
        <div class="form-field span-2">
          <label>備註</label>
          <textarea id="f_notes">${Utils.escapeHtml(vendor?.notes||'')}</textarea>
        </div>
      </div>
    `;

    ModalManager.open(
      isEdit ? `編輯供應商：${vendor.name}` : '新增供應商',
      body,
      ModalManager.submitVendorForm
    );
  },

  async submitVendorForm() {
    const data = {
      name:      document.getElementById('f_name').value.trim(),
      taxId:     document.getElementById('f_taxId').value.trim(),
      category:  document.getElementById('f_category').value,
      status:    document.getElementById('f_status').value,
      region:    document.getElementById('f_region').value,
      contact:   document.getElementById('f_contact').value.trim(),
      phone:     document.getElementById('f_phone').value.trim(),
      address:   document.getElementById('f_address').value.trim(),
      payment:   document.getElementById('f_payment').value,
      bankLast4: document.getElementById('f_bankLast4').value.trim(),
      tags:      document.getElementById('f_tags').value.split(',').map(t=>t.trim()).filter(Boolean),
      notes:     document.getElementById('f_notes').value.trim(),
    };
    if (!data.name) { Utils.toast('請輸入供應商名稱', 'warning'); return; }

    const btn = document.getElementById('modalSubmit');
    btn.textContent = '儲存中…'; btn.disabled = true;
    let res;
    if (ModalManager.currentData?.id) {
      res = await API.updateVendor(ModalManager.currentData.id, data);
    } else {
      res = await API.createVendor(data);
    }
    btn.textContent = '儲存'; btn.disabled = false;
    if (res.success) {
      Utils.toast(ModalManager.currentData ? '已更新供應商' : '已新增供應商', 'success');
      closeModal();
      VendorsPage.load();
    } else {
      Utils.toast('儲存失敗', 'error');
    }
  },

  openVendorDetail(vendor) {
    const ratingData = [
      { label: '整體評分', score: vendor.rating || 0, max: 5 },
      { label: '準時程度', score: (vendor.ratingPunctual || vendor.rating || 0), max: 5 },
      { label: '品質水準', score: (vendor.ratingQuality || vendor.rating || 0), max: 5 },
      { label: '價格合理', score: (vendor.ratingPrice || vendor.rating || 0), max: 5 },
    ];
    const ratingHtml = `
      <div class="rating-widget" style="margin-bottom:16px">
        ${ratingData.map(r => `
          <div class="rating-row">
            <div class="rating-label">${r.label}</div>
            <div class="rating-bar-wrap"><div class="rating-bar" style="width:${(r.score/r.max)*100}%"></div></div>
            <div class="rating-score">${r.score.toFixed(1)}</div>
          </div>
        `).join('')}
      </div>
    `;
    const body = `
      <div class="detail-header">
        <div class="detail-identity">
          ${Utils.companyAvatar(vendor.name, 56)}
          <div>
            <div class="detail-name">${Utils.escapeHtml(vendor.name)}</div>
            <div class="detail-sub">${vendor.category} · ${vendor.region}</div>
            <div class="detail-tags">
              ${Utils.statusChip(vendor.status)}
              ${Utils.tags(vendor.tags, true)}
            </div>
          </div>
        </div>
        <div class="detail-actions">
          <button class="btn-secondary" onclick="closeModal();VendorsPage.openEdit('${vendor.id}')">編輯</button>
        </div>
      </div>
      <div class="info-grid" style="margin-bottom:16px">
        <div class="info-item"><div class="info-label">統一編號</div><div class="info-value mono">${vendor.taxId||'—'}</div></div>
        <div class="info-item"><div class="info-label">聯絡人</div><div class="info-value">${vendor.contact||'—'}</div></div>
        <div class="info-item"><div class="info-label">電話</div><div class="info-value"><a href="tel:${vendor.phone}">${vendor.phone||'—'}</a></div></div>
        <div class="info-item"><div class="info-label">配合次數</div><div class="info-value">${vendor.projects} 次</div></div>
      </div>
      ${ratingHtml}
    `;
    ModalManager.openDetailOnly(`供應商詳情：${vendor.name}`, body);
  },

  // ── ACTIVITY FORM ───────────────────────────────────────────
  openActivityForm(clientId = '', clientName = '') {
    const typeOptions = Object.entries(CONFIG.ACTIVITY_TYPES).map(([k,v]) =>
      `<option value="${k}">${v.icon} ${v.label}</option>`).join('');
    const body = `
      <div class="form-grid">
        <div class="form-field">
          <label>追蹤類型 <span class="required">*</span></label>
          <select id="f_actType">${typeOptions}</select>
        </div>
        <div class="form-field">
          <label>日期時間</label>
          <input type="datetime-local" id="f_actDate" value="${new Date().toISOString().slice(0,16)}" />
        </div>
        <div class="form-field span-2">
          <label>標題 <span class="required">*</span></label>
          <input type="text" id="f_actTitle" placeholder="例：電話追蹤 — 6G標準峰會提案" />
        </div>
        <div class="form-field span-2">
          <label>關聯客戶</label>
          <input type="text" id="f_actClient" value="${Utils.escapeHtml(clientName)}" placeholder="輸入客戶名稱" />
        </div>
        <div class="form-field span-2">
          <label>內容記錄</label>
          <textarea id="f_actContent" placeholder="詳細說明、重點、後續待辦…" style="min-height:100px"></textarea>
        </div>
        <div class="form-field span-2">
          <label>後續行動</label>
          <input type="text" id="f_actNext" placeholder="例：下週三前提交報價單" />
        </div>
      </div>
    `;
    ModalManager.open('新增追蹤紀錄', body, async () => {
      const data = {
        type:      document.getElementById('f_actType').value,
        date:      document.getElementById('f_actDate').value,
        title:     document.getElementById('f_actTitle').value.trim(),
        client:    document.getElementById('f_actClient').value.trim(),
        content:   document.getElementById('f_actContent').value.trim(),
        nextAction:document.getElementById('f_actNext').value.trim(),
        clientId,
      };
      if (!data.title) { Utils.toast('請輸入標題', 'warning'); return; }
      const res = await API.createActivity(data);
      if (res.success) {
        Utils.toast('已新增追蹤紀錄', 'success');
        closeModal();
      } else {
        Utils.toast('儲存失敗', 'error');
      }
    });
  },

  openContactForm() {
    Utils.toast('聯絡人模組待 GAS 部署後啟用', 'info');
  },
  openProjectForm() {
    Utils.toast('專案模組待 GAS 部署後啟用', 'info');
  },
  openEvaluationForm() {
    Utils.toast('評價模組待 GAS 部署後啟用', 'info');
  },
};

// ── Global Modal Controls ────────────────────────────────────
function closeModal(e) {
  if (e && e.target !== document.getElementById('modalOverlay')) return;
  document.getElementById('modalOverlay').classList.add('hidden');
  document.getElementById('modal').classList.remove('wide');
  document.getElementById('modalFooter').innerHTML = `
    <button class="btn-secondary" onclick="closeModal()">取消</button>
    <button class="btn-primary" id="modalSubmit" onclick="submitModal()">儲存</button>
  `;
}

async function submitModal() {
  if (ModalManager._onSubmit) await ModalManager._onSubmit();
}

function openCreateModal() {
  const page = App.currentPage;
  if (page === 'clients')   return ModalManager.openClientForm();
  if (page === 'vendors')   return ModalManager.openVendorForm();
  if (page === 'contacts')  return ModalManager.openContactForm();
  if (page === 'activities') return ModalManager.openActivityForm();
  if (page === 'projects')  return ModalManager.openProjectForm();
  Utils.toast('請選擇頁面後再新增', 'info');
}
