import 'bootstrap';

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

const createNewListLink = (link, title, postId, isChecked) => {
  const a = document.createElement('a');
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
  return a;
};

const createNewListButton = (postId, i18n) => {
  const button = document.createElement('button');
  button.classList.add(...classLists.button);
  button.setAttribute('type', 'button');
  button.textContent = i18n.t('textContents.show');
  Object.assign(button.dataset, {
    id: postId,
    bsToggle: 'modal',
    bsTarget: '#modal',
  });
  return button;
};

const createNewListItem = (anchor, button) => {
  const li = document.createElement('li');
  li.classList.add(...classLists.liDefault, ...classLists.liPosts);
  li.append(anchor, button);
  return li;
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
    const isChecked = checked.some(({ id }) => id === postId);
    const a = createNewListLink(link, title, postId, isChecked);
    const button = createNewListButton(postId, i18n);
    [a, button].forEach((el) => el.addEventListener('click', () => {
      if (!isChecked) {
        checked.push({ id: postId, checked: true });
      }
      makeLinkVisited(el);
    }));
    button.addEventListener('click', () => {
      const modalTitle = modal.querySelector('.modal-title');
      const modalBody = modal.querySelector('.modal-body');
      modalTitle.textContent = title;
      modalBody.textContent = description;
      modal.show();
    });

    const li = createNewListItem(a, button);
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

const handleErrors = (elements, error, i18n) => {
  const { message } = error;
  if (!message) return;
  const { feedback } = elements;
  feedback.textContent = i18n.t(`messages.${message}`);
};

const addNewFeedHandler = () => (elements, state, i18n) => {
  const { feedback } = elements;
  const { message } = state;
  feedback.textContent = i18n.t(`messages.${message}`);
};

const handleNewFeed = addNewFeedHandler();

const handleProcessState = (elements, processState) => {
  switch (processState) {
    case ('filling'):
    case ('pending'):
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
    case ('message'):
      break;
    case ('form.valid'):
      if (!value) {
        break;
      }
      handleNewFeed(elements, state, i18n);
      break;
    case ('threads.posts'):
      renderNewPosts(elements, value, state.UIState.checkedPosts, i18n);
      break;
    case ('threads.feeds'):
      renderNewFeed(elements.feeds, value, i18n);
      break;
    case ('error'):
      handleErrors(elements, value, i18n);
      break;
    case ('processState'):
      handleProcessState(elements, value);
      break;
    default:
      throw new Error(`Unexpected path: ${path}`);
  }
};

export default initView;
