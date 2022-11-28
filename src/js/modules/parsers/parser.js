export default (response) => {
  const parser = new DOMParser();
  const parsedDom = parser.parseFromString(response, 'application/xml');
  if (parsedDom.querySelector('parsererror')) {
    throw new Error('parsingError');
  }
  const feedTitle = parsedDom.querySelector('channel > title').textContent;
  const feedDescription = parsedDom.querySelector('channel > description').textContent;
  const feed = { title: feedTitle, description: feedDescription };
  const items = parsedDom.querySelectorAll('item');
  const posts = [...items].map((item) => {
    const title = item.querySelector('title').textContent;
    const description = item.querySelector('description').textContent;
    const link = item.querySelector('link').textContent;
    return { title, description, link };
  });
  return { feed, posts };
};
