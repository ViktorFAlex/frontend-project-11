import i18next from 'i18next';
import * as yup from 'yup';
import onChange from 'on-change';
import { v4 as uuid } from 'uuid';
import axios from 'axios';
import initView from './view';
import { parser, resources, RouteHandler } from './modules/index';

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
  const routeHandler = new RouteHandler(address);
  return axios.get(routeHandler.buildRoute())
    .then((response) => parser(response.data.contents))
    .catch((e) => {
      if (e.message === 'Network Error') {
        throw new Error('networkError');
      }
      throw e;
    });
};

const checkNewPosts = (state) => {
  const handler = () => {
    setTimeout(() => {
      Promise.allSettled(state.urls.map((url, index) => makeRequest(url)
        .then((data) => {
          const { id } = state.threads.feeds[index];
          state.threads.posts = addNewPosts(state.threads.posts, data, id);
        })
        .catch((e) => {
          throw e;
        })))
        .then(() => {
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
    processState: 'pending',
    error: null,
    message: '',
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
      checkNewPosts(state);

      elements.input.addEventListener('input', (event) => {
        event.preventDefault();
        state.processState = 'filling';
        const { value } = event.target;
        state.form.url = value;
      });

      elements.form.addEventListener('submit', (event) => {
        event.preventDefault();
        state.processState = 'sending';
        const { form, urls } = state;
        validate(form, urls) // TODO: add aboutEarly: false, with second field in form!
          .then(() => makeRequest(form.url))
          .then((data) => {
            const id = uuid();
            state.threads.feeds = addNewFeed(state.threads.feeds, data, id);
            state.threads.posts = addNewPosts(state.threads.posts, data, id);
            state.urls = [...urls, form.url];
            state.error = null;
            state.processState = 'success';
            state.message = 'added';
            form.valid = true;
            form.url = '';
          })
          .catch((e) => {
            form.valid = false;
            state.processState = 'error';
            state.error = e;
          })
          .finally(() => {
            state.processState = 'pending';
            form.valid = false;
          });
      });
    })
    .catch(() => {
      throw new Error('Couldn\'t load i18 module!');
    });
};
