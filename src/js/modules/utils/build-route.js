const routes = {
  apiRoute: () => 'https://allorigins.hexlet.app/get?disableCache=true&url=',
};

export default (url) => {
  const encodedUrl = encodeURIComponent(url);
  return `${routes.apiRoute()}${encodedUrl}`;
};
