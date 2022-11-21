export default class RouteHandler {
  static apiRoute = 'https://allorigins.hexlet.app/get?disableCache=true&url=';

  constructor(url) {
    this.encodedUrl = encodeURIComponent(url);
  }

  buildRoute = () => `${this.constructor.apiRoute}${this.encodedUrl}`;
}
