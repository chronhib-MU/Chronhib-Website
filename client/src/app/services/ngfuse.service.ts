import { Injectable } from '@angular/core';
import Fuse from 'fuse.js';

@Injectable()
export class NgFuseService {


  constructor () { };

  search (collection: Array<Object>, searchString: string, options: NgFuseOptions = {}) {
    let results = []
    if (collection) {
      const fuse = new Fuse(collection, options);
      if (searchString === '') {
        return collection;
      } else {
        results = fuse.search(searchString);
        return results.map(res => res.item)
      }
    } else {
      return results;
    }
  };
}

export interface NgFuseOptions extends Fuse.IFuseOptions<any> {
}
