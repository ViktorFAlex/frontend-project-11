const resetFeedback = (elements) => {
  const { feedback, input } = elements;
  if (input.classList.contains('is-invalid')) {
    input.classList.remove('is-invalid');
  }
  if (feedback.classList.contains('text-danger')) {
    feedback.classList.remove('text-danger');
  }
  if (feedback.classList.contains('text-success')) {
    feedback.classList.remove('text-success');
  }
};

const handleMessage = (elements, message, i18n) => {
  if (!message) return;
  const { feedback } = elements;
  feedback.textContent = i18n.t(message);
};

const handleProcessState = (elements, processState) => {
  switch (processState) {
    case ('filling'):
      elements.input.disabled = false;
      elements.submit.disabled = false;
      break;
    case ('sending'):
      resetFeedback(elements);
      elements.input.disabled = true;
      elements.submit.disabled = true;
      break;
    case ('success'):
      elements.feedback.classList.add('text-success');
      elements.form.reset();
      elements.form.focus();
      break;
    case ('error'):
      elements.feedback.classList.add('text-danger');
      elements.input.classList.add('is-invalid');
      break;
    default:
      break;
  }
};

const initView = (elements, i18n) => (path, value) => {
  switch (path) {
    case ('form.url'):
    case ('feeds'):
      break;
    case ('message'):
      handleMessage(elements, value, i18n);
      break;
    case ('processState'):
      handleProcessState(elements, value);
      break;
    default:
      throw new Error(`Unexpected path: ${path}`);
  }
};

export default initView;
