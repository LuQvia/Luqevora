(() => {
  'use strict';

  const RESULT_TYPE = 'luqevora-contact-result';
  const STATUS_TYPE = 'luqevora-contact-status';
  const ENDPOINT_PATTERN = /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/;
  const STATUS_NOTICE_MS = 45000;
  const STATUS_GIVE_UP_MS = 5 * 60 * 1000;
  const STATUS_REQUEST_TIMEOUT_MS = 10000;
  const MAX_POLL_INTERVAL_MS = 5000;

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
      pending: '送信データの受付確認に時間がかかっています。二重送信はせず、受付メールまたは管理者からの連絡をご確認ください。この画面では引き続き受付状況を確認します。',
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
      pending: 'Confirmation is taking longer than expected. Do not submit again. Please check for the acknowledgement email or a response from us. This page will continue checking the status.',
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
    try {
      const url = new URL(origin);
      if (url.protocol !== 'https:') return false;
      const host = url.hostname.toLowerCase();
      return host === 'script.google.com' ||
        host === 'script.googleusercontent.com' ||
        host.endsWith('.script.googleusercontent.com') ||
        host.endsWith('.googleusercontent.com');
    } catch (_error) {
      return false;
    }
  }

  function createSubmissionId() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      return window.crypto.randomUUID().replace(/-/g, '');
    }

    const values = new Uint32Array(4);
    if (window.crypto && typeof window.crypto.getRandomValues === 'function') {
      window.crypto.getRandomValues(values);
      return Array.from(values, (value) => value.toString(16).padStart(8, '0')).join('');
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

    try {
      status.focus({ preventScroll: false });
    } catch (_error) {
      status.focus();
    }
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
    if (formVersion) formVersion.value = String(getConfig().formVersion || '1.9.0');
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
    const field = textarea.closest('.form-field');
    const counter = field ? field.querySelector('[data-character-count]') : null;
    if (!counter) return;
    counter.textContent = String(textarea.value.length);
  }

  function initializeCounters(form) {
    form.querySelectorAll('textarea[maxlength]').forEach((textarea) => {
      updateCharacterCount(textarea);
      textarea.addEventListener('input', () => updateCharacterCount(textarea));
    });
  }

  function clearStatusRequest(form) {
    if (form.__statusRequestTimer) {
      window.clearTimeout(form.__statusRequestTimer);
      form.__statusRequestTimer = null;
    }
    if (form.__statusScript && form.__statusScript.parentNode) {
      form.__statusScript.parentNode.removeChild(form.__statusScript);
    }
    form.__statusScript = null;
    if (form.__statusCallbackName) {
      try { delete window[form.__statusCallbackName]; } catch (_error) { window[form.__statusCallbackName] = undefined; }
    }
    form.__statusCallbackName = '';
  }

  function stopStatusPolling(form) {
    if (form.__statusPollTimer) {
      window.clearTimeout(form.__statusPollTimer);
      form.__statusPollTimer = null;
    }
    clearStatusRequest(form);
  }

  function completeSuccess(form, referenceNumber) {
    if (form.dataset.resultHandled === 'true') return;
    form.dataset.resultHandled = 'true';
    stopStatusPolling(form);
    setSubmitting(form, false);

    const lang = getLanguage(form);
    const followUp = `${messages[lang].success} ${messages[lang].followUp}`;
    setStatus(form, 'success', followUp, referenceNumber || '');

    window.dispatchEvent(new CustomEvent('luqevora:contact_success', {
      detail: {
        language: lang,
        inquiry_type: form.querySelector('[name="inquiryType"]')?.value || ''
      }
    }));

    form.reset();
    updateConditionalFields(form);
    resetSubmissionIdentity(form);
    updatePageMetadata(form);
    form.dataset.pendingSubmissionId = '';
    form.querySelectorAll('textarea[maxlength]').forEach(updateCharacterCount);
  }

  function completeError(form, errorCode) {
    if (form.dataset.resultHandled === 'true') return;
    form.dataset.resultHandled = 'true';
    stopStatusPolling(form);
    setSubmitting(form, false);

    const lang = getLanguage(form);
    const errorMessage = errorCode === 'RATE_LIMIT'
      ? messages[lang].rateLimit
      : errorCode === 'VALIDATION'
        ? messages[lang].validation
        : messages[lang].failed;
    setStatus(form, 'error', errorMessage);
  }

  function handleResult(form, data) {
    if (!data || data.type !== RESULT_TYPE) return false;
    if (String(data.submissionId || '') !== String(form.dataset.pendingSubmissionId || '')) return false;
    if (data.success) completeSuccess(form, data.referenceNumber || '');
    else completeError(form, data.errorCode || 'SERVER');
    return true;
  }

  function nextPollDelay(attempt) {
    return Math.min(700 + (attempt * 450), MAX_POLL_INTERVAL_MS);
  }

  function scheduleStatusPoll(form, endpoint, submissionId, startedAt, attempt) {
    if (form.dataset.resultHandled === 'true' || form.dataset.pendingSubmissionId !== submissionId) return;
    const elapsed = Date.now() - startedAt;
    if (elapsed >= STATUS_GIVE_UP_MS) {
      stopStatusPolling(form);
      setSubmitting(form, false);
      return;
    }

    if (elapsed >= STATUS_NOTICE_MS && form.dataset.pendingNoticeShown !== 'true') {
      form.dataset.pendingNoticeShown = 'true';
      setStatus(form, 'warning', messages[getLanguage(form)].pending);
    }

    form.__statusPollTimer = window.setTimeout(() => {
      pollSubmissionStatus(form, endpoint, submissionId, startedAt, attempt + 1);
    }, nextPollDelay(attempt));
  }

  function pollSubmissionStatus(form, endpoint, submissionId, startedAt, attempt) {
    if (form.dataset.resultHandled === 'true' || form.dataset.pendingSubmissionId !== submissionId) return;
    clearStatusRequest(form);

    const callbackName = `__luqevoraContactStatus_${submissionId}_${attempt}`;
    const script = document.createElement('script');
    const url = new URL(endpoint);
    url.searchParams.set('action', 'status');
    url.searchParams.set('submissionId', submissionId);
    url.searchParams.set('callback', callbackName);
    url.searchParams.set('_', String(Date.now()));

    let settled = false;
    const finishRequest = (payload) => {
      if (settled) return;
      settled = true;
      clearStatusRequest(form);

      if (payload && payload.type === STATUS_TYPE && String(payload.submissionId || '') === submissionId) {
        if (payload.found && payload.referenceNumber) {
          completeSuccess(form, payload.referenceNumber);
          return;
        }
        if (payload.final && payload.errorCode) {
          completeError(form, payload.errorCode);
          return;
        }
      }

      scheduleStatusPoll(form, endpoint, submissionId, startedAt, attempt);
    };

    window[callbackName] = (payload) => finishRequest(payload);
    script.async = true;
    script.src = url.toString();
    script.onerror = () => finishRequest(null);
    form.__statusCallbackName = callbackName;
    form.__statusScript = script;
    form.__statusRequestTimer = window.setTimeout(() => finishRequest(null), STATUS_REQUEST_TIMEOUT_MS);
    document.head.appendChild(script);
  }

  function beginStatusPolling(form, endpoint, submissionId) {
    stopStatusPolling(form);
    const startedAt = Date.now();
    form.dataset.pendingNoticeShown = 'false';
    form.__statusPollTimer = window.setTimeout(() => {
      pollSubmissionStatus(form, endpoint, submissionId, startedAt, 0);
    }, 600);
  }

  function initializeForm(form) {
    const lang = getLanguage(form);
    const config = getConfig();
    const endpoint = String(config.endpoint || '').trim();
    const configured = isConfiguredEndpoint(endpoint);
    const submitButton = form.querySelector('.form-submit');

    form.dataset.configured = configured ? 'true' : 'false';
    form.action = configured ? endpoint : '';
    form.dataset.submitting = 'false';
    form.dataset.resultHandled = 'false';

    updatePageMetadata(form);
    resetSubmissionIdentity(form);
    updateConditionalFields(form);
    initializeCounters(form);

    if (submitButton) submitButton.disabled = !configured;
    if (!configured) setStatus(form, 'warning', messages[lang].notConfigured);

    const typeSelect = form.querySelector('[name="inquiryType"]');
    if (typeSelect) typeSelect.addEventListener('change', () => updateConditionalFields(form));

    let contactStartTracked = false;
    const trackContactStart = () => {
      if (contactStartTracked) return;
      contactStartTracked = true;
      window.dispatchEvent(new CustomEvent('luqevora:contact_start', {
        detail: {
          language: lang,
          inquiry_type: form.querySelector('[name="inquiryType"]')?.value || ''
        }
      }));
    };
    form.addEventListener('input', trackContactStart, { once: true });
    form.addEventListener('change', trackContactStart, { once: true });

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

      const submissionIdField = form.querySelector('[name="submissionId"]');
      const submissionId = submissionIdField ? submissionIdField.value : '';
      if (!submissionId) {
        resetSubmissionIdentity(form);
      }

      const pendingId = form.querySelector('[name="submissionId"]')?.value || '';
      form.dataset.pendingSubmissionId = pendingId;
      form.dataset.resultHandled = 'false';
      setSubmitting(form, true);
      setStatus(form, 'sending', messages[lang].sending);
      beginStatusPolling(form, endpoint, pendingId);

      try {
        HTMLFormElement.prototype.submit.call(form);
      } catch (_error) {
        completeError(form, 'SERVER');
      }
    });

    window.addEventListener('message', (event) => {
      if (!isAllowedResultOrigin(event.origin)) return;
      handleResult(form, event.data);
    });
  }

  document.querySelectorAll('[data-contact-form]').forEach(initializeForm);
})();
