export default (response) => {
  const parser = new DOMParser();
  const parsedDom = parser.parseFromString(response, 'application/xml');
  if (parsedDom.querySelector('parsererror')) {
    throw new Error('parsingError');
  }
  return parsedDom;
};
