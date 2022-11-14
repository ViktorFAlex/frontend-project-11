const handleNewFeed = (elements) => {
  const {
    input, feedback, submit, form,
  } = elements;
  feedback.textContent = 'RSS успешно загружен';
  feedback.classList.add('text-success');
  input.disabled = false;
  submit.disabled = false;
  form.reset();
  form.focus();
};

const resetFeedback = (elements) => {
  const { feedback, input } = elements;
  if (input.classList.contains('is-invalid')) {
    feedback.classList.remove('is-invalid');
  }
  if (feedback.classList.contains('text-danger')) {
    feedback.classList.remove('text-danger');
  }
  if (feedback.classList.contains('text-success')) {
    feedback.classList.remove('text-success');
  }
};

const handleError = (elements, errorMessage) => {
  if (!errorMessage) return;
  const { input, feedback } = elements;
  resetFeedback(elements);
  feedback.textContent = errorMessage;
  input.classList.add('is-invalid');
  feedback.classList.add('text-danger');
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
      handleNewFeed(elements);
      break;
    default:
      break;
  }
};

const initView = (elements) => (path, value) => {
  switch (path) {
    case ('form.url'):
    case ('feeds'):
      break;
    case ('error'):
      handleError(elements, value);
      break;
    case ('processState'):
      handleProcessState(elements, value);
      break;
    default:
      throw new Error(`Unexpected path: ${path}`);
  }
};

export default initView;
