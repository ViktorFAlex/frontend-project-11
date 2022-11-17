import i18next from 'i18next';
import * as yup from 'yup';
import onChange from 'on-change';
import { v4 as uuid } from 'uuid';
import axios from 'axios';
import initView from './view';
import resources from './locales/index';
import parser from './parsers/parser';

const schema = yup.object().shape({
  url: yup
    .string()
    .url('invalidUrl')
    .required()
    .test('unique', 'existingFeed', (value, { options }) => {
      const { urls } = options;
      return !urls.includes(value);
    }),
});

const addNewFeed = (feeds, doc, id) => {
  const title = doc.querySelector('channel > title').textContent;
  const description = doc.querySelector('channel > description').textContent;
  const newFeed = { title, description, id };
  return [...feeds, newFeed];
};

const addNewPosts = (posts, doc, id) => {
  const items = doc.querySelectorAll('item');
  const startingIndex = posts.length;
  const newPosts = [...items]
    .filter((item) => posts
      .every((post) => {
        const itemTitleText = item.querySelector('title').textContent;
        const postTitleText = post.title;
        return id !== post.feedId || itemTitleText !== postTitleText;
      }))
    .map((newItem, index) => {
      const title = newItem.querySelector('title').textContent;
      const description = newItem.querySelector('description').textContent;
      const link = newItem.querySelector('link').textContent;
      const postId = startingIndex + index;
      return {
        feedId: id, title, description, link, postId,
      };
    });
  return [...newPosts, ...posts];
};

const makeRequest = (address) => axios.get(address)
  .then((response) => parser(response.data.contents))
  .catch((e) => {
    if (e.message === 'Network Error') {
      throw new Error('networkError');
    }
    throw e;
  });

const checkNewPosts = (address, state, id) => {
  const handler = () => {
    setTimeout(() => {
      makeRequest(address)
        .then((data) => {
          state.threads.posts = addNewPosts(state.threads.posts, data, id);
        })
        .catch((e) => {
          throw e;
        })
        .finally(() => handler());
    }, 5000);
  };
  handler();
};

export default () => {
  const defaultLanguage = 'ru';
  const initInput = '';
  const initMessage = null;
  const initProcessState = 'filling';
  const defaultRoute = '';
  const initialState = {
    form: {
      url: initInput,
    },
    UIState: {
      checkedPosts: [],
    },
    urls: [],
    threads: {
      posts: [],
      feeds: [],
    },
    processState: initProcessState,
    errors: {},
    message: initMessage,
    currentRoute: defaultRoute,
  };

  const i18nextInstance = i18next.createInstance();

  i18nextInstance.init({
    lng: defaultLanguage,
    debug: false,
    resources,
  });

  const elements = {
    input: document.querySelector('.form-control'),
    submit: document.querySelector('button[type="submit"]'),
    form: document.querySelector('.rss-form'),
    feedback: document.querySelector('.feedback'),
    posts: document.querySelector('.posts'),
    feeds: document.querySelector('.feeds'),
    modal: document.querySelector('.modal'),
  };

  const state = onChange(initialState, initView(elements, i18nextInstance, initialState));

  elements.input.addEventListener('input', (event) => {
    event.preventDefault();
    state.processState = 'filling';
    const { value } = event.target;
    state.form.url = value;
  });

  const routesHandlers = {
    getApiRoute: () => 'https://allorigins.hexlet.app/get?disableCache=true&url=',
    encode(url) {
      return encodeURIComponent(url);
    },
    buildRoute(url) {
      return `${this.getApiRoute()}${this.encode(url)}`;
    },
  };

  elements.form.addEventListener('submit', (event) => {
    event.preventDefault();
    state.processState = 'sending';
    const { urls } = state;
    schema.validate(state.form, { urls }) // TODO: add aboutEarly: false, with second field in form!
      .then(() => {
        state.currentRoute = routesHandlers.buildRoute(state.form.url);
        return makeRequest(state.currentRoute);
      })
      .then((data) => {
        const id = uuid();
        state.threads.feeds = addNewFeed(state.threads.feeds, data, id);
        state.threads.posts = addNewPosts(state.threads.posts, data, id);
        state.urls = [...state.urls, state.form.url];
        state.processState = 'success';
        state.message = 'added';
        state.form.url = initInput;
        checkNewPosts(state.currentRoute, state, id);
      })
      .catch((e) => {
        state.processState = 'error';
        state.message = e.message;
      })
      .finally(() => {
        state.processState = 'filling';
        state.message = initMessage;
      });
  });
};
