(() => {
  'use strict';

  const RESULT_TYPE = 'luqevora-contact-result';
  const SUBMIT_TIMEOUT_MS = 30000;
  const ENDPOINT_PATTERN = /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/;

  const messages = {
    ja: {
      notConfigured: 'お問い合わせフォームは現在準備中です。info@luqevora.com へメールでお問い合わせください。',
      sending: '送信しています。画面を閉じずにお待ちください。',
      success: 'お問い合わせを受け付けました。',
      reference: '受付番号',
      followUp: '内容を確認のうえ、必要に応じてご連絡します。',
      validation: '未入力または入力形式に誤りがある項目をご確認ください。',
      rateLimit: '短時間に複数回送信されています。少し時間を空けてから再度お試しください。',
      failed: '送信を完了できませんでした。時間を空けて再度お試しいただくか、info@luqevora.com へメールでお問い合わせください。',
      timeout: '送信結果を確認できませんでした。二重送信を避けるため、少し待ってから受付メールをご確認ください。',
      directEmail: 'フォームを利用できない場合：info@luqevora.com',
      countUnit: '文字'
    },
    en: {
      notConfigured: 'The contact form is not currently available. Please email info@luqevora.com.',
      sending: 'Submitting your inquiry. Please keep this page open.',
      success: 'Your inquiry has been received.',
      reference: 'Reference number',
      followUp: 'We will review your message and respond where appropriate.',
      validation: 'Please review the required fields and input formats.',
      rateLimit: 'Multiple submissions were detected in a short period. Please wait before trying again.',
      failed: 'We could not complete the submission. Please try again later or email info@luqevora.com.',
      timeout: 'We could not confirm the result. To avoid a duplicate submission, please wait and check for a confirmation email.',
      directEmail: 'If the form is unavailable: info@luqevora.com',
      countUnit: 'characters'
    }
  };

  const conditionalRules = Object.freeze({
    general: [],
    correction: ['correction'],
    product: ['product'],
    partnership: ['partnership'],
    technical: ['technical'],
    privacy: ['privacy'],
    legal: ['legal'],
    security: ['security'],
    media: ['media'],
    other: []
  });

  const organizationRequiredTypes = new Set(['product', 'partnership', 'media']);

  function getLanguage(form) {
    return form.getAttribute('lang') === 'en' ? 'en' : 'ja';
  }

  function getConfig() {
    return window.LUQEVORA_CONTACT_FORM || {};
  }

  function isConfiguredEndpoint(endpoint) {
    return ENDPOINT_PATTERN.test(String(endpoint || '').trim());
  }


  function isAllowedResultOrigin(origin) {
    return origin === 'https://script.google.com' || origin === 'https://script.googleusercontent.com';
  }

  function createSubmissionId() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      return window.crypto.randomUUID().replace(/-/g, '');
    }

    const random = Math.random().toString(36).slice(2);
    return `${Date.now().toString(36)}${random}${random}`.slice(0, 32);
  }

  function setStatus(form, state, text, referenceNumber) {
    const status = form.querySelector('[data-form-status]');
    if (!status) return;

    status.className = 'form-status';
    status.textContent = '';

    if (!text) return;

    status.classList.add(`form-status-${state}`);
    const message = document.createElement('span');
    message.textContent = text;
    status.appendChild(message);

    if (referenceNumber) {
      const lang = getLanguage(form);
      const ref = document.createElement('strong');
      ref.className = 'form-status-reference';
      ref.textContent = `${messages[lang].reference}: ${referenceNumber}`;
      status.appendChild(ref);
    }

    status.focus({ preventScroll: false });
  }

  function setSubmitting(form, submitting) {
    form.setAttribute('aria-busy', submitting ? 'true' : 'false');
    form.dataset.submitting = submitting ? 'true' : 'false';
    const button = form.querySelector('.form-submit');
    if (button) button.disabled = submitting || form.dataset.configured !== 'true';
  }

  function resetSubmissionIdentity(form) {
    const submissionId = form.querySelector('[name="submissionId"]');
    const startedAt = form.querySelector('[name="startedAt"]');
    if (submissionId) submissionId.value = createSubmissionId();
    if (startedAt) startedAt.value = String(Date.now());
  }

  function updatePageMetadata(form) {
    const pageUrl = form.querySelector('[name="pageUrl"]');
    const pageOrigin = form.querySelector('[name="pageOrigin"]');
    const formVersion = form.querySelector('[name="formVersion"]');
    if (pageUrl) pageUrl.value = window.location.href;
    if (pageOrigin) pageOrigin.value = window.location.origin;
    if (formVersion) formVersion.value = String(getConfig().formVersion || '1.6.0');
  }

  function setConditionalState(group, visible) {
    group.hidden = !visible;
    group.setAttribute('aria-hidden', visible ? 'false' : 'true');

    group.querySelectorAll('input, select, textarea').forEach((field) => {
      field.disabled = !visible;
      const shouldRequire = field.hasAttribute('data-required-when-visible');
      field.required = visible && shouldRequire;
    });
  }

  function updateOrganizationRequirement(form, inquiryType) {
    const organization = form.querySelector('[name="organization"]');
    const marker = form.querySelector('[data-organization-required]');
    const required = organizationRequiredTypes.has(inquiryType);

    if (organization) organization.required = required;
    if (marker) marker.hidden = !required;
  }

  function updateConditionalFields(form) {
    const select = form.querySelector('[name="inquiryType"]');
    const type = select ? select.value : '';
    const activeGroups = new Set(conditionalRules[type] || []);

    form.querySelectorAll('[data-conditional-group]').forEach((group) => {
      setConditionalState(group, activeGroups.has(group.dataset.conditionalGroup));
    });

    updateOrganizationRequirement(form, type);
  }

  function updateCharacterCount(textarea) {
    const counter = textarea.closest('.form-field')?.querySelector('[data-character-count]');
    if (!counter) return;
    counter.textContent = String(textarea.value.length);
  }

  function initializeCounters(form) {
    form.querySelectorAll('textarea[maxlength]').forEach((textarea) => {
      updateCharacterCount(textarea);
      textarea.addEventListener('input', () => updateCharacterCount(textarea));
    });
  }

  function initializeForm(form) {
    const lang = getLanguage(form);
    const config = getConfig();
    const endpoint = String(config.endpoint || '').trim();
    const configured = isConfiguredEndpoint(endpoint);
    const submitButton = form.querySelector('.form-submit');
    const iframe = document.getElementsByName(form.target)[0] || null;

    form.dataset.configured = configured ? 'true' : 'false';
    form.action = configured ? endpoint : '';
    form.dataset.submitting = 'false';

    updatePageMetadata(form);
    resetSubmissionIdentity(form);
    updateConditionalFields(form);
    initializeCounters(form);

    if (submitButton) submitButton.disabled = !configured;
    if (!configured) setStatus(form, 'warning', messages[lang].notConfigured);

    const typeSelect = form.querySelector('[name="inquiryType"]');
    if (typeSelect) typeSelect.addEventListener('change', () => updateConditionalFields(form));

    form.addEventListener('submit', (event) => {
      event.preventDefault();

      if (form.dataset.submitting === 'true') return;
      updateConditionalFields(form);
      updatePageMetadata(form);

      if (!configured) {
        setStatus(form, 'warning', messages[lang].notConfigured);
        return;
      }

      if (!form.checkValidity()) {
        form.reportValidity();
        setStatus(form, 'error', messages[lang].validation);
        return;
      }

      setSubmitting(form, true);
      setStatus(form, 'sending', messages[lang].sending);

      const submissionId = form.querySelector('[name="submissionId"]')?.value || '';
      form.dataset.pendingSubmissionId = submissionId;

      window.clearTimeout(form.__contactTimeout);
      form.__contactTimeout = window.setTimeout(() => {
        if (form.dataset.submitting !== 'true') return;
        setSubmitting(form, false);
        setStatus(form, 'warning', messages[lang].timeout);
      }, SUBMIT_TIMEOUT_MS);

      HTMLFormElement.prototype.submit.call(form);
    });

    window.addEventListener('message', (event) => {
      if (!iframe || event.source !== iframe.contentWindow) return;
      if (!isAllowedResultOrigin(event.origin)) return;
      const data = event.data;
      if (!data || data.type !== RESULT_TYPE) return;
      if (String(data.submissionId || '') !== String(form.dataset.pendingSubmissionId || '')) return;

      window.clearTimeout(form.__contactTimeout);
      setSubmitting(form, false);

      if (data.success) {
        const followUp = `${messages[lang].success} ${messages[lang].followUp}`;
        setStatus(form, 'success', followUp, data.referenceNumber || '');
        form.reset();
        updateConditionalFields(form);
        resetSubmissionIdentity(form);
        updatePageMetadata(form);
        form.dataset.pendingSubmissionId = '';
        form.querySelectorAll('textarea[maxlength]').forEach(updateCharacterCount);
        return;
      }

      const errorMessage = data.errorCode === 'RATE_LIMIT'
        ? messages[lang].rateLimit
        : data.errorCode === 'VALIDATION'
          ? messages[lang].validation
          : messages[lang].failed;
      setStatus(form, 'error', errorMessage);
    });
  }

  document.querySelectorAll('[data-contact-form]').forEach(initializeForm);
})();
