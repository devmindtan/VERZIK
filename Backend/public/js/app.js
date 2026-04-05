/**
 * VietFuture — Frontend App Logic
 */

// ===== DOM Elements =====
const tabBtns = document.querySelectorAll('.tab-btn');
const panels = document.querySelectorAll('.panel');

// Verify panel
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('fileInput');
const filePreview = document.getElementById('filePreview');
const filePreviewName = document.getElementById('filePreviewName');
const filePreviewSize = document.getElementById('filePreviewSize');
const fileRemoveBtn = document.getElementById('fileRemoveBtn');
const verifyBtn = document.getElementById('verifyBtn');
const verifySpinner = document.getElementById('verifySpinner');
const verifyBtnText = document.getElementById('verifyBtnText');
const verifyResult = document.getElementById('verifyResult');

// View panel
const accessCodeInput = document.getElementById('accessCodeInput');
const viewBtn = document.getElementById('viewBtn');
const viewSpinner = document.getElementById('viewSpinner');
const viewBtnText = document.getElementById('viewBtnText');
const viewResult = document.getElementById('viewResult');

let selectedFile = null;

// ===== Tab Navigation =====
tabBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.tab;

    tabBtns.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');

    panels.forEach((p) => {
      p.classList.remove('active');
      if (p.id === target) p.classList.add('active');
    });
  });
});

// ===== Dropzone =====
dropzone.addEventListener('click', () => fileInput.click());

dropzone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropzone.classList.add('dragover');
});

dropzone.addEventListener('dragleave', () => {
  dropzone.classList.remove('dragover');
});

dropzone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropzone.classList.remove('dragover');
  if (e.dataTransfer.files.length > 0) {
    handleFileSelect(e.dataTransfer.files[0]);
  }
});

fileInput.addEventListener('change', (e) => {
  if (e.target.files.length > 0) {
    handleFileSelect(e.target.files[0]);
  }
});

fileRemoveBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  clearFile();
});

function handleFileSelect(file) {
  selectedFile = file;
  filePreviewName.textContent = file.name;
  filePreviewSize.textContent = formatFileSize(file.size);
  filePreview.classList.add('visible');
  verifyBtn.disabled = false;
  verifyResult.classList.remove('visible');
}

