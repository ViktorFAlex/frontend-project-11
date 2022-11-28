import i18next from 'i18next';
import * as yup from 'yup';
import onChange from 'on-change';
import { v4 as uuid } from 'uuid';
import axios from 'axios';
import initView from './view';
import { parser, resources, buildRoute } from './modules/index';

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

const addNewFeed = (feeds, parsedData, id, url) => {
  const { feed } = parsedData;
  return [...feeds, { ...feed, id, url }];
};

const addNewPosts = (oldPosts, parsedData, id) => {
  const { posts } = parsedData;
  const startingIndex = oldPosts.length;
  const newPosts = posts
    .filter((post) => oldPosts
      .every((oldPost) => {
        const { title } = post;
        const { title: oldTitle, feedId } = oldPost;
        return id !== feedId || oldTitle !== title;
      }))
    .map((newPost, index) => {
      const { title, description, link } = newPost;
      const postId = startingIndex + index;
      return {
        feedId: id, title, description, link, postId,
      };
    });
  return [...newPosts, ...oldPosts];
};

const makeRequest = (address) => {
  const route = buildRoute(address);
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
  const handler = () => {
    const { threads: { feeds } } = state;
    const feedsUrls = feeds.map(({ url }) => url);
    setTimeout(() => {
      Promise.allSettled(feedsUrls.map((url, index) => makeRequest(url)
        .then((data) => {
          const { id } = feeds[index];
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
      modal: {
        show: false,
        currentId: null,
      },
    },
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

      elements.modal.addEventListener('show.bs.modal', (e) => {
        const { id } = e.relatedTarget.dataset;
        state.UIState.modal.currentId = id;
        state.UIState.modal.show = true;
      });

      elements.modal.addEventListener('hide.bs.modal', () => {
        state.UIState.modal.show = false;
      });

      elements.input.addEventListener('input', (event) => {
        event.preventDefault();
        state.processState = 'filling';
        const { value } = event.target;
        state.form.url = value;
      });

      elements.form.addEventListener('submit', (event) => {
        event.preventDefault();
        state.processState = 'sending';
        const { form, threads } = state;
        const urls = threads.feeds.map(({ url }) => url);
        validate(form, urls) // TODO: add aboutEarly: false, with second field in form!
          .then(() => makeRequest(form.url))
          .then((data) => {
            const id = uuid();
            threads.feeds = addNewFeed(threads.feeds, data, id, form.url);
            threads.posts = addNewPosts(threads.posts, data, id);
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
    .catch((e) => {
      throw e;
    });
};
