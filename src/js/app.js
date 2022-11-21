import i18next from 'i18next';
import * as yup from 'yup';
import onChange from 'on-change';
import { v4 as uuid } from 'uuid';
import axios from 'axios';
import initView from './view';
import resources from './locales/index';
import parser from './parsers/parser';

const validate = (form, visitedUrls) => {
  const schema = yup.object().shape({
    url: yup
      .string()
      .url('invalidUrl')
      .required()
      .notOneOf(visitedUrls, 'existingFeed'),
  });
  return schema.validate(form);
};

const routesHandlers = {
  getApiRoute: () => 'https://allorigins.hexlet.app/get?disableCache=true&url=',
  encode(url) {
    return encodeURIComponent(url);
  },
  buildRoute(url) {
    return `${this.getApiRoute()}${this.encode(url)}`;
  },
};

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

const makeRequest = (address) => {
  const route = routesHandlers.buildRoute(address);
  return axios.get(route)
    .then((response) => parser(response.data.contents))
    .catch((e) => {
      if (e.message === 'Network Error') {
        throw new Error('networkError');
      }
      throw e;
    });
};

const checkNewPosts = (state) => {
  const { length } = state.urls;
  const handler = () => {
    if (length !== state.urls.length) {
      return;
    }
    setTimeout(() => {
      Promise.all(state.urls.map(makeRequest))
        .then((responses) => {
          responses.forEach((response, index) => {
            const { id } = state.threads.feeds[index];
            state.threads.posts = addNewPosts(state.threads.posts, response, id);
          });
        })
        .catch((e) => {
          throw e;
        })
        .finally(() => {
          handler();
        });
    }, 5000);
  };
  handler();
};

export default () => {
  const defaultLanguage = 'ru';
  const initialState = {
    form: {
      url: '',
      valid: false,
    },
    UIState: {
      checkedPosts: [],
    },
    urls: [],
    threads: {
      posts: [],
      feeds: [],
    },
    processState: '',
    errors: null,
    currentRoute: '',
  };

  const elements = {
    input: document.querySelector('.form-control'),
    submit: document.querySelector('button[type="submit"]'),
    form: document.querySelector('.rss-form'),
    feedback: document.querySelector('.feedback'),
    posts: document.querySelector('.posts'),
    feeds: document.querySelector('.feeds'),
    modal: document.querySelector('.modal'),
  };

  const i18nextInstance = i18next.createInstance();

  i18nextInstance.init({
    lng: defaultLanguage,
    debug: false,
    resources,
  })
    .then(() => {
      const state = onChange(initialState, initView(elements, i18nextInstance, initialState));

      elements.input.addEventListener('input', (event) => {
        event.preventDefault();
        state.processState = 'filling';
        const { value } = event.target;
        state.form.url = value;
      });

      elements.form.addEventListener('submit', (event) => {
        event.preventDefault();
        state.processState = 'sending';
        const { urls } = state;
        validate(state.form, urls) // TODO: add aboutEarly: false, with second field in form!
          .then(() => makeRequest(state.form.url))
          .then((data) => {
            const id = uuid();
            state.threads.feeds = addNewFeed(state.threads.feeds, data, id);
            state.threads.posts = addNewPosts(state.threads.posts, data, id);
            state.urls = [...state.urls, state.form.url];
            state.errors = {};
            state.processState = 'success';
            state.form.valid = true;
            state.form.url = '';
            checkNewPosts(state);
          })
          .catch((e) => {
            state.form.valid = false;
            state.processState = 'error';
            state.errors = e;
          })
          .finally(() => {
            state.processState = 'filling';
            state.form.valid = false;
          });
      });
    })
    .catch(() => {
      throw new Error('Couldn\'t load i18 module!');
    });
};
