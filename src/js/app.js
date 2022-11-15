import i18next from 'i18next';
import * as yup from 'yup';
import onChange from 'on-change';
import initView from './view';
import resources from '../locales/index';

const schema = yup.object().shape({
  url: yup
    .string()
    .matches(/^(http:|https:)\S+(\.rss)$/m, 'invalidUrl') //  possible replacement: url()
    .required()
    .test('unique', 'existingFeed', (value, { options }) => {
      const { feeds } = options;
      return !feeds.includes(value);
    }),
});

export default () => {
  const defaultLanguage = 'ru';
  const initInput = '';
  const initMessage = null;
  const initProcessState = 'filling';
  const initialState = {
    form: {
      url: initInput,
    },
    feeds: [],
    processState: initProcessState,
    errors: {},
    message: initMessage,
  };

  const i18nextInstance = i18next.createInstance();

  i18nextInstance.init({
    lng: defaultLanguage,
    debug: false,
    resources,
  });

  const elements = {
    input: document.querySelector('.form-control'),
    submit: document.querySelector('.btn-primary'),
    form: document.querySelector('.rss-form'),
    feedback: document.querySelector('.feedback'),
  };

  const state = onChange(initialState, initView(elements, i18nextInstance));

  elements.input.addEventListener('input', (event) => {
    event.preventDefault();
    state.processState = 'filling';
    const { value } = event.target;
    state.form.url = value;
  });

  elements.form.addEventListener('submit', (event) => {
    event.preventDefault();
    state.processState = 'sending';
    const { feeds } = state;
    schema.validate(state.form, { feeds }) // TODO: add aboutEarly: false, on second field in form!
      .then(() => {
        state.feeds = [...state.feeds, state.form.url];
        state.processState = 'success';
        state.message = 'valid';
        state.form.url = initInput;
        state.processState = 'filling';
      })
      .catch((e) => {
        state.processState = 'error';
        state.message = e.message;
        state.processState = 'filling';
      });
    state.message = initMessage;
  });
};