function clearFile() {
  selectedFile = null;
  fileInput.value = '';
  filePreview.classList.remove('visible');
  verifyBtn.disabled = true;
  verifyResult.classList.remove('visible');
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function getFileIcon(name) {
  const ext = name.split('.').pop().toLowerCase();
  const icons = {
    pdf: '📄',
    jpg: '🖼️',
    jpeg: '🖼️',
    png: '🖼️',
    doc: '📝',
    docx: '📝',
    xls: '📊',
    xlsx: '📊',
  };
  return icons[ext] || '📎';
}

// ===== Verify Document =====
verifyBtn.addEventListener('click', async () => {
  if (!selectedFile) return;

  setLoading(verifyBtn, verifySpinner, verifyBtnText, true);
  verifyResult.classList.remove('visible');

  try {
    const formData = new FormData();
    formData.append('file', selectedFile);

    const response = await fetch('/api/v1/verify', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      showVerifyResult('error', data.error || 'Có lỗi xảy ra');
      return;
    }

    if (data.status === 'verified') {
      showVerifyResult('verified', data.message, {
        hash: data.documentHash,
        organization: data.organization,
        verifiedAt: new Date(data.verifiedAt).toLocaleString('vi-VN'),
        fileName: data.fileName,
      });
    } else {
      showVerifyResult('not_verified', data.message, {
        hash: data.documentHash,
        fileName: data.fileName,
      });
    }
  } catch (error) {
    showVerifyResult('error', 'Không thể kết nối tới server');
  } finally {
    setLoading(verifyBtn, verifySpinner, verifyBtnText, false);
  }
});

function showVerifyResult(type, message, details = {}) {
  let html = '';

  if (type === 'verified') {
    html = `
      <div class="result__card result__card--verified">
        <div class="result__header">
          <span class="result__icon">✅</span>
          <span class="result__status result__status--verified">${message}</span>
        </div>
        <div class="result__details">
          <div class="result__row">
            <span class="result__label">Tổ chức</span>
            <span class="result__value">${details.organization}</span>
          </div>
          <div class="result__row">
            <span class="result__label">Ngày chứng thực</span>
            <span class="result__value">${details.verifiedAt}</span>
          </div>
          <hr class="result__divider" />
          <div class="result__row">
            <span class="result__label">File</span>
            <span class="result__value">${details.fileName}</span>
          </div>
          <div class="result__row">
            <span class="result__label">Hash (keccak256)</span>
            <span class="result__value">${details.hash}</span>
          </div>
        </div>
      </div>
    `;
  } else if (type === 'not_verified') {
    html = `
      <div class="result__card result__card--not-verified">
        <div class="result__header">
          <span class="result__icon">⚠️</span>
          <span class="result__status result__status--not-verified">${message}</span>
        </div>
        <div class="result__details">
          <div class="result__row">
            <span class="result__label">File</span>
            <span class="result__value">${details.fileName}</span>
          </div>
          <div class="result__row">
            <span class="result__label">Hash (keccak256)</span>
            <span class="result__value">${details.hash}</span>
          </div>
        </div>
      </div>
    `;
  } else {
    html = `
      <div class="result__card result__card--error">
        <div class="result__header">
          <span class="result__icon">❌</span>
          <span class="result__status result__status--error">${message}</span>
        </div>
      </div>
    `;
  }

  verifyResult.innerHTML = html;
  verifyResult.classList.add('visible');
}

// ===== View Document =====
viewBtn.addEventListener('click', async () => {
  const accessCode = accessCodeInput.value.trim();
  if (!accessCode) return;

  setLoading(viewBtn, viewSpinner, viewBtnText, true);
  viewResult.classList.remove('visible');

  try {
    // Lấy token từ localStorage (nếu đã login)
    const token = localStorage.getItem('vf_token');

    if (!token) {
      showViewResult('error', 'Bạn cần đăng nhập để xem nội dung tài liệu');
      return;
    }

    const response = await fetch('/api/v1/view', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ access_code: accessCode }),
    });

    const data = await response.json();

    if (!response.ok) {
      showViewResult('error', data.error || 'Có lỗi xảy ra');
      return;
    }

    showViewResult('success', data.message, {
      hash: data.document.hash,
      fileName: data.document.fileName,
      organization: data.document.organization,
      verifiedAt: new Date(data.document.verifiedAt).toLocaleString('vi-VN'),
      viewUrl: data.viewUrl,
      expiresIn: data.expiresIn,
    });
  } catch (error) {
    showViewResult('error', 'Không thể kết nối tới server');
  } finally {
    setLoading(viewBtn, viewSpinner, viewBtnText, false);
  }
});

function showViewResult(type, message, details = {}) {
  let html = '';

  if (type === 'success') {
    html = `
      <div class="result__card result__card--view">
        <div class="result__header">
          <span class="result__icon">📄</span>
          <span class="result__status result__status--view">${message}</span>
        </div>
        <div class="result__details">
          <div class="result__row">
            <span class="result__label">Tài liệu</span>
            <span class="result__value">${details.fileName}</span>
          </div>
          <div class="result__row">
            <span class="result__label">Tổ chức</span>
            <span class="result__value">${details.organization}</span>
          </div>
          <div class="result__row">
            <span class="result__label">Chứng thực</span>
            <span class="result__value">${details.verifiedAt}</span>
          </div>
          <hr class="result__divider" />
          <div class="result__row">
            <span class="result__label">Hash</span>
            <span class="result__value">${details.hash}</span>
          </div>
          <div class="result__row">
            <span class="result__label">Hết hạn</span>
            <span class="result__value">${details.expiresIn}</span>
          </div>
        </div>
        <a href="${details.viewUrl}" target="_blank" rel="noopener" class="btn-view-link">
          📥 Xem tài liệu
        </a>
      </div>
    `;
  } else {
    html = `
      <div class="result__card result__card--error">
        <div class="result__header">
          <span class="result__icon">❌</span>
          <span class="result__status result__status--error">${message}</span>
        </div>
      </div>
    `;
  }

  viewResult.innerHTML = html;
  viewResult.classList.add('visible');
}

// ===== Helpers =====
function setLoading(btn, spinner, text, loading) {
  btn.disabled = loading;
  spinner.style.display = loading ? 'block' : 'none';
  text.textContent = loading
    ? 'Đang xử lý...'
    : btn.id === 'verifyBtn'
      ? 'Xác minh tài liệu'
      : 'Xem tài liệu';
}

// Update file icon on select
const observer = new MutationObserver(() => {
  const iconEl = document.getElementById('filePreviewIcon');
  if (selectedFile && iconEl) {
    iconEl.textContent = getFileIcon(selectedFile.name);
  }
});
