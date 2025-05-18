import { makeAutoObservable } from "mobx";

class CATEGORIES_STORE {
  categories: Record<string, any> = {};

  constructor() {
    makeAutoObservable(this);
  }

  update(newCategories: Record<string, any>) {
    this.categories = newCategories;
  }

  // Reset categories - proper action to use during refresh
  resetCategories() {
    this.categories = {};
  }

  // Set a specific category - proper action for updating a single category
  setCategory(contentType: string, categoryData: any) {
    this.categories[contentType] = categoryData;
  }
}

export const categoriesStore = new CATEGORIES_STORE();

class INFO_STORE {
  info: string[] = [];

  constructor() {
    makeAutoObservable(this);
  }

  update(newInfo: string[]) {
    this.info = newInfo;
  }
}

export const infoStore = new INFO_STORE();

class SOCIAL_STORE {
  social = {
    instagram: "",
    twitter: "",
    tiktok: "",
  };

  constructor() {
    makeAutoObservable(this);
  }

  update(newSocial: { instagram: string; twitter: string; tiktok: string }) {
    this.social = newSocial;
  }
}

export const socialStore = new SOCIAL_STORE();

class LIMITED_TIME_OFFER_STORE {
  limitedTimeCountdown = 60; // default 60 seconds
  limitedTimeFrequency = 10; // default 10 days

  constructor() {
    makeAutoObservable(this);
  }

  update(settings: {
    limitedTimeCountdown: number;
    limitedTimeFrequency: number;
  }) {
    this.limitedTimeCountdown = settings.limitedTimeCountdown;
    this.limitedTimeFrequency = settings.limitedTimeFrequency;
  }
}

export const limitedTimeOfferStore = new LIMITED_TIME_OFFER_STORE();

class OFFERINGS_STORE {
  offerings: any = null;

  constructor() {
    makeAutoObservable(this);
  }

  update(newOfferings: any) {
    this.offerings = newOfferings;
  }
}

export const offeringsStore = new OFFERINGS_STORE();

class CONTENT_TYPE_STORE {
  constructor() {
    makeAutoObservable(this);
  }

  contentTypes: string[] = [];
  activeContentType: string = '';

  update(newContentTypes: string[]) {
    this.contentTypes = newContentTypes;
    if (newContentTypes.length > 0 && this.activeContentType === '') {
      this.activeContentType = newContentTypes[0];
    }
  }

  setActiveContentType(contentType: string) {
    this.activeContentType = contentType;
  }
}

export const contentTypeStore = new CONTENT_TYPE_STORE();
