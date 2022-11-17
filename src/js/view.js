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
  feedback.textContent = '';
};

const classLists = {
  card: ['card', 'border-0'],
  cardBody: ['card-body'],
  h2: ['card-title', 'h4'],
  ul: ['list-group', 'border-0', 'rounded-0'],
  liDefault: ['list-group-item', 'border-0', 'border-end-0'],
  liPosts: ['d-flex', 'justify-content-between', 'align-items-start'],
  aUnvisited: ['fw-bold'],
  aVisited: ['fw-normal', 'link-secondary'],
  button: ['btn', 'btn-outline-primary', 'btn-sm'],
};

const attributesForModal = {
  body: {
    class: 'modal-open',
    style: 'overflow: hidden; padding-right: 17px',
  },
  modalShow: {
    class: 'show',
    style: 'display: block',
    'aria-modal': true,
    role: 'dialog',
  },
  modalHide: {
    style: 'display-none',
    'aria-hidden': true,
  },
};

const generateContainers = () => {
  const elements = {
    card: document.createElement('div'),
    cardBody: document.createElement('div'),
    h2: document.createElement('h2'),
    ul: document.createElement('ul'),
  };
  return Object.entries(elements).map(([name, tag]) => {
    tag.classList.add(...classLists[name]);
    return tag;
  });
};

const makeLinkVisited = (element) => {
  const linkElement = element.parentNode.querySelector('a');
  linkElement.className = '';
  linkElement.classList.add(...classLists.aVisited);
};

const addModalAttributes = (element, attributes) => {
  attributes.forEach(([attr, value]) => {
    if (attr === 'class') {
      element.classList.add(value);
    } else {
      element.setAttribute(attr, value);
    }
  });
};

const removeModalAttribues = (element, attributes) => {
  attributes.forEach(([attr, value]) => {
    if (attr === 'class') {
      element.classList.remove(value);
    } else {
      element.removeAttribute(attr, value);
    }
  });
};

const hideModal = (modal) => {
  const body = modal.parentNode;
  const bodyAttributes = Object.entries(attributesForModal.body);
  removeModalAttribues(body, bodyAttributes);
  const currentModalAttributes = Object.entries(attributesForModal.modalShow);
  const futureModalAttribues = Object.entries(attributesForModal.modalHide);
  removeModalAttribues(modal, currentModalAttributes);
  addModalAttributes(modal, futureModalAttribues);
};

const showModal = (modal, title, description, link) => {
  const body = modal.parentNode;
  const bodyAttributes = Object.entries(attributesForModal.body);
  addModalAttributes(body, bodyAttributes);
  modal.removeAttribute('aria-hidden');
  const modalAttributes = Object.entries(attributesForModal.modalShow);
  addModalAttributes(modal, modalAttributes);
  const modalTitle = modal.querySelector('.modal-title');
  modalTitle.textContent = title;
  const modalBody = modal.querySelector('.modal-body');
  modalBody.textContent = description;
  const linkElement = modal.querySelector('a');
  linkElement.setAttribute('href', link);
  const buttons = modal.querySelectorAll('button');
  buttons.forEach((btn) => btn.addEventListener('click', () => hideModal(modal)), { once: true });
};

const renderNewPosts = (elements, newPosts, checked, i18n) => {
  const { posts, modal } = elements;
  posts.innerHTML = '';
  const [card, cardBody, h2, ul] = generateContainers();
  h2.textContent = i18n.t('textContents.postsHeader');
  cardBody.append(h2);
  newPosts.forEach((post) => {
    const {
      title, description, link, postId,
    } = post;
    const li = document.createElement('li');
    li.classList.add(...classLists.liDefault, ...classLists.liPosts);
    const a = document.createElement('a');
    const button = document.createElement('button');
    const isChecked = checked.some(({ id }) => id === postId);
    if (isChecked) {
      a.classList.add(...classLists.aVisited);
    } else {
      a.classList.add(...classLists.aUnvisited);
    }
    Object.assign(a, {
      href: link,
      target: '_blank',
      rel: 'noopener noreferrer',
      textContent: title,
    });
    a.dataset.id = postId;
    button.classList.add(...classLists.button);
    button.setAttribute('type', 'button');
    button.textContent = i18n.t('textContents.show');
    Object.assign(button.dataset, {
      id: postId,
      bsToggle: 'modal',
      bsTarget: '#modal',
    });
    [a, button].forEach((el) => el.addEventListener('click', () => {
      if (!isChecked) {
        checked.push({ id: postId, checked: true });
      }
      makeLinkVisited(el);
    }));
    button.addEventListener('click', () => showModal(modal, title, description, link));
    li.append(a, button);
    ul.append(li);
  });
  card.append(cardBody, ul);
  posts.append(card);
};

const renderNewFeed = (container, feeds, i18n) => {
  container.innerHTML = '';
  const [card, cardBody, h2, ul] = generateContainers();
  h2.textContent = i18n.t('textContents.feedsHeader');
  cardBody.append(h2);
  feeds.forEach((feed) => {
    const li = document.createElement('li');
    li.classList.add('list-group-item', 'border-0', 'border-end-0');
    const h3 = document.createElement('h3');
    h3.classList.add('h6', 'm-0');
    h3.textContent = feed.title;
    const p = document.createElement('p');
    p.classList.add('m-0', 'small', 'text-black-50');
    p.textContent = feed.description;
    li.append(h3, p);
    ul.append(li);
  });
  card.append(cardBody, ul);
  container.append(card);
};

const handleMessage = (elements, message, i18n) => {
  if (!message) return;
  const { feedback } = elements;
  feedback.textContent = i18n.t(`messages.${message}`);
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
      throw new Error(`Unexpected process state: ${processState}!`);
  }
};

const initView = (elements, i18n, state) => (path, value) => {
  switch (path) {
    case ('form.url'):
    case ('urls'):
    case ('currentRoute'):
    case ('UIState.checkedPosts'):
      break;
    case ('threads.posts'):
      renderNewPosts(elements, value, state.UIState.checkedPosts, i18n);
      break;
    case ('threads.feeds'):
      renderNewFeed(elements.feeds, value, i18n);
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
