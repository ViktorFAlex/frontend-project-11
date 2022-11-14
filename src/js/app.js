import * as yup from 'yup';
import onChange from 'on-change';
import initView from './view';

const schema = yup.object().shape({
  url: yup
    .string()
    .matches(/^(http:|https:)\S+(\.rss)$/m, 'Ссылка должна быть валидным URL')
    .required()
    .url()
    .test('unique', 'RSS уже существует', (value, { options }) => {
      const { feeds } = options;
      return !feeds.includes(value);
    }),
});

export default () => {
  const initInput = '';
  const initError = null;
  const initProcessState = 'filling';
  const initialState = {
    form: {
      url: initInput,
    },
    feeds: [],
    processState: initProcessState,
    errors: {},
    error: initError,
  };

  const elements = {
    input: document.querySelector('.form-control'),
    submit: document.querySelector('.btn-primary'),
    form: document.querySelector('.rss-form'),
    feedback: document.querySelector('.feedback'),
  };

  const state = onChange(initialState, initView(elements));

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
    schema.validate(state.form, { feeds })
      .then(() => {
        state.feeds = [...state.feeds, state.form.url];
        state.processState = 'success';
        state.form.url = initInput;
      })
      .catch((e) => {
        state.error = e.message;
        state.processState = 'filling';
      });
    state.error = initError;
  });
};
