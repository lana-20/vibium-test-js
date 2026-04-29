import type { Page } from 'vibium';

export abstract class PageObject {
  constructor(protected readonly page: Page) {}
}
