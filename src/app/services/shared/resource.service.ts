import { Inject, Injectable } from '@angular/core';
import EngResource from '../../../resources/eng/resource.eng';
import ViResource from '../../../resources/eng/resource.eng';



@Injectable({
  providedIn: 'root'
})
export class ResourceService {

  public lang: string = "eng";
  public resource: any;
  constructor() { 
    this.reloadResource();
   }

  getResource(UIResource: any) {
    for (const key in UIResource) {
      if (Object.prototype.hasOwnProperty.call(UIResource, key) && Object.prototype.hasOwnProperty.call(this.resource, key)) {
        UIResource[key] = this.resource[key];
      }
    }
    return UIResource;
  }

  /**Change value of resource language */
  setResource(lang: string) {
   localStorage.setItem("language", lang);
    this.reloadResource();
  }

  reloadResource() {
    let lang = localStorage.getItem("language");
    if (lang == null || lang == "eng") {
      this.resource = EngResource;
    }
    else {
      this.resource = ViResource;
    }
  }
}
